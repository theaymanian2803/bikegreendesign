import { describe, expect, it } from "vitest";

import { filterByCategory } from "../catalog-filters";
import type { CatalogProduct } from "../catalog";

function product(id: string, categorySlug: string): CatalogProduct {
  return {
    id,
    name: id,
    price: 1,
    rating: 5,
    image: "",
    category: "Display name",
    categorySlug,
    description: "",
  };
}

describe("filterByCategory", () => {
  const products = [product("a", "bicycle-parts"), product("b", "mountain-bikes")];

  it("returns everything when no slug is requested", () => {
    expect(filterByCategory(products, undefined)).toHaveLength(2);
    expect(filterByCategory(products, "")).toHaveLength(2);
  });

  it("matches the stored slug, not the display name", () => {
    expect(filterByCategory(products, "bicycle-parts").map((p) => p.id)).toEqual(["a"]);
    expect(filterByCategory(products, "mountain-bikes").map((p) => p.id)).toEqual(["b"]);
  });

  it("returns an empty list for a slug that matches nothing", () => {
    expect(filterByCategory(products, "parts")).toEqual([]);
  });
});
