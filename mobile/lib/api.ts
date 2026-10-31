import Constants from "expo-constants";

export function apiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra ?? {};
  return typeof extra.apiUrl === "string" ? extra.apiUrl : "http://10.0.2.2:8080";
}

export function resolveMediaUrl(src: string): string {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  return `${apiBaseUrl().replace(/\/+$/, "")}/${src.replace(/^\/+/, "")}`;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

const DEFAULT_TIMEOUT_MS = 15000;

let authToken: string | null = null;

export function setApiAuthToken(token: string | null): void {
  authToken = token;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${apiBaseUrl().replace(/\/+$/, "")}/api/mobile/${path.replace(/^\/+/, "")}`,
      {
        ...init,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(init?.headers ?? {}),
        },
      },
    );
    if (!res.ok) throw new Error(await parseError(res));
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out — check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
