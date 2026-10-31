import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { z } from "zod";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { activateLicense, getLicenseStatus } from "@/lib/license.functions";

const searchSchema = z.object({ redirect: z.string().optional() });

const FRIENDLY: Record<string, string> = {
  invalid: "That key isn't valid. Check for typos or contact support.",
  product: "That key is for a different product. Use your Pathway key.",
  domain_limit: "This key has reached its domain limit. Contact support to add another site.",
  expired: "This key has expired. Contact support to renew it.",
  revoked: "This key was revoked. Contact support.",
  unreachable: "Could not reach the license server. Check your connection and try again.",
};

export const Route = createFileRoute("/activate")({
  validateSearch: searchSchema,
  loader: () => getLicenseStatus(),
  head: () => ({
    meta: [
      { title: "Activate Pathway — License" },
      { name: "description", content: "Activate your Pathway product key." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActivatePage,
});

function ActivatePage() {
  const status = Route.useLoaderData();
  const { redirect } = Route.useSearch();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/admin";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await activateLicense({ data: { key: key.trim() } });
      window.location.assign(target);
    } catch (cause) {
      const message = (cause instanceof Error ? cause.message : "invalid").replace(
        /^Error:\s*/,
        "",
      );
      setError(FRIENDLY[message] ?? message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#E9EAE4] text-[#171A17]">
      <Header />

      <main className="mx-auto grid max-w-[1440px] gap-12 px-5 py-12 md:px-10 md:py-16 lg:grid-cols-[1fr_540px] lg:items-start lg:gap-20">
        <aside className="max-w-[52ch]">
          <p className="font-spec text-[10px] uppercase tracking-[0.2em] text-[#171A17]/60">
            Pathway / License
          </p>
          <h1 className="mt-4 font-poster text-[clamp(2.4rem,4.6vw,3.8rem)] uppercase leading-[0.9]">
            Activate
            <br />
            your store
          </h1>
          <p className="mt-5 text-[17px] leading-[1.7] text-[#171A17]/80">
            {status.licensed
              ? `This store is already activated for ${status.domain}. You can replace the key below.`
              : "Paste the product key from your purchase to activate this domain. The store and admin stay available while you decide."}
          </p>
          <dl className="mt-8 max-w-[420px] text-[15px]">
            <div className="grid grid-cols-[104px_1fr] gap-4">
              <dt className="border-t border-[#171A17]/15 py-3 font-spec text-[10px] uppercase tracking-[0.14em] text-[#171A17]/60">
                Domain
              </dt>
              <dd className="border-t border-[#171A17]/15 py-3 text-[#171A17]/80">
                {status.domain}
              </dd>
            </div>
            <div className="grid grid-cols-[104px_1fr] gap-4">
              <dt className="border-t border-[#171A17]/15 py-3 font-spec text-[10px] uppercase tracking-[0.14em] text-[#171A17]/60">
                Status
              </dt>
              <dd className="border-t border-[#171A17]/15 py-3 text-[#171A17]/80">
                {status.licensed ? "Activated" : "Not activated"}
              </dd>
            </div>
          </dl>
          <p className="mt-8 font-spec text-[10px] uppercase leading-[1.7] tracking-[0.14em] text-[#171A17]/55">
            <Link to="/" className="transition-colors hover:text-[#171A17]">
              Back to the storefront
            </Link>
          </p>
        </aside>

        <section className="border border-[#171A17]/25 p-6 md:p-9">
          <h2 className="font-poster text-[clamp(1.7rem,2.6vw,2.2rem)] uppercase leading-[0.95]">
            Add your product key
          </h2>

          <form onSubmit={submit} data-tour="license-form" className="mt-7 space-y-5">
            <div data-tour="license-key">
              <label
                htmlFor="license-key"
                className="font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/65"
              >
                Product key
              </label>
              <input
                id="license-key"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder="PATHWAY-XXXX-XXXX-XXXX"
                autoComplete="off"
                required
                className="mt-2 h-12 w-full border border-[#171A17]/30 bg-transparent px-3 font-spec text-[14px] tracking-[0.08em] text-[#171A17] outline-none transition-colors placeholder:text-[#171A17]/45 focus:border-[#171A17]"
              />
            </div>

            {error ? (
              <p className="border border-[#FF4D00]/40 bg-[#FF4D00]/10 px-3 py-2.5 text-[14px] text-[#171A17]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || !key.trim()}
              className="flex h-14 w-full items-center justify-center gap-2 bg-[#FF4D00] font-spec text-[13px] font-bold uppercase tracking-[0.12em] text-[#171A17] transition-colors hover:bg-[#171A17] hover:text-[#E9EAE4] disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {busy ? "Activating…" : "Activate"}
            </button>
          </form>

          <p className="mt-5 font-spec text-[10px] uppercase tracking-[0.14em] text-[#171A17]/55">
            Domain: {status.domain}
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
