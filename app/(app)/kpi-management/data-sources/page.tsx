"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Button,
  Badge,
  QueryBoundary,
  EmptyState,
  Select,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCommittees, useCreateDataSource, useDataSources } from "@/lib/data/hooks";
import { useLocale, useT } from "@/lib/i18n/useT";
import { formatDateLocalized } from "@/lib/utils";
import type { Committee, DataSource } from "@/lib/types";
import { DataSourceModal, type DataSourceCreateInput } from "./DataSourceModal";

export default function DataSourcesPage() {
  return (
    <RequirePermission action="view_dashboards">
      <DataSources />
    </RequirePermission>
  );
}

function DataSources() {
  const router = useRouter();
  const { can, user } = useAuth();
  const t = useT();
  const locale = useLocale();
  const [committeeFilter, setCommitteeFilter] = useState("");
  const sourcesQ = useDataSources(
    committeeFilter ? { committeeId: committeeFilter } : undefined,
  );
  const committeesQ = useCommittees();
  const create = useCreateDataSource();
  const [showCreate, setShowCreate] = useState(false);

  const sources = sourcesQ.data ?? [];
  const isAdmin = can("configure_kpis");

  // A committee member's own sources are what they came here for, so float them
  // to the top rather than making them hunt through every committee's list.
  const ordered = user?.committeeId
    ? [...sources].sort((a, b) => {
        const mine = (s: DataSource) => (s.committeeId === user.committeeId ? 0 : 1);
        return mine(a) - mine(b) || a.name.localeCompare(b.name);
      })
    : sources;

  const newButton = isAdmin ? (
    <Button icon="add" onClick={() => setShowCreate(true)}>
      {t("dataSources.newButton")}
    </Button>
  ) : undefined;

  return (
    <>
      <PageHeader
        title={t("dataSources.title")}
        description={t("dataSources.description")}
        actions={newButton}
      />

      <Card elevated className="overflow-hidden">
        <div className="flex items-center gap-sm border-b border-hairline p-md">
          <Select
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            className="max-w-xs"
            aria-label={t("dataSources.filterAria")}
          >
            <option value="">{t("dataSources.allCommittees")}</option>
            {(committeesQ.data ?? []).map((c: Committee) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <QueryBoundary isLoading={sourcesQ.isLoading} isError={sourcesQ.isError}>
          {ordered.length === 0 ? (
            <EmptyState
              icon="database"
              title={t("dataSources.emptyTitle")}
              message={
                isAdmin
                  ? t("dataSources.emptyAdmin")
                  : t("dataSources.emptyMember")
              }
              action={newButton}
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("dataSources.colName")}</Th>
                  <Th>{t("dataSources.colCommittee")}</Th>
                  <Th align="center">{t("dataSources.colGrain")}</Th>
                  <Th align="center">{t("dataSources.colColumns")}</Th>
                  <Th align="center">{t("dataSources.colEntries")}</Th>
                  <Th align="center">{t("dataSources.colLinkedKpis")}</Th>
                  <Th align="center">{t("dataSources.colLatestUpdate")}</Th>
                  <Th align="center">{t("dataSources.colStatus")}</Th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((s) => (
                  <Tr
                    key={s.id}
                    onClick={() => router.push(`/kpi-management/data-sources/${s.id}`)}
                  >
                    <Td className="font-medium">{s.name}</Td>
                    <Td className="text-mute">{s.committeeName ?? s.committeeId}</Td>
                    <Td align="center">{t(`dataSources.grain.${s.periodGrain}`)}</Td>
                    <Td align="center">
                      {s.columnCount ?? 0 ? (
                        s.columnCount
                      ) : (
                        <Badge tone="warning">{t("dataSources.noColumns")}</Badge>
                      )}
                    </Td>
                    <Td align="center">{s.entryCount ?? 0}</Td>
                    <Td align="center">{s.linkCount ?? 0}</Td>
                    <Td align="center" className="text-mute">
                      {s.lastEntryAt ? formatDateLocalized(s.lastEntryAt, locale) : "—"}
                    </Td>
                    <Td align="center">
                      <Badge tone={s.status === "active" ? "success" : "neutral"}>
                        {t(`dataSources.status.${s.status}`)}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      <DataSourceModal
        open={showCreate}
        committees={committeesQ.data ?? []}
        submitting={create.isPending}
        onClose={() => setShowCreate(false)}
        onSubmit={(input) =>
          create.mutate(input as DataSourceCreateInput, {
            onSuccess: (created) => {
              setShowCreate(false);
              router.push(`/kpi-management/data-sources/${created.id}`);
            },
          })
        }
      />
    </>
  );
}
