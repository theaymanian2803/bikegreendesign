const SCHEME = "pbkdf2-sha512";
const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-512", salt: salt as unknown as BufferSource, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await deriveKey(password, salt, ITERATIONS);
  return `${SCHEME}$${ITERATIONS}$${base64UrlEncode(salt)}$${base64UrlEncode(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterationsRaw, saltRaw, hashRaw] = stored.split("$");
  if (scheme !== SCHEME || !iterationsRaw || !saltRaw || !hashRaw) return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 2_000_000) return false;

  try {
    const salt = base64UrlDecode(saltRaw);
    const expected = base64UrlDecode(hashRaw);
    if (salt.length < 8 || expected.length < 16) return false;
    const actual = await deriveKey(password, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
