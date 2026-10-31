import { getRequest } from "@tanstack/react-start/server";

import { decideAdminAccess } from "@/lib/admin-access";
import { getTurso } from "./client";

/**
 * Admin-only server functions call this.
 *
 * Reads (GET) are always allowed so a demo admin can explore the dashboard.
 * Writes (POST) require an activated license; without one the client sends the
 * admin to /activate. This is the server-side half of the preview mode.
 *
 * The decision itself lives in `@/lib/admin-access` so it can be tested without
 * a database or a request context.
 */
export async function assertAdminAccess(userId: number): Promise<void> {
  const result = await getTurso().execute({
    sql: "SELECT is_admin FROM users WHERE id = ?",
    args: [userId],
  });
  const row = result.rows[0];
  const isAdmin = Boolean(row) && Number(row.is_admin) === 1;

  let method = "POST";
  try {
    method = getRequest().method.toUpperCase();
  } catch {
    // No request context: treat as a write and require a license.
  }

  const readOnly = method === "GET" || method === "HEAD";
  let licensed = true;
  if (!readOnly && isAdmin) {
    const { currentLicense } = await import("./license.server");
    licensed = (await currentLicense()).licensed;
  }

  const decision = decideAdminAccess({ isAdmin, method, licensed });
  if (decision === "forbidden") throw new Error("Forbidden: admin role required");
  if (decision === "activate") {
    throw new Error("Preview mode: activate your license to add or edit anything.");
  }
}
