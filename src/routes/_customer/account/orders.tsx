import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

import { listMyOrders } from "@/lib/orders.functions";
import { safeLoad } from "@/lib/safe-load";

export const Route = createFileRoute("/_customer/account/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Pathway Cycle Supply" },
      { name: "description", content: "Every order you have placed with Pathway." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async () => ({ orders: await safeLoad([], () => listMyOrders()) }),
  component: AccountOrdersPage,
});

const STATUS_STYLES: Record<string, string> = {
  new: "bg-accent text-accent-foreground",
  processing: "bg-secondary/10 text-secondary",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

function AccountOrdersPage() {
  const { orders } = Route.useLoaderData();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center border border-dashed border-border bg-card py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-accent text-secondary">
          <Package className="size-7" />
        </span>
        <p className="mt-4 font-display text-lg font-semibold text-ink">No orders yet</p>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Your order history will appear here once you have placed an order.
        </p>
        <Link to="/shop" className="btn-brand mt-6">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="site-eyebrow">Your history</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-ink">My orders</h1>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        {orders.length} order{orders.length !== 1 ? "s" : ""} placed.
      </p>

      <div className="mt-6 space-y-3">
        {orders.map((order) => {
          const isOpen = expanded === order.id;
          return (
            <div key={order.id} className="overflow-hidden border border-border bg-card">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-medium text-ink">
                      {order.reference}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[order.status] ?? "bg-surface text-ink"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    · {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold text-primary">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {isOpen ? (
                <div className="border-t border-border bg-surface px-5 pb-4 pt-3">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="size-12 rounded-lg bg-border" />
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-sm font-medium text-ink">{item.name}</p>
                          <p className="font-sans text-xs text-muted-foreground">Qty: {item.qty}</p>
                        </div>
                        <p className="font-sans text-sm font-semibold text-ink">
                          ${(item.price * item.qty).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-border pt-3 text-right font-sans text-sm text-muted-foreground">
                    Subtotal ${order.subtotal.toFixed(2)} · Shipping ${order.shipping.toFixed(2)}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
