import { describe, expect, it } from "vitest";

import {
  defaultConfigFor,
  parseLandingConfig,
  servicesConfigSchema,
  type ServicesConfig,
} from "@/lib/landing";

describe("servicesConfigSchema", () => {
  it("fills an empty description for legacy items", () => {
    const config = parseLandingConfig("services", {
      items: [
        { title: "Part Replacement", label: "Bike Service", image: "/menu/service-part.jpg" },
      ],
    }) as ServicesConfig;
    expect(config.items[0]?.description).toBe("");
  });

  it("accepts the legacy bare-array services config", () => {
    const config = parseLandingConfig("services", [
      { title: "Part Replacement", label: "Bike Service", image: "/menu/service-part.jpg" },
    ]) as ServicesConfig;
    expect(config.items).toHaveLength(1);
    expect(config.items[0]?.description).toBe("");
  });

  it("preserves a provided description", () => {
    const result = servicesConfigSchema.parse({
      items: [{ title: "Service", label: "Label", image: "", description: "Custom copy" }],
    });
    expect(result.items[0]?.description).toBe("Custom copy");
  });

  it("creates new services with a blank description", () => {
    const config = defaultConfigFor("services") as ServicesConfig;
    expect(config.items[0]?.description).toBe("");
  });
});
