import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessionUser } from "@/hooks/use-session-user";
import { logout } from "@/lib/auth.functions";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Pathway Cycle Supply" },
      {
        name: "description",
        content: "Sign in to your Pathway account, create one, or continue as a guest.",
      },
      { property: "og:title", content: "Sign in — Pathway Cycle Supply" },
      { property: "og:description", content: "Sign in to track orders and save favourites." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

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

  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void run(async () => {
      await authRequest(mode === "signin" ? "login" : "register", { name, email, password });
      toast.success(mode === "signin" ? "Signed in." : "Account created.");
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

  function upgrade(event: React.FormEvent) {
    event.preventDefault();
    void run(async () => {
      await authRequest("upgrade", { name, email, password });
      toast.success("Account created — your orders came with you.");
      navigate({ to: redirectTo });
    });
  }

  return (
    <main className="grid min-h-[100dvh] bg-background md:grid-cols-[1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-secondary p-12 text-secondary-foreground md:flex md:flex-col md:justify-between lg:p-16">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 15%, #d9e4a1 0, transparent 35%), radial-gradient(circle at 80% 75%, #d8653c 0, transparent 32%)",
          }}
        />
        <Link
          to="/"
          className="relative z-10 w-fit font-display text-xl font-bold tracking-[-.06em]"
        >
          PATHWAY<span className="text-accent">.</span>
        </Link>
        <div className="relative z-10 max-w-lg">
          <p className="site-eyebrow !text-accent">Your rides, in one place</p>
          <h2 className="mt-4 text-5xl leading-[.98] tracking-[-.065em] lg:text-6xl">
            Keep track of the miles ahead.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-secondary-foreground/70">
            Sign in to follow your orders, keep a shortlist of parts, and pick up where you left
            off.
          </p>
        </div>
        <p className="relative z-10 text-xs text-secondary-foreground/45">
          Pathway Cycle Supply · Built for the long way round.
        </p>
      </section>

      <section className="flex min-h-[100dvh] items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-12 inline-flex font-display text-lg font-bold tracking-[-.06em] text-secondary md:hidden"
          >
            PATHWAY<span className="text-primary">.</span>
          </Link>

          <div className="admin-panel border border-border p-7 sm:p-9">
            {user?.isGuest ? (
              <>
                <p className="site-eyebrow">Guest session</p>
                <h1 className="mt-3 text-3xl tracking-[-.05em] text-ink">Keep your order.</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  You are browsing as a guest. Add an email and password and your order history
                  stays with you.
                </p>
                <form onSubmit={upgrade} className="mt-7 space-y-5">
                  <Field id="upgrade-name" label="Name" value={name} onChange={setName} />
                  <Field
                    id="upgrade-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                  />
                  <Field
                    id="upgrade-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                  />
                  <Button type="submit" disabled={busy} className="btn-brand w-full">
                    {busy ? "Saving…" : "Create account"}
                  </Button>
                </form>
                <button
                  type="button"
                  className="mt-5 text-left text-sm font-medium text-secondary underline decoration-border underline-offset-4 hover:text-primary"
                  onClick={() => void logout().then(() => refetch())}
                >
                  Sign out of this guest session
                </button>
              </>
            ) : (
              <>
                <p className="site-eyebrow">
                  {mode === "signin" ? "Welcome back" : "New around here"}
                </p>
                <h1 className="mt-3 text-3xl tracking-[-.05em] text-ink">
                  {mode === "signin" ? "Sign in." : "Set up your account."}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {mode === "signin"
                    ? "Pick up your orders, favourites and saved parts."
                    : "One account for orders, favourites and the workshop queue."}
                </p>

                <form onSubmit={onSubmit} className="mt-7 space-y-5">
                  {mode === "signup" ? (
                    <Field id="name" label="Name" value={name} onChange={setName} />
                  ) : null}
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />
                  <Field
                    id="password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <Button type="submit" disabled={busy} className="btn-brand w-full">
                    {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </form>

                <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>

                <a
                  href={googleHref}
                  className="flex min-h-12 w-full items-center justify-center border border-secondary px-5 text-[12px] font-bold uppercase tracking-[.1em] text-secondary transition-colors hover:bg-secondary hover:text-secondary-foreground"
                >
                  Continue with Google
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={continueAsGuest}
                  className="mt-4 w-full text-sm font-medium text-secondary underline decoration-border underline-offset-4 hover:text-primary"
                >
                  Continue as guest
                </button>

                <button
                  type="button"
                  className="mt-6 text-left text-sm font-medium text-secondary underline decoration-border underline-offset-4 hover:text-primary"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin"
                    ? "Need an account? Create one"
                    : "Already have an account? Sign in"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required
        minLength={type === "password" ? 6 : undefined}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-none bg-background"
      />
    </div>
  );
}
