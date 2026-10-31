import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bike, ChevronDown, MapPin, Menu, ShoppingBag, UserRound, X } from "lucide-react";

import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useSessionUser } from "@/hooks/use-session-user";
import { logout } from "@/lib/auth.functions";
import { MegaMenu } from "@/components/site/MegaMenu";

const nav = [
  { label: "Home", to: "/" },
  { label: "Bikes", to: "/shop", caret: true, menuKey: "shop" },
  { label: "Parts & gear", to: "/shop", caret: true, menuKey: "categories" },
  { label: "Workshop", to: "/#workshop" },
];

export function Header() {
  const { count } = useCart();
  const { count: favoriteCount } = useFavorites();
  const { data: user, refetch } = useSessionUser();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  async function signOut() {
    setAccountOpen(false);
    await logout();
    await refetch();
  }

  return (
    <header className="site-header-shadow relative z-30 w-full">
      <div className="bg-secondary text-secondary-foreground">
        <div className="site-container flex min-h-9 items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[.12em] sm:text-[11px]">
          <span>Free delivery on orders over $300</span>
          <span className="hidden items-center gap-2 text-secondary-foreground/80 sm:flex">
            <MapPin className="size-3.5 text-accent" /> 507 Union Trade Center
          </span>
          <Link to="/shop" className="text-accent transition-colors hover:text-white">
            Built to ride. Ready to roll.
          </Link>
        </div>
      </div>

      <div
        className="relative border-b border-border bg-background/95 backdrop-blur"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="site-container flex min-h-[76px] items-center justify-between gap-5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Pathway home">
            <span className="flex size-10 items-center justify-center bg-primary text-primary-foreground">
              <Bike className="size-6" strokeWidth={2.1} />
            </span>
            <span className="font-display text-[21px] font-bold leading-none tracking-[-.075em] text-ink">
              PATHWAY<span className="text-primary">.</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                activeProps={{ className: "text-primary" }}
                onMouseEnter={() => setOpenMenu(item.menuKey ?? null)}
                onFocus={() => setOpenMenu(item.menuKey ?? null)}
                aria-expanded={item.menuKey ? openMenu === item.menuKey : undefined}
                className={`flex items-center gap-1 font-sans text-[12px] font-bold uppercase tracking-[.09em] transition-colors hover:text-primary ${
                  openMenu && openMenu === item.menuKey ? "text-primary" : "text-ink"
                }`}
              >
                {item.label}
                {item.caret ? <ChevronDown className="size-3" /> : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-ink">
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-label={user ? "My account" : "Sign in"}
                aria-expanded={accountOpen}
                className="flex size-10 items-center justify-center transition-colors hover:bg-surface hover:text-primary"
              >
                <UserRound className="size-[18px]" />
                {favoriteCount > 0 ? (
                  <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
                ) : null}
              </button>
              {accountOpen ? (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setAccountOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute right-0 top-12 z-50 w-60 border border-border bg-background p-4 text-xs shadow-xl">
                    {user ? (
                      <>
                        <p className="font-display text-sm font-semibold text-ink">
                          {user.name || "Guest"}
                        </p>
                        <p className="mt-0.5 truncate text-muted-foreground">{user.email}</p>
                        <div className="mt-3 space-y-2">
                          <Link
                            to="/favorites"
                            onClick={() => setAccountOpen(false)}
                            className="block text-muted-foreground hover:text-primary"
                          >
                            Favourites ({favoriteCount})
                          </Link>
                          {user.isAdmin ? (
                            <Link
                              to="/admin"
                              onClick={() => setAccountOpen(false)}
                              className="block text-muted-foreground hover:text-primary"
                            >
                              Admin dashboard
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void signOut()}
                            className="block text-left text-muted-foreground hover:text-primary"
                          >
                            Sign out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          Sign in to track orders and save favourites.
                        </p>
                        <Link
                          to="/auth"
                          onClick={() => setAccountOpen(false)}
                          className="btn-brand mt-3 block text-center"
                        >
                          Sign in
                        </Link>
                      </>
                    )}
                  </div>
                </>
              ) : null}
            </div>
            <Link
              to="/cart"
              className="relative flex size-10 items-center justify-center bg-secondary text-secondary-foreground transition-colors hover:bg-primary"
              aria-label={`View cart, ${count} items`}
            >
              <ShoppingBag className="size-[18px]" />
              <span className="absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {count}
              </span>
            </Link>
            <button
              type="button"
              className="flex size-10 items-center justify-center border border-border lg:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {openMenu ? (
          <div className="absolute inset-x-0 top-full z-50 hidden lg:block">
            <div className="mx-auto max-w-[1400px] px-4">
              <MegaMenu menuKey={openMenu} />
            </div>
          </div>
        ) : null}

        {mobileOpen ? (
          <nav
            aria-label="Mobile navigation"
            className="grid gap-1 border-t border-border bg-background px-4 py-3 lg:hidden"
          >
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-3 font-sans text-xs font-bold uppercase tracking-[.1em] text-ink hover:bg-surface hover:text-primary"
              >
                {item.label}
                {item.caret ? <ChevronDown className="size-3" /> : null}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
