"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Input, Modal, Select, Table, Td, Th } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useBulkCreateLibraryKpis, useEdpexCatalog } from "@/lib/data/hooks";
import { downloadCsv } from "@/lib/csv";
import {
  KPI_BATCH_MAX_ROWS,
  buildKpiTemplateCsv,
  categoriesForKpiType,
  checkKpiBatch,
  emptyKpiBatchRow,
  isBlankKpiBatchRow,
  parseKpiPaste,
  readKpiTemplateCsv,
  type KpiBatchLookups,
  type KpiBatchRow,
} from "@/lib/kpi/kpiBatch";
import {
  areaAfterTopicChange,
  areasForTopic,
  EDPEX_INDICATOR_CODE_MAX,
  findEdpexArea,
} from "@/lib/kpi/edpex";
import type { KpiCategoryRecord } from "@/lib/types";

const INITIAL_ROWS = 5;

type GridRow = KpiBatchRow & { key: number };
type FillColumn = "kpiType" | "categoryId" | "committeeId" | "edpexTopicId" | "edpexAreaId";

/** Quick-create many skeleton KPIs — name, type, category, committee, a
 *  description and an optional EdPEx topic / area / indicator code — to configure one by one in
 *  the KPI editor afterwards.
 *
 *  Rows come from typing, from a paste out of Excel (into any Name cell), or
 *  from an uploaded CSV template; all three land in the same grid so they are
 *  reviewed before anything is saved. The grid validates with the same rules as
 *  the bulk API (lib/kpi/kpiBatch), and Create stays disabled while any row has
 *  an error: the whole batch is one transaction.
 *
 *  The grid survives closing the modal, so a stray Escape or backdrop click
 *  does not throw away a half-typed batch. It resets after a successful create
 *  or on Clear. */
export function BatchAddKpisModal({
  open,
  onClose,
  setId,
  kpiTypes,
  categories,
  committees,
  existingNames,
  defaultKpiType,
  defaultCommitteeId,
}: {
  open: boolean;
  onClose: () => void;
  setId: number;
  kpiTypes: { id: string; label: string }[];
  categories: KpiCategoryRecord[];
  committees: { id: string; name: string }[];
  existingNames: string[];
  /** The page's selected KPI type, so opening from the Routine view pre-fills Routine. */
  defaultKpiType: string;
  /** The page's committee filter, or "" when it shows all committees. */
  defaultCommitteeId: string;
}) {
  const create = useBulkCreateLibraryKpis(setId);
  const edpexQ = useEdpexCatalog();
  const edpex = useMemo(() => edpexQ.data ?? [], [edpexQ.data]);
  const nextKey = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  // Seeded on mount so the first open never paints an empty grid.
  const [rows, setRows] = useState<GridRow[]>(() =>
    Array.from({ length: INITIAL_ROWS }, () => ({
      ...emptyKpiBatchRow({ kpiType: defaultKpiType, committeeId: defaultCommitteeId }),
      key: nextKey.current++,
    })),
  );
  const [importError, setImportError] = useState<string | null>(null);

  const defaults = useMemo(
    () => ({ kpiType: defaultKpiType, committeeId: defaultCommitteeId }),
    [defaultKpiType, defaultCommitteeId],
  );
  const lookups: KpiBatchLookups = useMemo(
    () => ({ kpiTypes, categories, committees, edpex }),
    [kpiTypes, categories, committees, edpex],
  );

  const keyed = (row: KpiBatchRow): GridRow => ({ ...row, key: nextKey.current++ });
  const blankRows = (n: number) =>
    Array.from({ length: n }, () => keyed(emptyKpiBatchRow(defaults)));

  // On open, an untouched grid picks up the page's current type and committee;
  // one with work in it is left exactly as it was.
  useEffect(() => {
    if (!open) return;
    setImportError(null);
    setRows((current) =>
      current.every(isBlankKpiBatchRow)
        ? Array.from({ length: Math.max(current.length, INITIAL_ROWS) }, () => ({
            ...emptyKpiBatchRow(defaults),
            key: nextKey.current++,
          }))
        : current,
    );
  }, [open, defaults]);

  const check = useMemo(
    () => checkKpiBatch(rows, lookups, existingNames),
    [rows, lookups, existingNames],
  );
  const tooMany = check.readyCount > KPI_BATCH_MAX_ROWS;
  const canSubmit =
    check.readyCount > 0 && check.errorCount === 0 && !tooMany && !create.isPending;

  const update = (key: number, patch: Partial<KpiBatchRow>) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        // A type change can move the row to the other taxonomy; drop a category
        // that no longer fits instead of leaving an error behind.
        if (
          patch.kpiType !== undefined &&
          next.categoryId &&
          !categoriesForKpiType(categories, next.kpiType).some((c) => c.id === next.categoryId)
        ) {
          next.categoryId = "";
        }
        // Likewise a topic change drops an area that is not one of its own.
        if (patch.edpexTopicId !== undefined) {
          next.edpexAreaId = areaAfterTopicChange(edpex, next.edpexAreaId, next.edpexTopicId);
        }
        return next;
      }),
    );

  const remove = (key: number) =>
    setRows((rs) => {
      const rest = rs.filter((r) => r.key !== key);
      return rest.length > 0 ? rest : blankRows(1);
    });

  /** Copy the first filled-in row's value down the grid. A category only goes
   *  to rows whose type uses its taxonomy, and never to blank rows — that would
   *  turn them into rows missing a name. */
  const fillDown = (col: FillColumn) =>
    setRows((rs) => {
      const source = rs.find((r) => !isBlankKpiBatchRow(r)) ?? rs[0];
      if (!source) return rs;
      const value = source[col];
      return rs.map((r) => {
        if (col === "categoryId") {
          if (isBlankKpiBatchRow(r)) return r;
          const fits = categoriesForKpiType(categories, r.kpiType).some((c) => c.id === value);
          return fits || !value ? { ...r, categoryId: value } : r;
        }
        if (col === "kpiType") {
          const next = { ...r, kpiType: value };
          const fits = categoriesForKpiType(categories, value).some((c) => c.id === r.categoryId);
          return fits ? next : { ...next, categoryId: "" };
        }
        if (col === "edpexTopicId") {
          return {
            ...r,
            edpexTopicId: value,
            edpexAreaId: areaAfterTopicChange(edpex, r.edpexAreaId, value),
          };
        }
        if (col === "edpexAreaId") {
          // An area carries its topic with it, but never overrides a row that
          // already sits under a different topic.
          if (!value) return { ...r, edpexAreaId: "" };
          const area = findEdpexArea(edpex, value);
          if (!area || (r.edpexTopicId && r.edpexTopicId !== area.topicId)) return r;
          return { ...r, edpexTopicId: area.topicId, edpexAreaId: area.id };
        }
        return { ...r, [col]: value };
      });
    });

  /** Pasting several cells or lines into a Name cell spreads them over the
   *  grid from that row down, overwriting the blank rows below it. */
  const onPasteName = (key: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.trim().includes("\n")) return; // plain text paste
    e.preventDefault();
    const pasted = parseKpiPaste(text, lookups, defaults).map(keyed);
    if (pasted.length === 0) return;
    setRows((rs) => {
      const at = rs.findIndex((r) => r.key === key);
      if (at < 0) return [...rs, ...pasted];
      let end = at + 1;
      while (end < rs.length && end - at < pasted.length && isBlankKpiBatchRow(rs[end])) end += 1;
      return [...rs.slice(0, at), ...pasted, ...rs.slice(end)];
    });
  };

  const onImportFile = async (file: File) => {
    setImportError(null);
    try {
      const imported = readKpiTemplateCsv(await file.text(), lookups, defaults).map(keyed);
      if (imported.length === 0) {
        setImportError("The file has no KPI rows under its header.");
        return;
      }
      // Imported rows replace the empty placeholders and follow any typed work.
      setRows((rs) => [...rs.filter((r) => !isBlankKpiBatchRow(r)), ...imported]);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not read the file.");
    }
  };

  const submit = () => {
    const ready = rows
      .filter((r) => !isBlankKpiBatchRow(r))
      .map(({ key: _key, ...row }) => row);
    create.mutate(ready, {
      onSuccess: () => {
        setRows(blankRows(INITIAL_ROWS));
        onClose();
      },
    });
  };

  const typeLabel = (id: string) => kpiTypes.find((t) => t.id === id)?.label ?? id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Batch Add KPIs"
      subtitle="Create draft KPIs in one go, then configure targets, calculation and sub-KPIs in each KPI's editor."
      footer={
        <>
          <div className="mr-auto flex flex-wrap items-center gap-sm">
            <Badge tone={check.readyCount > 0 ? "success" : "neutral"}>
              {check.readyCount} ready
            </Badge>
            {check.errorCount > 0 && (
              <Badge tone="error">
                {check.errorCount} {check.errorCount === 1 ? "row needs" : "rows need"} fixing
              </Badge>
            )}
            {check.duplicateCount > 0 && (
              <Badge tone="warning">
                {check.duplicateCount} duplicate {check.duplicateCount === 1 ? "name" : "names"}
              </Badge>
            )}
            {tooMany && (
              <Badge tone="error">At most {KPI_BATCH_MAX_ROWS} KPIs per batch</Badge>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            {create.isPending
              ? "Creating…"
              : `Create ${check.readyCount} ${check.readyCount === 1 ? "KPI" : "KPIs"}`}
          </Button>
        </>
      }
    >
      {/* min-w-0 lets the table scroll inside the dialog instead of widening it. */}
      <div className="flex min-w-0 flex-col gap-md">
        <div className="flex flex-wrap items-center gap-sm">
          <Button
            size="sm"
            variant="outline"
            icon="add"
            onClick={() => setRows((rs) => [...rs, ...blankRows(1)])}
          >
            Add row
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon="upload_file"
            onClick={() => fileRef.current?.click()}
          >
            Import CSV
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon="download"
            onClick={() => downloadCsv("kpi-batch-template.csv", buildKpiTemplateCsv(lookups))}
          >
            Template
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon="restart_alt"
            onClick={() => {
              setImportError(null);
              setRows(blankRows(INITIAL_ROWS));
            }}
          >
            Clear
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // allow re-importing the same file
              if (file) void onImportFile(file);
            }}
          />
          <span className="ml-auto inline-flex items-center gap-xs text-caption-sm text-mute">
            <Icon name="content_paste" size={16} />
            Paste rows from Excel into any Name cell — columns: Name, Type, Category,
            Committee, Description, EdPEx Topic, EdPEx Area, EdPEx Indicator.
          </span>
        </div>

        {importError && (
          <p role="alert" className="text-caption-sm text-error">
            {importError}
          </p>
        )}

        <div className="min-w-0 overflow-hidden rounded-DEFAULT border border-hairline">
          <Table>
            <thead>
              <tr>
                <Th className="px-md">KPI Name *</Th>
                <FillTh label="Type" onFill={() => fillDown("kpiType")} />
                <FillTh label="Category" onFill={() => fillDown("categoryId")} />
                <FillTh label="Committee" onFill={() => fillDown("committeeId")} />
                <Th className="px-md">Description</Th>
                <FillTh label="EdPEx Topic" onFill={() => fillDown("edpexTopicId")} />
                <FillTh label="EdPEx Area" onFill={() => fillDown("edpexAreaId")} />
                <Th className="px-md">EdPEx Indicator</Th>
                <Th className="px-md">Status</Th>
                <Th className="px-md">
                  <span className="sr-only">Remove</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rowCheck = check.rows[i];
                const rowCategories = categoriesForKpiType(categories, row.kpiType);
                const rowAreas = areasForTopic(edpex, row.edpexTopicId);
                return (
                  <tr key={row.key} className="border-t border-hairline align-top">
                    <Td className="px-md py-xs">
                      <Input
                        aria-label={`KPI name, row ${i + 1}`}
                        className="min-w-[16rem]"
                        value={row.name}
                        placeholder={i === 0 ? "e.g. Clinical Placement Rate" : undefined}
                        onChange={(e) => update(row.key, { name: e.target.value })}
                        onPaste={(e) => onPasteName(row.key, e)}
                      />
                    </Td>
                    <Td className="px-md py-xs">
                      <Select
                        aria-label={`KPI type, row ${i + 1}`}
                        className="min-w-[9rem]"
                        value={row.kpiType}
                        onChange={(e) => update(row.key, { kpiType: e.target.value })}
                      >
                        {!row.kpiType && <option value="">Choose…</option>}
                        {kpiTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                        <UnknownOption value={row.kpiType} known={kpiTypes} />
                      </Select>
                    </Td>
                    <Td className="px-md py-xs">
                      <Select
                        aria-label={`Category, row ${i + 1}`}
                        className="min-w-[11rem]"
                        value={row.categoryId}
                        onChange={(e) => update(row.key, { categoryId: e.target.value })}
                      >
                        <option value="">Uncategorised</option>
                        {rowCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                        <UnknownOption
                          value={row.categoryId}
                          known={rowCategories}
                          label={categories.find((c) => c.id === row.categoryId)?.label}
                        />
                      </Select>
                    </Td>
                    <Td className="px-md py-xs">
                      <Select
                        aria-label={`Committee, row ${i + 1}`}
                        className="min-w-[11rem]"
                        value={row.committeeId}
                        onChange={(e) => update(row.key, { committeeId: e.target.value })}
                      >
                        <option value="">No committee</option>
                        {committees.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <UnknownOption value={row.committeeId} known={committees} />
                      </Select>
                    </Td>
                    <Td className="px-md py-xs">
                      <Input
                        aria-label={`Description, row ${i + 1}`}
                        className="min-w-[12rem]"
                        value={row.description}
                        onChange={(e) => update(row.key, { description: e.target.value })}
                      />
                    </Td>
                    <Td className="px-md py-xs">
                      <Select
                        aria-label={`EdPEx topic, row ${i + 1}`}
                        className="w-[9rem]"
                        value={row.edpexTopicId}
                        onChange={(e) => update(row.key, { edpexTopicId: e.target.value })}
                      >
                        <option value="">None</option>
                        {edpex.map((t) => (
                          <option key={t.id} value={t.id} title={t.name}>
                            {t.id} · {t.name}
                          </option>
                        ))}
                        <UnknownOption value={row.edpexTopicId} known={edpex} />
                      </Select>
                    </Td>
                    <Td className="px-md py-xs">
                      <Select
                        aria-label={`EdPEx area, row ${i + 1}`}
                        className="w-[9rem]"
                        value={row.edpexAreaId}
                        disabled={!row.edpexTopicId && !row.edpexAreaId}
                        onChange={(e) => update(row.key, { edpexAreaId: e.target.value })}
                      >
                        <option value="">{row.edpexTopicId ? "None" : "Topic first"}</option>
                        {rowAreas.map((a) => (
                          <option key={a.id} value={a.id} title={a.name}>
                            {a.id} · {a.name}
                          </option>
                        ))}
                        <UnknownOption
                          value={row.edpexAreaId}
                          known={rowAreas}
                          label={findEdpexArea(edpex, row.edpexAreaId)?.id}
                          wrongLabel="other topic"
                        />
                      </Select>
                    </Td>
                    <Td className="px-md py-xs">
                      <Input
                        aria-label={`EdPEx indicator code, row ${i + 1}`}
                        className="w-[8rem]"
                        maxLength={EDPEX_INDICATOR_CODE_MAX}
                        placeholder={row.edpexAreaId ? `${row.edpexAreaId}-1` : "7.1ข-4"}
                        value={row.edpexIndicatorCode}
                        onChange={(e) => update(row.key, { edpexIndicatorCode: e.target.value })}
                      />
                    </Td>
                    <Td className="px-md py-xs">
                      <div className="flex min-h-[36px] w-[12rem] items-center">
                        <RowStatus
                          blank={rowCheck?.blank ?? true}
                          error={rowCheck?.error ?? null}
                          duplicate={rowCheck?.duplicate ?? false}
                          typeLabel={typeLabel(row.kpiType)}
                        />
                      </div>
                    </Td>
                    <Td className="px-md py-xs">
                      <button
                        type="button"
                        aria-label={`Remove row ${i + 1}`}
                        title="Remove row"
                        onClick={() => remove(row.key)}
                        className="grid h-[36px] w-8 place-items-center rounded text-mute hover:bg-surface-container-high hover:text-error"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        <p className="text-caption-sm text-mute">
          New KPIs start as drafts (marked D) with weight 0% and unit Item, and stay
          out of performance records until first saved in the KPI editor. Routine
          KPIs use the ด้านที่ categories; every other type uses the Strategic
          categories. EdPEx Area lists only the areas of the row&apos;s EdPEx Topic, and an
          EdPEx Indicator (the SAR row, e.g. 7.1ข-4) must start with the row&apos;s area. The
          CSV template lists every allowed value in its # instruction lines; Type,
          Category, Committee and the EdPEx columns accept either the name shown
          here or its code.
        </p>
      </div>
    </Modal>
  );
}

function FillTh({ label, onFill }: { label: string; onFill: () => void }) {
  return (
    <Th className="px-md">
      <span className="inline-flex items-center gap-xs whitespace-nowrap">
        {label}
        <button
          type="button"
          aria-label={`Copy the first row's ${label} down to every row`}
          title={`Copy the first row's ${label} down to every row`}
          onClick={onFill}
          className="grid h-6 w-6 place-items-center rounded text-mute hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="arrow_downward" size={14} />
        </button>
      </span>
    </Th>
  );
}

/** Keep a pasted or imported value that matched nothing selectable, so the
 *  select shows what was typed (and the row its error) rather than a blank. */
function UnknownOption({
  value,
  known,
  label,
  wrongLabel,
}: {
  value: string;
  known: { id: string }[];
  /** Set when the value exists but is not valid here (a category from the
   *  other taxonomy); omitted when it matched nothing at all. */
  label?: string;
  /** What "exists but not valid here" means for this column. */
  wrongLabel?: string;
}) {
  if (!value || known.some((k) => k.id === value)) return null;
  return (
    <option value={value}>
      {label ? `${label} (${wrongLabel ?? "wrong type"})` : `${value} (not found)`}
    </option>
  );
}

function RowStatus({
  blank,
  error,
  duplicate,
  typeLabel,
}: {
  blank: boolean;
  error: string | null;
  duplicate: boolean;
  typeLabel: string;
}) {
  if (blank) return <span className="text-caption-sm text-mute">empty, skipped</span>;
  if (error) {
    return (
      <span className="text-caption-sm text-error" title={error}>
        {error}
      </span>
    );
  }
  if (duplicate) {
    return (
      <span className="text-caption-sm text-[#8a4b00]" title="Another KPI has this name">
        duplicate name
      </span>
    );
  }
  return <span className="whitespace-nowrap text-caption-sm text-success">new {typeLabel} KPI</span>;
}
