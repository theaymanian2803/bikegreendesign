import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const license = () => import("@/integrations/turso/license.server");

export const getLicenseStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { currentLicense } = await license();
  return currentLicense();
});

export const activateLicense = createServerFn({ method: "POST" })
  .validator((input) =>
    z.object({ key: z.string().trim().min(1, "Enter your product key") }).parse(input),
  )
  .handler(async ({ data }) => {
    if (process.env["LICENSE_DISABLED"] === "1") {
      return { licensed: true as const, mode: "disabled" as const };
    }

    const { getRequestHost } = await import("@tanstack/react-start/server");
    const { licenseConfig, normalizeHost, writeGrant } = await license();
    const host = normalizeHost(getRequestHost());
    const { serverUrl, product } = licenseConfig();

    let response: Response;
    try {
      response = await fetch(`${serverUrl}/v1/activate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: data.key, domain: host, product }),
      });
    } catch {
      throw new Error("unreachable");
    }

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok || !payload.grant) {
      throw new Error(String(payload.error ?? "invalid"));
    }

    await writeGrant(String(payload.grant));
    return { licensed: true as const, mode: String(payload.mode ?? "forever") };
  });

export const heartbeatLicense = createServerFn({ method: "POST" }).handler(async () => {
  if (process.env["LICENSE_DISABLED"] === "1") {
    return { licensed: true as const, mode: "disabled" as const };
  }

  const { getRequestHost } = await import("@tanstack/react-start/server");
  const { licenseConfig, normalizeHost, readGrant, verifyGrant, writeGrant, clearGrant } =
    await license();
  const host = normalizeHost(getRequestHost());
  const token = await readGrant();
  if (!token) return { licensed: false as const, reason: "missing" };

  const { publicKey, serverUrl } = licenseConfig();
  const verified = await verifyGrant(token, host, publicKey);
  if (!verified.ok) {
    return { licensed: false as const, reason: verified.reason };
  }
  const grant = verified.payload;
  if (grant.mode !== "managed") {
    return { licensed: true as const, mode: "forever" as const };
  }

  let response: Response;
  try {
    response = await fetch(`${serverUrl}/v1/heartbeat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: grant.key, domain: host }),
    });
  } catch {
    return { licensed: true as const, mode: "managed" as const, stale: true };
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (response.ok && payload.grant) {
    await writeGrant(String(payload.grant));
    return { licensed: true as const, mode: "managed" as const };
  }

  await clearGrant();
  return { licensed: false as const, reason: String(payload.error ?? "revoked") };
});
