/**
 * The admin write gate, as a pure decision.
 *
 * Lives outside the server module so it can be tested without a database or a
 * request context. `assertAdminAccess` in `integrations/turso/admin-guard.server.ts`
 * performs the lookups and then applies this decision.
 */
export type AdminAccessInput = {
  isAdmin: boolean;
  /** Request method; empty when there is no request context. */
  method: string;
  licensed: boolean;
};

export type AdminAccessDecision = "allow" | "forbidden" | "activate";

export function decideAdminAccess({
  isAdmin,
  method,
  licensed,
}: AdminAccessInput): AdminAccessDecision {
  if (!isAdmin) return "forbidden";

  const verb = method.toUpperCase();
  if (verb === "GET" || verb === "HEAD") return "allow";

  return licensed ? "allow" : "activate";
}
