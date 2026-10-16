"use client";

// The EdPEx-topic / EdPEx-area dropdown pair, shared by the Add KPI modal and
// the KPI editor. The area list follows the chosen topic; changing the topic
// drops an area that is not one of its own (lib/kpi/edpex.ts holds the rule).
//
// Renders two <Field>s as siblings so the caller's grid lays them out.
import { Field, Select } from "@/components/ui";
import type { EdpexTopic } from "@/lib/types";
import {
  areaAfterTopicChange,
  areasForTopic,
  findEdpexArea,
  findEdpexTopic,
} from "@/lib/kpi/edpex";

export interface EdpexValue {
  edpexTopicId: string;
  edpexAreaId: string;
}

export function EdpexSelects({
  catalog,
  value,
  onChange,
  topicLabel = "EdPEx Topic",
  areaLabel = "EdPEx Area",
  noneLabel = "None",
  chooseTopicFirst = "Choose a topic first",
  disabled,
}: {
  catalog: EdpexTopic[];
  value: EdpexValue;
  onChange: (next: EdpexValue) => void;
  topicLabel?: string;
  areaLabel?: string;
  noneLabel?: string;
  chooseTopicFirst?: string;
  disabled?: boolean;
}) {
  const { edpexTopicId: topicId, edpexAreaId: areaId } = value;
  const areas = areasForTopic(catalog, topicId);
  // A stored id the catalog no longer has stays visible rather than silently
  // reading as "None" — saving would otherwise blank it without anyone noticing.
  const unknownTopic = topicId && !findEdpexTopic(catalog, topicId);
  const unknownArea = areaId && !areas.some((a) => a.id === areaId);

  return (
    <>
      <Field label={topicLabel}>
        <Select
          value={topicId}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            onChange({
              edpexTopicId: next,
              edpexAreaId: areaAfterTopicChange(catalog, areaId, next),
            });
          }}
        >
          <option value="">{noneLabel}</option>
          {catalog.map((t) => (
            <option key={t.id} value={t.id}>
              {t.id} · {t.name}
            </option>
          ))}
          {unknownTopic && <option value={topicId}>{topicId} (not found)</option>}
        </Select>
      </Field>
      <Field label={areaLabel}>
        <Select
          value={areaId}
          disabled={disabled || (!topicId && !areaId)}
          onChange={(e) => onChange({ edpexTopicId: topicId, edpexAreaId: e.target.value })}
        >
          <option value="">{topicId ? noneLabel : chooseTopicFirst}</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id} · {a.name}
            </option>
          ))}
          {unknownArea && (
            <option value={areaId}>
              {areaId} ({findEdpexArea(catalog, areaId) ? "not in this topic" : "not found"})
            </option>
          )}
        </Select>
      </Field>
    </>
  );
}
