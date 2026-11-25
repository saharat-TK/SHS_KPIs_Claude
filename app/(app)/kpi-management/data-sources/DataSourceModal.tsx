"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { useT } from "@/lib/i18n/useT";
import type {
  Committee,
  DataSource,
  DataSourcePeriodGrain,
  DataSourceStatus,
} from "@/lib/types";

export interface DataSourceCreateInput {
  name: string;
  description?: string;
  committeeId: string;
  periodGrain: DataSourcePeriodGrain;
}

export interface DataSourceUpdateInput {
  name?: string;
  description?: string | null;
  committeeId?: string;
  periodGrain?: DataSourcePeriodGrain;
  status?: DataSourceStatus;
}

/**
 * Create/edit modal for a data source's own details. Pass `source` to edit an
 * existing one (adds a status field, locks the grain once entries exist, and
 * emits only the changed fields); omit it to create a new one.
 */
export function DataSourceModal({
  open,
  committees,
  submitting,
  source,
  onClose,
  onSubmit,
}: {
  open: boolean;
  committees: Committee[];
  submitting: boolean;
  source?: DataSource;
  onClose: () => void;
  onSubmit: (input: DataSourceCreateInput | DataSourceUpdateInput) => void;
}) {
  const t = useT();
  const isEdit = !!source;
  // The grain is baked into every entry's shape, so it can't move once data
  // exists — the API rejects it with a 409, and we mirror that guard here.
  const grainLocked = isEdit && (source?.entryCount ?? 0) > 0;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [periodGrain, setPeriodGrain] = useState<DataSourcePeriodGrain>("quarterly");
  const [status, setStatus] = useState<DataSourceStatus>("active");

  // Re-seed the form whenever it opens (or the edited source changes) so edit
  // mode shows the current values and create mode starts blank.
  useEffect(() => {
    if (!open) return;
    setName(source?.name ?? "");
    setDescription(source?.description ?? "");
    setCommitteeId(source?.committeeId ?? "");
    setPeriodGrain(source?.periodGrain ?? "quarterly");
    setStatus(source?.status ?? "active");
  }, [open, source]);

  const valid = name.trim().length > 0 && committeeId.length > 0;

  const submit = () => {
    if (!isEdit) {
      onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        committeeId,
        periodGrain,
      });
      return;
    }

    // Emit only what actually changed so the PATCH stays minimal.
    const patch: DataSourceUpdateInput = {};
    const trimmedName = name.trim();
    if (trimmedName !== source!.name) patch.name = trimmedName;
    const trimmedDescription = description.trim();
    if (trimmedDescription !== (source!.description ?? "")) {
      patch.description = trimmedDescription || null;
    }
    if (committeeId !== source!.committeeId) patch.committeeId = committeeId;
    if (!grainLocked && periodGrain !== source!.periodGrain) {
      patch.periodGrain = periodGrain;
    }
    if (status !== source!.status) patch.status = status;
    onSubmit(patch);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("dataSources.modal.editTitle") : t("dataSources.modal.createTitle")}
      subtitle={
        isEdit
          ? t("dataSources.modal.editSubtitle")
          : t("dataSources.modal.createSubtitle")
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("dataSources.modal.cancel")}
          </Button>
          <Button disabled={!valid || submitting} onClick={submit}>
            {submitting
              ? isEdit
                ? t("dataSources.modal.saving")
                : t("dataSources.modal.creating")
              : isEdit
                ? t("dataSources.modal.save")
                : t("dataSources.modal.create")}
          </Button>
        </>
      }
    >
      <div className="grid gap-md">
        <Field label={t("dataSources.modal.nameLabel")}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("dataSources.modal.namePlaceholder")}
          />
        </Field>
        <Field
          label={t("dataSources.modal.descriptionLabel")}
          hint={t("dataSources.modal.descriptionHint")}
        >
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field
          label={t("dataSources.modal.committeeLabel")}
          hint={t("dataSources.modal.committeeHint")}
        >
          <Select value={committeeId} onChange={(e) => setCommitteeId(e.target.value)}>
            <option value="">{t("dataSources.modal.committeePlaceholder")}</option>
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("dataSources.modal.grainLabel")}
          hint={
            grainLocked
              ? t("dataSources.modal.grainLockedHint")
              : t("dataSources.modal.grainHint")
          }
        >
          <Select
            value={periodGrain}
            disabled={grainLocked}
            onChange={(e) => setPeriodGrain(e.target.value as DataSourcePeriodGrain)}
          >
            <option value="quarterly">{t("dataSources.grain.quarterly")}</option>
            <option value="annual">{t("dataSources.grain.annual")}</option>
          </Select>
        </Field>
        {isEdit && (
          <Field
            label={t("dataSources.modal.statusLabel")}
            hint={t("dataSources.modal.statusHint")}
          >
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as DataSourceStatus)}
            >
              <option value="active">{t("dataSources.status.active")}</option>
              <option value="archived">{t("dataSources.status.archived")}</option>
            </Select>
          </Field>
        )}
      </div>
    </Modal>
  );
}
