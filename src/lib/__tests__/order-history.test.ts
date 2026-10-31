import { describe, expect, it } from "vitest";

import { groupOrderHistory } from "../order-history";

const orders = [
  {
    id: 2,
    publicId: "PW-AAAAAA",
    status: "shipped",
    createdAt: "2026-10-30T10:00:00.000Z",
    subtotalCents: 28000,
    shippingCents: 1900,
    totalCents: 29900,
  },
  {
    id: 1,
    publicId: null,
    status: "new",
    createdAt: "2026-10-20T10:00:00.000Z",
    subtotalCents: 5000,
    shippingCents: 1900,
    totalCents: 6900,
  },
];

const items = [
  { id: 10, orderId: 2, name: "Derailleur", priceCents: 28000, qty: 1 },
  { id: 11, orderId: 1, name: "Helmet", priceCents: 2500, qty: 2 },
];

describe("groupOrderHistory", () => {
  it("attaches each item to its own order", () => {
    const history = groupOrderHistory(orders, items);
    expect(history[0].items.map((i) => i.name)).toEqual(["Derailleur"]);
    expect(history[1].items.map((i) => i.name)).toEqual(["Helmet"]);
  });

  it("converts cents to display money without losing precision", () => {
    const history = groupOrderHistory(orders, items);
    expect(history[0].total).toBe(299);
    expect(history[1].subtotal).toBe(50);
    expect(history[1].items[0].price).toBe(25);
  });

  it("falls back to a readable order id when public_id is missing", () => {
    const history = groupOrderHistory(orders, items);
    expect(history[0].reference).toBe("PW-AAAAAA");
    expect(history[1].reference).toBe("#1");
  });

  it("counts quantities, not line items", () => {
    const history = groupOrderHistory(orders, items);
    expect(history[0].itemCount).toBe(1);
    expect(history[1].itemCount).toBe(2);
  });

  it("returns orders with an empty item list rather than dropping them", () => {
    const history = groupOrderHistory(orders, []);
    expect(history).toHaveLength(2);
    expect(history[0].items).toEqual([]);
  });
});
