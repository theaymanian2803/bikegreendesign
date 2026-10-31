import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";
import type { MegaMenuContent } from "@/data/mega-menu";

const turso = () => import("@/integrations/turso/client");

export type MenuRow = {
  key: string;
  title: string;
  categories_title: string;
  products_title: string;
  left_banner_image: string | null;
  left_banner_alt: string | null;
  right_banner_image: string | null;
  right_banner_alt: string | null;
  sort_order: number;
};

export type CategoryRow = {
  id: number;
  menu_key: string;
  label: string;
  image_url: string;
  href: string;
  sort_order: number;
};

export type ProductRow = {
  id: number;
  menu_key: string;
  name: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  image_url: string;
  href: string;
  sort_order: number;
};

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

/** Public read of a single menu's content (used by the site header). */
export const getMegaMenuData = createServerFn({ method: "GET" })
  .validator((input) => z.string().min(1).max(60).parse(input))
  .handler(async ({ data: menuKey }): Promise<MegaMenuContent | null> => {
    const { getTurso } = await turso();
    const client = getTurso();
    const [menuRes, catRes, prodRes] = await Promise.all([
      client.execute({
        sql: "SELECT * FROM mega_menus WHERE key = ?",
        args: [menuKey],
      }),
      client.execute({
        sql: "SELECT id, menu_key, label, image_url, href, sort_order FROM mega_menu_categories WHERE menu_key = ? ORDER BY sort_order",
        args: [menuKey],
      }),
      client.execute({
        sql: "SELECT id, menu_key, name, price, old_price, badge, image_url, href, sort_order FROM mega_menu_products WHERE menu_key = ? ORDER BY sort_order",
        args: [menuKey],
      }),
    ]);

    const menu = menuRes.rows[0];
    if (!menu) return null;

    const banner = (image: unknown, alt: unknown) =>
      image ? { image: String(image), alt: String(alt ?? "") } : undefined;

    return {
      key: String(menu.key),
      title: String(menu.title),
      categoriesTitle: String(menu.categories_title),
      categories: catRes.rows.map((c) => ({
        id: Number(c.id),
        label: String(c.label),
        image: String(c.image_url),
        href: String(c.href),
      })),
      productsTitle: String(menu.products_title),
      products: prodRes.rows.map((p) => ({
        id: Number(p.id),
        name: String(p.name),
        price: Number(p.price),
        oldPrice: p.old_price === null ? undefined : Number(p.old_price),
        image: String(p.image_url),
        badge: p.badge === null ? undefined : String(p.badge),
        href: String(p.href),
      })),
      leftBanner: banner(menu.left_banner_image, menu.left_banner_alt),
      rightBanner: banner(menu.right_banner_image, menu.right_banner_alt),
    };
  });

const menuRowSchema = z.object({
  key: z.string().min(1),
  title: z.string(),
  categories_title: z.string(),
  products_title: z.string(),
  left_banner_image: z.string().nullable(),
  left_banner_alt: z.string().nullable(),
  right_banner_image: z.string().nullable(),
  right_banner_alt: z.string().nullable(),
});

const categoryRowSchema = z.object({
  id: z.number(),
  menu_key: z.string().min(1),
  label: z.string(),
  image_url: z.string(),
  href: z.string(),
  sort_order: z.number(),
});

const productRowSchema = z.object({
  id: z.number(),
  menu_key: z.string().min(1),
  name: z.string(),
  price: z.number(),
  old_price: z.number().nullable(),
  badge: z.string().nullable(),
  image_url: z.string(),
  href: z.string(),
  sort_order: z.number(),
});

export const loadMegaMenuAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const [menus, categories, products] = await Promise.all([
      client.execute(
        "SELECT key, title, categories_title, products_title, left_banner_image, left_banner_alt, right_banner_image, right_banner_alt, sort_order FROM mega_menus ORDER BY sort_order",
      ),
      client.execute(
        "SELECT id, menu_key, label, image_url, href, sort_order FROM mega_menu_categories ORDER BY sort_order",
      ),
      client.execute(
        "SELECT id, menu_key, name, price, old_price, badge, image_url, href, sort_order FROM mega_menu_products ORDER BY sort_order",
      ),
    ]);

    return {
      menus: menus.rows.map((r) => ({
        key: String(r.key),
        title: String(r.title),
        categories_title: String(r.categories_title),
        products_title: String(r.products_title),
        left_banner_image: r.left_banner_image === null ? null : String(r.left_banner_image),
        left_banner_alt: r.left_banner_alt === null ? null : String(r.left_banner_alt),
        right_banner_image: r.right_banner_image === null ? null : String(r.right_banner_image),
        right_banner_alt: r.right_banner_alt === null ? null : String(r.right_banner_alt),
        sort_order: Number(r.sort_order),
      })),
      categories: categories.rows.map((r) => ({
        id: Number(r.id),
        menu_key: String(r.menu_key),
        label: String(r.label),
        image_url: String(r.image_url),
        href: String(r.href),
        sort_order: Number(r.sort_order),
      })),
      products: products.rows.map((r) => ({
        id: Number(r.id),
        menu_key: String(r.menu_key),
        name: String(r.name),
        price: Number(r.price),
        old_price: r.old_price === null ? null : Number(r.old_price),
        badge: r.badge === null ? null : String(r.badge),
        image_url: String(r.image_url),
        href: String(r.href),
        sort_order: Number(r.sort_order),
      })),
    };
  });

/** Saves the menu settings plus the full category/product list for one menu. */
export const saveMegaMenu = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    z
      .object({
        menu: menuRowSchema,
        categories: z.array(categoryRowSchema).max(200),
        products: z.array(productRowSchema).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const now = new Date().toISOString();

    const statements = [
      {
        sql: `UPDATE mega_menus
              SET title = ?, categories_title = ?, products_title = ?,
                  left_banner_image = ?, left_banner_alt = ?,
                  right_banner_image = ?, right_banner_alt = ?, updated_at = ?
              WHERE key = ?`,
        args: [
          data.menu.title,
          data.menu.categories_title,
          data.menu.products_title,
          data.menu.left_banner_image,
          data.menu.left_banner_alt,
          data.menu.right_banner_image,
          data.menu.right_banner_alt,
          now,
          data.menu.key,
        ],
      },
      ...data.categories.map((c) => ({
        sql: `INSERT INTO mega_menu_categories (id, menu_key, label, image_url, href, sort_order, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                menu_key = excluded.menu_key,
                label = excluded.label,
                image_url = excluded.image_url,
                href = excluded.href,
                sort_order = excluded.sort_order,
                updated_at = excluded.updated_at`,
        args: [c.id, c.menu_key, c.label, c.image_url, c.href, c.sort_order, now],
      })),
      ...data.products.map((p) => ({
        sql: `INSERT INTO mega_menu_products (id, menu_key, name, price, old_price, badge, image_url, href, sort_order, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                menu_key = excluded.menu_key,
                name = excluded.name,
                price = excluded.price,
                old_price = excluded.old_price,
                badge = excluded.badge,
                image_url = excluded.image_url,
                href = excluded.href,
                sort_order = excluded.sort_order,
                updated_at = excluded.updated_at`,
        args: [
          p.id,
          p.menu_key,
          p.name,
          p.price,
          p.old_price,
          p.badge,
          p.image_url,
          p.href,
          p.sort_order,
          now,
        ],
      })),
    ];

    await client.batch(statements, "write");
    return { ok: true };
  });

export const addMegaMenuCategory = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ menuKey: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const next = await client.execute({
      sql: "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM mega_menu_categories WHERE menu_key = ?",
      args: [data.menuKey],
    });
    const sortOrder = Number(next.rows[0]?.next_order ?? 1);
    const insert = await client.execute({
      sql: "INSERT INTO mega_menu_categories (menu_key, label, image_url, href, sort_order) VALUES (?, 'New category', '/menu/p-helmet-red.jpg', '/shop', ?)",
      args: [data.menuKey, sortOrder],
    });
    return {
      id: Number(insert.lastInsertRowid),
      menu_key: data.menuKey,
      label: "New category",
      image_url: "/menu/p-helmet-red.jpg",
      href: "/shop",
      sort_order: sortOrder,
    };
  });

export const addMegaMenuProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ menuKey: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const next = await client.execute({
      sql: "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM mega_menu_products WHERE menu_key = ?",
      args: [data.menuKey],
    });
    const sortOrder = Number(next.rows[0]?.next_order ?? 1);
    const insert = await client.execute({
      sql: "INSERT INTO mega_menu_products (menu_key, name, price, image_url, href, sort_order) VALUES (?, 'New product', 0, '/menu/p-stem.jpg', '/shop', ?)",
      args: [data.menuKey, sortOrder],
    });
    return {
      id: Number(insert.lastInsertRowid),
      menu_key: data.menuKey,
      name: "New product",
      price: 0,
      old_price: null,
      badge: null,
      image_url: "/menu/p-stem.jpg",
      href: "/shop",
      sort_order: sortOrder,
    };
  });

export const removeMegaMenuCategory = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "DELETE FROM mega_menu_categories WHERE id = ?",
      args: [data.id],
    });
    return { ok: true };
  });

export const removeMegaMenuProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "DELETE FROM mega_menu_products WHERE id = ?",
      args: [data.id],
    });
    return { ok: true };
  });
