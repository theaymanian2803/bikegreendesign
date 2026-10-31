import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LogOut, Package, User } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getSessionUser, logout } from "@/lib/auth.functions";

export const Route = createFileRoute("/_customer")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await getSessionUser();
    if (!user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user };
  },
  component: AccountLayout,
});

function AccountLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const initials = (user.name || user.email || "?")
    .split(/[\s@]+/)
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function signOut() {
    await logout();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="site-container min-h-[65vh] py-10 sm:py-14">
        <div className="mb-9 border-b border-border pb-6">
          <p className="site-eyebrow">Your Pathway</p>
          <h1 className="mt-2 text-3xl tracking-[-.05em]">Rider account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep your details close and your orders in view.
          </p>
        </div>
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 md:w-60">
            <div className="admin-panel border border-border p-6 text-center">
              <Avatar className="mx-auto size-16 rounded-full">
                <AvatarFallback className="bg-secondary text-lg font-bold text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <p className="mt-3 font-display text-base font-semibold text-ink">
                {user.name || "Rider"}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
            </div>

            <nav className="mt-4 flex flex-col gap-1">
              <Link
                to="/account"
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="flex items-center gap-2 border-l-2 border-transparent px-4 py-3 font-sans text-sm text-ink transition-colors hover:bg-surface"
              >
                <User className="size-4" /> Profile
              </Link>
              <Link
                to="/account/orders"
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="flex items-center gap-2 border-l-2 border-transparent px-4 py-3 font-sans text-sm text-ink transition-colors hover:bg-surface"
              >
                <Package className="size-4" /> My Orders
              </Link>
              <Link
                to="/favorites"
                className="flex items-center gap-2 border-l-2 border-transparent px-4 py-3 font-sans text-sm text-ink transition-colors hover:bg-surface"
              >
                <User className="size-4" /> Favourites
              </Link>
            </nav>

            <div className="mt-4 border-t border-border pt-4">
              <Button variant="outline" size="sm" className="w-full" onClick={() => void signOut()}>
                <LogOut className="mr-2 size-4" /> Sign out
              </Button>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
