/**
 * Assembles a customer's order history from the two flat tables.
 *
 * Orders and their line items live in separate tables; the storefront wants one
 * order per row, with its items attached, money in display units. Kept pure so
 * the join can be tested without a database.
 */

export type OrderHeadRow = {
  id: number;
  publicId: string | null;
  status: string;
  createdAt: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

export type OrderItemRow = {
  id: number;
  orderId: number;
  name: string;
  priceCents: number;
  qty: number;
};

export type OrderHistoryEntry = {
  id: number;
  reference: string;
  status: string;
  createdAt: string;
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  items: { id: number; name: string; price: number; qty: number }[];
};

export function groupOrderHistory(
  orders: OrderHeadRow[],
  items: OrderItemRow[],
): OrderHistoryEntry[] {
  const byOrder = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const list = byOrder.get(item.orderId);
    if (list) list.push(item);
    else byOrder.set(item.orderId, [item]);
  }

  return orders.map((order) => {
    const lines = byOrder.get(order.id) ?? [];
    return {
      id: order.id,
      reference: order.publicId ?? `#${order.id}`,
      status: order.status,
      createdAt: order.createdAt,
      subtotal: order.subtotalCents / 100,
      shipping: order.shippingCents / 100,
      total: order.totalCents / 100,
      itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
      items: lines.map((line) => ({
        id: line.id,
        name: line.name,
        price: line.priceCents / 100,
        qty: line.qty,
      })),
    };
  });
}
