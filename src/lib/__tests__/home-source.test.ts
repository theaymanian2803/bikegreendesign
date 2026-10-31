import { describe, expect, it } from "vitest";

import { resolveHomeSource } from "../home-source";

describe("resolveHomeSource", () => {
  it("defaults to the designed homepage when unset", () => {
    expect(resolveHomeSource(undefined)).toBe("static");
    expect(resolveHomeSource(null)).toBe("static");
    expect(resolveHomeSource("")).toBe("static");
  });

  it("honours the cms setting", () => {
    expect(resolveHomeSource("cms")).toBe("cms");
    expect(resolveHomeSource(" CMS ")).toBe("cms");
  });

  it("falls back to the designed homepage for anything else", () => {
    expect(resolveHomeSource("static")).toBe("static");
    expect(resolveHomeSource("landing")).toBe("static");
    expect(resolveHomeSource("1")).toBe("static");
  });
});
