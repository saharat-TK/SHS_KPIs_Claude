"use client";

import { Button, Field } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  filterChoicesByRef,
  fractionFor,
  refValueFor,
  type EntryLayout,
  type RefLookups,
} from "@/lib/kpi/columnLinks";
import type { AcademicCatalog, DataSourceColumn, FacultyRecord } from "@/lib/types";
import { CellInput } from "./CellInput";

/** One row of the panel while editing: the picked value and its program. */
export interface DraftItem {
  main: string;
  target: string;
  /** Editing an entry: the saved row this item came from. New items have none. */
  entryId?: number;
}

export const blankItem = (): DraftItem => ({ main: "", target: "" });

/** A Field on the first row only; later rows line up under it unlabelled. */
function MaybeField({ label, children }: { label?: string; children: React.ReactNode }) {
  return label ? <Field label={label}>{children}</Field> : <>{children}</>;
}

/** Every code a choice column offers, before any ref filter. Null for free text. */
function allCodes(
  column: DataSourceColumn,
  faculty: FacultyRecord[],
  catalog: AcademicCatalog,
): string[] | null {
  switch (column.dataType) {
    case "faculty":
      return faculty.map((f) => f.id);
    case "program":
      return catalog.programs.map((p) => p.code);
    case "curriculum":
      return catalog.curricula.map((c) => c.code);
    case "select":
      return column.options ?? [];
    default:
      return null;
  }
}

/** The right-hand section of the entry form: the multiple column, one row per
 *  value, and every "ref by" pair. Picking a program narrows the list beside it;
 *  picking a value fills in (and locks) its program. */
export function LinkedItemsPanel({
  layout,
  items,
  onChange,
  faculty,
  catalog,
  lookups,
  duplicates,
  allowAdd,
}: {
  layout: EntryLayout;
  items: Record<string, DraftItem[]>;
  onChange: (groupKey: string, next: DraftItem[]) => void;
  /** Active roster, already sorted for the picker. */
  faculty: FacultyRecord[];
  catalog: AcademicCatalog;
  lookups: RefLookups;
  /** Values picked twice in the multiple group. */
  duplicates: string[];
  /** False when editing a saved row: it stays one row. */
  allowAdd: boolean;
}) {
  return (
    <div className="flex flex-col gap-md rounded-md border border-hairline bg-surface-lowest p-md">
      {layout.groups.map((g) => {
        const main = g.main as DataSourceColumn;
        const target = g.target as DataSourceColumn | null;
        const rows = items[main.colKey]?.length ? items[main.colKey] : [blankItem()];
        const codes = allCodes(main, faculty, catalog);
        const picked = rows.map((r) => r.main).filter(Boolean);
        const share = g.multiple && layout.shares.length > 0
          ? fractionFor(Math.max(1, picked.length))
          : null;

        const set = (i: number, patch: Partial<DraftItem>) =>
          onChange(
            main.colKey,
            rows.map((r, j) => (j === i ? { ...r, ...patch } : r)),
          );

        return (
          <section key={main.colKey} className="flex flex-col gap-sm">
            <div>
              <h3 className="text-label-md text-on-surface">
                {main.label}
                {main.isRequired ? " *" : ""}
              </h3>
              <p className="text-caption-sm text-mute">
                {g.multiple
                  ? "Add one per value; each is saved as its own row."
                  : "Linked fields — picking one fills in the other."}
                {share !== null &&
                  ` ${layout.shares.map((s) => s.label).join(", ")} is filled with 1/${Math.max(1, picked.length)} per row.`}
              </p>
            </div>

            {rows.map((row, i) => {
              const derived = target ? refValueFor(main, row.main || null, lookups) : undefined;
              // A known pick decides its program, so the program can't be changed under it.
              const targetLocked = !!row.main && derived !== undefined;
              let allowed = codes;
              if (allowed && target) {
                allowed = filterChoicesByRef(main, allowed.map((code) => ({ code })), row.target || null, lookups)
                  .map((c) => c.code);
              }
              if (allowed && g.multiple) {
                const others = new Set(picked.filter((_, j) => j !== i));
                allowed = allowed.filter((c) => !others.has(c));
              }
              const isDuplicate = !!row.main && duplicates.includes(row.main);

              return (
                <div key={i} className="flex flex-wrap items-end gap-sm">
                  {target && (
                    <div className="min-w-[9rem] flex-1">
                      <MaybeField label={i === 0 ? `${target.label}${target.isRequired ? " *" : ""}` : undefined}>
                        <CellInput
                          column={target}
                          value={row.target}
                          faculty={faculty}
                          catalog={catalog}
                          selectedProgramCode={null}
                          disabled={targetLocked}
                          onChange={(v) => {
                            // A program the current pick doesn't belong to clears the pick.
                            const keep = row.main && refValueFor(main, row.main, lookups) === (v || null);
                            set(i, { target: v, main: keep ? row.main : "" });
                          }}
                        />
                      </MaybeField>
                    </div>
                  )}
                  <div className="min-w-[12rem] flex-[2]">
                    <MaybeField label={i === 0 && target ? main.label : undefined}>
                      <CellInput
                        column={main}
                        value={row.main}
                        faculty={faculty}
                        catalog={catalog}
                        selectedProgramCode={target ? null : row.target || null}
                        allowedOptions={allowed}
                        onChange={(v) => {
                          const program = target && v ? refValueFor(main, v, lookups) : undefined;
                          set(i, {
                            main: v,
                            target: program === undefined ? row.target : (program ?? ""),
                          });
                        }}
                      />
                    </MaybeField>
                  </div>
                  {share !== null && (
                    <span className="pb-sm text-caption-sm tabular-nums text-mute" title="Share of this entry">
                      {row.main ? share : "—"}
                    </span>
                  )}
                  {g.multiple && allowAdd && rows.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove ${main.label} ${i + 1}`}
                      title="Remove"
                      onClick={() => onChange(main.colKey, rows.filter((_, j) => j !== i))}
                      className="mb-xs grid h-8 w-8 place-items-center rounded-md text-mute transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    >
                      <Icon name="close" className="text-[18px]" />
                    </button>
                  )}
                  {isDuplicate && (
                    <p className="w-full text-caption-sm text-error">Already added above.</p>
                  )}
                </div>
              );
            })}

            {g.multiple && allowAdd && (
              <div>
                <Button
                  variant="ghost"
                  icon="add"
                  onClick={() => onChange(main.colKey, [...rows, blankItem()])}
                >
                  Add another
                </Button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
