import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, ShoppingBag, Award, Tag } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { gearProducts, partProducts } from "@/data/products";
import heroBike from "@/assets/hero-bike-snow.jpg";
import servicePart from "@/assets/service-part.jpg";
import serviceMaintenance from "@/assets/service-maintenance.jpg";
import serviceRepair from "@/assets/service-repair.jpg";
import serviceTest from "@/assets/service-test.jpg";
import aboutShop from "@/assets/about-shop.jpg";
import aboutMechanic from "@/assets/about-mechanic.jpg";
import ctaRoad from "@/assets/cta-road.jpg";
import catRedBike from "@/assets/cat-red-bike.jpg";
import catBlueBike from "@/assets/cat-blue-bike.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pathway Bike Shop — E-Bikes, Parts & Full Service Repairs" },
      {
        name: "description",
        content:
          "Pathway is a full service bike shop: city e-bikes, road bikes, premium parts, accessories and expert repairs by certified mechanics.",
      },
      { property: "og:title", content: "Pathway Bike Shop — E-Bikes, Parts & Full Service" },
      {
        property: "og:description",
        content:
          "Shop city e-bikes, gear and bicycle parts, and book expert maintenance at the Pathway repair workshop.",
      },
    ],
  }),
  component: Index,
});

const services = [
  { title: "Part Replacement", image: servicePart },
  { title: "Bike Maintenance", image: serviceMaintenance },
  { title: "Damage Repairing", image: serviceRepair },
  { title: "E-Bike Test", image: serviceTest },
];

const features = [
  { icon: Bike, title: "Best Bikes In City", text: "A carefully picked range built for every road and every rider." },
  { icon: ShoppingBag, title: "Clothing & Gear", text: "Helmets, jerseys and protection from the brands we trust." },
  { icon: Award, title: "Experience", text: "Over twenty years of wrenching, fitting and building bikes." },
  { icon: Tag, title: "No Charges", text: "Free tune-up checks on every bike bought in our store." },
];

const testimonials = [
  {
    name: "Leslie Alexander",
    role: "Customer",
    text: "They stripped, cleaned and rebuilt my entire drivetrain in a single day. The bike shifts like it did the week I bought it.",
  },
  {
    name: "Cristofer Bailey",
    role: "Customer",
    text: "Honest advice, fair prices and nobody upsells you. I have sent half of my riding club here already.",
  },
];

const brands = ["Cycling", "One Biker's", "Biking", "Bicycle", "Go Cycling"];

const gallery = [
  { title: "How To Write A Blog Post Your Readers Will Love In 5 Steps", image: serviceRepair },
  { title: "9 Content Marketing Trends And Ideas Worth Trying", image: serviceMaintenance },
  { title: "The Ultimate Guide To Marketing Strategies For Your Store", image: servicePart },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative">
          <img
            src={heroBike}
            alt="City e-bike standing in fresh snow with mountains behind"
            width={1920}
            height={900}
            className="h-[380px] w-full object-cover md:h-[520px]"
          />
          <div className="absolute inset-0 bg-ink/45" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-ink-foreground/80">
              Cyclocross / Hybrid Bike
            </span>
            <h1 className="max-w-3xl text-3xl leading-tight text-ink-foreground md:text-5xl">
              Here You Find Right
              <br /> City E-Bike
            </h1>
            <Link to="/shop" className="btn-brand mt-7">
              Shop Now
            </Link>
          </div>
        </section>

        {/* Services */}
        <section className="bg-surface py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="mb-10 flex flex-col items-center text-center">
              <span className="section-label">Our Services</span>
              <h2 className="mt-3 text-2xl md:text-3xl">Full Service Shop</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <article key={s.title} className="group relative overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    width={700}
                    height={800}
                    className="h-[240px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                      — Bike Service
                    </span>
                    <h3 className="mt-1 text-base text-ink-foreground">{s.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            <span className="section-label">About Us</span>
            <h2 className="mt-3 max-w-md text-2xl leading-snug md:text-3xl">
              We Are The Best Shop & Repair Bicycles
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
              <img
                src={aboutShop}
                alt="Rows of bicycles inside the Pathway shop"
                loading="lazy"
                width={1000}
                height={700}
                className="h-full w-full object-cover"
              />
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Our workshop is run by mechanics who ride every day. We service everything from
                    entry-level commuters to carbon race bikes, and every repair leaves the stand
                    with a full safety check. Bring the bike in, tell us how it rides, and we will
                    tell you exactly what it needs — nothing more.
                  </p>
                  <Link to="/shop" className="btn-brand mt-6">
                    Read More
                  </Link>
                </div>
                <img
                  src={aboutMechanic}
                  alt="Mechanic repairing a bicycle on a workstand"
                  loading="lazy"
                  width={900}
                  height={700}
                  className="h-[260px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Gear grid */}
        <section className="pb-16">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="mb-10 flex flex-col items-center text-center">
              <span className="section-label">Parts & Accessories</span>
              <h2 className="mt-3 text-2xl md:text-3xl">Shop Gear & Accessories</h2>
            </div>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {gearProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="relative">
          <img
            src={ctaRoad}
            alt="Cyclist riding a road bike at speed"
            loading="lazy"
            width={1920}
            height={800}
            className="h-[340px] w-full object-cover md:h-[430px]"
          />
          <div className="absolute inset-0 bg-ink/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-ink-foreground/80">
              Exclusive Bicycle
            </span>
            <h2 className="max-w-3xl text-2xl leading-tight text-ink-foreground md:text-4xl">
              Unleash The Thrill Of
              <br /> The Open Road!
            </h2>
            <Link to="/shop" className="btn-brand mt-7">
              Shop Now
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="text-center">
                <f.icon className="mx-auto size-8 text-ink" />
                <h3 className="mt-4 text-base">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Category cards */}
        <section className="pb-16">
          <div className="mx-auto grid max-w-[1200px] gap-6 px-4 md:grid-cols-2">
            {[
              { label: "New Collection", title: "Strattos S3 Bicycle", image: catRedBike },
              { label: "Best Seller", title: "Grd Bicycle 7 Speed Gear", image: catBlueBike },
            ].map((c) => (
              <article
                key={c.title}
                className="flex items-center justify-between gap-4 bg-surface p-8"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    {c.label}
                  </span>
                  <h3 className="mt-2 max-w-[10ch] text-xl leading-snug">{c.title}</h3>
                  <Link to="/shop" className="btn-brand mt-5">
                    Shop Now
                  </Link>
                </div>
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  width={900}
                  height={600}
                  className="w-1/2 object-contain"
                />
              </article>
            ))}
          </div>
        </section>

        {/* Bicycle parts */}
        <section className="pb-16">
          <div className="mx-auto max-w-[1200px] px-4">
            <h2 className="mb-10 text-center text-2xl md:text-3xl">Shop Bicycle Parts</h2>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {partProducts.map((p) => (
                <ProductCard key={`part-${p.id}`} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-surface py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <span className="section-label">Our Testimonials</span>
                <h2 className="mt-3 max-w-[14ch] text-2xl leading-snug md:text-3xl">
                  See What They Said About Client
                </h2>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                {testimonials.map((t) => (
                  <figure key={t.name}>
                    <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                      {t.name.charAt(0)}
                    </div>
                    <figcaption className="text-sm font-semibold text-ink">
                      {t.name}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        — {t.role}
                      </span>
                    </figcaption>
                    <blockquote className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      “{t.text}”
                    </blockquote>
                  </figure>
                ))}
              </div>
            </div>
            <div className="mt-14 grid grid-cols-2 items-center gap-8 opacity-40 md:grid-cols-5">
              {brands.map((b) => (
                <span
                  key={b}
                  className="text-center font-display text-lg font-bold uppercase tracking-wide text-ink"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-4">
            <h2 className="mb-10 text-center text-2xl md:text-3xl">From The Gallery</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {gallery.map((g) => (
                <article key={g.title} className="group">
                  <img
                    src={g.image}
                    alt={g.title}
                    loading="lazy"
                    width={700}
                    height={800}
                    className="h-[220px] w-full object-cover"
                  />
                  <h3 className="mt-4 text-sm leading-snug transition-colors group-hover:text-primary">
                    {g.title}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
