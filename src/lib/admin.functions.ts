import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";

const turso = () => import("@/integrations/turso/client");

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  isAdmin: boolean;
  isGuest: boolean;
};

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const result = await getTurso().execute(
      "SELECT id, email, created_at, last_sign_in_at, is_admin, is_guest FROM users ORDER BY created_at",
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      email: String(row.email),
      createdAt: String(row.created_at),
      lastSignInAt: row.last_sign_in_at === null ? null : String(row.last_sign_in_at),
      confirmed: true,
      isAdmin: Number(row.is_admin) === 1,
      isGuest: Number(row.is_guest) === 1,
    }));
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z.object({ userId: z.string().min(1), makeAdmin: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const target = Number(data.userId);
    if (!Number.isInteger(target)) throw new Error("Invalid user id");

    const { getTurso } = await turso();
    const client = getTurso();

    const targetRow = await client.execute({
      sql: "SELECT is_guest FROM users WHERE id = ?",
      args: [target],
    });
    if (!targetRow.rows[0]) throw new Error("User not found");
    if (Number(targetRow.rows[0].is_guest) === 1) {
      throw new Error("Guest accounts cannot be admins");
    }

    if (!data.makeAdmin) {
      if (target === context.userId) {
        throw new Error("You cannot remove your own admin access");
      }
      const result = await client.execute("SELECT COUNT(*) AS count FROM users WHERE is_admin = 1");
      if (Number(result.rows[0]?.count ?? 0) <= 1) {
        throw new Error("At least one admin must remain");
      }
      await client.execute({ sql: "UPDATE users SET is_admin = 0 WHERE id = ?", args: [target] });
      return { ok: true };
    }

    await client.execute({ sql: "UPDATE users SET is_admin = 1 WHERE id = ?", args: [target] });
    return { ok: true };
  });

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z.object({ userId: z.string().min(1), password: z.string().min(8).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const target = Number(data.userId);
    if (!Number.isInteger(target)) throw new Error("Invalid user id");

    const { getTurso } = await turso();
    const client = getTurso();
    const targetRow = await client.execute({
      sql: "SELECT is_guest FROM users WHERE id = ?",
      args: [target],
    });
    if (!targetRow.rows[0]) throw new Error("User not found");
    if (Number(targetRow.rows[0].is_guest) === 1) {
      throw new Error("Guest accounts do not have passwords");
    }

    const { hashPassword } = await import("@/integrations/turso/password.server");
    const passwordHash = await hashPassword(data.password);
    await client.execute({
      sql: "UPDATE users SET password_hash = ? WHERE id = ?",
      args: [passwordHash, target],
    });
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ userId: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const target = Number(data.userId);
    if (!Number.isInteger(target)) throw new Error("Invalid user id");
    if (target === context.userId) throw new Error("You cannot delete your own account");

    const { getTurso } = await turso();
    const client = getTurso();
    await client.execute({
      sql: "UPDATE orders SET user_id = NULL WHERE user_id = ?",
      args: [target],
    });
    await client.execute({ sql: "DELETE FROM users WHERE id = ?", args: [target] });
    return { ok: true };
  });
