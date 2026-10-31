// Auth function middleware for server functions. Import this module ONLY via
// `.middleware([requireAuth])` from server function files; the build tooling
// keeps the server-only logic out of the client bundle.
import { createMiddleware } from "@tanstack/react-start";

import { getSessionUser } from "./auth.server";
import type { SessionUser } from "./auth.server";

export type { SessionUser };

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  return next({ context: { userId: user.id, user } });
});
