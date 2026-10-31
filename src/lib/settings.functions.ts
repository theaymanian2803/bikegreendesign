import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";

const turso = () => import("@/integrations/turso/client");

export type StoreSettings = {
  freeShippingThresholdCents: number;
  flatShippingCents: number;
  storeEmail: string;
  storePhone: string;
  /** "cms" renders the landing sections; anything else renders the designed homepage. */
  homeSource: string;
};

const DEFAULT_SETTINGS: StoreSettings = {
  freeShippingThresholdCents: 30000,
  flatShippingCents: 1900,
  storeEmail: "",
  storePhone: "",
  homeSource: "static",
};

async function loadSettings(): Promise<StoreSettings> {
  const { getTurso } = await turso();
  const result = await getTurso().execute("SELECT key, value FROM settings");
  const map = new Map(result.rows.map((r) => [String(r.key), String(r.value)]));
  return {
    freeShippingThresholdCents:
      Number(map.get("free_shipping_threshold_cents")) ||
      DEFAULT_SETTINGS.freeShippingThresholdCents,
    flatShippingCents: Number(map.get("flat_shipping_cents")) || DEFAULT_SETTINGS.flatShippingCents,
    storeEmail: map.get("store_email") || DEFAULT_SETTINGS.storeEmail,
    storePhone: map.get("store_phone") || DEFAULT_SETTINGS.storePhone,
    homeSource: map.get("home_source") || DEFAULT_SETTINGS.homeSource,
  };
}

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

/** Public read of store-wide settings (used by checkout to compute shipping). */
export const getSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreSettings> => loadSettings(),
);

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<StoreSettings> => {
    await assertAdmin(context.userId);
    return loadSettings();
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z
      .object({
        freeShippingThresholdCents: z.number().int().min(0).max(100000000),
        flatShippingCents: z.number().int().min(0).max(100000000),
        storeEmail: z.string().trim().email("Enter a valid email address").max(255),
        storePhone: z.string().trim().min(1, "Phone is required").max(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const now = new Date().toISOString();
    const entries: [string, string][] = [
      ["free_shipping_threshold_cents", String(data.freeShippingThresholdCents)],
      ["flat_shipping_cents", String(data.flatShippingCents)],
      ["store_email", data.storeEmail],
      ["store_phone", data.storePhone],
    ];
    const statements = entries.map(([key, value]) => ({
      sql: `INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [key, value, now],
    }));
    await getTurso().batch(statements, "write");
    return { ok: true };
  });

/** Chooses which homepage renders. Defaults to the designed homepage. */
export const setHomeSource = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ homeSource: z.enum(["static", "cms"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const now = new Date().toISOString();
    await getTurso().execute({
      sql: `INSERT INTO settings (key, value, updated_at)
            VALUES ('home_source', ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [data.homeSource, now],
    });
    return { ok: true };
  });

export const setDemoMode = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { writeDemoMode } = await import("@/integrations/turso/license.server");
    await writeDemoMode(data.enabled);
    return { ok: true };
  });
