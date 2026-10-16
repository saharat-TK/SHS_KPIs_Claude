// Input rules for the /admin/edpex editor, shared by its form and the API so
// both refuse the same things. No runtime imports beyond siblings: tests load
// this file directly under node's type-stripping.
import {
  EDPEX_AREA_CODE_MAX,
  EDPEX_NAME_MAX,
  EDPEX_TOPIC_ID_MAX,
  edpexAreaId,
} from "./edpex.ts";

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** A code is what KPIs, CSV files and the area ids are keyed on, so it may not
 *  contain spaces — "7.1" or "ข", never "7.1 ข". */
function codeError(label: string, code: string, max: number): string | null {
  if (!code) return `${label} is required`;
  if (/\s/.test(code)) return `${label} cannot contain spaces`;
  if (code.length > max) return `${label} is longer than ${max} characters`;
  return null;
}

function nameError(name: string): string | null {
  if (!name) return "Name is required";
  if (name.length > EDPEX_NAME_MAX) return `Name is longer than ${EDPEX_NAME_MAX} characters`;
  return null;
}

export function readEdpexTopicInput(
  body: Record<string, unknown>,
): { ok: true; id: string; name: string } | { ok: false; error: string } {
  const id = clean(body.id);
  const name = clean(body.name);
  const error = codeError("Topic code", id, EDPEX_TOPIC_ID_MAX) ?? nameError(name);
  return error ? { ok: false, error } : { ok: true, id, name };
}

export function readEdpexAreaInput(
  body: Record<string, unknown>,
):
  | { ok: true; id: string; topicId: string; code: string; name: string }
  | { ok: false; error: string } {
  const topicId = clean(body.topicId);
  const code = clean(body.code);
  const name = clean(body.name);
  if (!topicId) return { ok: false, error: "Topic is required" };
  const error = codeError("Area code", code, EDPEX_AREA_CODE_MAX) ?? nameError(name);
  return error
    ? { ok: false, error }
    : { ok: true, id: edpexAreaId(topicId, code), topicId, code, name };
}

/** Name / order edits. Codes are fixed once created, so they are not read. */
export function readEdpexPatch(
  body: Record<string, unknown>,
): { ok: true; name?: string; sortOrder?: number } | { ok: false; error: string } {
  const out: { name?: string; sortOrder?: number } = {};
  if ("name" in body) {
    const name = clean(body.name);
    const error = nameError(name);
    if (error) return { ok: false, error };
    out.name = name;
  }
  if ("sortOrder" in body) {
    const n = Number(body.sortOrder);
    if (!Number.isInteger(n)) return { ok: false, error: "sortOrder must be a whole number" };
    out.sortOrder = n;
  }
  if (out.name === undefined && out.sortOrder === undefined) {
    return { ok: false, error: "No fields to update" };
  }
  return { ok: true, ...out };
}
