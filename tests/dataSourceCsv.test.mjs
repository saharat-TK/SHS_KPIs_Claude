import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, toCsv, UTF8_BOM } from "../lib/csv.ts";
import {
  buildEntryTemplateCsv,
  collectEntryRows,
  entryFingerprint,
  matchTemplateHeaders,
  readEntryTemplateCsv,
  withResolvedOptions,
} from "../lib/kpi/dataSources.ts";

const col = (over = {}) => ({
  colKey: "count",
  label: "Count",
  dataType: "number",
  isRequired: false,
  options: null,
  ...over,
});

const PROGRAM = col({
  colKey: "program",
  label: "Program",
  dataType: "program",
  options: ["PH", "SHS", "OHS", "EnvH", "BM"],
});
const STATUS = col({
  colKey: "status",
  label: "Status",
  dataType: "select",
  options: ["employed", "studying"],
});

// ── parseCsv ────────────────────────────────────────────────────────────────

test("parseCsv reads plain rows", () => {
  assert.deepEqual(parseCsv("a,b\n1,2"), [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("parseCsv keeps commas and newlines inside quoted fields", () => {
  assert.deepEqual(parseCsv('a,"one, two"\n"line\nbreak",b'), [
    ["a", "one, two"],
    ["line\nbreak", "b"],
  ]);
});

test("parseCsv unescapes doubled quotes", () => {
  assert.deepEqual(parseCsv('"say ""hi""",b'), [['say "hi"', "b"]]);
});

test("parseCsv handles CRLF line endings", () => {
  assert.deepEqual(parseCsv("a,b\r\n1,2\r\n"), [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("parseCsv strips a leading BOM and drops the trailing newline", () => {
  assert.deepEqual(parseCsv(`${UTF8_BOM}a,b\n1,2\n`), [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("parseCsv round-trips what toCsv writes", () => {
  const csv = toCsv(["Label", "Note"], [['a "quoted", value', "line\nbreak"]]);
  assert.deepEqual(parseCsv(csv), [
    ["Label", "Note"],
    ['a "quoted", value', "line\nbreak"],
  ]);
});

// ── buildEntryTemplateCsv ───────────────────────────────────────────────────

const template = (over = {}) =>
  buildEntryTemplateCsv({
    sourceName: "Graduate Employment",
    grain: "quarterly",
    columns: [PROGRAM, STATUS, col()],
    choices: {
      program: [
        { code: "PH", label: "สาธารณสุขศาสตร์" },
        { code: "SHS", label: "วิทยาศาสตร์การกีฬา" },
      ],
      status: [
        { code: "employed", label: "employed" },
        { code: "studying", label: "studying" },
      ],
    },
    ...over,
  });

const headerRowOf = (csv) =>
  parseCsv(csv).find((r) => !(r[0] ?? "").startsWith("#"));

test("buildEntryTemplateCsv emits a Quarter column only for quarterly sources", () => {
  assert.deepEqual(headerRowOf(template()), [
    "Year",
    "Quarter",
    "Program",
    "Status",
    "Count",
    "Note",
  ]);
  assert.deepEqual(headerRowOf(template({ grain: "annual" })), [
    "Year",
    "Program",
    "Status",
    "Count",
    "Note",
  ]);
});

test("buildEntryTemplateCsv lists derived codes with their labels", () => {
  const csv = template();
  assert.match(csv, /^#\s+PH = สาธารณสุขศาสตร์$/m);
  assert.match(csv, /^#\s+SHS = วิทยาศาสตร์การกีฬา$/m);
  assert.match(csv, /Program \[program\] — 5 Programs\. Enter one of these codes:/);
});

test("buildEntryTemplateCsv prints a Choice option once, not as code = code", () => {
  const csv = template();
  assert.match(csv, /^#\s+employed$/m);
  assert.doesNotMatch(csv, /employed = employed/);
});

test("buildEntryTemplateCsv marks required columns and names the input format", () => {
  const csv = buildEntryTemplateCsv({
    sourceName: "S",
    grain: "annual",
    columns: [
      col({ colKey: "seen_on", label: "Seen on", dataType: "date", isRequired: true }),
      col({ colKey: "ok", label: "OK", dataType: "boolean" }),
    ],
  });
  assert.match(csv, /Seen on \[seen_on\] — Date, required\. Format: YYYY-MM-DD\./);
  assert.match(csv, /OK \[ok\] — Yes \/ No\. Enter true or false\./);
});

test("buildEntryTemplateCsv quotes a label containing a comma", () => {
  const csv = buildEntryTemplateCsv({
    sourceName: "S",
    grain: "annual",
    columns: [col({ colKey: "a", label: "Count, total" })],
  });
  assert.deepEqual(headerRowOf(csv), ["Year", "Count, total", "Note"]);
});

test("a freshly built template parses back to zero data rows", () => {
  const result = readEntryTemplateCsv({
    rows: parseCsv(`${UTF8_BOM}${template()}`),
    grain: "quarterly",
    columns: [PROGRAM, STATUS, col()],
  });
  assert.deepEqual(result.headerErrors, []);
  assert.deepEqual(result.rows, []);
});

// ── matchTemplateHeaders ────────────────────────────────────────────────────

const match = (header, grain = "quarterly", columns = [PROGRAM, col()]) =>
  matchTemplateHeaders(header, grain, columns);

test("matchTemplateHeaders maps by label or col_key, ignoring case and space", () => {
  const { map, errors } = match(["Year", "Quarter", " program ", "COUNT", "Note"]);
  assert.deepEqual(errors, []);
  assert.equal(map.year, 0);
  assert.equal(map.quarter, 1);
  assert.equal(map.note, 4);
  assert.deepEqual(map.columns, { program: 2, count: 3 });
});

test("matchTemplateHeaders rejects an unknown header", () => {
  const { errors } = match(["Year", "Quarter", "Program", "Salary"]);
  assert.deepEqual(errors, ['Unrecognised column "Salary" in the header row']);
});

test("matchTemplateHeaders rejects a repeated column", () => {
  const { errors } = match(["Year", "Quarter", "Program", "program"]);
  assert.deepEqual(errors, [
    'Column "Program" appears more than once in the header row',
  ]);
});

test("matchTemplateHeaders requires Year, and Quarter only when quarterly", () => {
  assert.match(match(["Quarter", "Program"]).errors[0], /must include a "Year" column/);
  assert.match(
    match(["Year", "Program"]).errors[0],
    /must include a "Quarter" column/,
  );
  assert.deepEqual(match(["Year", "Program"], "annual").errors, []);
});

test("matchTemplateHeaders reports a missing required column once", () => {
  const required = col({ colKey: "count", label: "Count", isRequired: true });
  const { errors } = match(["Year", "Quarter", "Program"], "quarterly", [
    PROGRAM,
    required,
  ]);
  assert.deepEqual(errors, [
    'Required column "Count" is missing from the header row',
  ]);
});

test("matchTemplateHeaders ignores trailing empty header cells", () => {
  const { errors } = match(["Year", "Quarter", "Program", "Count", "", ""]);
  assert.deepEqual(errors, []);
});

// ── collectEntryRows ────────────────────────────────────────────────────────

const collect = (cells, over = {}) => {
  const columns = over.columns ?? [PROGRAM, col()];
  const grain = over.grain ?? "quarterly";
  const header = over.header ?? ["Year", "Quarter", "Program", "Count", "Note"];
  const { map } = matchTemplateHeaders(header, grain, columns);
  return collectEntryRows({
    rows: cells.map((c, i) => ({ lineNumber: i + 1, cells: c })),
    map,
    grain,
    columns,
    labels: over.labels,
  });
};

test("collectEntryRows coerces a clean row to stored types", () => {
  const [row] = collect([["2568", "3", "PH", "42", "checked"]]);
  assert.deepEqual(row.errors, []);
  assert.equal(row.year, 2568);
  assert.equal(row.quarter, 3);
  assert.deepEqual(row.values, { program: "PH", count: 42 });
  assert.equal(row.note, "checked");
});

test("collectEntryRows drops entirely blank rows", () => {
  assert.deepEqual(collect([["", "", "", "", ""], ["  ", "", "", "", ""]]), []);
});

test("collectEntryRows flags a non-numeric cell against its own column", () => {
  const [row] = collect([["2568", "1", "PH", "twelve", ""]]);
  assert.equal(row.errors.length, 1);
  assert.equal(row.errors[0].colKey, "count");
  assert.match(row.errors[0].message, /"Count" must be a number/);
  assert.equal(row.raw.count, "twelve", "the rejected text is kept for the preview");
});

test("collectEntryRows flags an out-of-catalog program code", () => {
  const [row] = collect([["2568", "1", "XX", "1", ""]]);
  assert.equal(row.errors.length, 1);
  assert.equal(row.errors[0].colKey, "program");
  assert.match(row.errors[0].message, /not a valid choice/);
});

test("collectEntryRows suggests the code when a derived cell holds a label", () => {
  const [row] = collect([["2568", "1", "สาธารณสุขศาสตร์", "1", ""]], {
    labels: { PH: "สาธารณสุขศาสตร์" },
  });
  assert.match(row.errors[0].message, /did you mean "PH"\?/);
});

test("collectEntryRows flags a bad date and a missing required cell", () => {
  const columns = [
    col({ colKey: "seen_on", label: "Seen on", dataType: "date" }),
    col({ colKey: "count", label: "Count", isRequired: true }),
  ];
  const [row] = collect([["2568", "1", "2025-13-01", "", ""]], {
    columns,
    header: ["Year", "Quarter", "Seen on", "Count", "Note"],
  });
  assert.equal(row.errors.length, 2);
  assert.match(row.errors[0].message, /"Seen on" must be a date \(YYYY-MM-DD\)/);
  assert.deepEqual(row.errors[1], {
    colKey: "count",
    message: '"Count" is required',
  });
});

test("collectEntryRows accepts Yes/No for a boolean column", () => {
  const columns = [col({ colKey: "ok", label: "OK", dataType: "boolean" })];
  const header = ["Year", "Quarter", "OK", "Note"];
  const rows = collect(
    [
      ["2568", "1", "Yes", ""],
      ["2568", "1", "no", ""],
      ["2568", "1", "true", ""],
      ["2568", "1", "maybe", ""],
    ],
    { columns, header },
  );
  assert.deepEqual(
    rows.map((r) => r.values.ok),
    [true, false, true, null],
  );
  assert.match(rows[3].errors[0].message, /"OK" must be true or false/);
});

test("collectEntryRows reports a bad period against the row, not a column", () => {
  const [row] = collect([["not-a-year", "1", "PH", "1", ""]]);
  assert.equal(row.year, null);
  assert.deepEqual(row.errors, [
    { colKey: null, message: "A valid year is required" },
  ]);
  assert.equal(row.rawPeriod, "not-a-year Q1");
});

test("an annual source rejects a row that fills in a quarter", () => {
  const [row] = collect([["2568", "2", "PH", "1", ""]], {
    grain: "annual",
    header: ["Year", "Quarter", "Program", "Count", "Note"],
  });
  assert.match(row.errors[0].message, /annual data source does not take a quarter/);
});

test("an annual source tolerates an empty Quarter column", () => {
  const [row] = collect([["2568", "", "PH", "1", ""]], {
    grain: "annual",
    header: ["Year", "Quarter", "Program", "Count", "Note"],
  });
  assert.deepEqual(row.errors, []);
  assert.equal(row.quarter, null);
});

// ── readEntryTemplateCsv ────────────────────────────────────────────────────

test("readEntryTemplateCsv skips the legend and numbers lines against the file", () => {
  const csv = [
    "# SHS data entry template — S",
    "#   Program [program] — 5 Programs.",
    "#",
    "Year,Quarter,Program,Count,Note",
    "2568,1,PH,4,",
    "",
    "2568,2,SHS,5,",
  ].join("\n");

  const { headerErrors, rows } = readEntryTemplateCsv({
    rows: parseCsv(csv),
    grain: "quarterly",
    columns: [PROGRAM, col()],
  });
  assert.deepEqual(headerErrors, []);
  assert.deepEqual(
    rows.map((r) => r.lineNumber),
    [5, 7],
  );
});

test("readEntryTemplateCsv returns header errors and no rows", () => {
  const { headerErrors, rows } = readEntryTemplateCsv({
    rows: parseCsv("Year,Quarter,Salary\n2568,1,9"),
    grain: "quarterly",
    columns: [PROGRAM, col()],
  });
  assert.deepEqual(rows, []);
  assert.match(headerErrors[0], /Unrecognised column "Salary"/);
});

test("readEntryTemplateCsv rejects a file that is only a legend", () => {
  const { headerErrors } = readEntryTemplateCsv({
    rows: parseCsv("# just a comment\n"),
    grain: "annual",
    columns: [col()],
  });
  assert.deepEqual(headerErrors, ["This file has no header row"]);
});

// ── withResolvedOptions ─────────────────────────────────────────────────────

// A derived column arrives from the API with options: null, and coerceCellValue
// only checks a non-empty option list. Skipping this step made a bad program
// code preview clean and fail on import instead.
test("withResolvedOptions fills a derived column's allowed set from the choices", () => {
  const raw = [col({ ...PROGRAM, options: null }), col()];
  const [program, count] = withResolvedOptions(raw, {
    program: [
      { code: "PH", label: "สาธารณสุขศาสตร์" },
      { code: "SHS", label: "วิทยาศาสตร์การกีฬา" },
    ],
  });
  assert.deepEqual(program.options, ["PH", "SHS"]);
  assert.equal(count.options, null, "a non-derived column is untouched");
});

test("an unresolved derived column would accept anything — resolving rejects it", () => {
  const unresolved = [col({ ...PROGRAM, options: null }), col()];
  const header = ["Year", "Quarter", "Program", "Count", "Note"];
  const cells = [["2568", "1", "XX", "1", ""]];

  const lax = collectEntryRows({
    rows: cells.map((c, i) => ({ lineNumber: i + 1, cells: c })),
    map: matchTemplateHeaders(header, "quarterly", unresolved).map,
    grain: "quarterly",
    columns: unresolved,
  });
  assert.deepEqual(lax[0].errors, [], "this is the bug the resolve step prevents");

  const resolved = withResolvedOptions(unresolved, {
    program: [{ code: "PH", label: "สาธารณสุขศาสตร์" }],
  });
  const strict = collectEntryRows({
    rows: cells.map((c, i) => ({ lineNumber: i + 1, cells: c })),
    map: matchTemplateHeaders(header, "quarterly", resolved).map,
    grain: "quarterly",
    columns: resolved,
  });
  assert.equal(strict[0].errors.length, 1);
  assert.equal(strict[0].errors[0].colKey, "program");
});

// ── entryFingerprint ────────────────────────────────────────────────────────

test("entryFingerprint matches on period and values, ignoring key order", () => {
  const columns = [PROGRAM, col()];
  const a = entryFingerprint(columns, 2568, 1, { program: "PH", count: 4 });
  const b = entryFingerprint(columns, 2568, 1, { count: 4, program: "PH" });
  assert.equal(a, b);
  assert.notEqual(a, entryFingerprint(columns, 2568, 2, { program: "PH", count: 4 }));
  assert.notEqual(a, entryFingerprint(columns, 2568, 1, { program: "SHS", count: 4 }));
});

test("entryFingerprint treats a missing cell as an empty one", () => {
  const columns = [PROGRAM, col()];
  assert.equal(
    entryFingerprint(columns, 2568, 1, { program: "PH" }),
    entryFingerprint(columns, 2568, 1, { program: "PH", count: null }),
  );
});
