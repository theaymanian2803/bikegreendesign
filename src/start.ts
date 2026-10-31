import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// Loads the optional custom database credentials from the bootstrap database
// before any route/server function touches the catalog.
const dbConfigMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    const { refreshDbConfig } = await import("./integrations/turso/db-config.server");
    await refreshDbConfig();
  } catch {
    // Bootstrap unavailable — keep the current database client.
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, dbConfigMiddleware, csrfMiddleware],
}));
