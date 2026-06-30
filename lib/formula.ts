import { create, all, type MathJsInstance } from "mathjs";
import type { FormulaVariable } from "@/lib/types";

// Restricted mathjs instance — no symbolic imports, no access to globals.
const math: MathJsInstance = create(all, {});
// Neutralize the extension surface that could be abused; evaluate() stays.
math.import(
  {
    import: function () {
      throw new Error("disabled");
    },
    createUnit: function () {
      throw new Error("disabled");
    },
    simplify: function () {
      throw new Error("disabled");
    },
    derivative: function () {
      throw new Error("disabled");
    },
  },
  { override: true },
);

export interface FormulaCheck {
  ok: boolean;
  message: string;
  sample?: number;
  unknownSymbols?: string[];
}

const SYMBOL_RE = /[A-Za-z_][A-Za-z0-9_]*/g;
// mathjs built-ins that may legitimately appear and are not variables.
const RESERVED = new Set([
  "abs", "min", "max", "sqrt", "round", "floor", "ceil", "log", "exp", "pow",
  "mean", "sum", "e", "pi", "PI",
]);

/**
 * Validate an expression against its declared variables and run it once with
 * sample values (each variable = 1, or a provided sample map) to catch errors.
 */
export function checkFormula(
  expression: string,
  variables: FormulaVariable[],
  sample?: Record<string, number>,
): FormulaCheck {
  const expr = expression.trim();
  if (!expr) return { ok: false, message: "Expression is empty." };

  const declared = new Set(variables.map((v) => v.symbol));
  const used = new Set(expr.match(SYMBOL_RE) ?? []);
  const unknown = [...used].filter(
    (s) => !declared.has(s) && !RESERVED.has(s),
  );
  if (unknown.length > 0) {
    return {
      ok: false,
      message: `Unknown symbol(s): ${unknown.join(", ")}. Declare them as variables.`,
      unknownSymbols: unknown,
    };
  }

  const scope: Record<string, number> = {};
  for (const v of variables) scope[v.symbol] = sample?.[v.symbol] ?? 1;

  try {
    const result = math.evaluate(expr, scope);
    if (typeof result !== "number" || !Number.isFinite(result)) {
      return { ok: false, message: "Expression did not evaluate to a finite number." };
    }
    return {
      ok: true,
      message: "Valid — evaluates cleanly.",
      sample: Math.round(result * 1000) / 1000,
    };
  } catch (e) {
    return { ok: false, message: `Syntax error: ${(e as Error).message}` };
  }
}
