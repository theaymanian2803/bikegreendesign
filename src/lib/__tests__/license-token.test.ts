import { describe, expect, it } from "vitest";
import { exportJWK, generateKeyPair, importJWK, SignJWT } from "jose";

import { normalizeHost, verifyGrant } from "@/lib/license-token";

async function keypair() {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", {
    crv: "Ed25519",
    extractable: true,
  });
  return {
    publicJwk: JSON.stringify(await exportJWK(publicKey)),
    privateJwk: JSON.stringify(await exportJWK(privateKey)),
  };
}

async function sign(privateJwk: string, overrides: Partial<{ domain: string; exp: number }> = {}) {
  const key = await importJWK(JSON.parse(privateJwk), "EdDSA");
  const jwt = new SignJWT({
    key: "PATHWAY-TEST",
    product: "pathway",
    domain: overrides.domain ?? "shop.example.com",
    mode: "forever",
  })
    .setProtectedHeader({ alg: "EdDSA" })
    .setIssuedAt(Math.floor(Date.now() / 1000));
  if (overrides.exp !== undefined) jwt.setExpirationTime(overrides.exp);
  return jwt.sign(key);
}

describe("normalizeHost", () => {
  it("normalizes URLs, ports, case and trailing dots", () => {
    expect(normalizeHost("https://Shop.Example.com:443/path")).toBe("shop.example.com");
    expect(normalizeHost("SHOP.EXAMPLE.COM.")).toBe("shop.example.com");
    expect(normalizeHost("  example.com:8080 ")).toBe("example.com");
  });
});

describe("verifyGrant", () => {
  it("accepts a valid forever grant", async () => {
    const { publicJwk, privateJwk } = await keypair();
    const token = await sign(privateJwk);
    const result = await verifyGrant(token, "shop.example.com", publicJwk);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload.product).toBe("pathway");
  });

  it("rejects a grant bound to another domain", async () => {
    const { publicJwk, privateJwk } = await keypair();
    const token = await sign(privateJwk, { domain: "other.example.com" });
    const result = await verifyGrant(token, "shop.example.com", publicJwk);
    expect(result).toEqual({ ok: false, reason: "domain" });
  });

  it("rejects an expired managed grant", async () => {
    const { publicJwk, privateJwk } = await keypair();
    const token = await sign(privateJwk, { exp: Math.floor(Date.now() / 1000) - 60 });
    const result = await verifyGrant(token, "shop.example.com", publicJwk);
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a forged signature", async () => {
    const { publicJwk } = await keypair();
    const { privateJwk: otherPrivate } = await keypair();
    const token = await sign(otherPrivate);
    const result = await verifyGrant(token, "shop.example.com", publicJwk);
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });
});
