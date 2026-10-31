import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";

const turso = () => import("@/integrations/turso/client");

export type TopBarSettings = {
  enabled: boolean;
  location: string;
  phone: string;
  email: string;
  trackOrderHref: string;
};

export const DEFAULT_TOP_BAR_SETTINGS: TopBarSettings = {
  enabled: true,
  location: "507 Union Trade Center, USA",
  phone: "(+91) 9876-543-210",
  email: "demo@example.com",
  trackOrderHref: "/admin/orders",
};

const KEYS = {
  enabled: "topbar_enabled",
  location: "topbar_location",
  phone: "topbar_phone",
  email: "topbar_email",
  trackOrderHref: "topbar_track_order_href",
} as const;

async function loadTopBar(): Promise<TopBarSettings> {
  const { getTurso } = await turso();
  const result = await getTurso().execute("SELECT key, value FROM settings");
  const map = new Map(result.rows.map((row) => [String(row.key), String(row.value)]));
  const rawEnabled = map.get(KEYS.enabled);
  return {
    enabled: rawEnabled === undefined ? DEFAULT_TOP_BAR_SETTINGS.enabled : rawEnabled === "1",
    location: map.get(KEYS.location) ?? DEFAULT_TOP_BAR_SETTINGS.location,
    phone: map.get(KEYS.phone) ?? DEFAULT_TOP_BAR_SETTINGS.phone,
    email: map.get(KEYS.email) ?? DEFAULT_TOP_BAR_SETTINGS.email,
    trackOrderHref: map.get(KEYS.trackOrderHref) ?? DEFAULT_TOP_BAR_SETTINGS.trackOrderHref,
  };
}

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

/** Public read of the storefront top bar. */
export const getTopBarSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<TopBarSettings> => loadTopBar(),
);

export const saveTopBarSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z
      .object({
        enabled: z.boolean(),
        location: z.string().trim().max(200),
        phone: z.string().trim().max(60),
        email: z
          .string()
          .trim()
          .max(255)
          .refine((value) => value === "" || /^\S+@\S+\.\S+$/.test(value), {
            message: "Enter a valid email address",
          }),
        trackOrderHref: z
          .string()
          .trim()
          .max(500)
          .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value), {
            message: "Use a path like /admin/orders or a full http(s) URL",
          }),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const now = new Date().toISOString();
    const entries: [string, string][] = [
      [KEYS.enabled, data.enabled ? "1" : "0"],
      [KEYS.location, data.location],
      [KEYS.phone, data.phone],
      [KEYS.email, data.email],
      [KEYS.trackOrderHref, data.trackOrderHref],
    ];
    await getTurso().batch(
      entries.map(([key, value]) => ({
        sql: `INSERT INTO settings (key, value, updated_at)
              VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        args: [key, value, now],
      })),
      "write",
    );
    return { ok: true };
  });
