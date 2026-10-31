import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const turso = () => import("@/integrations/turso/client");

/** Public newsletter signup used by the mobile app. */
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator((input) =>
    z.object({ email: z.string().trim().email("Enter a valid email").max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getTurso } = await turso();
    await getTurso().execute({
      sql: "INSERT INTO newsletter_subscribers (email) VALUES (?) ON CONFLICT(email) DO NOTHING",
      args: [data.email.toLowerCase()],
    });
    return { ok: true as const };
  });
