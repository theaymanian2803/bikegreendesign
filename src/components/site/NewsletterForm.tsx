import { useState } from "react";
import { toast } from "sonner";

import { subscribeNewsletter } from "@/lib/newsletter.functions";

/**
 * Newsletter capture used by the storefront. The markup here is the design's:
 * the handler is what adds the backend call.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await subscribeNewsletter({ data: { email } });
      toast.success("You're subscribed — watch your inbox for deals.");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not subscribe right now");
    }
    setBusy(false);
  }

  return (
    <form className="mt-6 flex gap-2" onSubmit={submit}>
      <input
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary"
      />
      <button type="submit" disabled={busy} className="btn-brand">
        {busy ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
