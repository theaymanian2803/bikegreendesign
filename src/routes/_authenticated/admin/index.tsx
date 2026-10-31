import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CircleDollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { getDashboardStats, type DashboardStats } from "@/lib/dashboard.functions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders.functions";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/admin/order-status";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Pathway Admin" },
      {
        name: "description",
        content: "Store performance overview: orders, revenue and top products.",
      },
      { property: "og:title", content: "Dashboard — Pathway Admin" },
      { property: "og:description", content: "Pathway store performance at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-ink">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 font-sans text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  async function load() {
    try {
      setStats(await getDashboardStats());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load dashboard");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (!stats) {
    return <div className="py-20 font-sans text-muted-foreground">Loading…</div>;
  }

  const chartData = stats.revenueSeries.map((point) => ({
    day: point.day.slice(5),
    revenue: point.revenueCents / 100,
  }));

  return (
    <main className="py-8">
      <header>
        <p className="section-label">Admin</p>
        <h1 className="font-display text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Store performance overview for today.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="size-5" />}
          label="Total orders"
          value={String(stats.totalOrders)}
          hint={`${stats.todayOrders} today`}
        />
        <StatCard
          icon={<CircleDollarSign className="size-5" />}
          label="Revenue"
          value={formatMoney(stats.totalRevenueCents)}
          hint={`${formatMoney(stats.todayRevenueCents)} today`}
        />
        <StatCard
          icon={<ShoppingCart className="size-5" />}
          label="Avg. order"
          value={formatMoney(stats.avgOrderCents)}
          hint="Excluding cancelled"
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="In progress"
          value={String(stats.statusCounts.new + stats.statusCounts.processing)}
          hint="New + processing"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Revenue — last 7 days</h2>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-primary"
            >
              View orders <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-surface)" }}
                  formatter={(value) => [formatMoney(Number(value) * 100), "Revenue"]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-border p-6">
          <h2 className="font-display text-lg font-bold text-ink">Orders by status</h2>
          <ul className="mt-4 space-y-3">
            {ORDER_STATUSES.map((status: OrderStatus) => {
              const count = stats.statusCounts[status];
              const total = Math.max(stats.totalOrders, 1);
              const width = Math.round((count / total) * 100);
              return (
                <li key={status}>
                  <div className="flex items-center justify-between font-sans text-xs">
                    <span className="text-muted-foreground">{status}</span>
                    <span className="font-semibold text-ink">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-surface">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.min(width, 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-border">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="font-display text-lg font-bold text-ink">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-primary"
            >
              All orders <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="px-6 pb-6 pt-4 font-sans text-sm text-muted-foreground">
              No orders yet. Orders placed at checkout will show up here.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] font-sans text-sm">
                <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-6 py-3">
                        <Link
                          to="/admin/orders/$orderId"
                          params={{ orderId: String(o.id) }}
                          className="font-semibold text-primary hover:underline"
                        >
                          {o.publicId}
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <span className="block text-ink">{o.fullName}</span>
                        <span className="block text-xs text-muted-foreground">{o.email}</span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-ink">
                        {formatMoney(o.totalCents)}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Trophy className="size-4 text-primary" /> Top products
          </h2>
          {stats.topProducts.length === 0 ? (
            <p className="mt-4 font-sans text-sm text-muted-foreground">No product sales yet.</p>
          ) : (
            <ol className="mt-4 space-y-4">
              {stats.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-start gap-3">
                  <span className="mt-0.5 font-display text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm text-ink">{p.name}</p>
                    <p className="font-sans text-xs text-muted-foreground">
                      {p.qty} sold · {formatMoney(p.revenueCents)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
