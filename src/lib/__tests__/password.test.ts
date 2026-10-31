import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/integrations/turso/password.server";

describe("password hashing", () => {
  it("verifies the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("right-password");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("anything", "pbkdf2-sha512$abc$salt$hash")).resolves.toBe(false);
  });

  it("uses a unique salt per hash", async () => {
    const first = await hashPassword("same-password");
    const second = await hashPassword("same-password");
    expect(first).not.toBe(second);
  });
});
