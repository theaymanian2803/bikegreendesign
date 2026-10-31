import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";

const turso = () => import("@/integrations/turso/client");

type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewRow = {
  id: number;
  productId: number;
  productSlug: string;
  productName: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  createdAt: string;
};

export type ProductReviews = {
  reviews: ReviewRow[];
  average: number;
  count: number;
};

function mapReviewRow(row: Record<string, unknown>): ReviewRow {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    productSlug: String(row.product_slug),
    productName: String(row.product_name),
    author: String(row.author_name),
    rating: Number(row.rating),
    title: String(row.title),
    body: String(row.body),
    status: String(row.status) as ReviewStatus,
    createdAt: String(row.created_at),
  };
}

const reviewSelect = `
  SELECT r.id, r.product_id, r.rating, r.title, r.body, r.author_name, r.status, r.created_at,
         p.slug AS product_slug, p.name AS product_name
  FROM reviews r
  JOIN products p ON p.id = r.product_id`;

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/** Approved reviews for one product, plus the rolling average and count. */
export const listProductReviews = createServerFn({ method: "GET" })
  .validator((input) => z.string().min(1).max(120).parse(input))
  .handler(async ({ data: slug }): Promise<ProductReviews> => {
    const { getTurso } = await turso();
    const client = getTurso();
    const [reviewsRes, avgRes] = await Promise.all([
      client.execute({
        sql: `${reviewSelect} WHERE p.slug = ? AND r.status = 'approved' ORDER BY r.created_at DESC`,
        args: [slug],
      }),
      client.execute({
        sql: `SELECT COALESCE(AVG(r.rating), 0) AS average, COUNT(*) AS count
              FROM reviews r JOIN products p ON p.id = r.product_id
              WHERE p.slug = ? AND r.status = 'approved'`,
        args: [slug],
      }),
    ]);
    const reviews = reviewsRes.rows.map((r) => mapReviewRow(r as Record<string, unknown>));
    const average = Number(avgRes.rows[0]?.average ?? 0);
    const count = Number(avgRes.rows[0]?.count ?? 0);
    return { reviews, average, count };
  });

/** Latest approved reviews across the catalog, used by mobile and landing sections. */
export const listApprovedReviews = createServerFn({ method: "GET" })
  .validator((input) => z.number().int().min(1).max(24).optional().parse(input))
  .handler(async ({ data: limit }): Promise<ReviewRow[]> => {
    const { getTurso } = await turso();
    const result = await getTurso().execute({
      sql: `${reviewSelect} WHERE r.status = 'approved' ORDER BY r.created_at DESC LIMIT ?`,
      args: [limit ?? 6],
    });
    return result.rows.map((row) => mapReviewRow(row as Record<string, unknown>));
  });

const createReviewSchema = z.object({
  productSlug: z.string().min(1).max(120),
  author: z.string().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120),
  body: z.string().max(2000),
});

/** A visitor submits a review — always starts as 'pending' until an admin approves it. */
export const createReview = createServerFn({ method: "POST" })
  .validator((input) => createReviewSchema.parse(input))
  .handler(async ({ data }) => {
    const { getTurso } = await turso();
    const client = getTurso();
    const product = await client.execute({
      sql: "SELECT id FROM products WHERE slug = ?",
      args: [data.productSlug],
    });
    const productId = product.rows[0]?.id;
    if (productId === undefined) throw new Error("Product not found");

    await client.execute({
      sql: `INSERT INTO reviews (product_id, author_name, rating, title, body, status)
            VALUES (?, ?, ?, ?, ?, 'pending')`,
      args: [
        Number(productId),
        data.author.trim(),
        data.rating,
        data.title.trim(),
        data.body.trim(),
      ],
    });
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

/** Every review (all statuses), newest first — pending first for the moderation queue. */
export const loadReviewsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<ReviewRow[]> => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const result = await getTurso().execute(
      `SELECT r.id, r.product_id, r.rating, r.title, r.body, r.author_name, r.status, r.created_at,
              p.slug AS product_slug, p.name AS product_name
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC`,
    );
    return result.rows.map((r) => mapReviewRow(r as Record<string, unknown>));
  });

const setReviewStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["approved", "rejected"]),
});

export const setReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => setReviewStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "UPDATE reviews SET status = ?, updated_at = ? WHERE id = ?",
      args: [data.status, new Date().toISOString(), data.id],
    });
    return { ok: true };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({ sql: "DELETE FROM reviews WHERE id = ?", args: [data.id] });
    return { ok: true };
  });

const adminCreateReviewSchema = z.object({
  productId: z.number().int().positive(),
  author: z.string().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120),
  body: z.string().max(2000),
});

/** Admin-authored reviews are published immediately as 'approved'. */
export const adminCreateReview = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => adminCreateReviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: `INSERT INTO reviews (product_id, author_name, rating, title, body, status)
            VALUES (?, ?, ?, ?, ?, 'approved')`,
      args: [data.productId, data.author.trim(), data.rating, data.title.trim(), data.body.trim()],
    });
    return { ok: true };
  });
