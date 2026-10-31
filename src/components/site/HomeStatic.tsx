import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Bike,
  Check,
  Clock3,
  Compass,
  MapPin,
  Wrench,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import type { CatalogProduct } from "@/lib/catalog";
import type { ReviewRow } from "@/integrations/turso/reviews.functions";
import heroBike from "@/assets/hero-bike-snow.jpg";
import serviceRepair from "@/assets/service-repair.jpg";
import serviceMaintenance from "@/assets/service-maintenance.jpg";
import serviceTest from "@/assets/service-test.jpg";
import aboutShop from "@/assets/about-shop.jpg";
import aboutMechanic from "@/assets/about-mechanic.jpg";
import ctaRoad from "@/assets/cta-road.jpg";
import catRedBike from "@/assets/cat-red-bike.jpg";
import catBlueBike from "@/assets/cat-blue-bike.jpg";

/**
 * The designed homepage. Catalogue and review content arrive as props; the
 * layout, copy and artwork are the design as delivered.
 */
export function HomeStatic({
  products,
  reviews,
}: {
  products: CatalogProduct[];
  reviews: ReviewRow[];
}) {
  const gear = products.slice(0, 4);
  const parts = products.slice(4, 8);
  const quotes = reviews.length
    ? reviews.slice(0, 2).map((r) => ({ name: r.author, quote: r.body }))
    : [
        {
          name: "Leslie Alexander",
          quote:
            "They stripped, cleaned and rebuilt my entire drivetrain in a single day. The bike shifts like it did the week I bought it.",
        },
        {
          name: "Cristofer Bailey",
          quote:
            "Honest advice, fair prices and nobody upsells you. I have sent half of my riding club here already.",
        },
      ];

  const workshopOffers = [
    {
      icon: Wrench,
      name: "The quick check",
      time: "From 30 minutes",
      detail:
        "Safety check, brake and gear adjustment, tire pressure. A solid start to the season.",
      price: "$45",
    },
    {
      icon: Clock3,
      name: "The full tune",
      time: "Drop off for the day",
      detail: "A full clean, drivetrain service, wheel true, and careful adjustment end to end.",
      price: "$110",
    },
    {
      icon: Compass,
      name: "The custom build",
      time: "By consultation",
      detail:
        "A bike built around your routes, your fit, and the things you want to do more often.",
      price: "Let’s talk",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />
      <main>
        <section className="overflow-hidden bg-background">
          <div className="site-container grid min-h-[610px] items-center gap-10 py-10 md:grid-cols-[.9fr_1.1fr] md:py-14">
            <div className="relative z-10 py-5">
              <div className="mb-7 flex items-center gap-3">
                <span className="h-px w-9 bg-primary" />
                <p className="site-eyebrow">Independent bike shop · Est. 2012</p>
              </div>
              <h1 className="max-w-[620px] font-display text-[clamp(3.5rem,7vw,6.7rem)] font-semibold leading-[.91] tracking-[-.075em] text-ink">
                The long way
                <br />
                <span className="text-secondary">is the</span>{" "}
                <span className="italic text-primary">right</span>
                <br />
                way.
              </h1>
              <p className="mt-7 max-w-[425px] text-[15px] leading-7 text-muted-foreground sm:text-base">
                Bikes chosen by people who ride them. Parts that earn their place. A workshop that
                knows the difference between a quick fix and a good one.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/shop" className="btn-brand">
                  Find your next bike <ArrowUpRight className="ml-2 size-4" />
                </Link>
                <a
                  className="inline-flex min-h-12 items-center gap-2 px-2 text-xs font-bold uppercase tracking-[.1em] text-secondary transition-colors hover:text-primary"
                  href="#workshop"
                >
                  Meet the workshop <ArrowRight className="size-4" />
                </a>
              </div>
              <div className="mt-12 flex items-center gap-4 border-t border-border pt-5">
                <span className="flex size-10 items-center justify-center rounded-full border border-secondary/30 text-secondary">
                  <Compass className="size-[18px]" />
                </span>
                <p className="text-xs leading-5 text-muted-foreground">
                  <strong className="block font-semibold text-ink">
                    Made for the miles ahead.
                  </strong>
                  Real advice, right here in Union Trade Center.
                </p>
              </div>
            </div>
            <div className="relative min-h-[390px] overflow-hidden bg-surface md:min-h-[520px]">
              <img
                src={heroBike}
                alt="A capable city bicycle ready for a winter ride"
                width={1920}
                height={900}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-ink-foreground sm:bottom-8 sm:left-8 sm:right-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">
                    Tested beyond the pavement
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-.04em] sm:text-2xl">
                    Keep going, whatever the weather.
                  </p>
                </div>
                <a
                  href="#bikes"
                  aria-label="Explore bikes"
                  className="flex size-11 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-transform hover:-translate-y-1"
                >
                  <ArrowUpRight className="size-5" />
                </a>
              </div>
              <span className="absolute right-0 top-8 hidden -translate-y-1/3 translate-x-1/4 rotate-90 bg-accent px-4 py-2 text-[9px] font-bold uppercase tracking-[.2em] text-secondary md:block">
                Pathway field notes · 01
              </span>
            </div>
          </div>
        </section>

        <div className="border-y border-border bg-surface">
          <div className="site-container grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            {[
              ["01", "Ride-tested bikes"],
              ["02", "Workshop on site"],
              ["03", "Advice without jargon"],
              ["04", "Built for real life"],
            ].map(([n, label]) => (
              <div
                key={n}
                className="flex min-h-[76px] items-center gap-3 px-4 py-4 sm:justify-center"
              >
                <span className="font-display text-xs font-bold text-primary">{n}</span>
                <span className="text-[9px] font-bold uppercase tracking-[.11em] text-ink sm:text-[11px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <section id="bikes" className="site-section">
          <div className="site-container">
            <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="site-eyebrow">Choose your kind of outside</p>
                <h2 className="mt-3 max-w-[620px] text-[clamp(2rem,4vw,3rem)] leading-[1.04] tracking-[-.045em]">
                  A good bike changes the shape of a day.
                </h2>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 pb-2 text-sm font-semibold text-ink hover:text-primary"
              >
                Shop all bikes <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-[1.18fr_.82fr]">
              <Link
                to="/shop"
                className="group relative min-h-[370px] overflow-hidden bg-surface sm:min-h-[470px]"
              >
                <img
                  src={catRedBike}
                  alt="Red adventure bicycle from Pathway's all-road collection"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/5 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-ink-foreground sm:p-9">
                  <p className="site-eyebrow !text-accent">Go where the map gets quiet</p>
                  <h3 className="mt-3 text-3xl tracking-[-.055em] sm:text-4xl">
                    All-road &amp; gravel
                  </h3>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em]">
                    Explore the collection{" "}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-1">
                <Link
                  to="/shop"
                  className="group relative min-h-[220px] overflow-hidden bg-surface sm:min-h-[255px]"
                >
                  <img
                    src={catBlueBike}
                    alt="Blue everyday bicycle for urban rides"
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/85 to-transparent" />
                  <div className="absolute bottom-5 left-5 text-ink-foreground">
                    <p className="text-[9px] font-bold uppercase tracking-[.16em] text-accent">
                      For the everyday miles
                    </p>
                    <h3 className="mt-1 text-2xl tracking-[-.04em]">City &amp; commute</h3>
                  </div>
                  <ArrowUpRight className="absolute bottom-5 right-5 size-5 text-white transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </Link>
                <div className="flex min-h-[185px] flex-col justify-between bg-secondary p-6 text-secondary-foreground sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="site-eyebrow !text-accent">Not sure where to start?</p>
                      <h3 className="mt-3 max-w-[300px] text-2xl leading-tight tracking-[-.05em] sm:text-[27px]">
                        We’ll help you find your fit.
                      </h3>
                    </div>
                    <Award className="mt-1 size-6 shrink-0 text-accent" />
                  </div>
                  <Link
                    to="/shop"
                    className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-accent"
                  >
                    Talk to a real rider <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="gear" className="site-section bg-card">
          <div className="site-container">
            <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="site-eyebrow">The good stuff</p>
                <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] leading-[1.04] tracking-[-.045em]">
                  Small upgrades. Better rides.
                </h2>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 pb-2 text-sm font-semibold text-ink hover:text-primary"
              >
                Shop parts &amp; gear <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-4">
              {gear.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section id="workshop" className="bg-secondary text-secondary-foreground">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[350px] md:min-h-[560px]">
              <img
                src={serviceRepair}
                alt="A Pathway mechanic carefully repairing a bicycle in the workshop"
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 to-transparent" />
              <div className="absolute bottom-6 left-6 border-l-2 border-primary pl-4 sm:bottom-8 sm:left-8">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-accent">
                  The hands behind the miles
                </p>
                <p className="mt-1 font-display text-xl font-semibold">Good work, no shortcuts.</p>
              </div>
            </div>
            <div className="flex items-center px-6 py-14 sm:px-10 md:px-[clamp(40px,7vw,100px)] md:py-20">
              <div className="max-w-[510px]">
                <p className="site-eyebrow !text-accent">The Pathway workshop</p>
                <h2 className="mt-4 text-[clamp(2.5rem,5vw,3.8rem)] leading-[.98] tracking-[-.065em]">
                  Your bike deserves a proper mechanic.
                </h2>
                <p className="mt-5 max-w-[430px] text-sm leading-7 text-secondary-foreground/75">
                  From the first tune-up to the mystery click you’ve been ignoring, our mechanics
                  explain the work, price it clearly, and get you back out there.
                </p>
                <div className="mt-7 space-y-3 border-y border-secondary-foreground/15 py-5">
                  {[
                    "Repairs for every kind of bike",
                    "Clear estimates before we start",
                    "Parts chosen for the way you ride",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-secondary-foreground/90"
                    >
                      <span className="flex size-5 items-center justify-center bg-accent text-secondary">
                        <Check className="size-3.5" />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
                <Link to="/shop" className="btn-brand mt-7">
                  Talk to the workshop <ArrowUpRight className="ml-2 size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="site-section">
          <div className="site-container">
            <div className="mb-8">
              <p className="site-eyebrow">Service, straight up</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] leading-[1.04] tracking-[-.045em]">
                The right care at the right time.
              </h2>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-3">
              {workshopOffers.map(({ icon: Icon, name, time, detail, price }, index) => (
                <article
                  key={name}
                  className="flex min-h-[280px] flex-col bg-background p-6 sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center bg-surface text-secondary">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-display text-xs font-semibold text-primary">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">
                    {time}
                  </p>
                  <h3 className="mt-1 text-xl tracking-[-.04em]">{name}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{detail}</p>
                  <Link
                    to="/shop"
                    className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-bold uppercase tracking-[.1em]"
                  >
                    <span>{price}</span>
                    <span className="flex items-center gap-2 text-secondary">
                      Ask about service <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="visit" className="site-section bg-card">
          <div className="site-container grid items-center gap-10 md:grid-cols-[1fr_.9fr]">
            <div className="relative min-h-[300px] overflow-hidden sm:min-h-[380px]">
              <img
                src={aboutShop}
                alt="Inside the Pathway Cycle Supply shop, with bikes ready to ride"
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
              <span className="absolute bottom-4 left-4 bg-background px-3 py-2 text-[9px] font-bold uppercase tracking-[.16em] text-secondary">
                Union Trade Center · Find us on the way
              </span>
            </div>
            <div className="md:pl-8">
              <p className="site-eyebrow">A shop built around riding</p>
              <h2 className="mt-3 text-[clamp(2.25rem,4.8vw,3.5rem)] leading-[1.02] tracking-[-.06em]">
                Come in with a question. Leave with a plan.
              </h2>
              <p className="mt-5 max-w-[470px] text-sm leading-7 text-muted-foreground">
                We’re riders, mechanics, and the people who’ll help you get the right thing—not just
                the most expensive thing. Drop by, tell us where you want to go.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-5">
                <Link to="/shop" className="btn-brand">
                  Explore the shop <ArrowUpRight className="ml-2 size-4" />
                </Link>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="size-4 text-primary" />
                  507 Union Trade Center
                </span>
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
                <img
                  src={aboutMechanic}
                  alt=""
                  loading="lazy"
                  className="size-12 rounded-full object-cover"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  <strong className="block text-ink">Real people. Useful answers.</strong>Meet the
                  crew who keep Pathway rolling.
                </p>
                <Bike className="ml-auto size-5 text-secondary" />
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-accent">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block">
            <img
              src={ctaRoad}
              alt=""
              loading="lazy"
              className="size-full object-cover opacity-70 mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/50 to-transparent" />
          </div>
          <div className="site-container relative z-10 flex flex-col items-start justify-between gap-7 py-12 sm:flex-row sm:items-center sm:py-16">
            <div className="max-w-[620px]">
              <p className="site-eyebrow">Ready when you are</p>
              <h2 className="mt-2 text-[clamp(2.1rem,5vw,3.5rem)] leading-[.98] tracking-[-.065em] text-secondary">
                Your next good ride starts here.
              </h2>
              <p className="mt-3 text-sm text-ink/75">
                Shop a bike, ask a mechanic, or just come say hello.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-secondary px-5 text-xs font-bold uppercase tracking-[.1em] text-secondary-foreground transition-transform hover:-translate-y-0.5"
            >
              Shop bikes <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="site-section">
          <div className="site-container grid items-start gap-10 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <p className="site-eyebrow">Good people, good miles</p>
              <h2 className="mt-3 max-w-[14ch] text-[clamp(2rem,4vw,3rem)] leading-[1.04] tracking-[-.045em]">
                The best bit is hearing where you went.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
                We take our time with every build, tune, and recommendation. These are the rides
                that make it worthwhile.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {quotes.map((review) => (
                <figure key={review.name} className="border-t-2 border-primary pt-5">
                  <p className="font-display text-lg leading-snug tracking-[-.025em]">
                    “{review.quote}”
                  </p>
                  <figcaption className="mt-6 text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">
                    {review.name}
                    <span className="ml-2 font-normal normal-case tracking-normal">
                      · Pathway rider
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card py-12">
          <div className="site-container flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="site-eyebrow">More for the next ride</p>
              <h2 className="mt-2 text-2xl tracking-[-.04em]">Parts we’d put on our own bikes.</h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
            >
              Browse components <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="site-container mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-4">
            {parts.map((product) => (
              <ProductCard key={`part-${product.id}`} product={product} />
            ))}
          </div>
          <div className="site-container mt-8 flex justify-center">
            <img
              src={serviceMaintenance}
              alt="Pathway mechanic carefully servicing a bicycle"
              loading="lazy"
              className="hidden h-48 w-full max-w-4xl object-cover md:block"
            />
            <img
              src={serviceTest}
              alt="A bicycle undergoing a careful workshop inspection"
              loading="lazy"
              className="h-40 w-full object-cover md:hidden"
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
