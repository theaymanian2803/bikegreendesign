import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/money";
import { productGallery, type CatalogProduct } from "@/lib/catalog";

describe("formatMoney", () => {
  it("formats cents to dollar string", () => {
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(199)).toBe("$1.99");
    expect(formatMoney(1099)).toBe("$10.99");
    expect(formatMoney(30000)).toBe("$300.00");
  });

  it("always shows two decimal places", () => {
    expect(formatMoney(100)).toBe("$1.00");
    expect(formatMoney(5)).toBe("$0.05");
  });
});

describe("productGallery", () => {
  const baseProduct: CatalogProduct = {
    id: "test-slug",
    name: "Test Product",
    price: 19.99,
    rating: 5,
    image: "/test-image.jpg",
    category: "Parts",
    categorySlug: "parts",
  };

  it("returns 4 images", () => {
    const gallery = productGallery(baseProduct);
    expect(gallery).toHaveLength(4);
  });

  it("uses the product image as the first image", () => {
    const gallery = productGallery(baseProduct);
    expect(gallery[0]).toBe("/test-image.jpg");
  });

  it("falls back to the gallery pool for remaining images", () => {
    const gallery = productGallery(baseProduct);
    expect(gallery[1]).toBe("/menu/p-derailleur.jpg");
    expect(gallery[2]).toBe("/menu/p-wheel.jpg");
    expect(gallery[3]).toBe("/menu/p-crank.jpg");
  });

  it("does not duplicate the product image in the pool", () => {
    const product: CatalogProduct = {
      ...baseProduct,
      image: "/menu/p-derailleur.jpg",
    };
    const gallery = productGallery(product);
    expect(gallery[0]).toBe("/menu/p-derailleur.jpg");
    expect(new Set(gallery).size).toBe(4);
  });
});
