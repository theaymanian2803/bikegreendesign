const columns = [
  {
    title: "Products",
    links: ["Prices Drop", "New Products", "Best Sellers", "Sitemap", "Stores", "Headsets"],
  },
  {
    title: "Our Company",
    links: [
      "Delivery",
      "Legal Notice",
      "Terms & Conditions",
      "Secure Payment",
      "Contact Us",
      "About Us",
    ],
  },
  {
    title: "Your Account",
    links: ["Order Tracking", "Sign In", "Create Account", "Discount", "Wishlist", "Credit Slips"],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 text-sm text-ink-foreground/70">
          <h4 className="text-base uppercase tracking-wide text-ink-foreground">
            Store Information
          </h4>
          <p>Pathway Demo</p>
          <p>108 New Theme St. NY, USA 37305, Beside the Sun point blvd, United States</p>
          <p>Call us: +00 123-456-789</p>
          <p>Email us: admin@example.com</p>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="space-y-3 text-sm text-ink-foreground/70">
            <h4 className="text-base uppercase tracking-wide text-ink-foreground">{col.title}</h4>
            {col.links.map((l) => (
              <p key={l} className="transition-colors hover:text-primary">
                {l}
              </p>
            ))}
          </div>
        ))}

        <div className="space-y-3 text-sm text-ink-foreground/70">
          <h4 className="text-base uppercase tracking-wide text-ink-foreground">Opening Hours</h4>
          <p>Mon - Fri</p>
          <p className="text-ink-foreground">08:00 - 22:00</p>
          <p>Saturday</p>
          <p className="text-ink-foreground">08:00 - 18:00</p>
          <p>Sunday</p>
          <p className="text-ink-foreground">Closed</p>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto max-w-[1200px] px-4 py-5 text-center text-xs text-ink-foreground/60">
          © {new Date().getFullYear()} Pathway Bike Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
