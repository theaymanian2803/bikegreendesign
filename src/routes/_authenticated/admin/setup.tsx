import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Database,
  KeyRound,
  ListChecks,
  Loader2,
  PlugZap,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logout } from "@/lib/auth.functions";
import {
  connectDatabase,
  getSetupInfo,
  resetDatabase,
  testDatabaseConnection,
  type SetupInfo,
} from "@/lib/setup.functions";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";
import { useLicense } from "@/hooks/use-license";

const STORAGE_KEY = "pathway_setup_progress";

const CHECKLIST = [
  {
    key: "products",
    title: "Add your products",
    description: "Create products with images, prices, badges and specifications.",
    href: "/admin/products",
  },
  {
    key: "categories",
    title: "Set up categories",
    description: "Organise the catalog so shoppers can browse by category.",
    href: "/admin/categories",
  },
  {
    key: "landing",
    title: "Design the homepage",
    description: "Arrange hero banners, product rows and promo sections.",
    href: "/admin/landing",
  },
  {
    key: "popup",
    title: "Set up a promo popup",
    description: "Welcome visitors with a discount when they arrive.",
    href: "/admin/popup",
  },
  {
    key: "settings",
    title: "Configure shipping & contact",
    description: "Set the free-shipping threshold, flat rate and store details.",
    href: "/admin/settings",
  },
  {
    key: "users",
    title: "Add team admins",
    description: "Grant admin access to other Google accounts.",
    href: "/admin/users",
  },
  {
    key: "orders",
    title: "Manage incoming orders",
    description: "Track, update and fulfil customer orders.",
    href: "/admin/orders",
  },
  {
    key: "activate",
    title: "Activate your license",
    description: "Activate this domain to unlock admin writes.",
    href: "/activate",
  },
];

function loadProgress(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/_authenticated/admin/setup")({
  head: () => ({
    meta: [
      { title: "Setup — Pathway Admin" },
      {
        name: "description",
        content: "Connect your Turso database, secure the Google admin and finish store setup.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const [info, setInfo] = useState<SetupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbUrl, setDbUrl] = useState("");
  const [dbToken, setDbToken] = useState("");
  const [keepSeed, setKeepSeed] = useState(true);
  const [dbBusy, setDbBusy] = useState<"test" | "connect" | "reset" | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>(loadProgress);

  const { status: license } = useLicense();
  const { requireWrite } = useAdminWriteGuard();
  const navigate = useNavigate();

  async function load() {
    try {
      setInfo(await getSetupInfo());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load setup details");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function toggle(key: string) {
    const next = done.includes(key) ? done.filter((k) => k !== key) : [...done, key];
    setDone(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — progress just won't persist
    }
  }

  async function testConnection() {
    if (!requireWrite()) return;
    if (!dbUrl.trim() || !dbToken.trim()) {
      setDbError("Database URL and token are required.");
      return;
    }
    setDbBusy("test");
    setDbError(null);
    try {
      const result = await testDatabaseConnection({
        data: { url: dbUrl, token: dbToken },
      });
      if (result.ok) {
        toast.success("Connection works!");
      } else {
        setDbError(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      setDbError(message);
      toast.error(message);
    }
    setDbBusy(null);
  }

  async function connect() {
    if (!requireWrite()) return;
    if (!dbUrl.trim() || !dbToken.trim()) {
      setDbError("Database URL and token are required.");
      return;
    }
    setDbBusy("connect");
    setDbError(null);
    try {
      const result = await connectDatabase({
        data: { url: dbUrl, token: dbToken, keepSeed },
      });
      setDbUrl("");
      setDbToken("");
      if (result.signedOut) {
        toast.message("Database connected. Sign in with Google to claim it.", {
          description: "The new database has no session for the demo account.",
        });
        navigate({ to: "/auth", search: { redirect: "/admin/setup" } });
      } else {
        toast.success("Database connected");
        await load();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not connect the database";
      setDbError(message);
      toast.error(message);
    }
    setDbBusy(null);
  }

  async function reset() {
    if (!requireWrite()) return;
    if (!window.confirm("Switch back to the demo database? You will be signed out.")) return;
    setDbBusy("reset");
    try {
      await resetDatabase();
      setDbUrl("");
      setDbToken("");
      toast.success("Back to the demo database");
      navigate({ to: "/auth", search: { redirect: "/admin/setup" } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset the database");
    }
    setDbBusy(null);
  }

  async function switchGoogleAccount() {
    await logout();
    navigate({ to: "/auth" });
  }

  if (loading || !info) {
    return <div className="py-20 font-sans text-muted-foreground">Loading setup…</div>;
  }

  const total = CHECKLIST.length;
  const completed = done.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <main className="space-y-6 py-8">
      <header data-tour="setup-header">
        <p className="section-label">Admin</p>
        <h1 className="font-display text-3xl font-bold text-ink">Setup</h1>
        <p className="mt-1 max-w-[70ch] font-sans text-sm text-muted-foreground">
          Connect your own database, secure the Google admin account and work through the checklist
          before going live.
        </p>
      </header>

      <section
        data-tour="admin-db"
        className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(43,38,34,0.04)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Database className="size-4 text-primary" /> Connect your own database
            </h2>
            <p className="mt-1 max-w-[70ch] font-sans text-sm text-muted-foreground">
              The store works out of the box on the demo database. Connect your own Turso database
              to keep products, orders and customers private.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-sans text-xs font-semibold text-ink">
            <span
              className={`size-2 rounded-full ${info.db.usingCustom ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            {info.db.usingCustom ? "Your database" : "Demo database"}
          </span>
        </div>

        {info.db.usingCustom && info.db.url ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 font-sans text-sm">
            <Check className="size-4 text-emerald-600" />
            <span className="font-mono text-xs text-muted-foreground">{info.db.url}</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={reset}
              disabled={dbBusy !== null}
            >
              <RefreshCw className="mr-2 size-3.5" /> Reset to demo
            </Button>
          </div>
        ) : null}

        {!info.db.usingCustom ? (
          <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-border p-3 font-sans text-sm text-ink">
            <input
              type="checkbox"
              checked={keepSeed}
              onChange={(event) => setKeepSeed(event.target.checked)}
              className="mt-1 accent-primary"
            />
            <span>
              <span className="font-semibold">Copy the sample catalog into the new database</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Recommended. Uncheck to start with an empty store and add everything yourself.
              </span>
            </span>
          </label>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="db-url"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Database URL
            </Label>
            <Input
              id="db-url"
              value={dbUrl}
              onChange={(event) => setDbUrl(event.target.value)}
              placeholder="libsql://your-database.turso.io"
              autoComplete="off"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="db-token"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Auth token
            </Label>
            <Input
              id="db-token"
              type="password"
              value={dbToken}
              onChange={(event) => setDbToken(event.target.value)}
              placeholder="eyJhbGciOiJ…"
              autoComplete="off"
              className="font-mono text-sm"
            />
          </div>
        </div>

        {dbError ? <p className="mt-2 font-sans text-xs text-destructive">{dbError}</p> : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={testConnection} disabled={dbBusy !== null}>
            {dbBusy === "test" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Test connection
          </Button>
          <Button size="sm" onClick={connect} disabled={dbBusy !== null}>
            {dbBusy === "connect" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <PlugZap className="mr-2 size-4" />
            )}
            Save &amp; connect
          </Button>
          <a
            href="https://turso.tech"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:underline"
          >
            <PlugZap className="size-3.5" /> Don't have one? Create a free database at turso.tech
          </a>
        </div>

        <p className="mt-3 font-sans text-[11px] leading-relaxed text-muted-foreground">
          Connecting switches this deployment to the new database. If you are using the temporary
          demo admin you will be signed out, then the first Google sign-in becomes the owner.
        </p>
      </section>

      <section
        data-tour="admin-creds"
        className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(43,38,34,0.04)]"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <KeyRound className="size-4 text-primary" /> Secure your admin login
        </h2>
        <p className="mt-1 max-w-[70ch] font-sans text-sm text-muted-foreground">
          There is no password to manage here. Admin access is tied to Google accounts: the first
          Google sign-in on a new database becomes the owner, and more admins can be added from
          Users &amp; roles.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="font-sans text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {info.isDemoUser ? "Demo admin" : "Signed in with Google"}
            </p>
            <p className="mt-1 break-all font-sans text-sm font-semibold text-ink">
              {info.user.email}
            </p>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              {info.isDemoUser ? "Temporary demo admin" : "Admin account"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="font-sans text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Store owner
            </p>
            <p className="mt-1 break-all font-sans text-sm font-semibold text-ink">
              {info.ownerEmail ?? "Not claimed yet"}
            </p>
            <p className="mt-0.5 font-sans text-xs text-muted-foreground">
              {info.adminCount} other admin{info.adminCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {info.isDemoUser ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft px-3 py-2 font-sans text-sm text-ink">
            <span>
              You're using the temporary demo admin. Sign in with Google after activation to claim
              the store as the owner.
            </span>
            <Button variant="outline" size="sm" onClick={switchGoogleAccount}>
              Sign in with Google
            </Button>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/users">Manage users &amp; roles</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={switchGoogleAccount}>
            Switch Google account
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(43,38,34,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <ShieldCheck className="size-4 text-primary" /> License
          </h2>
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-sans text-xs font-semibold text-ink">
            <span
              className={`size-2 rounded-full ${license?.licensed ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            {license?.licensed ? "Activated" : "Not activated"}
          </span>
        </div>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          Domain: <span className="font-mono text-xs text-ink">{license?.domain ?? "—"}</span>
          {" · "}
          Admin writes require activation. Readers can browse the admin in preview mode.
        </p>
        {!license?.licensed ? (
          <Button size="sm" className="btn-brand mt-3" asChild>
            <Link to="/activate" search={{ redirect: "/admin/setup" }}>
              Activate license
            </Link>
          </Button>
        ) : null}
      </section>

      <section
        data-tour="setup-list"
        className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(43,38,34,0.04)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <ListChecks className="size-4 text-primary" /> Setup progress
            </h2>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              {completed === total
                ? "Everything is done — your store is ready to sell."
                : "Keep going — you're almost there."}
            </p>
          </div>
          <span className="font-display text-sm font-bold text-primary">
            {completed} / {total}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {CHECKLIST.map((item) => {
            const isDone = done.includes(item.key);
            return (
              <div
                key={item.key}
                className={`rounded-xl border p-4 transition-colors ${
                  isDone ? "border-primary/30 bg-primary-soft/50" : "border-border bg-background"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(item.key)}
                    aria-pressed={isDone}
                    aria-label={`Mark "${item.title}" ${isDone ? "not done" : "done"}`}
                    className="mt-0.5 shrink-0 text-primary transition-opacity hover:opacity-80"
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
                      {item.title}
                      {isDone ? <Check className="size-4 text-primary" /> : null}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                      {item.description}
                    </p>
                    <a
                      href={item.href}
                      className="mt-2 inline-flex items-center gap-1 font-sans text-xs font-semibold text-primary hover:underline"
                    >
                      Open <ArrowRight className="size-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
