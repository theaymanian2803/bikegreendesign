import { importJWK, jwtVerify } from "jose";

export type GrantMode = "forever" | "managed";

export type GrantPayload = {
  key: string;
  product: string;
  domain: string;
  mode: GrantMode;
  iat: number;
  exp?: number;
};

export const LICENSE_FALLBACK = {
  serverUrl: "https://petpaw-license.sberechou.workers.dev",
  publicKey: '{"crv":"Ed25519","kty":"OKP","x":"q2tMoDat1ek3FhSY-mBJp9FTwRQbwNSS-n8fC32REiI"}',
  product: "pathway",
} as const;

/** Lowercases, strips scheme/path/port/trailing dot so bindings compare exactly. */
export function normalizeHost(input: string): string {
  let value = String(input ?? "")
    .trim()
    .toLowerCase();
  try {
    if (value.includes("://")) value = new URL(value).host;
  } catch {
    // treat as a bare host
  }
  return value.split("/")[0].replace(/:\d+$/, "").replace(/\.$/, "");
}

/** Verifies a grant's signature and that it is bound to `host` and unexpired. */
export async function verifyGrant(
  token: string,
  host: string,
  publicJwk: string,
): Promise<
  | { ok: true; payload: GrantPayload }
  | { ok: false; reason: "domain" | "expired" | "bad_signature" }
> {
  try {
    const key = await importJWK(JSON.parse(publicJwk), "EdDSA");
    const { payload } = await jwtVerify(token, key, { algorithms: ["EdDSA"] });
    const grant = payload as unknown as GrantPayload;
    if (normalizeHost(grant.domain) !== normalizeHost(host)) {
      return { ok: false, reason: "domain" };
    }
    if (grant.exp && grant.exp * 1000 < Date.now()) {
      return { ok: false, reason: "expired" };
    }
    return { ok: true, payload: grant };
  } catch (error) {
    if ((error as { code?: string })?.code === "ERR_JWT_EXPIRED") {
      return { ok: false, reason: "expired" };
    }
    return { ok: false, reason: "bad_signature" };
  }
}
