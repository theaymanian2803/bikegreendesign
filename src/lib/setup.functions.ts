import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";

const turso = () => import("@/integrations/turso/client");
const dbConfig = () => import("@/integrations/turso/db-config.server");
const authServer = () => import("@/integrations/turso/auth.server");

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

export type SetupInfo = {
  user: { id: number; email: string; name: string; isAdmin: boolean; isGuest: boolean };
  isDemoUser: boolean;
  ownerEmail: string | null;
  adminCount: number;
  db: { usingCustom: boolean; url: string | null };
};

export const getSetupInfo = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<SetupInfo> => {
    await assertAdmin(context.userId);
    const [{ getTurso }, { readDbConfig }, { DEMO_ADMIN_EMAIL }] = await Promise.all([
      turso(),
      dbConfig(),
      authServer(),
    ]);
    const db = await readDbConfig();
    const client = getTurso();
    const owner = await client.execute(
      "SELECT value FROM settings WHERE key = 'owner_email' LIMIT 1",
    );
    const admins = await client.execute(
      "SELECT COUNT(*) AS n FROM users WHERE is_admin = 1 AND email <> ?",
      [DEMO_ADMIN_EMAIL],
    );
    return {
      user: context.user,
      isDemoUser: context.user.email === DEMO_ADMIN_EMAIL,
      ownerEmail: owner.rows[0] ? String(owner.rows[0].value ?? "") || null : null,
      adminCount: Number(admins.rows[0]?.n ?? 0),
      db,
    };
  });

export const testDatabaseConnection = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z.object({ url: z.string().trim().min(1), token: z.string().trim().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { testTursoConnection } = await dbConfig();
    return testTursoConnection(data.url, data.token);
  });

export const connectDatabase = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z
      .object({
        url: z.string().trim().min(1),
        token: z.string().trim().min(1),
        keepSeed: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { connectDatabase } = await dbConfig();
    return connectDatabase({ ...data, user: context.user });
  });

export const resetDatabase = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { resetDatabase } = await dbConfig();
    await resetDatabase();
    return { ok: true as const };
  });
