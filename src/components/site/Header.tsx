import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Mail, Phone, Search, ShoppingCart, User, ChevronDown } from "lucide-react";

import { useCart } from "@/lib/cart";


const nav = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop", caret: true },
  { label: "Categories", to: "/shop", caret: true, tag: "New" },
  { label: "Products", to: "/shop", caret: true, tag: "Hot" },
  { label: "Top Deals", to: "/shop", caret: true },
  { label: "Elements", to: "/shop", caret: true },
];

export function Header() {
  const { count } = useCart();
  return (

    <header className="w-full">
      <div className="hidden border-b border-border bg-topbar text-topbar-foreground lg:block">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-2 text-xs">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" /> 507 Union Trade Center, USA
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5 text-primary" /> (+91) 9876-543-210
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-primary" /> demo@example.com
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Track Order</span>
            <span>Help Center</span>
            <span>English</span>
            <span>$ USD</span>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background">
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
                className="flex items-center gap-1 font-display text-[13px] font-bold uppercase tracking-wide text-ink transition-colors hover:text-primary"
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
            <User className="hidden size-5 sm:block" />
            <span className="relative">
              <Heart className="size-5" />
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                0
              </span>
            </span>
            <Link to="/cart" className="relative" aria-label="View cart">
              <ShoppingCart className="size-5" />
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {count}
              </span>
            </Link>

          </div>
        </div>
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
