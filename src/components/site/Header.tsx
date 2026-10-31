import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Mail, Phone, Search, ShoppingCart, User, ChevronDown } from "lucide-react";

import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  DEFAULT_TOP_BAR_SETTINGS,
  getTopBarSettings,
  type TopBarSettings,
} from "@/lib/topbar.functions";
import { MegaMenu } from "@/components/site/MegaMenu";
import { logout } from "@/lib/auth.functions";

const nav = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop", caret: true, menuKey: "shop" },
  { label: "Categories", to: "/shop", caret: true, tag: "New", menuKey: "categories" },
  { label: "Products", to: "/shop", caret: true, tag: "Hot", menuKey: "products" },
  { label: "Top Deals", to: "/shop", caret: true, menuKey: "top-deals" },
  { label: "Elements", to: "/shop", caret: true, menuKey: "elements" },
];

export function Header() {
  const { count } = useCart();
  const { count: favoriteCount } = useFavorites();
  const { data: user, refetch } = useSessionUser();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [topBar, setTopBar] = useState<TopBarSettings>(DEFAULT_TOP_BAR_SETTINGS);

  useEffect(() => {
    let active = true;
    getTopBarSettings()
      .then((data) => {
        if (active && data) setTopBar(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    setAccountOpen(false);
    await logout();
    await refetch();
  }

  return (
    <header className="w-full">
      <div className="hidden border-b border-border bg-topbar text-topbar-foreground lg:block">
        {topBar.enabled ? (
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-2 text-xs">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> {topBar.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary" /> {topBar.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" /> {topBar.email}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to={topBar.trackOrderHref} className="transition-colors hover:text-primary">
                Track Order
              </Link>
              <span>Help Center</span>
              <span>English</span>
              <span>$ USD</span>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="relative border-b border-border bg-background"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-4 py-4">
          <Link to="/" className="flex items-center font-display text-2xl font-bold tracking-tight">
            <span className="rounded-sm bg-primary px-2 py-0.5 text-primary-foreground">Path</span>
            <span className="pl-1 text-ink">way</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                activeProps={{ className: "text-primary" }}
                onMouseEnter={() => setOpenMenu(item.menuKey ?? null)}
                onFocus={() => setOpenMenu(item.menuKey ?? null)}
                aria-expanded={item.menuKey ? openMenu === item.menuKey : undefined}
                className={`flex items-center gap-1 font-display text-[13px] font-bold uppercase tracking-wide transition-colors hover:text-primary ${
                  openMenu && openMenu === item.menuKey ? "text-primary" : "text-ink"
                }`}
              >
                {item.label}
                {item.tag ? (
                  <span className="rounded-sm bg-primary px-1 py-px text-[9px] uppercase text-primary-foreground">
                    {item.tag}
                  </span>
                ) : null}
                {item.caret ? <ChevronDown className="size-3" /> : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-ink">
            <Search className="size-5" />
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-label={user ? "Your account" : "Sign in"}
                aria-expanded={accountOpen}
                className="flex items-center"
              >
                <User className="size-5" />
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
                  <div className="absolute right-0 top-8 z-50 w-56 border border-border bg-background p-4 text-xs shadow-lg">
                    {user ? (
                      <>
                        <p className="font-semibold text-ink">{user.name || "Guest"}</p>
                        <p className="mt-0.5 truncate text-muted-foreground">{user.email}</p>
                        <div className="mt-3 space-y-2">
                          <Link
                            to="/favorites"
                            onClick={() => setAccountOpen(false)}
                            className="block text-muted-foreground hover:text-primary"
                          >
                            Favourites
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
                        <p className="text-muted-foreground">You are browsing as a visitor.</p>
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
            <Link to="/favorites" className="relative" aria-label="View favorites">
              <Heart className="size-5" />
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {favoriteCount}
              </span>
            </Link>
            <Link to="/cart" className="relative" aria-label="View cart">
              <ShoppingCart className="size-5" />
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {count}
              </span>
            </Link>
          </div>
        </div>

        {openMenu ? (
          <div className="absolute inset-x-0 top-full z-50 hidden lg:block">
            <div className="mx-auto max-w-[1400px] px-4">
              <MegaMenu menuKey={openMenu} />
            </div>
          </div>
        ) : null}

        <nav className="flex items-center gap-5 overflow-x-auto border-t border-border px-4 py-3 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="whitespace-nowrap font-display text-xs font-bold uppercase text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
