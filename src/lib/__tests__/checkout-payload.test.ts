import { describe, expect, it } from "vitest";

import { placeOrderSchema } from "../orders.functions";

/**
 * The checkout page builds this object from the cart and the form. If the two
 * shapes drift, every order fails at runtime with a zod error the customer
 * cannot act on.
 */
describe("checkout payload", () => {
  it("accepts what the checkout page builds from a cart line", () => {
    const payload = {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "5550001111",
      address: "1 Test Street",
      city: "Testville",
      postcode: "00000",
      country: "USA",
      notes: undefined,
      items: [{ id: "mtb-derailleur", name: "MTB Mech Derailleur", price: 280, qty: 2 }],
    };

    expect(placeOrderSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects a cart line that lost its product id", () => {
    const payload = {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "5550001111",
      address: "1 Test Street",
      city: "Testville",
      postcode: "00000",
      country: "USA",
      items: [{ name: "MTB Mech Derailleur", price: 280, qty: 2 }],
    };

    expect(placeOrderSchema.safeParse(payload).success).toBe(false);
  });
});
