import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";
import type { CatalogCategory, CatalogProduct, StorefrontNavigation } from "@/lib/catalog";

const turso = () => import("@/integrations/turso/client");

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `item-${Date.now().toString(36)}`;
}

type TursoClient = ReturnType<Awaited<ReturnType<typeof turso>>["getTurso"]>;

async function uniqueSlug(
  client: TursoClient,
  table: string,
  desired: string,
  excludeId?: number,
): Promise<string> {
  let slug = desired;
  let n = 2;
  for (;;) {
    const result = await client.execute({
      sql:
        excludeId === undefined
          ? `SELECT 1 FROM ${table} WHERE slug = ? LIMIT 1`
          : `SELECT 1 FROM ${table} WHERE slug = ? AND id <> ? LIMIT 1`,
      args: excludeId === undefined ? [slug] : [slug, excludeId],
    });
    if (result.rows.length === 0) return slug;
    slug = `${desired}-${n++}`;
  }
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed = JSON.parse(String(raw)) as T;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export type Spec = { label: string; value: string };

const defaultHighlights = [
  "CNC machined for a precise, rattle-free fit",
  "Weather sealed bearings and hardware",
  "Compatible with most modern frame standards",
  "2 year manufacturer warranty",
];

const defaultSpecs = (category: string): Spec[] => [
  { label: "Category", value: category },
  { label: "Material", value: "6061-T6 Aluminum / Carbon" },
  { label: "Weight", value: "342 g" },
  { label: "Colour", value: "Matte Black" },
  { label: "Warranty", value: "24 months" },
];

const defaultDescription = (name: string, category: string) =>
  `The ${name} is built for riders who expect their ${category.toLowerCase()} to keep up mile after mile. Precision machined from durable materials, it delivers reliable performance on tarmac, gravel and rough singletrack alike, while staying light enough to keep your bike responsive. Every unit is inspected in our workshop before it ships, and our mechanics are happy to fit it for you in store.`;

const productSelect = `
  SELECT p.id, p.slug, p.name, p.price, p.old_price, p.badge, p.rating, p.image_url,
         p.brand, p.sku, p.description, p.highlights, p.specs, p.category_id,
         c.name AS category_name, c.slug AS category_slug
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id`;

function mapProductRow(row: Record<string, unknown>): CatalogProduct {
  const name = String(row.name);
  const category = String(row.category_name ?? "");
  const highlights = parseJson<string[]>(row.highlights, []);
  const specs = parseJson<Spec[]>(row.specs, []);
  return {
    id: String(row.slug),
    name,
    price: Number(row.price),
    oldPrice: row.old_price === null ? undefined : Number(row.old_price),
    rating: Number(row.rating),
    image: String(row.image_url),
    badge: row.badge === null ? undefined : String(row.badge),
    category,
    categorySlug: String(row.category_slug ?? ""),
    brand: row.brand ? String(row.brand) : undefined,
    sku: row.sku ? String(row.sku) : undefined,
    description: String(row.description) || defaultDescription(name, category),
    highlights: highlights.length ? highlights : defaultHighlights,
    specs: specs.length ? specs : defaultSpecs(category),
  };
}

/** Full catalog for the storefront (shop, product and home pages). */
export const listCatalogProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogProduct[]> => {
    const { getTurso } = await turso();
    const result = await getTurso().execute(`${productSelect} ORDER BY p.sort_order, p.id`);
    return result.rows.map(mapProductRow);
  },
);

async function loadCategories(): Promise<CatalogCategory[]> {
  const { getTurso } = await turso();
  const result = await getTurso().execute(
    `SELECT c.id, c.name, c.slug, c.image_url, c.description,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
     FROM categories c
     ORDER BY c.sort_order, c.id`,
  );
  return result.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    slug: String(r.slug),
    image: String(r.image_url),
    description: String(r.description),
    count: Number(r.product_count),
  }));
}

export const listCatalogCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogCategory[]> => loadCategories(),
);

/** Public: live categories plus newest products for the storefront navigation. */
export const getStorefrontNavigationData = createServerFn({ method: "GET" }).handler(
  async (): Promise<StorefrontNavigation> => {
    const { getTurso } = await turso();
    const [categories, products] = await Promise.all([
      loadCategories(),
      getTurso().execute(`${productSelect} ORDER BY p.sort_order, p.id LIMIT 6`),
    ]);
    return {
      categories,
      products: products.rows.map((row) => mapProductRow(row as Record<string, unknown>)),
    };
  },
);

export const getCatalogProduct = createServerFn({ method: "GET" })
  .validator((input) => z.string().min(1).max(120).parse(input))
  .handler(
    async ({
      data: slug,
    }): Promise<{ product: CatalogProduct; related: CatalogProduct[] } | null> => {
      const { getTurso } = await turso();
      const client = getTurso();
      const [main, related] = await Promise.all([
        client.execute({ sql: `${productSelect} WHERE p.slug = ?`, args: [slug] }),
        client.execute({
          sql: `${productSelect} WHERE p.category_id = (SELECT category_id FROM products WHERE slug = ?) AND p.slug <> ? ORDER BY p.sort_order, p.id LIMIT 4`,
          args: [slug, slug],
        }),
      ]);
      const row = main.rows[0];
      if (!row) return null;
      return {
        product: mapProductRow(row as Record<string, unknown>),
        related: related.rows.map((r) => mapProductRow(r as Record<string, unknown>)),
      };
    },
  );

// ---------------------------------------------------------------------------
// Admin — products
// ---------------------------------------------------------------------------

export type AdminProductRow = {
  id: number;
  slug: string;
  name: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  rating: number;
  image_url: string;
  category_id: number | null;
  category_name: string | null;
  brand: string;
  sku: string;
  description: string;
  highlights: string[];
  specs: Spec[];
};

export type AdminCategoryRow = {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  description: string;
  sort_order: number;
  product_count: number;
};

const productInputSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(120),
  price: z.number().min(0),
  old_price: z.number().min(0).nullable(),
  badge: z.string().max(60).nullable(),
  rating: z.number().min(0).max(5),
  image_url: z.string().max(500),
  category_id: z.number().int().positive().nullable(),
  brand: z.string().max(120),
  sku: z.string().max(60),
  description: z.string(),
  highlights: z.array(z.string()).max(30),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).max(40),
});

export const loadCatalogAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(
    async ({
      context,
    }): Promise<{ products: AdminProductRow[]; categories: AdminCategoryRow[] }> => {
      await assertAdmin(context.userId);
      const { getTurso } = await turso();
      const client = getTurso();
      const [products, categories] = await Promise.all([
        client.execute(`${productSelect} ORDER BY p.sort_order, p.id`),
        client.execute(
          `SELECT c.id, c.name, c.slug, c.image_url, c.description, c.sort_order,
                (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
         FROM categories c
         ORDER BY c.sort_order, c.id`,
        ),
      ]);
      return {
        products: products.rows.map((r) => {
          const row = r as Record<string, unknown>;
          const categoryName = row.category_name === null ? null : String(row.category_name);
          const highlights = parseJson<string[]>(row.highlights, []);
          const specs = parseJson<Spec[]>(row.specs, []);
          return {
            id: Number(row.id),
            slug: String(row.slug),
            name: String(row.name),
            price: Number(row.price),
            old_price: row.old_price === null ? null : Number(row.old_price),
            badge: row.badge === null ? null : String(row.badge),
            rating: Number(row.rating),
            image_url: String(row.image_url),
            category_id: row.category_id === null ? null : Number(row.category_id),
            category_name: categoryName,
            brand: String(row.brand),
            sku: String(row.sku),
            description:
              String(row.description) || defaultDescription(String(row.name), categoryName ?? ""),
            highlights: highlights.length ? highlights : defaultHighlights,
            specs: specs.length ? specs : defaultSpecs(categoryName ?? ""),
          };
        }),
        categories: categories.rows.map((r) => ({
          id: Number(r.id),
          name: String(r.name),
          slug: String(r.slug),
          image_url: String(r.image_url),
          description: String(r.description),
          sort_order: Number(r.sort_order),
          product_count: Number(r.product_count),
        })),
      };
    },
  );

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => productInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const slug = await uniqueSlug(client, "products", slugify(data.slug || data.name));
    const next = await client.execute(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM products",
    );
    const sortOrder = Number(next.rows[0]?.next_order ?? 1);
    const result = await client.execute({
      sql: `INSERT INTO products
              (slug, name, price, old_price, badge, rating, image_url, category_id,
               brand, sku, description, highlights, specs, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        slug,
        data.name,
        data.price,
        data.old_price,
        data.badge,
        data.rating,
        data.image_url,
        data.category_id,
        data.brand,
        data.sku,
        data.description,
        JSON.stringify(data.highlights),
        JSON.stringify(data.specs),
        sortOrder,
      ],
    });
    return { ok: true, id: Number(result.lastInsertRowid), slug };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => productInputSchema.extend({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const slug = await uniqueSlug(client, "products", slugify(data.slug || data.name), data.id);
    await client.execute({
      sql: `UPDATE products SET
              slug = ?, name = ?, price = ?, old_price = ?, badge = ?, rating = ?,
              image_url = ?, category_id = ?, brand = ?, sku = ?, description = ?,
              highlights = ?, specs = ?, updated_at = ?
            WHERE id = ?`,
      args: [
        slug,
        data.name,
        data.price,
        data.old_price,
        data.badge,
        data.rating,
        data.image_url,
        data.category_id,
        data.brand,
        data.sku,
        data.description,
        JSON.stringify(data.highlights),
        JSON.stringify(data.specs),
        new Date().toISOString(),
        data.id,
      ],
    });
    return { ok: true, slug };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "DELETE FROM products WHERE id = ?",
      args: [data.id],
    });
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Admin — categories
// ---------------------------------------------------------------------------

const categoryInputSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().max(80),
  image_url: z.string().max(500),
  description: z.string().max(500),
});

export const createCategory = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => categoryInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const slug = await uniqueSlug(client, "categories", slugify(data.slug || data.name));
    const next = await client.execute(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM categories",
    );
    const sortOrder = Number(next.rows[0]?.next_order ?? 1);
    const result = await client.execute({
      sql: "INSERT INTO categories (name, slug, image_url, description, sort_order) VALUES (?, ?, ?, ?, ?)",
      args: [data.name, slug, data.image_url, data.description, sortOrder],
    });
    return { ok: true, id: Number(result.lastInsertRowid) };
  });

export const updateCategory = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) =>
    categoryInputSchema
      .extend({ id: z.number().int().positive(), sort_order: z.number().int().min(0) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const slug = await uniqueSlug(client, "categories", slugify(data.slug || data.name), data.id);
    await client.execute({
      sql: `UPDATE categories SET name = ?, slug = ?, image_url = ?, description = ?,
              sort_order = ?, updated_at = ? WHERE id = ?`,
      args: [
        data.name,
        slug,
        data.image_url,
        data.description,
        data.sort_order,
        new Date().toISOString(),
        data.id,
      ],
    });
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "DELETE FROM categories WHERE id = ?",
      args: [data.id],
    });
    return { ok: true };
  });
