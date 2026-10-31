/** Which homepage renders. Stored in `settings.home_source`. */
export type HomeSource = "static" | "cms";

/**
 * Decides which homepage to render.
 *
 * The live database already holds landing sections from the previous store, so
 * the designed homepage stays the default: a missing, empty or unrecognised
 * setting must never hand the homepage to the CMS by accident.
 */
export function resolveHomeSource(raw: unknown): HomeSource {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return value === "cms" ? "cms" : "static";
}
