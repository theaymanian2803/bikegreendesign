import { describe, expect, it } from "vitest";

import { decideAdminAccess } from "../admin-access";

describe("decideAdminAccess", () => {
  it("forbids a non-admin regardless of method or licence", () => {
    expect(decideAdminAccess({ isAdmin: false, method: "GET", licensed: true })).toBe("forbidden");
    expect(decideAdminAccess({ isAdmin: false, method: "POST", licensed: false })).toBe(
      "forbidden",
    );
  });

  it("allows an admin to read without a licence", () => {
    expect(decideAdminAccess({ isAdmin: true, method: "GET", licensed: false })).toBe("allow");
    expect(decideAdminAccess({ isAdmin: true, method: "HEAD", licensed: false })).toBe("allow");
  });

  it("requires activation when an admin writes without a licence", () => {
    expect(decideAdminAccess({ isAdmin: true, method: "POST", licensed: false })).toBe("activate");
    expect(decideAdminAccess({ isAdmin: true, method: "PUT", licensed: false })).toBe("activate");
  });

  it("allows an admin to write once licensed", () => {
    expect(decideAdminAccess({ isAdmin: true, method: "POST", licensed: true })).toBe("allow");
  });

  it("treats a missing method as a write", () => {
    expect(decideAdminAccess({ isAdmin: true, method: "", licensed: false })).toBe("activate");
  });
});
