"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  StatCard,
  Badge,
  Button,
  Table,
  Th,
  Td,
  Tr,
  QueryBoundary,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  useKpis,
  useDepartments,
  useFaculty,
  useValidations,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import { KPI_CATEGORIES } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { user, can } = useAuth();
  const kpis = useKpis();
  const departments = useDepartments();
  const faculty = useFaculty();
  const validations = useValidations();

  const loading =
    kpis.isLoading || departments.isLoading || faculty.isLoading || validations.isLoading;

  const atRisk = useMemo(
    () =>
      (kpis.data ?? []).filter(
        (k) => healthOf(k.currentValue, k.thresholds) !== "healthy",
      ),
    [kpis.data],
  );

  const pending = (validations.data ?? []).filter((v) => v.status === "pending").length;

  const categorySummary = useMemo(() => {
    return KPI_CATEGORIES.map((c) => {
      const list = (kpis.data ?? []).filter((k) => k.category === c.id);
      const healthy = list.filter(
        (k) => healthOf(k.currentValue, k.thresholds) === "healthy",
      ).length;
      return { ...c, total: list.length, healthy };
    });
  }, [kpis.data]);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ").slice(-1)[0]}`}
        description="School of Health Sciences — performance at a glance."
      />

      <QueryBoundary isLoading={loading} isError={kpis.isError}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
          <StatCard label="Tracked KPIs" value={kpis.data?.length ?? 0} icon="tune" />
          <StatCard
            label="Departments"
            value={(departments.data ?? []).filter((d) => d.status === "active").length}
            icon="account_tree"
          />
          <StatCard label="Faculty" value={faculty.data?.length ?? 0} icon="groups" />
          <StatCard
            label="Pending Reviews"
            value={pending}
            icon="fact_check"
            delta={
              pending > 0
                ? { value: "needs attention", direction: "down" }
                : { value: "all clear", direction: "up" }
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-lg">
          <Card>
            <CardHeader
              title="KPI Health by Category"
              actions={
                can("configure_kpis") && (
                  <Link href="/kpis">
                    <Button variant="ghost" size="sm" iconRight="chevron_right">
                      Manage
                    </Button>
                  </Link>
                )
              }
            />
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {categorySummary.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-hairline p-md"
                >
                  <div className="min-w-0">
                    <p className="text-body-strong text-on-surface truncate">{c.label}</p>
                    <p className="text-caption-sm text-mute">
                      {c.healthy}/{c.total} on target
                    </p>
                  </div>
                  <Badge tone={c.total && c.healthy === c.total ? "success" : c.healthy === 0 ? "error" : "warning"}>
                    {c.total ? Math.round((c.healthy / c.total) * 100) : 0}%
                  </Badge>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Needs Review"
              actions={
                can("review_submissions") && (
                  <Link href="/validation">
                    <Button variant="ghost" size="sm" iconRight="chevron_right">
                      Queue
                    </Button>
                  </Link>
                )
              }
            />
            <CardBody className="flex flex-col gap-sm">
              <div className="flex items-center gap-md rounded-lg bg-surface-soft p-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Icon name="pending_actions" size={22} />
                </span>
                <div>
                  <p className="text-heading-md text-on-surface">{pending}</p>
                  <p className="text-caption-sm text-mute">submissions awaiting validation</p>
                </div>
              </div>
              <p className="text-body-sm text-mute">
                {can("review_submissions")
                  ? "You have reviewer access — open the queue to act on these."
                  : "Reviewers will action these submissions."}
              </p>
            </CardBody>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader
            title="KPIs at Risk"
            subtitle={`${atRisk.length} indicator(s) below target`}
            actions={
              <Link href="/analytics/student-success">
                <Button variant="ghost" size="sm" iconRight="insights">
                  Analytics
                </Button>
              </Link>
            }
          />
          {atRisk.length === 0 ? (
            <CardBody>
              <p className="text-body-sm text-mute">All tracked KPIs are on target. 🎯</p>
            </CardBody>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>KPI</Th>
                  <Th>Category</Th>
                  <Th align="right">Current</Th>
                  <Th>Health</Th>
                </tr>
              </thead>
              <tbody>
                {atRisk.map((k) => {
                  const health = healthOf(k.currentValue, k.thresholds);
                  const cat = KPI_CATEGORIES.find((c) => c.id === k.category)?.label;
                  return (
                    <Tr key={k.id}>
                      <Td className="font-medium">{k.name}</Td>
                      <Td className="text-mute">{cat}</Td>
                      <Td align="right" className="font-medium">
                        {formatNumber(k.currentValue, 1)} {k.unit}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-sm">
                          <ThresholdBar value={k.currentValue} thresholds={k.thresholds} className="w-[90px]" />
                          <span className="text-caption-sm text-mute">{HEALTH_LABEL[health]}</span>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      </QueryBoundary>
    </>
  );
}
