import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import {
  listOrders,
  ORDER_STATUSES,
  type OrderListItem,
  type OrderStatus,
} from "@/lib/orders.functions";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "@/components/admin/order-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  head: () => ({
    meta: [
      { title: "Orders — Pathway Admin" },
      {
        name: "description",
        content: "Browse and manage Pathway store orders and their status.",
      },
      { property: "og:title", content: "Orders — Pathway Admin" },
      { property: "og:description", content: "Manage store orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

const PAGE_SIZE = 20;

function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listOrders({
        data: {
          status: status === "all" ? undefined : status,
          query: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
      });
      setOrders(result.orders);
      setTotal(result.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load orders");
    }
    setLoading(false);
  }, [status, search, page]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pickStatus(next: OrderStatus | "all") {
    setPage(1);
    setStatus(next);
  }

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(query.trim());
  }

  return (
    <main className="py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Admin</p>
          <h1 className="font-display text-3xl font-bold text-ink">Orders</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Track and manage every order placed at checkout.
          </p>
        </div>
        <Button variant="outline" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>
          <RefreshCw className="mr-2 size-4" /> Refresh
        </Button>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => pickStatus("all")}
          className={`rounded-full px-4 py-2 font-sans text-sm transition-colors ${
            status === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-ink hover:bg-surface/70"
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => pickStatus(s)}
            className={`rounded-full px-4 py-2 font-sans text-sm capitalize transition-colors ${
              status === s
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-ink hover:bg-surface/70"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={runSearch} className="mt-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or order id…"
            className="pl-9"
          />
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] font-sans text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/admin/orders/$orderId"
                    params={{ orderId: String(o.id) }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {o.publicId}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="block text-ink">{o.fullName}</span>
                  <span className="block text-xs text-muted-foreground">{o.email}</span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{o.itemCount}</td>
                <td className="px-4 py-3 text-right font-semibold text-ink">
                  {formatMoney(o.totalCents)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {orders.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {status === "all" && !search
                    ? "No orders yet. Orders placed at checkout will appear here."
                    : "No orders match these filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="font-sans text-xs text-muted-foreground">
          {total} order{total === 1 ? "" : "s"} · page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="mr-1 size-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
