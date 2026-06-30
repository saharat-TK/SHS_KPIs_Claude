"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Field,
  Input,
  Select,
  QueryBoundary,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import { useFormulas, useSaveFormula } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkFormula } from "@/lib/formula";
import type { Formula, FormulaVariable } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FormulaBuilderPage() {
  return (
    <RequirePermission action="configure_kpis">
      <FormulaBuilder />
    </RequirePermission>
  );
}

function FormulaBuilder() {
  const { user } = useAuth();
  const formulas = useFormulas();
  const save = useSaveFormula();

  const [formulaId, setFormulaId] = useState<string>("");
  const [expression, setExpression] = useState("");
  const [variables, setVariables] = useState<FormulaVariable[]>([]);
  const [changeNote, setChangeNote] = useState("");
  const [sample, setSample] = useState<Record<string, number>>({});

  const active: Formula | undefined = useMemo(
    () => formulas.data?.find((f) => f.id === formulaId),
    [formulas.data, formulaId],
  );

  useEffect(() => {
    if (!formulaId && formulas.data?.[0]) setFormulaId(formulas.data[0].id);
  }, [formulas.data, formulaId]);

  useEffect(() => {
    if (active) {
      setExpression(active.expression);
      setVariables(active.variables);
      setChangeNote("");
      setSample(Object.fromEntries(active.variables.map((v) => [v.symbol, 1])));
    }
  }, [active]);

  const check = useMemo(
    () => checkFormula(expression, variables, sample),
    [expression, variables, sample],
  );

  const dirty = !!active && expression.trim() !== active.expression.trim();

  const insert = (token: string) => setExpression((e) => `${e}${token}`);

  return (
    <>
      <PageHeader
        title="Custom Formula Builder"
        description="Author and validate KPI calculation formulas. Each save creates a new audited version."
        actions={
          <Button
            icon="save"
            disabled={!check.ok || !dirty || !changeNote.trim() || save.isPending}
            onClick={() =>
              active &&
              save.mutate(
                {
                  id: active.id,
                  expression: expression.trim(),
                  author: user.name,
                  changeNote: changeNote.trim(),
                },
                { onSuccess: () => setChangeNote("") },
              )
            }
          >
            {save.isPending ? "Saving…" : "Save Formula"}
          </Button>
        }
      />

      <QueryBoundary isLoading={formulas.isLoading} isError={formulas.isError}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-lg">
          <div className="flex flex-col gap-lg min-w-0">
            <Card>
              <CardHeader
                title="Formula Definition"
                actions={
                  active && <Badge tone="primary">{active.currentVersion}</Badge>
                }
              />
              <CardBody className="flex flex-col gap-lg">
                <Field label="Editing formula">
                  <Select value={formulaId} onChange={(e) => setFormulaId(e.target.value)}>
                    {formulas.data?.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Expression" hint="Use the declared variable symbols and math operators.">
                  <textarea
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    rows={3}
                    spellCheck={false}
                    className="w-full rounded-DEFAULT border border-hairline bg-surface-lowest px-md py-sm font-mono text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none resize-none"
                  />
                </Field>

                <div className="flex flex-wrap gap-xs">
                  {["+", "-", "*", "/", "(", ")", "100", "sqrt(", "min(", "max("].map((t) => (
                    <button
                      key={t}
                      onClick={() => insert(t)}
                      className="rounded-DEFAULT border border-hairline bg-surface-soft px-md py-xs font-mono text-body-sm hover:border-hairline-strong transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div
                  className={cn(
                    "flex items-start gap-sm rounded-lg border px-md py-sm",
                    check.ok
                      ? "border-[#bcd99a] bg-[#e9f3dd] text-[#2f6500]"
                      : "border-[#f0b6b0] bg-error-container text-on-error-container",
                  )}
                >
                  <Icon name={check.ok ? "check_circle" : "error"} size={20} />
                  <div className="text-body-sm">
                    <p>{check.message}</p>
                    {check.ok && typeof check.sample === "number" && (
                      <p className="text-caption-sm opacity-80">
                        Sample evaluation = {check.sample}
                      </p>
                    )}
                  </div>
                </div>

                <Field label="Change note" hint="Required — recorded in the version history.">
                  <Input
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="Describe what changed and why"
                  />
                </Field>
              </CardBody>
            </Card>
          </div>

          <div className="flex flex-col gap-lg">
            <Card>
              <CardHeader title="Variable Library" subtitle="Symbols available to this formula" />
              <CardBody className="flex flex-col gap-md">
                {variables.length === 0 && (
                  <p className="text-body-sm text-mute">No variables declared.</p>
                )}
                {variables.map((v) => (
                  <div key={v.symbol} className="flex flex-col gap-xs rounded-lg border border-hairline p-md">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => insert(v.symbol)}
                        className="font-mono text-body-strong text-primary-dark hover:underline"
                        title="Insert into expression"
                      >
                        {v.symbol}
                      </button>
                      <Badge tone="neutral">test = {sample[v.symbol] ?? 1}</Badge>
                    </div>
                    <p className="text-body-sm">{v.label}</p>
                    <p className="text-caption-sm text-mute">{v.source}</p>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sample[v.symbol] ?? 1}
                      onChange={(e) =>
                        setSample((s) => ({ ...s, [v.symbol]: Number(e.target.value) }))
                      }
                      className="accent-primary-container"
                    />
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Logic & Validation" />
              <CardBody className="flex flex-col gap-sm text-body-sm text-mute">
                <Row icon="function" label="Operators" value="+ − × ÷ ( )" />
                <Row icon="science" label="Functions" value="sqrt, min, max, round" />
                <Row icon="shield" label="Sandboxed" value="No eval / imports" />
              </CardBody>
            </Card>
          </div>
        </div>
      </QueryBoundary>
    </>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-sm">
        <Icon name={icon} size={18} className="text-primary" />
        {label}
      </span>
      <span className="font-mono text-on-surface">{value}</span>
    </div>
  );
}
