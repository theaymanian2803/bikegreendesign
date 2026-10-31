import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useSessionUser } from "@/hooks/use-session-user";
import { logout } from "@/lib/auth.functions";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Pathway Bike Shop" },
      { name: "description", content: "Sign in to your Pathway account, or continue as a guest." },
      { property: "og:title", content: "Sign in — Pathway Bike Shop" },
      { property: "og:description", content: "Sign in to track orders and save favourites." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "register";

async function authRequest(path: string, body?: unknown) {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error ?? payload?.message ?? "Something went wrong.");
  }
  return payload;
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { data: user, refetch } = useSessionUser();

  const redirectTo =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/shop";
  const googleHref = `/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`;

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
    setBusy(false);
  }

  function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await authRequest(mode === "register" ? "register" : "login", { name, email, password });
      toast.success(mode === "register" ? "Account created." : "Signed in.");
      navigate({ to: redirectTo });
    });
  }

  function continueAsGuest() {
    void run(async () => {
      await authRequest("guest");
      toast.success("Continuing as a guest.");
      navigate({ to: redirectTo });
    });
  }

  function upgrade(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await authRequest("upgrade", { name, email, password });
      toast.success("Account created — your orders moved with you.");
      navigate({ to: redirectTo });
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[440px] px-4 py-16">
        <div className="border border-border p-8">
          <p className="section-label">Your account</p>
          <h1 className="mt-2 text-2xl text-ink">
            {user?.isGuest ? "Keep your guest order" : "Sign in or create an account"}
          </h1>

          {user?.isGuest ? (
            <form onSubmit={upgrade} className="mt-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                You are signed in as a guest. Add an email and password to keep your order history
                and track deliveries.
              </p>
              <Field label="Name" value={name} onChange={setName} />
              <Field label="Email" type="email" value={email} onChange={setEmail} />
              <Field label="Password" type="password" value={password} onChange={setPassword} />
              <button type="submit" disabled={busy} className="btn-brand w-full">
                {busy ? "Saving…" : "Create account"}
              </button>
              <button
                type="button"
                onClick={() => void logout().then(() => refetch())}
                className="w-full text-xs text-muted-foreground hover:text-primary"
              >
                Sign out of this guest session
              </button>
            </form>
          ) : (
            <>
              <div className="mt-5 flex gap-2">
                {(["signin", "register"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 border px-4 py-2 font-display text-[12px] font-bold uppercase tracking-wide transition-colors ${
                      mode === m
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-ink hover:border-primary hover:text-primary"
                    }`}
                  >
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={submitEmail} className="mt-5 space-y-4">
                {mode === "register" ? (
                  <Field label="Name" value={name} onChange={setName} />
                ) : null}
                <Field label="Email" type="email" value={email} onChange={setEmail} />
                <Field label="Password" type="password" value={password} onChange={setPassword} />
                <button type="submit" disabled={busy} className="btn-brand w-full">
                  {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <a
                href={googleHref}
                className="block border border-ink px-5 py-2.5 text-center font-display text-[13px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Continue with Google
              </a>
              <button
                type="button"
                onClick={continueAsGuest}
                disabled={busy}
                className="mt-3 w-full text-xs text-muted-foreground hover:text-primary"
              >
                Continue as guest
              </button>
            </>
          )}

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Back to the shop
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-border bg-background px-3 py-2 text-xs text-ink outline-none focus:border-primary"
      />
    </label>
  );
}
