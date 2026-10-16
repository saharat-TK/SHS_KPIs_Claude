// EdPEx topic / area — the two optional KPI fields that place a KPI under an
// EdPEx Category 7 results item (7.1–7.5) and an area within it (7.1ก/ข/ค …).
//
// The list itself is admin-editable (tables edpex_topic / edpex_area, page
// /admin/edpex) and arrives as a catalog: topics, each carrying its areas.
// The one rule a KPI must keep is that its area belongs to its topic; an area
// given without a topic implies that topic.
//
// A KPI may also carry an indicator code: its numbered row in the School's
// EdPEx SAR ("7.1ข-4", "7.5ก-2-3"). It is free text — the SAR's numbering is
// not a managed list — but when an area is set the code must start with it.
//
// No runtime imports: tests load this file directly under node's type-stripping.
import type { EdpexArea, EdpexTopic } from "@/lib/types";

export type EdpexCatalog = Pick<EdpexTopic, "id" | "name" | "areas">[];

/** Limits shared by the admin API and its form (they match the column sizes). */
export const EDPEX_TOPIC_ID_MAX = 10;
export const EDPEX_AREA_CODE_MAX = 10;
export const EDPEX_NAME_MAX = 500;
/** Column size of library_kpi.edpex_indicator_code. */
export const EDPEX_INDICATOR_CODE_MAX = 30;

/** An area's id is its topic's id followed by its own code: "7.1" + "ข". */
export const edpexAreaId = (topicId: string, code: string) => `${topicId}${code}`;

/** Nest flat DB rows into the catalog shape, areas under their topic in order. */
export function buildEdpexCatalog(
  topics: { id: string; name: string; sortOrder: number }[],
  areas: EdpexArea[],
): EdpexTopic[] {
  const bySort = <T extends { sortOrder: number; id: string }>(a: T, b: T) =>
    a.sortOrder - b.sortOrder || a.id.localeCompare(b.id);
  return [...topics].sort(bySort).map((t) => ({
    ...t,
    areas: areas.filter((a) => a.topicId === t.id).sort(bySort),
  }));
}

export function allEdpexAreas(catalog: EdpexCatalog): EdpexArea[] {
  return catalog.flatMap((t) => t.areas);
}

export function findEdpexTopic(catalog: EdpexCatalog, id: string | null | undefined) {
  return id ? catalog.find((t) => t.id === id) : undefined;
}

export function findEdpexArea(
  catalog: EdpexCatalog,
  id: string | null | undefined,
): EdpexArea | undefined {
  return id ? allEdpexAreas(catalog).find((a) => a.id === id) : undefined;
}

/** The areas offered once a topic is chosen — the cascade behind every
 *  EdPEx-area dropdown. No topic, no areas. */
export function areasForTopic(catalog: EdpexCatalog, topicId: string | null | undefined) {
  return findEdpexTopic(catalog, topicId)?.areas ?? [];
}

/** Whether an area id may sit alongside a topic id. A blank area always fits. */
export function edpexAreaFitsTopic(
  catalog: EdpexCatalog,
  areaId: string | null | undefined,
  topicId: string | null | undefined,
): boolean {
  if (!areaId) return true;
  return areasForTopic(catalog, topicId).some((a) => a.id === areaId);
}

export interface EdpexFields {
  edpexTopicId: string | null;
  edpexAreaId: string | null;
  edpexIndicatorCode: string | null;
}

/** Why an indicator code cannot sit with an area, or null when it can. A blank
 *  code always fits; with no area only the length is checked. Spaces and case
 *  are ignored, so "7.1 ข-4" fits area 7.1ข. */
export function edpexIndicatorCodeError(
  code: string | null | undefined,
  areaId: string | null | undefined,
): string | null {
  const c = code?.trim();
  if (!c) return null;
  if (c.length > EDPEX_INDICATOR_CODE_MAX) {
    return `EdPEx indicator code must be ${EDPEX_INDICATOR_CODE_MAX} characters or fewer`;
  }
  const area = areaId?.trim();
  if (area && !squash(c).startsWith(squash(area))) {
    return `EdPEx indicator code "${c}" must start with its EdPEx area ${area} (e.g. ${area}-1)`;
  }
  return null;
}

/**
 * Validate and complete a KPI's EdPEx fields before they are written: blanks
 * become null, an area alone fills in its topic, and an unknown id, an area
 * from another topic or an indicator code outside its area is refused. Shared
 * by the single create/edit routes and the batch grid so all three apply one
 * rule.
 */
export function normaliseEdpex(
  input: {
    edpexTopicId?: string | null;
    edpexAreaId?: string | null;
    edpexIndicatorCode?: string | null;
  },
  catalog: EdpexCatalog,
): { ok: true; value: EdpexFields } | { ok: false; error: string } {
  const topicId = input.edpexTopicId?.trim() || null;
  const areaId = input.edpexAreaId?.trim() || null;
  const edpexIndicatorCode = input.edpexIndicatorCode?.trim() || null;

  if (topicId && !findEdpexTopic(catalog, topicId)) {
    return { ok: false, error: `Unknown EdPEx topic "${topicId}"` };
  }
  if (!areaId) {
    const error = edpexIndicatorCodeError(edpexIndicatorCode, null);
    if (error) return { ok: false, error };
    return { ok: true, value: { edpexTopicId: topicId, edpexAreaId: null, edpexIndicatorCode } };
  }

  const area = findEdpexArea(catalog, areaId);
  if (!area) return { ok: false, error: `Unknown EdPEx area "${areaId}"` };
  if (topicId && area.topicId !== topicId) {
    return { ok: false, error: `EdPEx area ${area.id} is not part of topic ${topicId}` };
  }
  const error = edpexIndicatorCodeError(edpexIndicatorCode, area.id);
  if (error) return { ok: false, error };
  return {
    ok: true,
    value: { edpexTopicId: area.topicId, edpexAreaId: area.id, edpexIndicatorCode },
  };
}

/** The area to keep after the topic changes: unchanged when it still fits,
 *  otherwise cleared — the same rule the type→category cascade follows. */
export function areaAfterTopicChange(
  catalog: EdpexCatalog,
  areaId: string,
  topicId: string,
): string {
  return edpexAreaFitsTopic(catalog, areaId, topicId) ? areaId : "";
}

/** Display string for a KPI's EdPEx placement, or null when it has none.
 *  Ids no longer in the catalog still show, bare, rather than vanish. */
export function edpexLabel(
  catalog: EdpexCatalog,
  topicId: string | null | undefined,
  areaId: string | null | undefined,
): string | null {
  if (areaId) {
    const area = findEdpexArea(catalog, areaId);
    return area ? `${area.id} · ${area.name}` : areaId;
  }
  if (topicId) {
    const topic = findEdpexTopic(catalog, topicId);
    return topic ? `${topic.id} · ${topic.name}` : topicId;
  }
  return null;
}

/** Short code for tight spaces (headers, chips): "7.1ข", or "7.1". */
export function edpexCode(
  topicId: string | null | undefined,
  areaId: string | null | undefined,
): string | null {
  return areaId || topicId || null;
}

// ── Reading typed text (paste, CSV) ─────────────────────────────────────────
// Same convention as the other batch resolvers: match by id, code or name,
// case- and space-insensitively; text that matches nothing is kept verbatim so
// validation can show it instead of silently dropping it.

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase();
/** Codes compare without spaces or a trailing dot: "7.1 ข." ≡ "7.1ข". */
const squash = (s: string) => norm(s).replace(/\s+/g, "").replace(/\.$/, "");

export function resolveEdpexTopicText(text: string, catalog: EdpexCatalog): string {
  const t = norm(text);
  if (!t) return "";
  return (
    catalog.find((c) => squash(c.id) === squash(text) || norm(c.name) === t)?.id ??
    text.trim()
  );
}

/** A bare code ("ข") resolves within `topicId`; a full id ("7.1ข") or a name
 *  resolves anywhere, preferring an area of `topicId` when names repeat. */
export function resolveEdpexAreaText(
  text: string,
  topicId: string,
  catalog: EdpexCatalog,
): string {
  const t = norm(text);
  if (!t) return "";
  const s = squash(text);
  const mine = areasForTopic(catalog, topicId);
  const byCode = mine.find((a) => squash(a.code) === s);
  if (byCode) return byCode.id;
  const matches = allEdpexAreas(catalog).filter(
    (a) => squash(a.id) === s || norm(a.name) === t,
  );
  return (matches.find((a) => a.topicId === topicId) ?? matches[0])?.id ?? text.trim();
}
