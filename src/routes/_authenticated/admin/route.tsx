import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ExternalLink,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Settings2,
  ShoppingBag,
  Star,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

import { logout } from "@/lib/auth.functions";
import { heartbeatLicense } from "@/lib/license.functions";
import { Button } from "@/components/ui/button";
import { useAdminWriteGuard } from "@/hooks/use-admin-write-guard";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/setup", label: "Setup", icon: ListChecks, exact: false },
  { to: "/admin/landing", label: "Landing page", icon: LayoutTemplate, exact: false },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/menu", label: "Mega menu", icon: Menu, exact: false },
  { to: "/admin/categories", label: "Categories", icon: Tags, exact: false },
  { to: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings2, exact: false },
  { to: "/admin/users", label: "Users & roles", icon: Users, exact: false },
  { to: "/admin/popup", label: "Popup", icon: Megaphone, exact: false },
] as const satisfies ReadonlyArray<{
  to: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}>;

const NAV_LINK_CLASS =
  "flex items-center gap-2 rounded-full px-4 py-2 font-sans text-sm transition-colors";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Pathway" },
      { name: "description", content: "Pathway store administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const { locked } = useAdminWriteGuard();

  async function signOutUser() {
    await logout();
    await router.invalidate();
    navigate({ to: "/" });
  }

  useEffect(() => {
    let cancelled = false;

    try {
      const last = Number(sessionStorage.getItem("pathway_license_hb") ?? 0);
      if (Date.now() - last < 12 * 60 * 60 * 1000) return;
      sessionStorage.setItem("pathway_license_hb", String(Date.now()));
    } catch {
      // storage unavailable — fall through and check once per mount
    }

    (async () => {
      const result = await heartbeatLicense().catch(() => null);
      if (!cancelled && result && "licensed" in result && !result.licensed) {
        await router.invalidate();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div
        data-tour="admin-dashboard"
        className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4"
      >
        <nav className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-tour={
                  item.to === "/admin/setup"
                    ? "nav-setup"
                    : item.to === "/admin/settings"
                      ? "nav-settings"
                      : item.to === "/admin/users"
                        ? "nav-users"
                        : undefined
                }
                activeOptions={{ exact: item.exact }}
                activeProps={{
                  className: `${NAV_LINK_CLASS} bg-primary text-primary-foreground hover:bg-primary/90`,
                }}
                inactiveProps={{
                  className: `${NAV_LINK_CLASS} bg-surface text-ink hover:bg-primary hover:text-primary-foreground`,
                }}
                className={NAV_LINK_CLASS}
              >
                <Icon className="size-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" /> View store
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={signOutUser}>
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </div>
      </div>
      {locked ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3 font-sans text-sm text-ink">
          <span>
            <strong>Preview mode</strong> — browse everything. Activate to add or edit.
          </span>
          <Button size="sm" asChild>
            <Link to="/activate" search={{ redirect: "/admin" }}>
              Activate license
            </Link>
          </Button>
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}
