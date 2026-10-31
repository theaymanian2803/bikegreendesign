import { createServerFn } from "@tanstack/react-start";

import { requireAuth } from "@/integrations/turso/auth";
import type { OrderStatus } from "@/lib/orders.functions";

const turso = () => import("@/integrations/turso/client");

const ALL_STATUSES: OrderStatus[] = ["new", "processing", "shipped", "delivered", "cancelled"];

export type RecentOrder = {
  id: number;
  publicId: string;
  fullName: string;
  email: string;
  totalCents: number;
  status: OrderStatus;
  createdAt: string;
};

export type TopProduct = {
  name: string;
  qty: number;
  revenueCents: number;
};

export type DaySeries = {
  day: string;
  orderCount: number;
  revenueCents: number;
};

export type DashboardStats = {
  totalOrders: number;
  totalRevenueCents: number;
  todayOrders: number;
  todayRevenueCents: number;
  avgOrderCents: number;
  statusCounts: Record<OrderStatus, number>;
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  revenueSeries: DaySeries[];
};

async function assertAdmin(userId: number): Promise<void> {
  const { assertAdminAccess } = await import("@/integrations/turso/admin-guard.server");
  await assertAdminAccess(userId);
}

function isoDay(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<DashboardStats> => {
    await assertAdmin(context.userId);
    const { getTurso } = await turso();
    const client = getTurso();
    const today = isoDay();

    const [totalRes, statusRes, todayRes, recentRes, topRes, seriesRes] = await Promise.all([
      client.execute(
        "SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS revenue FROM orders WHERE status != 'cancelled'",
      ),
      client.execute("SELECT status, COUNT(*) AS count FROM orders GROUP BY status"),
      client.execute({
        sql: "SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS revenue FROM orders WHERE status != 'cancelled' AND date(created_at) = date('now')",
      }),
      client.execute({
        sql: `SELECT id, public_id, first_name, last_name, email, total_cents, status, created_at
              FROM orders
              ORDER BY created_at DESC, id DESC
              LIMIT 8`,
      }),
      client.execute({
        sql: `SELECT oi.name, SUM(oi.qty) AS qty, SUM(oi.qty * oi.price_cents) AS revenue
              FROM order_items oi
              JOIN orders o ON o.id = oi.order_id
              WHERE o.status != 'cancelled'
              GROUP BY oi.name
              ORDER BY qty DESC, revenue DESC
              LIMIT 8`,
      }),
      client.execute({
        sql: "SELECT date(created_at) AS day, COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS revenue FROM orders WHERE status != 'cancelled' AND date(created_at) >= ? GROUP BY date(created_at) ORDER BY day",
        args: [isoDay(-6)],
      }),
    ]);

    const totalRow = totalRes.rows[0];
    const totalOrders = Number(totalRes.rows[0]?.count ?? 0);
    const totalRevenueCents = Number(totalRow?.revenue ?? 0);

    const statusCounts = Object.fromEntries(ALL_STATUSES.map((status) => [status, 0])) as Record<
      OrderStatus,
      number
    >;
    for (const row of statusRes.rows) {
      const status = String(row.status) as OrderStatus;
      if (status in statusCounts) statusCounts[status] = Number(row.count);
    }

    const todayRow = todayRes.rows[0];
    const todayOrders = Number(todayRow?.count ?? 0);
    const todayRevenueCents = Number(todayRow?.revenue ?? 0);

    const seriesMap = new Map<string, { orderCount: number; revenueCents: number }>();
    for (const row of seriesRes.rows) {
      seriesMap.set(String(row.day), {
        orderCount: Number(row.count),
        revenueCents: Number(row.revenue),
      });
    }
    const revenueSeries: DaySeries[] = [];
    for (let offset = -6; offset <= 0; offset++) {
      const day = isoDay(offset);
      const point = seriesMap.get(day);
      revenueSeries.push({
        day,
        orderCount: point?.orderCount ?? 0,
        revenueCents: point?.revenueCents ?? 0,
      });
    }

    return {
      totalOrders,
      totalRevenueCents,
      todayOrders,
      todayRevenueCents,
      avgOrderCents: totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0,
      statusCounts,
      recentOrders: recentRes.rows.map((r) => ({
        id: Number(r.id),
        publicId: String(r.public_id),
        fullName: `${String(r.first_name)} ${String(r.last_name)}`,
        email: String(r.email),
        totalCents: Number(r.total_cents),
        status: String(r.status) as OrderStatus,
        createdAt: String(r.created_at),
      })),
      topProducts: topRes.rows.map((r) => ({
        name: String(r.name),
        qty: Number(r.qty),
        revenueCents: Number(r.revenue),
      })),
      revenueSeries,
    };
  });
