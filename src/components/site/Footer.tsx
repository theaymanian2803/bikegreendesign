import { ArrowUpRight, Bike, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Bikes", to: "/shop" },
      { label: "Parts & gear", to: "/shop" },
      { label: "Shop all", to: "/shop" },
    ],
  },
  {
    title: "Your Pathway",
    links: [
      { label: "My account", to: "/account" },
      { label: "Order history", to: "/account/orders" },
      { label: "Your cart", to: "/cart" },
    ],
  },
  {
    title: "Good to know",
    links: [
      { label: "Shipping & returns", to: "/shop" },
      { label: "Workshop", to: "/#workshop" },
      { label: "Visit the shop", to: "/#visit" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="site-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Link to="/" className="flex w-fit items-center gap-2.5">
            <span className="flex size-9 items-center justify-center bg-primary text-primary-foreground">
              <Bike className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-[-.06em]">
              PATHWAY<span className="text-accent">.</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-6 text-secondary-foreground/70">
            Good bikes. Honest advice. A workshop that treats every ride like it matters.
          </p>
          <p className="flex items-center gap-2 text-xs text-accent">
            <MapPin className="size-3.5" /> 507 Union Trade Center, USA
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-secondary-foreground transition-colors hover:text-accent"
          >
            Find your next ride <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="space-y-4 text-sm text-secondary-foreground/70">
            <h4 className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">
              {col.title}
            </h4>
            <div className="flex flex-col gap-3">
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  className="w-fit transition-colors hover:text-secondary-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-4 text-sm text-secondary-foreground/70">
          <h4 className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">
            Workshop hours
          </h4>
          <p>
            Monday–Friday <span className="block text-secondary-foreground">9am–6pm</span>
          </p>
          <p>
            Saturday <span className="block text-secondary-foreground">10am–4pm</span>
          </p>
          <p>
            Sunday <span className="block text-secondary-foreground">Out riding</span>
          </p>
        </div>
      </div>
      <div className="border-t border-secondary-foreground/15">
        <div className="site-container flex flex-wrap items-center justify-between gap-3 py-4 text-[11px] text-secondary-foreground/50">
          <span>
            © {new Date().getFullYear()} Pathway Cycle Supply. Built for the long way round.
          </span>
          <span>Ride far. Look after your kit.</span>
        </div>
      </div>
    </footer>
  );
}
