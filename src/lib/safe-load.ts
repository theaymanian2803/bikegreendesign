/**
 * Runs a loader and falls back instead of throwing.
 *
 * The storefront's front door must render even when the database is
 * unreachable: a mistyped credential or a Turso outage degrades to empty
 * sections and a designed empty state, never a 500 error page.
 */
export async function safeLoad<T>(fallback: T, load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error("[storefront] data load failed, rendering fallback:", error);
    return fallback;
  }
}
