"use client";

import { useMemo, useRef, useState } from "react";
import { Modal, Button, Badge, Table, Th, Td } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useBulkCreateDataSourceEntries } from "@/lib/data/hooks";
import { parseCsv } from "@/lib/csv";
import { useLocale, useT } from "@/lib/i18n/useT";
import {
  entryFingerprint,
  formatCellValue,
  formatEntryPeriod,
  readEntryTemplateCsv,
  splitRowErrors,
  valuesForSubmit,
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
 *  adds no rules of its own. Import stays disabled while any row has a blocking
 *  error: the whole file lands in one transaction, so a half-valid file has no
 *  useful outcome to offer.
 *
 *  An empty *required* cell is the one error that is not blocking. Those rows
 *  can be imported anyway, flagged incomplete: they are stored, shown in the
 *  table, and skipped by every KPI calculation until someone fills the cell in.
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
  const t = useT();
  const locale = useLocale();
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
      setReadError(t("dataSources.import.fileTooLarge"));
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      setReadError(t("dataSources.import.fileUnreadable"));
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

  // Blocking errors stop the import; empty required cells only make a row
  // "incomplete", which can still be imported with a flag.
  const split = (r: ParsedEntryRow) => splitRowErrors(r.errors);
  const errorCount = rows.filter((r) => split(r).blocking.length > 0).length;
  const incompleteRows = rows.filter(
    (r) => split(r).blocking.length === 0 && split(r).missing.length > 0,
  );
  const selected = rows.filter(
    (r) => split(r).blocking.length === 0 && !excluded.has(r.lineNumber),
  );
  const completeSelected = selected.filter((r) => split(r).missing.length === 0);
  const incompleteSelected = selected.length - completeSelected.length;
  const canImport = errorCount === 0 && selected.length > 0 && !bulk.isPending;
  const canImportComplete =
    errorCount === 0 && completeSelected.length > 0 && !bulk.isPending;

  const submit = (withFlag: boolean) => {
    const chosen = withFlag ? selected : completeSelected;
    bulk.mutate(
      {
        id: dataSourceId,
        input: {
          allowIncomplete: withFlag,
          rows: chosen.map((r) => ({
            // errors.length === 0 guarantees the period normalised.
            year: r.year as number,
            quarter: r.quarter,
            values: valuesForSubmit(columns, r.values),
            note: r.note,
          })),
        },
      },
      { onSuccess: close },
    );
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t("dataSources.import.title")}
      subtitle={t("dataSources.import.subtitle")}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {t("dataSources.modal.cancel")}
          </Button>
          {incompleteSelected > 0 ? (
            <>
              <Button
                variant="outline"
                disabled={!canImportComplete}
                onClick={() => submit(false)}
              >
                {t("dataSources.import.importCompleteOnly", { count: completeSelected.length })}
              </Button>
              <Button disabled={!canImport} onClick={() => submit(true)}>
                {bulk.isPending
                  ? t("dataSources.import.importing")
                  : t("dataSources.import.importAnyway", { count: selected.length })}
              </Button>
            </>
          ) : (
            <Button disabled={!canImport} onClick={() => submit(false)}>
              {bulk.isPending
                ? t("dataSources.import.importing")
                : t(
                    selected.length === 1
                      ? "dataSources.import.importOne"
                      : "dataSources.import.importMany",
                    { count: selected.length },
                  )}
            </Button>
          )}
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
            {fileName ? fileName : t("dataSources.import.dropHint")}
          </p>
          <div className="flex items-center gap-sm">
            <Button
              variant="outline"
              size="sm"
              icon="folder_open"
              onClick={() => fileRef.current?.click()}
            >
              {fileName
                ? t("dataSources.import.chooseAnother")
                : t("dataSources.import.chooseFile")}
            </Button>
            <Button variant="ghost" size="sm" icon="download" onClick={onDownloadTemplate}>
              {t("dataSources.import.downloadTemplate")}
            </Button>
          </div>
        </div>

        {readError && <ErrorBox lines={[readError]} />}

        {headerErrors.length > 0 && (
          <ErrorBox
            title={t("dataSources.import.headerMismatch")}
            lines={headerErrors}
          />
        )}

        {fileName && !readError && headerErrors.length === 0 && rows.length === 0 && (
          <p className="text-body-sm text-mute">
            {t("dataSources.import.noDataRows")}
          </p>
        )}

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-sm">
              <Badge tone={errorCount > 0 ? "neutral" : "success"}>
                {t("dataSources.import.readyBadge", { selected: selected.length, total: rows.length })}
              </Badge>
              {errorCount > 0 && (
                <Badge tone="error">
                  {t(
                    errorCount === 1
                      ? "dataSources.import.errorsOne"
                      : "dataSources.import.errorsMany",
                    { count: errorCount },
                  )}
                </Badge>
              )}
              {incompleteRows.length > 0 && (
                <Badge tone="warning">
                  {t("dataSources.import.incompleteBadge", { count: incompleteRows.length })}
                </Badge>
              )}
              {duplicates.size > 0 && (
                <Badge tone="warning">
                  {t(
                    duplicates.size === 1
                      ? "dataSources.import.duplicatesOne"
                      : "dataSources.import.duplicatesMany",
                    { count: duplicates.size },
                  )}
                </Badge>
              )}
            </div>

            {incompleteRows.length > 0 && (
              <p className="text-body-sm text-mute">
                {t(
                  incompleteRows.length === 1
                    ? "dataSources.import.incompleteNoteOne"
                    : "dataSources.import.incompleteNoteMany",
                  { count: incompleteRows.length },
                )}
              </p>
            )}

            <div className="max-h-[45vh] overflow-auto rounded border border-hairline">
              <Table>
                <thead>
                  <tr>
                    <Th>
                      <span className="sr-only">{t("dataSources.import.colImport")}</span>
                    </Th>
                    <Th align="right">{t("dataSources.import.colLine")}</Th>
                    <Th>{t("dataSources.import.colStatus")}</Th>
                    <Th>{t("dataSources.entries.colPeriod")}</Th>
                    {columns.map((c) => (
                      <Th key={c.id}>{c.label}</Th>
                    ))}
                    <Th>{t("dataSources.entries.colNote")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const failed = split(row).blocking.length > 0;
                    const incomplete = !failed && split(row).missing.length > 0;
                    const badCells = new Set(
                      row.errors.map((e) => e.colKey).filter(Boolean) as string[],
                    );
                    return (
                      <tr key={row.lineNumber} className="border-t border-hairline">
                        <Td>
                          <input
                            type="checkbox"
                            className="accent-primary-container"
                            aria-label={t("dataSources.import.importLine", { n: row.lineNumber })}
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
                            <Badge tone="error">{t("dataSources.import.statusError")}</Badge>
                          ) : incomplete ? (
                            <Badge tone="warning">{t("dataSources.import.statusIncomplete")}</Badge>
                          ) : duplicates.has(row.lineNumber) ? (
                            <Badge tone="warning">{t("dataSources.import.statusDuplicate")}</Badge>
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
                              : formatEntryPeriod(row.year, row.quarter, locale)}
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
                                ? row.raw[c.colKey] || t("dataSources.import.empty")
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
  const t = useT();
  const LIMIT = 20;
  // Empty required cells are not listed: they import with a flag, and the row's
  // status badge and red cell already say so. A row that also has a blocking
  // error still shows only that one — fixing it will surface the rest.
  const all = rows.flatMap((row) =>
    splitRowErrors(row.errors).blocking.map((e) =>
      t("dataSources.import.errorLine", { n: row.lineNumber, message: e.message }),
    ),
  );
  const shown = all.slice(0, LIMIT);
  return (
    <ErrorBox
      title={t("dataSources.import.fixTitle")}
      lines={
        all.length > shown.length
          ? [...shown, t("dataSources.import.andMore", { count: all.length - shown.length })]
          : shown
      }
    />
  );
}
