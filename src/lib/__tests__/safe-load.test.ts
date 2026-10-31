import { describe, expect, it } from "vitest";

import { safeLoad } from "../safe-load";

describe("safeLoad", () => {
  it("returns the loaded value when the load succeeds", async () => {
    await expect(safeLoad([], async () => [1, 2, 3])).resolves.toEqual([1, 2, 3]);
  });

  it("returns the fallback when the load rejects", async () => {
    await expect(
      safeLoad([], async () => {
        throw new Error("database unreachable");
      }),
    ).resolves.toEqual([]);
  });

  it("returns the fallback object instance, not a copy", async () => {
    const fallback = { products: [], categories: [] };
    const result = await safeLoad(fallback, async () => {
      throw new Error("nope");
    });
    expect(result).toBe(fallback);
  });
});
