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
import { filterByCategory } from "@/lib/catalog-filters";
import { safeLoad } from "@/lib/safe-load";
import shopBanner from "@/assets/cta-road.jpg";
import cityRide from "@/assets/service-test.jpg";
import trailRide from "@/assets/about-mechanic.jpg";
import categoryBlueBike from "@/assets/cat-blue-bike.jpg";
import categoryRedBike from "@/assets/cat-red-bike.jpg";
import categorySnowBike from "@/assets/hero-bike-snow.jpg";
import categoryRoadRide from "@/assets/cta-road.jpg";

const categoryImages = [categoryBlueBike, categoryRedBike, categorySnowBike, categoryRoadRide];

const sideMenu = ["Bicycles", "Accessories", "Apparel", "Components", "Services"];

const shopSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["relevance", "price-asc", "price-desc", "name-asc"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: shopSearchSchema,
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
        content: "Bikes, wheels, helmets and drivetrain parts with category filters.",
      },
    ],
  }),
  loader: async (): Promise<{ products: CatalogProduct[]; categories: CatalogCategory[] }> => {
    const [products, categories] = await Promise.all([
      safeLoad([], () => listCatalogProducts()),
      safeLoad([], () => listCatalogCategories()),
    ]);
    return { products, categories };
  },
  component: ShopPage,
});

function ShopPage() {
  const { products, categories } = Route.useLoaderData();
  const { q, category, sort } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const visible = useMemo(() => {
    let list = filterByCategory(products, category);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) || (p.brand ?? "").toLowerCase().includes(needle),
      );
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, sort, q]);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[],
    [products],
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative isolate overflow-hidden bg-secondary">
        <img
          src={shopBanner}
          alt="Road bicycle wheel close up"
          width={1920}
          height={800}
          className="absolute inset-0 size-full object-cover opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-secondary/30" />
        <div className="site-container relative flex min-h-[220px] flex-col justify-center py-10 text-secondary-foreground sm:min-h-[270px]">
          <p className="site-eyebrow !text-accent">Ride farther. Fix less.</p>
          <h1 className="mt-3 max-w-2xl text-4xl tracking-[-.06em] sm:text-6xl">The shop floor.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-secondary-foreground/75">
            Ride-tested bikes, parts with a purpose, and gear picked by people who use it.
          </p>
          <p className="mt-4 text-xs text-secondary-foreground/65">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>{" "}
            / Shop
          </p>
        </div>
      </section>

      <main className="site-container grid gap-8 py-10 lg:grid-cols-[230px_1fr] lg:py-14">
        {/* Sidebar */}
        <aside className="order-2 space-y-8 lg:sticky lg:top-8 lg:order-1 lg:self-start">
          <div>
            <h2 className="border-b border-border pb-3 text-[11px] font-bold uppercase tracking-[.15em] text-ink">
              Shop the range
            </h2>
            <ul className="mt-2">
              {sideMenu.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between border-b border-border/70 py-3 text-xs text-muted-foreground"
                >
                  {item}
                  <Plus className="size-3 text-primary" />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="border-b border-border pb-3 text-[11px] font-bold uppercase tracking-[.15em] text-ink">
              Narrow your search
            </h2>
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink">Categories</h3>
                <ul className="mt-2 space-y-1.5">
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link
                      to="/shop"
                      search={(prev) => ({ ...prev, category: undefined })}
                      className={category ? "hover:text-primary" : "font-bold text-ink"}
                    >
                      Everything ({products.length})
                    </Link>
                  </li>
                  {categories.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Link
                        to="/shop"
                        search={(prev) => ({ ...prev, category: c.slug })}
                        className={
                          category === c.slug ? "font-bold text-ink" : "hover:text-primary"
                        }
                      >
                        {c.name} ({c.count})
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {brands.length ? (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-ink">Brands</h3>
                  <ul className="mt-2 space-y-1.5">
                    {brands.map((brand) => (
                      <li
                        key={brand}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <input type="checkbox" className="size-3 accent-primary" readOnly />
                        {brand}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        {/* Listing */}
        <div className="order-1 min-w-0 lg:order-2">
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Our shelves are edited, not endless. Find the bike for your kind of miles, then add the
            components and kit our mechanics ride themselves.
          </p>

          <h2 className="mt-9 text-[11px] font-bold uppercase tracking-[.15em]">
            Find your terrain
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.slice(0, 4).map((c, index) => (
              <Link
                key={c.name}
                to="/shop"
                search={(prev) => ({ ...prev, category: c.slug })}
                className="group text-center"
              >
                <div className="relative isolate h-28 overflow-hidden border border-border bg-secondary text-left">
                  <img
                    src={categoryImages[index % categoryImages.length]}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-secondary/85 via-secondary/15 to-transparent" />
                  <span className="absolute bottom-3 left-3 font-display text-xs font-semibold text-secondary-foreground">
                    {String(c.count).padStart(2, "0")} in range
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-ink">{c.name}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center bg-secondary text-secondary-foreground">
                <Grid2x2 className="size-4" />
              </span>
              <span className="flex size-8 items-center justify-center border border-border text-muted-foreground">
                <List className="size-4" />
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                {visible.length} products, picked for the ride.
              </span>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Sort by:
              <select
                aria-label="Sort products"
                className="form-control px-3 py-2 text-xs text-ink"
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
            </label>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="mt-8 border border-border bg-surface p-6 text-sm text-muted-foreground">
              Nothing on the shelf matches that filter yet.
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span>
              Showing 1–{visible.length} of {visible.length} item(s)
            </span>
            <div className="flex items-center gap-1">
              <span className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
                1
              </span>
            </div>
          </div>

          {/* Description block */}
          <div className="mt-12 bg-surface p-5 sm:p-7">
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
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
            <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
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
      <section className="border-t border-border bg-card py-14">
        <div className="mx-auto max-w-[600px] px-4 text-center">
          <span className="site-eyebrow">Ride notes</span>
          <h2 className="mt-3 text-3xl tracking-[-.05em]">Good things for the next ride.</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            New arrivals, workshop advice and routes worth getting up early for.
          </p>
          <NewsletterForm />
          <label className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <input type="checkbox" className="accent-primary" />I agree to the terms and conditions
            and the privacy policy
          </label>
        </div>
      </section>

      <Footer />
    </div>
  );
}
