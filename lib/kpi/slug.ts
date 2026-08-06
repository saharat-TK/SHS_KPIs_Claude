// Slug ids for user-named records (currently KPI categories).
//
// Shared by app/api/kpi-categories/route.ts and app/api/strategic-sets/route.ts,
// which each carried their own copy.

// Names are frequently Thai, and the ASCII-only character class strips every
// Thai codepoint — "ด้านที่ 1-การผลิตบัณฑิต" reduces to "1". A bare number is a
// terrible id (it collides with the next such name and reads as an accident),
// so anything that degenerates to empty-or-digits falls back to the caller's
// prefix and lets the collision loop number it: category_2, category_3, …
export function slugify(name: string, fallback = "category"): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return slug === "" || /^\d+$/.test(slug) ? fallback : slug;
}
