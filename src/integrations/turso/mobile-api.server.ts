const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function mobileJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function mobileError(error: unknown, status = 400): Response {
  const message = error instanceof Error ? error.message : "Request failed";
  return mobileJson({ error: message }, status);
}

export function mobileOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
