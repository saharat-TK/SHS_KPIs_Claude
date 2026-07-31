import type {
  Committee,
  FacultyMember,
  Formula,
  FormulaVersion,
  Kpi,
  Measurement,
  Metric,
} from "@/lib/types";
import * as seed from "./seed";

// Phase 1 in-memory store. A single module-level mutable snapshot seeded from
// ./seed. All repository writes mutate this; reads return clones so React state
// stays immutable. Phase 2 deletes this file and points the repositories at a
// real backend — the repository signatures do not change.
interface DB {
  committees: Committee[];
  faculty: FacultyMember[];
  kpis: Kpi[];
  metrics: Metric[];
  formulas: Formula[];
  formulaVersions: FormulaVersion[];
  measurements: Measurement[];
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

let db: DB | null = null;

export function getDB(): DB {
  if (!db) {
    db = {
      committees: clone(seed.committees),
      faculty: clone(seed.faculty),
      kpis: clone(seed.kpis),
      metrics: clone(seed.metrics),
      formulas: clone(seed.formulas),
      formulaVersions: clone(seed.formulaVersions),
      measurements: clone(seed.measurements),
    };
  }
  return db;
}

/** Simulate network latency so loading states are exercised in the prototype. */
export function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), ms));
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
