import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/integrations/turso/auth";

const turso = () => import("@/integrations/turso/client");

export const ORDER_STATUSES = ["new", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const orderItemSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  price: z.number().nonnegative(),
  qty: z.number().int().positive().max(999),
});

export const placeOrderSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30),
  address: z.string().trim().min(1, "Street address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(80),
  postcode: z.string().trim().min(1, "Postal code is required").max(20),
  country: z.string().trim().min(1, "Country is required").max(80),
  notes: z.string().trim().max(500).optional(),
  items: z.array(orderItemSchema).min(1),
});

const updateOrderSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  postcode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(500).nullable(),
  items: z.array(orderItemSchema).min(1),
});

const updateOrderStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(ORDER_STATUSES),
});

const listOrdersSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  query: z.string().trim().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

function makePublicId(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PW-${suffix}`;
}

async function getShippingSettings() {
  const { getTurso } = await turso();
  const result = await getTurso().execute(
    "SELECT key, value FROM settings WHERE key IN ('free_shipping_threshold_cents', 'flat_shipping_cents')",
  );
  const map = new Map(result.rows.map((r) => [String(r.key), String(r.value)]));
  return {
    freeShippingThresholdCents: Number(map.get("free_shipping_threshold_cents")) || 30000,
    flatShippingCents: Number(map.get("flat_shipping_cents")) || 1900,
  };
}

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

export type OrderListItem = {
  id: number;
  publicId: string;
  fullName: string;
  email: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  itemCount: number;
};

export type OrderLineItem = {
  id: string;
  name: string;
  priceCents: number;
  qty: number;
};

export type OrderDetail = OrderListItem & {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  notes: string | null;
  subtotalCents: number;
  shippingCents: number;
  updatedAt: string | null;
  items: OrderLineItem[];
};

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => placeOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { getTurso } = await turso();
    const client = getTurso();

    const subtotalCents = Math.round(data.items.reduce((sum, i) => sum + i.price * i.qty, 0) * 100);
    const { freeShippingThresholdCents, flatShippingCents } = await getShippingSettings();
    const shippingCents =
      subtotalCents === 0 || subtotalCents >= freeShippingThresholdCents ? 0 : flatShippingCents;
    const totalCents = subtotalCents + shippingCents;

    for (let attempt = 0; attempt < 5; attempt++) {
      const publicId = makePublicId();
      try {
        const insert = await client.execute({
          sql: `INSERT INTO orders
                (public_id, first_name, last_name, email, phone, address, city, postcode, country, notes, subtotal_cents, shipping_cents, total_cents, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            publicId,
            data.firstName,
            data.lastName,
            data.email,
            data.phone,
            data.address,
            data.city,
            data.postcode,
            data.country,
            data.notes || null,
            subtotalCents,
            shippingCents,
            totalCents,
            context.userId,
          ],
        });

        const orderId = Number(insert.lastInsertRowid);
        const items = data.items.map((i) => ({
          sql: "INSERT INTO order_items (order_id, name, price_cents, qty) VALUES (?, ?, ?, ?)",
          args: [orderId, i.name, Math.round(i.price * 100), i.qty],
        }));
        await client.batch(items, "write");

        return { publicId, email: data.email, total: totalCents / 100 };
      } catch (error) {
        if (error instanceof Error && /unique constraint/i.test(error.message)) {
          continue; // rare public_id collision — retry
        }
        throw error;
      }
    }

    throw new Error("Could not generate a unique order id");
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((input) => listOrdersSchema.parse(input))
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      orders: OrderListItem[];
      total: number;
      page: number;
      pageSize: number;
    }> => {
      await assertAdmin(context.userId);
      const { getTurso } = await turso();
      const client = getTurso();

      const where: string[] = [];
      const args: (string | number)[] = [];
      if (data.status) {
        where.push("o.status = ?");
        args.push(data.status);
      }
      if (data.query) {
        where.push("(o.email LIKE ? OR o.public_id LIKE ?)");
        const like = `%${data.query}%`;
        args.push(like, like);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const totalRes = await client.execute({
        sql: `SELECT COUNT(*) AS count FROM orders o ${whereSql}`,
        args,
      });
      const offset = (data.page - 1) * data.pageSize;
      const rows = await client.execute({
        sql: `SELECT o.id, o.public_id, o.first_name, o.last_name, o.email, o.status,
                   o.total_cents, o.created_at,
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
            FROM orders o
            ${whereSql}
            ORDER BY o.created_at DESC, o.id DESC
            LIMIT ? OFFSET ?`,
        args: [...args, data.pageSize, offset],
      });

      return {
        orders: rows.rows.map((r) => ({
          id: Number(r.id),
          publicId: String(r.public_id),
          fullName: `${String(r.first_name)} ${String(r.last_name)}`,
          email: String(r.email),
          status: String(r.status) as OrderStatus,
          totalCents: Number(r.total_cents),
          createdAt: String(r.created_at),
          itemCount: Number(r.item_count),
        })),
        total: Number(totalRes.rows[0]?.count ?? 0),
        page: data.page,
        pageSize: data.pageSize,
      };
    },
  );

export const getOrder = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }): Promise<OrderDetail> => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();

    const [orderRes, itemsRes] = await Promise.all([
      client.execute({
        sql: "SELECT * FROM orders WHERE id = ?",
        args: [data.id],
      }),
      client.execute({
        sql: "SELECT id, name, price_cents, qty FROM order_items WHERE order_id = ? ORDER BY id",
        args: [data.id],
      }),
    ]);

    const r = orderRes.rows[0];
    if (!r) throw new Error("Order not found");

    return {
      id: Number(r.id),
      publicId: String(r.public_id),
      fullName: `${String(r.first_name)} ${String(r.last_name)}`,
      firstName: String(r.first_name),
      lastName: String(r.last_name),
      email: String(r.email),
      phone: String(r.phone),
      address: String(r.address),
      city: String(r.city),
      postcode: String(r.postcode),
      country: String(r.country),
      notes: r.notes === null ? null : String(r.notes),
      status: String(r.status) as OrderStatus,
      subtotalCents: Number(r.subtotal_cents),
      shippingCents: Number(r.shipping_cents),
      totalCents: Number(r.total_cents),
      createdAt: String(r.created_at),
      updatedAt: r.updated_at === null ? null : String(r.updated_at),
      itemCount: itemsRes.rows.length,
      items: itemsRes.rows.map((i) => ({
        id: String(i.id),
        name: String(i.name),
        priceCents: Number(i.price_cents),
        qty: Number(i.qty),
      })),
    };
  });

export type TrackedOrder = {
  id: number;
  publicId: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  items: { name: string; priceCents: number; qty: number }[];
};

/** Public order lookup used by the mobile app's Track order screen. */
export const trackOrdersByPhone = createServerFn({ method: "GET" })
  .validator((input) => z.string().trim().min(4).max(30).parse(input))
  .handler(async ({ data: phone }): Promise<TrackedOrder[]> => {
    const { getTurso } = await turso();
    const client = getTurso();
    const digits = phone.replace(/\D/g, "");
    const ordersRes = await client.execute({
      sql: `SELECT id, public_id, status, total_cents, created_at
            FROM orders
            WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE ?
            ORDER BY created_at DESC
            LIMIT 20`,
      args: [`%${digits}%`],
    });
    if (ordersRes.rows.length === 0) return [];

    const ids = ordersRes.rows.map((row) => Number(row.id));
    const itemsRes = await client.execute({
      sql: `SELECT order_id, name, price_cents, qty
            FROM order_items
            WHERE order_id IN (${ids.map(() => "?").join(", ")})
            ORDER BY id`,
      args: ids,
    });
    const itemsByOrder = new Map<number, TrackedOrder["items"]>();
    for (const row of itemsRes.rows) {
      const orderId = Number(row.order_id);
      const list = itemsByOrder.get(orderId) ?? [];
      list.push({
        name: String(row.name),
        priceCents: Number(row.price_cents),
        qty: Number(row.qty),
      });
      itemsByOrder.set(orderId, list);
    }

    return ordersRes.rows.map((row) => {
      const id = Number(row.id);
      return {
        id,
        publicId: String(row.public_id ?? `#${id}`),
        status: String(row.status) as OrderStatus,
        totalCents: Number(row.total_cents),
        createdAt: String(row.created_at),
        items: itemsByOrder.get(id) ?? [],
      };
    });
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => updateOrderStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
      args: [data.status, new Date().toISOString(), data.id],
    });
    return { ok: true };
  });

export const updateOrder = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => updateOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();

    const existing = await client.execute({
      sql: "SELECT id FROM orders WHERE id = ?",
      args: [data.id],
    });
    if (!existing.rows[0]) throw new Error("Order not found");

    const subtotalCents = Math.round(data.items.reduce((sum, i) => sum + i.price * i.qty, 0) * 100);
    const { freeShippingThresholdCents, flatShippingCents } = await getShippingSettings();
    const shippingCents =
      subtotalCents === 0 || subtotalCents >= freeShippingThresholdCents ? 0 : flatShippingCents;
    const totalCents = subtotalCents + shippingCents;
    const now = new Date().toISOString();

    const statements = [
      {
        sql: `UPDATE orders
              SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?,
                  city = ?, postcode = ?, country = ?, notes = ?,
                  subtotal_cents = ?, shipping_cents = ?, total_cents = ?, updated_at = ?
              WHERE id = ?`,
        args: [
          data.firstName,
          data.lastName,
          data.email,
          data.phone,
          data.address,
          data.city,
          data.postcode,
          data.country,
          data.notes,
          subtotalCents,
          shippingCents,
          totalCents,
          now,
          data.id,
        ],
      },
      { sql: "DELETE FROM order_items WHERE order_id = ?", args: [data.id] },
      ...data.items.map((i) => ({
        sql: "INSERT INTO order_items (order_id, name, price_cents, qty) VALUES (?, ?, ?, ?)",
        args: [data.id, i.name, Math.round(i.price * 100), i.qty],
      })),
    ];

    await client.batch(statements, "write");
    return { ok: true, subtotalCents, shippingCents, totalCents };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "DELETE FROM orders WHERE id = ?",
      args: [data.id],
    });
    return { ok: true };
  });
