"use client";

import { useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Badge,
  Select,
  QueryBoundary,
  EmptyState,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useFormulas,
  useAllVersions,
  useRevertFormula,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatDate } from "@/lib/utils";

export default function FormulaHistoryPage() {
  return (
    <RequirePermission action="configure_kpis">
      <FormulaHistory />
    </RequirePermission>
  );
}

function FormulaHistory() {
  const { user } = useAuth();
  const formulas = useFormulas();
  const versions = useAllVersions();
  const revert = useRevertFormula();
  const [filter, setFilter] = useState("all");

  const formulaName = (id: number) =>
    formulas.data?.find((f) => f.id === id)?.name ?? String(id);
  const currentVersion = (id: number) =>
    formulas.data?.find((f) => f.id === id)?.currentVersion;

  const rows = useMemo(() => {
    const list = versions.data ?? [];
    return filter === "all" ? list : list.filter((v) => String(v.formulaId) === filter);
  }, [versions.data, filter]);

  return (
    <>
      <PageHeader
        title="Formula Version History"
        description="Full audit log of every formula change. Revert to restore a prior definition as a new version."
        actions={
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-auto min-w-[200px]"
          >
            <option value="all">All Formulas</option>
            {formulas.data?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        }
      />

      <Card>
        <CardHeader title="Audit Log" subtitle={`${rows.length} versions`} />
        <QueryBoundary
          isLoading={versions.isLoading || formulas.isLoading}
          isError={versions.isError}
        >
          {rows.length === 0 ? (
            <EmptyState title="No versions recorded" />
          ) : (
            <ol className="relative px-xl py-lg">
              {rows.map((v, i) => {
                const isCurrent = currentVersion(v.formulaId) === v.version;
                return (
                  <li key={v.id} className="relative flex gap-lg pb-xl last:pb-0">
                    {i < rows.length - 1 && (
                      <span className="absolute left-[15px] top-[32px] bottom-0 w-px bg-hairline" />
                    )}
                    <span
                      className={
                        "mt-tiny flex h-8 w-8 shrink-0 items-center justify-center rounded-full border " +
                        (isCurrent
                          ? "border-primary-container bg-surface-soft text-primary-dark"
                          : "border-hairline bg-surface-lowest text-mute")
                      }
                    >
                      <Icon name={isCurrent ? "bookmark" : "history"} size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-sm">
                        <span className="text-body-strong text-on-surface">
                          {formulaName(v.formulaId)}
                        </span>
                        <Badge tone={isCurrent ? "primary" : "neutral"}>
                          {v.version}
                        </Badge>
                        {isCurrent && <Badge tone="success">Current</Badge>}
                      </div>
                      <code className="mt-xs block w-fit max-w-full overflow-x-auto rounded-lg bg-surface-soft border border-hairline px-md py-xs font-mono text-body-sm">
                        {v.expression}
                      </code>
                      <p className="mt-xs text-body-sm text-on-surface">{v.changeNote}</p>
                      <p className="text-caption-sm text-mute">
                        {v.author} · {formatDate(v.createdAt)}
                      </p>
                    </div>

                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon="restore"
                        disabled={revert.isPending}
                        onClick={() =>
                          revert.mutate({
                            formulaId: v.formulaId,
                            versionId: v.id,
                            author: user.name,
                          })
                        }
                      >
                        Revert to {v.version}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
