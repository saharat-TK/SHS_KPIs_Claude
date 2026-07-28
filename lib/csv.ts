// CSV in and out. This module has NO imports on purpose — tests load it directly
// under node's type-stripping, and the parser is the one piece of the import flow
// that must be exercised against ugly real-world files.

/** Prepended to a download so Excel reads the file as UTF-8 rather than guessing
 *  a legacy codepage — without it the Thai labels in a template come out as
 *  mojibake. parseCsv strips it back off, so a downloaded file round-trips. */
export const UTF8_BOM = "﻿";

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

/** Parse CSV text into rows of raw cells (RFC 4180: quoted fields may contain
 *  commas, newlines, and "" escapes).
 *
 *  Deliberately dumb — it does not know about headers, comments, or types. The
 *  caller decides what a row means, which keeps this testable against the
 *  spreadsheet quirks that actually break imports: a UTF-8 BOM from Excel, CRLF
 *  line endings, and the trailing newline every editor adds. */
export function parseCsv(text: string): string[][] {
  const src = text.startsWith(UTF8_BOM) ? text.slice(UTF8_BOM.length) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];

    if (quoted) {
      if (ch !== '"') {
        field += ch;
      } else if (src[i + 1] === '"') {
        field += '"';
        i += 1; // consume the escape's second quote
      } else {
        quoted = false;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (ch === "\r" && src[i + 1] === "\n") i += 1; // CRLF is one break
    } else {
      field += ch;
    }
  }

  // A file ending in a newline leaves nothing pending; anything else is a last row.
  if (field !== "" || row.length > 0 || quoted) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
