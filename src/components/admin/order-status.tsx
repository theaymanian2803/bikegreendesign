import type { OrderStatus } from "@/lib/orders.functions";

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-sky-500/10 text-sky-700" },
  processing: { label: "Processing", className: "bg-amber-500/10 text-amber-700" },
  shipped: { label: "Shipped", className: "bg-violet-500/10 text-violet-700" },
  delivered: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-700" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        meta?.className ?? "bg-surface text-ink"
      }`}
    >
      {meta?.label ?? status}
    </span>
  );
}
