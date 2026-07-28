"use client";

import { useMemo, useRef, useState } from "react";
import { Modal, Button, Badge, Table, Th, Td } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBulkCreateDataSourceEntries } from "@/lib/data/hooks";
import { parseCsv } from "@/lib/csv";
import {
  entryFingerprint,
  formatCellValue,
  formatEntryPeriod,
  readEntryTemplateCsv,
  withResolvedOptions,
  type ParsedEntryRow,
  type TemplateChoice,
} from "@/lib/kpi/dataSources";
import type {
  DataSourceColumn,
  DataSourceEntry,
  DataSourcePeriodGrain,
} from "@/lib/types";

/** Upload a filled-in template as a batch of entries.
 *
 *  The preview runs the same coercion the API will (readEntryTemplateCsv wraps
 *  coerceCellValue), so what the user sees here is what gets stored — the modal
 *  adds no rules of its own. Import stays disabled while any row has an error:
 *  the whole file lands in one transaction, so a half-valid file has no useful
 *  outcome to offer.
 *
 *  Duplicates are only ever a warning. A data source legitimately holds many
 *  rows per period (one per curriculum, say), so there is no key to upsert on —
 *  a repeated row is far more often a second upload of the same file than real
 *  data, which is worth flagging but not worth refusing. */
export function ImportEntriesModal({
  open,
  onClose,
  dataSourceId,
  periodGrain,
  columns,
  choices,
  entries,
  cellLabels,
  onDownloadTemplate,
}: {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
  periodGrain: DataSourcePeriodGrain;
  columns: DataSourceColumn[];
  /** The allowed values behind the derived-option columns — the same map the
   *  template's legend prints, so the file and the check agree by construction. */
  choices: Record<string, TemplateChoice[]>;
  /** Already-recorded rows, for duplicate detection. */
  entries: DataSourceEntry[];
  cellLabels: Record<string, string>;
  onDownloadTemplate: () => void;
}) {
  const { user } = useAuth();
  const bulk = useBulkCreateDataSourceEntries();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [headerErrors, setHeaderErrors] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedEntryRow[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setFileName(null);
    setReadError(null);
    setHeaderErrors([]);
    setRows([]);
    setExcluded(new Set());
  };

  const close = () => {
    reset();
    onClose();
  };

  // Validate against the same allowed values the server will, not the null
  // `options` a derived column arrives with. Display still uses `columns`.
  const checkColumns = useMemo(
    () => withResolvedOptions(columns, choices),
    [columns, choices],
  );

  // Fingerprints of what is already stored. Built once per open file rather than
  // per row so a large import stays linear.
  const existing = useMemo(
    () =>
      new Set(
        entries.map((e) => entryFingerprint(columns, e.year, e.quarter, e.values)),
      ),
    [entries, columns],
  );

  const duplicates = useMemo(() => {
    const seen = new Set(existing);
    const flagged = new Set<number>();
    for (const row of rows) {
      const key = entryFingerprint(columns, row.year, row.quarter, row.values);
      if (seen.has(key)) flagged.add(row.lineNumber);
      seen.add(key);
    }
    return flagged;
  }, [rows, columns, existing]);

  const readFile = async (file: File) => {
    reset();
    setFileName(file.name);

    // A CSV this size is not a data entry template; refuse before parsing rather
    // than freezing the tab on it.
    if (file.size > 2_000_000) {
      setReadError("That file is larger than 2 MB. Import it in smaller batches.");
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      setReadError("That file could not be read.");
      return;
    }

    const result = readEntryTemplateCsv({
      rows: parseCsv(text),
      grain: periodGrain,
      columns: checkColumns,
      labels: cellLabels,
    });
    setHeaderErrors(result.headerErrors);
    setRows(result.rows);

    // Duplicates start unchecked — re-uploading the same file is the mistake
    // this catches, and importing nothing is the safer default when it happens.
    const seen = new Set(existing);
    const skip = new Set<number>();
    for (const row of result.rows) {
      const key = entryFingerprint(columns, row.year, row.quarter, row.values);
      if (seen.has(key)) skip.add(row.lineNumber);
      seen.add(key);
    }
    setExcluded(skip);
  };

  const toggle = (lineNumber: number) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(lineNumber)) next.delete(lineNumber);
      else next.add(lineNumber);
      return next;
    });

  const errorCount = rows.filter((r) => r.errors.length > 0).length;
  const selected = rows.filter(
    (r) => r.errors.length === 0 && !excluded.has(r.lineNumber),
  );
  const canImport = errorCount === 0 && selected.length > 0 && !bulk.isPending;

  const submit = () => {
    bulk.mutate(
      {
        id: dataSourceId,
        input: {
          rows: selected.map((r) => ({
            // errors.length === 0 guarantees the period normalised.
            year: r.year as number,
            quarter: r.quarter,
            values: r.values,
            note: r.note,
          })),
          actorId: user?.facultyId,
          userRole: user?.role,
        },
      },
      { onSuccess: close },
    );
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Upload Data Entry"
      subtitle="Fill in the downloaded template, then upload it here."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!canImport} onClick={submit}>
            {bulk.isPending
              ? "Importing…"
              : `Import ${selected.length} ${selected.length === 1 ? "entry" : "entries"}`}
          </Button>
        </>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void readFile(file);
          // Clear the input so choosing the same file twice still fires onChange.
          e.target.value = "";
        }}
      />

      <div className="grid gap-md">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void readFile(file);
          }}
          className={`flex flex-col items-center gap-sm rounded-lg border border-dashed px-lg py-xl text-center ${
            dragging ? "border-primary-dark bg-primary-container/30" : "border-hairline-strong"
          }`}
        >
          <Icon name="upload_file" size={28} className="text-mute" />
          <p className="text-body-sm text-mute">
            {fileName ? fileName : "Drop a CSV file here, or choose one."}
          </p>
          <div className="flex items-center gap-sm">
            <Button
              variant="outline"
              size="sm"
              icon="folder_open"
              onClick={() => fileRef.current?.click()}
            >
              {fileName ? "Choose another file" : "Choose CSV file"}
            </Button>
            <Button variant="ghost" size="sm" icon="download" onClick={onDownloadTemplate}>
              Download template
            </Button>
          </div>
        </div>

        {readError && <ErrorBox lines={[readError]} />}

        {headerErrors.length > 0 && (
          <ErrorBox
            title="This file's header row does not match this data source."
            lines={headerErrors}
          />
        )}

        {fileName && !readError && headerErrors.length === 0 && rows.length === 0 && (
          <p className="text-body-sm text-mute">
            That file has a valid header row but no data rows.
          </p>
        )}

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-sm">
              <Badge tone={errorCount > 0 ? "neutral" : "success"}>
                {selected.length} of {rows.length} rows ready
              </Badge>
              {errorCount > 0 && (
                <Badge tone="error">
                  {errorCount} {errorCount === 1 ? "row has" : "rows have"} errors
                </Badge>
              )}
              {duplicates.size > 0 && (
                <Badge tone="warning">
                  {duplicates.size} possible {duplicates.size === 1 ? "duplicate" : "duplicates"}
                </Badge>
              )}
            </div>

            <div className="max-h-[45vh] overflow-auto rounded border border-hairline">
              <Table>
                <thead>
                  <tr>
                    <Th>
                      <span className="sr-only">Import</span>
                    </Th>
                    <Th align="right">Line</Th>
                    <Th>Status</Th>
                    <Th>Period</Th>
                    {columns.map((c) => (
                      <Th key={c.id}>{c.label}</Th>
                    ))}
                    <Th>Note</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const failed = row.errors.length > 0;
                    const badCells = new Set(
                      row.errors.map((e) => e.colKey).filter(Boolean) as string[],
                    );
                    return (
                      <tr key={row.lineNumber} className="border-t border-hairline">
                        <Td>
                          <input
                            type="checkbox"
                            className="accent-primary-container"
                            aria-label={`Import line ${row.lineNumber}`}
                            disabled={failed}
                            checked={!failed && !excluded.has(row.lineNumber)}
                            onChange={() => toggle(row.lineNumber)}
                          />
                        </Td>
                        <Td align="right" className="text-mute">
                          {row.lineNumber}
                        </Td>
                        <Td>
                          {failed ? (
                            <Badge tone="error">error</Badge>
                          ) : duplicates.has(row.lineNumber) ? (
                            <Badge tone="warning">duplicate</Badge>
                          ) : (
                            <span className="text-mute">—</span>
                          )}
                        </Td>
                        {/* The colour goes on the span, not the Td: cn() only
                            concatenates, so a text-* class on Td would lose to
                            the text-on-surface it already carries. */}
                        <Td>
                          <span className={row.year === null ? "text-error" : undefined}>
                            {row.year === null
                              ? row.rawPeriod || "—"
                              : formatEntryPeriod(row.year, row.quarter)}
                          </span>
                        </Td>
                        {columns.map((c) => (
                          <Td key={c.id}>
                            {/* The message rides on the cell too, so a wide table
                                stays readable without scrolling to the list below. */}
                            <span
                              className={badCells.has(c.colKey) ? "text-error" : undefined}
                              title={
                                row.errors.find((e) => e.colKey === c.colKey)?.message
                              }
                            >
                              {badCells.has(c.colKey)
                                ? row.raw[c.colKey] || "(empty)"
                                : formatCellValue(
                                    c,
                                    row.values[c.colKey] ?? null,
                                    cellLabels,
                                  )}
                            </span>
                          </Td>
                        ))}
                        <Td className="text-mute">{row.note ?? "—"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            {errorCount > 0 && <ErrorList rows={rows} />}
          </>
        )}
      </div>
    </Modal>
  );
}

function ErrorBox({ title, lines }: { title?: string; lines: string[] }) {
  return (
    <div className="rounded border border-error/30 bg-error/10 px-md py-sm text-body-sm text-error">
      {title && <p className="mb-xs font-medium">{title}</p>}
      <ul className="grid gap-tiny">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

/** Every problem in the file, capped so a badly mismatched upload does not
 *  render a thousand list items the user will not read. */
function ErrorList({ rows }: { rows: ParsedEntryRow[] }) {
  const LIMIT = 20;
  const all = rows.flatMap((row) =>
    row.errors.map((e) => `Line ${row.lineNumber}: ${e.message}`),
  );
  const shown = all.slice(0, LIMIT);
  return (
    <ErrorBox
      title="Fix these in the file and upload it again."
      lines={
        all.length > shown.length
          ? [...shown, `…and ${all.length - shown.length} more`]
          : shown
      }
    />
  );
}
