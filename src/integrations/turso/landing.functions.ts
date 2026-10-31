import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";
import {
  LANDING_SECTION_TYPES,
  defaultConfigFor,
  defaultTitleFor,
  landingConfigSchemas,
  landingSectionTypeSchema,
  parseLandingConfig,
  promoPopupConfigSchema,
  type LandingSection,
  type LandingSectionType,
  type PageLandingSection,
  type PromoPopupConfig,
  type PromoPopupSection,
} from "@/lib/landing";

const turso = () => import("@/integrations/turso/client");

const sectionColumns =
  "id, section_key, type, title, subtitle, image_url, visible, sort_order, platform, config";

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

function isLandingSectionType(value: string): value is LandingSectionType {
  return (LANDING_SECTION_TYPES as readonly string[]).includes(value);
}

function mapRow(row: Record<string, unknown>): LandingSection | null {
  const type = String(row.type);
  if (!isLandingSectionType(type)) return null;

  let rawConfig: unknown = {};
  try {
    rawConfig = JSON.parse(String(row.config ?? "{}"));
  } catch {
    rawConfig = {};
  }

  return {
    id: Number(row.id),
    sectionKey: String(row.section_key),
    type,
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    imageUrl: String(row.image_url ?? ""),
    visible: Number(row.visible) === 1,
    sortOrder: Number(row.sort_order),
    platform: row.platform === "web" ? "web" : row.platform === "mobile" ? "mobile" : "both",
    config: parseLandingConfig(type, rawConfig),
  } as LandingSection;
}

async function loadSections(options: {
  visibleOnly: boolean;
  includePopup: boolean;
  platform?: "web" | "mobile";
}): Promise<LandingSection[]> {
  const { getTurso } = await turso();
  const where: string[] = [];
  if (options.visibleOnly) where.push("visible = 1");
  if (!options.includePopup) where.push("type <> 'promo_popup'");
  if (options.platform) where.push(`platform IN ('${options.platform}', 'both')`);

  const result = await getTurso().execute(
    `SELECT ${sectionColumns} FROM landing_sections${
      where.length ? ` WHERE ${where.join(" AND ")}` : ""
    } ORDER BY sort_order, id`,
  );

  return result.rows
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((section): section is LandingSection => section !== null);
}

/** Public: visible homepage sections in display order (promo popup excluded). */
export const getLandingSections = createServerFn({ method: "GET" }).handler(
  async (): Promise<PageLandingSection[]> =>
    (await loadSections({
      visibleOnly: true,
      includePopup: false,
      platform: "web",
    })) as PageLandingSection[],
);

/** Public: visible sections published to the mobile app, in display order. */
export const getMobileLandingSections = createServerFn({ method: "GET" }).handler(
  async (): Promise<PageLandingSection[]> =>
    (await loadSections({
      visibleOnly: true,
      includePopup: false,
      platform: "mobile",
    })) as PageLandingSection[],
);

/** Public: the promo popup when enabled and visible, otherwise `null`. */
export const getPromoPopup = createServerFn({ method: "GET" }).handler(
  async (): Promise<PromoPopupSection | null> => {
    const sections = await loadSections({ visibleOnly: true, includePopup: true });
    const popup = sections.find((section) => section.type === "promo_popup");
    if (!popup || popup.type !== "promo_popup" || !popup.config.enabled) return null;
    return popup;
  },
);

export type PromoPopupAdmin = {
  title: string;
  subtitle: string;
  imageUrl: string;
  config: PromoPopupConfig;
};

/** Admin: promo popup values (defaults when the row does not exist yet). */
export const getPromoPopupAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<PromoPopupAdmin> => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const result = await getTurso().execute({
      sql: `SELECT ${sectionColumns} FROM landing_sections WHERE type = 'promo_popup' ORDER BY id LIMIT 1`,
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const section = row ? mapRow(row) : null;
    if (!section || section.type !== "promo_popup") {
      return {
        title: defaultTitleFor("promo_popup"),
        subtitle: "",
        imageUrl: "",
        config: defaultConfigFor("promo_popup") as PromoPopupConfig,
      };
    }
    return {
      title: section.title,
      subtitle: section.subtitle,
      imageUrl: section.imageUrl,
      config: section.config,
    };
  });

/** Admin: every editable homepage section (promo popup has its own page). */
export const getLandingAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<PageLandingSection[]> => {
    await assertAdmin(context.userId);
    return (await loadSections({
      visibleOnly: false,
      includePopup: false,
    })) as PageLandingSection[];
  });

const createSectionSchema = z.object({
  type: landingSectionTypeSchema,
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  imageUrl: z.string().max(1000).optional(),
  platform: z.enum(["web", "mobile", "both"]).optional(),
  config: z.unknown().optional(),
});

export const createLandingSection = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => createSectionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();

    let config = defaultConfigFor(data.type);
    if (data.config !== undefined) {
      const parsed = landingConfigSchemas[data.type].safeParse(data.config);
      if (!parsed.success) {
        throw new Error(
          `Invalid ${data.type} settings: ${parsed.error.issues[0]?.message ?? "bad data"}`,
        );
      }
      config = parsed.data as typeof config;
    }

    const next = await client.execute(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM landing_sections WHERE type <> 'promo_popup'",
    );
    const sortOrder = Number(next.rows[0]?.next_order ?? 1);
    const sectionKey = `${data.type}_${Date.now().toString(36)}`;
    const insert = await client.execute({
      sql: `INSERT INTO landing_sections
              (section_key, type, title, subtitle, image_url, visible, sort_order, platform, config)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      args: [
        sectionKey,
        data.type,
        data.title ?? defaultTitleFor(data.type),
        data.subtitle ?? "",
        data.imageUrl ?? "",
        sortOrder,
        data.platform ?? "both",
        JSON.stringify(config),
      ],
    });
    return { ok: true as const, id: Number(insert.lastInsertRowid) };
  });

const updateSectionSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().max(200),
  subtitle: z.string().max(500),
  imageUrl: z.string().max(1000),
  platform: z.enum(["web", "mobile", "both"]),
  config: z.unknown(),
});

export const updateLandingSection = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => updateSectionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const existing = await client.execute({
      sql: "SELECT type FROM landing_sections WHERE id = ?",
      args: [data.id],
    });
    const typeRaw = existing.rows[0]?.type;
    if (typeRaw === undefined) throw new Error("Section not found");
    const type = String(typeRaw);
    if (!isLandingSectionType(type)) throw new Error("Unknown section type");

    const parsed = landingConfigSchemas[type].safeParse(data.config);
    if (!parsed.success) {
      throw new Error(`Invalid ${type} settings: ${parsed.error.issues[0]?.message ?? "bad data"}`);
    }

    await client.execute({
      sql: `UPDATE landing_sections
            SET title = ?, subtitle = ?, image_url = ?, platform = ?, config = ?, updated_at = ?
            WHERE id = ?`,
      args: [
        data.title,
        data.subtitle,
        data.imageUrl,
        data.platform,
        JSON.stringify(parsed.data),
        new Date().toISOString(),
        data.id,
      ],
    });
    return { ok: true as const };
  });

export const setLandingVisibility = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z.object({ id: z.number().int().positive(), visible: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "UPDATE landing_sections SET visible = ?, updated_at = ? WHERE id = ?",
      args: [data.visible ? 1 : 0, new Date().toISOString(), data.id],
    });
    return { ok: true as const };
  });

export const deleteLandingSection = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "DELETE FROM landing_sections WHERE id = ?",
      args: [data.id],
    });
    return { ok: true as const };
  });

export const moveLandingSection = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z.object({ id: z.number().int().positive(), direction: z.enum(["up", "down"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const result = await client.execute(
      "SELECT id FROM landing_sections WHERE type <> 'promo_popup' ORDER BY sort_order, id",
    );
    const ids = result.rows.map((row) => Number(row.id));
    const index = ids.indexOf(data.id);
    const target = data.direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= ids.length) return { ok: true as const };

    [ids[index], ids[target]] = [ids[target], ids[index]];
    await client.batch(
      ids.map((id, position) => ({
        sql: "UPDATE landing_sections SET sort_order = ? WHERE id = ?",
        args: [position + 1, id],
      })),
      "write",
    );
    return { ok: true as const };
  });

const promoPopupInputSchema = z.object({
  title: z.string().max(200),
  subtitle: z.string().max(500),
  imageUrl: z.string().max(1000),
  config: promoPopupConfigSchema,
});

export const savePromoPopup = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => promoPopupInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const now = new Date().toISOString();
    const config = JSON.stringify(data.config);

    const existing = await client.execute(
      "SELECT id FROM landing_sections WHERE type = 'promo_popup' ORDER BY id LIMIT 1",
    );
    const id = existing.rows[0]?.id;
    if (id !== undefined) {
      await client.execute({
        sql: `UPDATE landing_sections
              SET title = ?, subtitle = ?, image_url = ?, visible = ?, config = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          data.title,
          data.subtitle,
          data.imageUrl,
          data.config.enabled ? 1 : 0,
          config,
          now,
          Number(id),
        ],
      });
    } else {
      await client.execute({
        sql: `INSERT INTO landing_sections
                (section_key, type, title, subtitle, image_url, visible, sort_order, config)
              VALUES ('promo_popup', 'promo_popup', ?, ?, ?, ?, 999, ?)`,
        args: [data.title, data.subtitle, data.imageUrl, data.config.enabled ? 1 : 0, config],
      });
    }
    return { ok: true as const };
  });
