"use client";

import { useCallback, useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Table,
  Th,
  Td,
  Tr,
  Button,
  StatCard,
  QueryBoundary,
  ThresholdBar,
  healthOf,
  HEALTH_LABEL,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { TrendLineChart, CategoryBarChart } from "@/components/ui/Charts";
import { useKpis, useCommittees, useMeasurements } from "@/lib/data/hooks";
import { PERIODS } from "@/lib/data/seed";
import { toCsv, downloadCsv } from "@/lib/csv";
import { formatNumber } from "@/lib/utils";

const SS_KPIS = ["kpi-grad-rate", "kpi-licensure", "kpi-employment"];
const SHORT: Record<string, string> = {
  "kpi-grad-rate": "Graduation",
  "kpi-licensure": "Licensure",
  "kpi-employment": "Employment",
};

export default function StudentSuccessPage() {
  const kpis = useKpis();
  const committees = useCommittees();
  const measurements = useMeasurements();
  const [period, setPeriod] = useState<string>(PERIODS[PERIODS.length - 1]);

  const loading = kpis.isLoading || committees.isLoading || measurements.isLoading;

  const val = useCallback(
    (kpiId: string, committeeId: string, p: string) =>
      measurements.data?.find(
        (m) => m.targetId === kpiId && m.committeeId === committeeId && m.period === p,
      )?.value ?? null,
    [measurements.data],
  );

  // Overall (mean across committees) per KPI for the selected period.
  const overall = useMemo(() => {
    const out: Record<string, number> = {};
    const activeCommittees = (committees.data ?? []).filter((d) => d.status === "active");
    for (const k of SS_KPIS) {
      const vals = activeCommittees
        .map((d) => val(k, d.id, period))
        .filter((v): v is number => v != null);
      out[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    return out;
  }, [committees.data, period, val]);

  // Trend across all periods (overall mean) for the line chart.
  const trend = useMemo(() => {
    const activeCommittees = (committees.data ?? []).filter((d) => d.status === "active");
    return PERIODS.map((p) => {
      const row: Record<string, string | number> = { period: p };
      for (const k of SS_KPIS) {
        const vals = activeCommittees
          .map((d) => val(k, d.id, p))
          .filter((v): v is number => v != null);
        row[k] = vals.length
          ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
          : 0;
      }
      return row;
    });
  }, [committees.data, val]);

  // Committee breakdown for the selected period.
  const breakdown = useMemo(() => {
    const activeCommittees = (committees.data ?? []).filter((d) => d.status === "active");
    return activeCommittees.map((d) => ({
      committee: d.name,
      committeeId: d.id,
      grad: val("kpi-grad-rate", d.id, period),
      lic: val("kpi-licensure", d.id, period),
      emp: val("kpi-employment", d.id, period),
    }));
  }, [committees.data, period, val]);

  const barData = breakdown.map((b) => ({ committee: b.committee, value: b.grad ?? 0 }));

  const kpiOf = (id: string) => kpis.data?.find((k) => k.id === id);

  const exportCsv = () => {
    const headers = ["Committee", "Graduation", "Licensure", "Employment"];
    const rows = breakdown.map((b) => [b.committee, b.grad ?? "", b.lic ?? "", b.emp ?? ""]);
    downloadCsv(`student-success-${period}.csv`, toCsv(headers, rows));
  };

  return (
    <>
      <PageHeader
        title="Student Success Deep-Dive"
        description="Graduation, licensure and post-graduation employment across committees."
        actions={
          <Button variant="outline" icon="download" onClick={exportCsv}>
            Export Data CSV
          </Button>
        }
      />

      <div className="flex items-center gap-xs">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={
              "rounded-DEFAULT px-md py-sm text-label-md border transition-colors " +
              (p === period
                ? "border-primary-container bg-surface-soft text-primary-dark"
                : "border-hairline bg-surface-lowest text-mute hover:text-on-surface")
            }
          >
            {p.replace("2024-", "")} 2024
          </button>
        ))}
      </div>

      <QueryBoundary isLoading={loading} isError={kpis.isError}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
          {SS_KPIS.map((k) => {
            const kpi = kpiOf(k);
            const v = overall[k] ?? 0;
            const health = kpi ? healthOf(v, kpi.thresholds) : "watch";
            return (
              <StatCard
                key={k}
                label={SHORT[k] + " Rate"}
                value={formatNumber(v, 1)}
                unit={kpi?.unit}
                icon="school"
                delta={{
                  value: HEALTH_LABEL[health],
                  direction:
                    health === "healthy" ? "up" : health === "at_risk" ? "down" : "flat",
                }}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          <Card>
            <CardHeader title="Overall Trend" subtitle="Mean across committees by quarter" />
            <CardBody>
              <TrendLineChart
                data={trend}
                xKey="period"
                lines={SS_KPIS.map((k) => ({ key: k, label: SHORT[k] }))}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={`Graduation by Committee · ${period.replace("2024-", "")} 2024`} />
            <CardBody>
              <CategoryBarChart data={barData} xKey="committee" barKey="value" label="Graduation %" />
            </CardBody>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader title="Committee Breakdown" subtitle={`Sub-KPI detail for ${period.replace("2024-", "")} 2024`} />
          <Table>
            <thead>
              <tr>
                <Th>Committee</Th>
                <Th align="right">Graduation Rate</Th>
                <Th align="right">Licensure Pass Rate</Th>
                <Th align="right">Post-Grad Emp.</Th>
                <Th>Trend</Th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => {
                const gradKpi = kpiOf("kpi-grad-rate");
                return (
                  <Tr key={b.committeeId}>
                    <Td className="font-medium">{b.committee}</Td>
                    <Td align="right">{b.grad != null ? formatNumber(b.grad, 1) + "%" : "—"}</Td>
                    <Td align="right">{b.lic != null ? formatNumber(b.lic, 1) + "%" : "—"}</Td>
                    <Td align="right">{b.emp != null ? formatNumber(b.emp, 1) + "%" : "—"}</Td>
                    <Td>
                      {gradKpi && b.grad != null && (
                        <div className="flex items-center gap-sm">
                          <ThresholdBar value={b.grad} thresholds={gradKpi.thresholds} className="w-[80px]" />
                          <Icon
                            name={b.grad >= gradKpi.thresholds.green ? "trending_up" : "trending_flat"}
                            size={16}
                            className={b.grad >= gradKpi.thresholds.green ? "text-success" : "text-mute"}
                          />
                        </div>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      </QueryBoundary>
    </>
  );
}
