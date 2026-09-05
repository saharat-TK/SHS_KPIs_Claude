// The deployed app is served beneath this path; local dev stays at the
// conventional localhost root. Mirrors next.config.mjs — keep both in sync.
export const BASE_PATH = process.env.NODE_ENV === "production" ? "/SHSKPIs" : "";
