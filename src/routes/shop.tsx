import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Grid2x2, List, Plus } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { listCatalogCategories, listCatalogProducts } from "@/integrations/turso/catalog.functions";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import shopBanner from "@/assets/cta-road.jpg";
import cityRide from "@/assets/service-test.jpg";
import trailRide from "@/assets/about-mechanic.jpg";

const sideMenu = ["Bicycles", "Accessories", "Apparel", "Components", "Services"];

const shopSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["relevance", "price-asc", "price-desc", "name-asc"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: shopSearchSchema,
  loader: async (): Promise<{ products: CatalogProduct[]; categories: CatalogCategory[] }> => {
    const [products, categories] = await Promise.all([
      listCatalogProducts(),
      listCatalogCategories(),
    ]);
    return { products, categories };
  },
  head: () => ({
    meta: [
      { title: "Shop Bicycles & Parts — Pathway Bike Store" },
      {
        name: "description",
        content:
          "Browse bicycles, wheels, helmets and drivetrain parts. Filter by category, brand and price at the Pathway bike store.",
      },
      { property: "og:title", content: "Shop Bicycles & Parts — Pathway Bike Store" },
      {
        property: "og:description",
        content: "Bikes, wheels, helmets and drivetrain parts with category and price filters.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { products, categories } = Route.useLoaderData();
  const { category, sort } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const visible = useMemo(() => {
    let list = products;
    if (category) list = list.filter((p) => slugify(p.category) === category);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, sort]);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[],
    [products],
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page banner */}
      <section className="relative">
        <img
          src={shopBanner}
          alt="Road bicycle wheel close up"
          width={1920}
          height={800}
          className="h-[160px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-2xl text-ink-foreground">Shop</h1>
          <p className="mt-1 text-xs text-ink-foreground/70">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>{" "}
            / Shop
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-8">
          <div>
            <h2 className="border-l-2 border-primary bg-surface px-3 py-2 text-sm">Home</h2>
            <ul className="mt-2">
              {sideMenu.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between border-b border-border py-2 text-xs text-muted-foreground"
                >
                  {item}
                  <Plus className="size-3" />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="border-l-2 border-primary bg-surface px-3 py-2 text-sm">Filter By</h2>
            <div className="mt-4 space-y-6">
              <FilterGroup title="Categories">
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link
                    to="/shop"
                    search={(prev) => ({ ...prev, category: undefined })}
                    className={category ? "hover:text-primary" : "font-bold text-ink"}
                  >
                    All ({products.length})
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link
                      to="/shop"
                      search={(prev) => ({ ...prev, category: c.slug })}
                      className={category === c.slug ? "font-bold text-ink" : "hover:text-primary"}
                    >
                      {c.name} ({c.count})
                    </Link>
                  </li>
                ))}
              </FilterGroup>

              {brands.length ? (
                <FilterGroup title="Brands">
                  {brands.map((brand) => (
                    <li
                      key={brand}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <input type="checkbox" className="size-3 accent-primary" readOnly />
                      {brand}
                    </li>
                  ))}
                </FilterGroup>
              ) : null}
            </div>
          </div>
        </aside>

        {/* Listing */}
        <div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Bicycles come in various categories, each designed for specific terrains, purposes and
            rider preferences. Road bikes are lightweight and built for speed, ideal for paved
            surfaces and long-distance riding. Mountain bikes, with their sturdy frames and wide
            knobby tires, are perfect for rugged trails and off-road adventures.
          </p>

          <h2 className="mt-8 text-sm">Subcategories</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((c) => (
              <div key={c.name} className="text-center">
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    width={320}
                    height={240}
                    className="h-24 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center border border-border bg-background text-[11px] text-muted-foreground">
                    No image available
                  </div>
                )}
                <p className="mt-2 text-xs text-ink">{c.name}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
                <Grid2x2 className="size-4" />
              </span>
              <span className="flex size-7 items-center justify-center border border-border text-muted-foreground">
                <List className="size-4" />
              </span>
              <span className="ml-3 text-xs text-muted-foreground">
                There are {visible.length} products.
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Sort by:
              <select
                className="border border-border bg-background px-3 py-1.5 text-xs text-ink"
                value={sort ?? "relevance"}
                onChange={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      sort: e.target.value === "relevance" ? undefined : (e.target.value as never),
                    }),
                  })
                }
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price, low to high</option>
                <option value="price-desc">Price, high to low</option>
                <option value="name-asc">Name, A to Z</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">No products match this filter yet.</p>
          ) : null}

          <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing 1-{Math.min(12, visible.length)} of {visible.length} item(s)
            </span>
            <div className="flex items-center gap-1">
              <span className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
                1
              </span>
            </div>
          </div>

          {/* Description block */}
          <div className="mt-12 border border-border p-6">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Hybrid bikes combine features of road and mountain bikes, offering versatility for
              both city commuting and occasional trail rides. Cruiser bikes prioritize comfort and
              style, often used for casual riding on flat terrain. Electric bikes have become
              increasingly popular, featuring a motor to assist with pedaling, making commuting and
              hill climbing easier.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <img
                src={cityRide}
                alt="Commuter riding an e-bike in the city"
                loading="lazy"
                width={700}
                height={800}
                className="h-[220px] w-full object-cover"
              />
              <img
                src={trailRide}
                alt="Mechanic checking a bicycle wheel"
                loading="lazy"
                width={900}
                height={700}
                className="h-[220px] w-full object-cover"
              />
            </div>
            <ul className="mt-5 space-y-1.5 text-xs text-muted-foreground">
              <li>• The enclosed design reduces air resistance, allowing for greater speeds.</li>
              <li>• Riders sit in a reclined position, which distributes weight evenly.</li>
              <li>
                • They often include storage space, lighting and suspension for smooth travel.
              </li>
              <li>• Some velomobiles are pedal-only, while others come with electric-assist.</li>
              <li>• Though heavier than standard bikes, they are popular among commuters.</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Newsletter */}
      <section className="border-t border-border py-14">
        <div className="mx-auto max-w-[600px] px-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            Our Newsletter
          </span>
          <h2 className="mt-3 text-2xl">Join Our Newsletter</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Subscribe to our latest newsletter to get news about special discounts and upcoming
            sales.
          </p>
          <NewsletterForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-ink">{title}</h3>
      <ul className="mt-2 space-y-1.5">{children}</ul>
    </div>
  );
}
