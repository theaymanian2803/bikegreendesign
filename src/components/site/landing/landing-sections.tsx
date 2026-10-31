import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Award, Bike, Heart, Plus, ShoppingBag, Star, Tag } from "lucide-react";

import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import type { ReviewRow } from "@/integrations/turso/reviews.functions";
import type {
  AboutSection,
  CategoriesSection as LiveCategoriesSection,
  CategoryCardsSection,
  CtaSection,
  FeaturesSection,
  GallerySection,
  HeroSection,
  PageLandingSection,
  ProductRowSection,
  ProductRowConfig,
  ReviewsSection as LiveReviewsSection,
  ServicesSection,
  TestimonialsSection,
} from "@/lib/landing";

const featureIcons = {
  bike: Bike,
  "shopping-bag": ShoppingBag,
  award: Award,
  tag: Tag,
};

const PAPER = "bg-[#E9EAE4]";
const INK = "bg-[#171A17]";
const SIGNAL = "#FF4D00";
const MEASURE = "#2B4C7E";

function CtaLink({
  label,
  href,
  className = "",
}: {
  label: string;
  href: string;
  className?: string;
}) {
  if (!label.trim() || !href.trim()) return null;
  return (
    <a
      href={href}
      className={`inline-flex h-14 items-center justify-center gap-2 border border-[#171A17] px-7 font-spec text-[13px] font-bold uppercase tracking-[0.12em] text-[#171A17] transition-colors duration-200 hover:bg-[#171A17] hover:text-[#E9EAE4] sm:justify-start ${className}`}
      style={{ backgroundColor: SIGNAL }}
    >
      {label}
      <ArrowUpRight className="size-4" />
    </a>
  );
}

function SheetHeading({
  label,
  title,
  note,
  dark = false,
}: {
  label: string;
  title: string;
  note?: string;
  dark?: boolean;
}) {
  const ink = dark ? "text-[#E9EAE4]" : "text-[#171A17]";
  const muted = dark ? "text-[#E9EAE4]/70" : "text-[#171A17]/70";
  const rule = dark ? "border-[#E9EAE4]/25" : "border-[#171A17]/25";

  return (
    <div className={`border-t ${rule} pt-6`}>
      <div className="grid gap-5 md:grid-cols-[1fr_minmax(0,380px)] md:items-end">
        <h2
          className={`font-poster text-[clamp(2rem,3.7vw,3.1rem)] uppercase leading-[0.9] tracking-[-0.015em] ${ink}`}
        >
          {title}
        </h2>
        {note ? <p className={`max-w-[40ch] text-[15px] leading-[1.65] ${muted}`}>{note}</p> : null}
      </div>
      <div
        className={`mt-5 flex items-center justify-between gap-4 font-spec text-[10px] uppercase tracking-[0.18em] ${muted}`}
      >
        <span>{label}</span>
        <span>Pathway / Workshop sheet</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

function HeroBlock({ section }: { section: HeroSection }) {
  return (
    <section className={`relative overflow-hidden ${PAPER} text-[#171A17]`}>
      <div className="relative mx-auto max-w-[1440px] px-5 pb-0 pt-6 md:px-10 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 font-spec text-[10px] uppercase tracking-[0.18em] text-[#171A17]/70">
          <span>Pathway / Workshop sheet 01</span>
          <span>{section.subtitle || "City / Trail / Workshop"}</span>
          <span className="hidden sm:inline">Framed, fitted, serviced</span>
        </div>

        <div className="grid gap-10 py-8 md:grid-cols-12 md:gap-10 md:py-14">
          <div className="flex flex-col justify-start md:col-span-6 lg:col-span-6">
            <div>
              <h1 className="max-w-[13ch] whitespace-pre-line font-poster text-[clamp(3.2rem,6vw,6.2rem)] uppercase leading-[0.95] tracking-[-0.02em] text-[#171A17] sm:max-w-[18ch] sm:leading-[0.85] lg:leading-[0.82]">
                {section.title.replace(/\s+/g, " ") || "Built to be ridden"}
              </h1>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.7] text-[#171A17]/80">
                City e-bikes, trail machines, parts and workshop service. Every bike is assembled,
                fitted and checked by certified mechanics before it leaves the stand.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <CtaLink
                label={section.config.ctaLabel || "Shop the collection"}
                href={section.config.ctaHref || "/shop"}
              />
              <Link
                to="/shop"
                className="inline-flex h-14 items-center justify-center gap-2 border border-[#171A17]/40 px-7 font-spec text-[13px] font-bold uppercase tracking-[0.12em] text-[#171A17] transition-colors hover:border-[#171A17] hover:bg-[#171A17] hover:text-[#E9EAE4]"
              >
                Browse the shop
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-6">
            <figure className="relative border border-[#171A17] bg-[#DDE0D7] p-2.5 md:p-3">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#D6D9D0]">
                {section.imageUrl ? (
                  <img
                    src={section.imageUrl}
                    alt=""
                    width={1400}
                    height={1050}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Bike className="size-16 text-[#171A17]/20" />
                  </div>
                )}
                <span className="absolute left-0 top-0 bg-[#171A17] px-2 py-1 font-spec text-[10px] uppercase tracking-[0.16em] text-[#E9EAE4]">
                  Fig. 01
                </span>
              </div>
              <figcaption className="mt-4 flex items-center justify-between gap-4 font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/70">
                <span>{section.subtitle || "Workshop plate"}</span>
                <span>Pathway / City line</span>
              </figcaption>
              <div className="mt-3 grid grid-cols-3 gap-2 font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/70">
                <span>Frame / 01</span>
                <span className="text-center">Fit / checked</span>
                <span className="text-right">City line</span>
              </div>
            </figure>
          </div>
        </div>

        <div className="mt-6 grid gap-4 pb-8 sm:grid-cols-3">
          {["Free delivery over $300", "30-day returns", "Certified mechanics"].map(
            (label, index) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 py-3 font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/75"
              >
                <span>{label}</span>
                <span style={{ color: MEASURE }}>0{index + 1}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

function ServicesBlock({ section }: { section: ServicesSection }) {
  return (
    <section className={`${INK} py-12 text-[#E9EAE4] md:py-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label="Service / Work orders"
          title={section.title || "Full Service Shop"}
          note={section.subtitle}
          dark
        />

        <div className="mt-10">
          {section.config.items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="group grid grid-cols-[42px_1fr_28px] items-start gap-5 py-6 transition-colors hover:bg-[#E9EAE4]/5 md:grid-cols-[64px_104px_1fr_36px] md:items-center md:gap-8 md:py-8"
            >
              <span className="font-spec text-[10px] uppercase tracking-[0.16em] text-[#E9EAE4]/75">
                W-{String(index + 1).padStart(2, "0")}
              </span>

              <div className="hidden h-24 w-24 overflow-hidden md:block">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    width={240}
                    height={240}
                    className="h-full w-full object-cover grayscale-[25%] transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>

              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-poster text-2xl uppercase leading-none tracking-[0.01em] md:text-3xl">
                    {item.title}
                  </h3>
                  {item.label ? (
                    <span className="font-spec text-[10px] uppercase tracking-[0.16em] text-[#E9EAE4]/75">
                      {item.label}
                    </span>
                  ) : null}
                </div>
                {item.description ? (
                  <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.7] text-[#E9EAE4]/75">
                    {item.description}
                  </p>
                ) : null}
              </div>

              <ArrowUpRight className="size-5 text-[#E9EAE4]/35 transition-colors group-hover:text-[#FF4D00]" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* About                                                                       */
/* -------------------------------------------------------------------------- */

function AboutBlock({ section }: { section: AboutSection }) {
  return (
    <section className={`${PAPER} py-12 text-[#171A17] md:py-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label="Workshop / About"
          title={section.title || "Inside the workshop"}
          note={section.subtitle}
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <figure className="relative bg-[#DDE0D7]">
              {section.imageUrl ? (
                <img
                  src={section.imageUrl}
                  alt=""
                  loading="lazy"
                  width={1200}
                  height={900}
                  className="aspect-[5/4] w-full object-cover"
                />
              ) : (
                <div className="aspect-[5/4] w-full bg-[#D6D9D0]" />
              )}
              <figcaption className="mt-4 flex items-center justify-between font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/70">
                <span>Fig. 02 / The bench</span>
                <span>Pathway workshop</span>
              </figcaption>
            </figure>
          </div>

          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <p className="max-w-[48ch] text-[17px] leading-[1.7] text-[#171A17]/80">
                {section.config.body}
              </p>
              {section.config.ctaLabel ? (
                <div className="mt-7">
                  <CtaLink
                    label={section.config.ctaLabel}
                    href={section.config.ctaHref || "/shop"}
                  />
                </div>
              ) : null}
            </div>

            {section.config.secondaryImage ? (
              <figure className="mt-10 bg-[#DDE0D7]">
                <img
                  src={section.config.secondaryImage}
                  alt=""
                  loading="lazy"
                  width={900}
                  height={600}
                  className="aspect-[3/2] w-full object-cover"
                />
                <figcaption className="mt-3 font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/70">
                  Detail / hand-finished
                </figcaption>
              </figure>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Product row / parts wall                                                    */
/* -------------------------------------------------------------------------- */

function PartsCard({
  product,
  index,
  featured = false,
}: {
  product: CatalogProduct;
  index: number;
  featured?: boolean;
}) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(product.id);

  return (
    <article
      className={`group relative flex h-full flex-col ${
        featured ? "md:grid md:grid-cols-[1.15fr_1fr] md:gap-10" : ""
      }`}
    >
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative overflow-hidden bg-[#F4F4EF]">
          {product.badge ? (
            <span className="absolute left-0 top-0 z-10 bg-[#171A17] px-2 py-1 font-spec text-[10px] uppercase tracking-[0.12em] text-[#E9EAE4]">
              {product.badge}
            </span>
          ) : null}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
              featured ? "aspect-[16/9]" : "aspect-square"
            }`}
          />
          <span className="absolute bottom-0 right-0 bg-[#E9EAE4] px-2 py-1 font-spec text-[10px] uppercase tracking-[0.12em] text-[#171A17]/75">
            P-{String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </Link>

      <div
        className={
          featured
            ? "flex flex-1 flex-col gap-6 pt-4 md:justify-center md:pt-3"
            : "flex flex-1 flex-col pt-3"
        }
      >
        <div>
          <div className="flex items-center justify-between gap-3 font-spec text-[10px] uppercase tracking-[0.14em] text-[#171A17]/70">
            <span>{product.brand || product.category || "Pathway"}</span>
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-[#171A17] text-[#171A17]" />
              {product.rating}.0
            </span>
          </div>
          <Link to="/product/$id" params={{ id: product.id }} className="mt-1 block">
            <h3
              className={`font-sans font-semibold leading-snug text-[#171A17] transition-colors group-hover:text-[#FF4D00] ${
                featured ? "text-xl md:text-2xl" : "line-clamp-2 min-h-[2.8em] text-[15px]"
              }`}
            >
              {product.name}
            </h3>
          </Link>

          {featured ? (
            <div className="mt-4 space-y-3">
              {product.description ? (
                <p className="line-clamp-3 max-w-[44ch] text-[15px] leading-[1.7] text-[#171A17]/75">
                  {product.description}
                </p>
              ) : null}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 pt-4 font-spec text-[10px] uppercase tracking-[0.12em]">
                {product.category ? (
                  <>
                    <dt className="text-[#171A17]/70">Category</dt>
                    <dd className="text-right text-[#171A17]/75">{product.category}</dd>
                  </>
                ) : null}
                {product.sku ? (
                  <>
                    <dt className="text-[#171A17]/70">SKU</dt>
                    <dd className="text-right text-[#171A17]/75">{product.sku}</dd>
                  </>
                ) : null}
                <dt className="text-[#171A17]/70">Rating</dt>
                <dd className="text-right text-[#171A17]/75">{product.rating}.0 / 5</dd>
              </dl>
            </div>
          ) : null}
        </div>

        <div
          className={`flex items-end justify-between gap-3 ${featured ? "mt-3" : "mt-auto pt-3"}`}
        >
          <div className="flex items-baseline gap-2">
            <span className="font-poster text-[26px] leading-none text-[#171A17]">
              ${product.price.toFixed(2)}
            </span>
            {product.oldPrice ? (
              <span className="font-spec text-[11px] text-[#171A17]/75 line-through">
                ${product.oldPrice.toFixed(2)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggle(product)}
              aria-label={saved ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={saved}
              className="flex size-10 items-center justify-center border border-[#171A17]/25 text-[#171A17] transition-colors hover:border-[#171A17] hover:bg-[#171A17] hover:text-[#E9EAE4]"
            >
              <Heart className={`size-4 ${saved ? "fill-[#FF4D00] text-[#FF4D00]" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() =>
                add({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                })
              }
              aria-label={`Add ${product.name} to cart`}
              className="flex size-10 items-center justify-center border border-[#171A17] text-[#171A17] transition-colors hover:bg-[#FF4D00]"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductRowBlock({
  section,
  products,
}: {
  section: ProductRowSection;
  products: CatalogProduct[];
}) {
  const items = pickProducts(products, section.config);
  const gear = /gear|accessor/i.test(section.title);

  return (
    <section className={`${PAPER} py-12 text-[#171A17] md:py-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label={gear ? "Range / Gear & accessories" : "Range / Bikes & parts"}
          title={section.title || "Shop the range"}
          note={section.subtitle}
        />

        {items.length === 0 ? (
          <p className="mt-8 font-spec text-[10px] uppercase tracking-[0.18em] text-[#171A17]/70">
            No products match this sheet yet.
          </p>
        ) : gear && items.length > 1 ? (
          <div className="mt-8 space-y-10">
            <PartsCard product={items[0]} index={0} featured />
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
              {items.slice(1).map((product, index) => (
                <PartsCard key={product.id} product={product} index={index + 1} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product, index) => (
              <PartsCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 py-2 font-spec text-[12px] font-bold uppercase tracking-[0.12em] text-[#171A17] transition-colors hover:text-[#FF4D00]"
          >
            Shop all
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* CTA                                                                         */
/* -------------------------------------------------------------------------- */

function CtaBlock({ section }: { section: CtaSection }) {
  return (
    <section className={`${PAPER} pb-12 pt-2 text-[#171A17] md:pb-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid bg-[#171A17] text-[#E9EAE4] lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-12 p-8 md:p-12">
            <div>
              <div className="flex items-center justify-between font-spec text-[10px] uppercase tracking-[0.16em] text-[#E9EAE4]/70">
                <span>Pathway / Workshop note</span>
                <span>Fig. 03</span>
              </div>
              <h2 className="mt-6 max-w-[14ch] whitespace-pre-line font-poster text-[clamp(2.4rem,5vw,5rem)] uppercase leading-[0.86] tracking-[-0.015em]">
                {section.title || "Ride with us"}
              </h2>
              {section.subtitle ? (
                <p className="mt-6 max-w-[44ch] text-[16px] leading-[1.7] text-[#E9EAE4]/80">
                  {section.subtitle}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <CtaLink
                label={section.config.ctaLabel || "Shop the collection"}
                href={section.config.ctaHref || "/shop"}
              />
              <span className="font-spec text-[10px] uppercase tracking-[0.16em] text-[#E9EAE4]/75">
                Fitted in the workshop
              </span>
            </div>
          </div>

          <div className="relative min-h-[280px] border-t border-[#E9EAE4]/20 lg:border-l lg:border-t-0">
            {section.imageUrl ? (
              <img
                src={section.imageUrl}
                alt=""
                loading="lazy"
                width={1200}
                height={900}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[#2A2E29]" />
            )}
            <span className="absolute left-5 top-5 bg-[#E9EAE4] px-2 py-1 font-spec text-[10px] uppercase tracking-[0.14em] text-[#171A17]">
              Ride / 03
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Features / standards                                                        */
/* -------------------------------------------------------------------------- */

function FeaturesBlock({ section }: { section: FeaturesSection }) {
  return (
    <section className={`${PAPER} py-12 text-[#171A17] md:py-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label="Standards / Service promise"
          title={section.title || "The workshop standard"}
          note={section.subtitle}
        />

        <div className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {section.config.items.map((item, index) => {
            const Icon = featureIcons[item.icon] ?? Bike;
            return (
              <div key={`${item.title}-${index}`} className={`py-0 ${""}`}>
                <div className="flex items-center justify-between font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/70">
                  <span>ST-{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="size-4 text-[#FF4D00]" />
                </div>
                <h3 className="mt-5 font-poster text-xl uppercase leading-none">{item.title}</h3>
                <p className="mt-3 max-w-[32ch] text-[15px] leading-[1.65] text-[#171A17]/75">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Category cards                                                              */
/* -------------------------------------------------------------------------- */

function CategoryCardsBlock({ section }: { section: CategoryCardsSection }) {
  return (
    <section className={`${PAPER} pb-12 text-[#171A17] md:pb-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label="Collections / Curated"
          title={section.title || "Shop by terrain"}
          note={section.subtitle}
        />

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {section.config.items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="group grid overflow-hidden bg-[#DDE0D7] sm:grid-cols-2"
            >
              <div
                className={`relative min-h-[260px] overflow-hidden ${
                  index % 2 === 1 ? "sm:order-2" : ""
                }`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    width={900}
                    height={700}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#D6D9D0]" />
                )}
              </div>
              <div className="flex flex-col justify-between gap-10 p-6 md:p-8">
                <div className="flex items-center justify-between font-spec text-[10px] uppercase tracking-[0.16em] text-[#171A17]/70">
                  <span>{item.label || "Collection"}</span>
                  <span>C-{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <h3 className="max-w-[14ch] whitespace-pre-line font-poster text-3xl uppercase leading-[0.9]">
                    {item.title}
                  </h3>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-5 inline-flex items-center gap-2 py-1 font-spec text-[12px] font-bold uppercase tracking-[0.12em] text-[#171A17] transition-colors hover:text-[#FF4D00]"
                    >
                      Shop now
                      <ArrowUpRight className="size-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Live categories                                                             */
/* -------------------------------------------------------------------------- */

function LiveCategoriesBlock({
  section,
  categories,
}: {
  section: LiveCategoriesSection;
  categories: CatalogCategory[];
}) {
  const items = categories.slice(0, section.config.limit);

  return (
    <section className={`${PAPER} py-12 text-[#171A17] md:py-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label="Index / Categories"
          title={section.title || "Shop by category"}
          note={section.subtitle}
        />

        {items.length === 0 ? (
          <p className="mt-8 font-spec text-[10px] uppercase tracking-[0.18em] text-[#171A17]/70">
            No categories yet.
          </p>
        ) : (
          <div className="mt-10 grid gap-x-10 md:grid-cols-2">
            {items.map((category) => (
              <Link
                key={category.id}
                to="/shop"
                search={{ category: category.slug }}
                className="group flex items-center gap-5 py-4 transition-colors hover:bg-[#DDE0D7] md:px-4"
              >
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden bg-[#DDE0D7]">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt=""
                      loading="lazy"
                      width={88}
                      height={88}
                      className="h-full w-full object-cover grayscale-[20%] transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <Bike className="size-4 text-[#171A17]/75" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-base font-semibold text-[#171A17] transition-colors group-hover:text-[#FF4D00]">
                    {category.name}
                  </span>
                  <span className="mt-0.5 block font-spec text-[10px] uppercase tracking-[0.14em] text-[#171A17]/70">
                    {category.count} {category.count === 1 ? "piece" : "pieces"}
                  </span>
                </span>
                <ArrowUpRight className="size-4 text-[#171A17]/30 transition-colors group-hover:text-[#FF4D00]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                     */
/* -------------------------------------------------------------------------- */

function Stars({ rating, dark = false }: { rating: number; dark?: boolean }) {
  return (
    <span className="flex gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3 ${
            index < rating
              ? "fill-[#FF4D00] text-[#FF4D00]"
              : dark
                ? "fill-[#E9EAE4]/15 text-[#E9EAE4]/15"
                : "fill-[#171A17]/15 text-[#171A17]/15"
          }`}
        />
      ))}
    </span>
  );
}

function LiveReviewsBlock({
  section,
  reviews,
}: {
  section: LiveReviewsSection;
  reviews: ReviewRow[];
}) {
  const items = reviews.slice(0, section.config.limit);

  return (
    <section className={`${INK} py-12 text-[#E9EAE4] md:py-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label="Rider log / Reviews"
          title={section.title || "Rider log"}
          note={section.subtitle}
          dark
        />

        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {items.map((review) => (
            <article key={review.id} className="py-0">
              <div className="flex items-center justify-between gap-3">
                <Stars rating={review.rating} dark />
                <span className="font-spec text-[10px] uppercase tracking-[0.14em] text-[#E9EAE4]/50">
                  R-{review.id}
                </span>
              </div>
              {review.title ? (
                <h3 className="mt-5 font-poster text-xl uppercase leading-none text-[#E9EAE4]">
                  {review.title}
                </h3>
              ) : null}
              <p className="mt-3 text-[15px] leading-[1.7] text-[#E9EAE4]/75">{review.body}</p>
              <p className="mt-5 font-spec text-[9px] uppercase tracking-[0.18em] text-[#E9EAE4]/75">
                {review.author}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Testimonials                                                                */
/* -------------------------------------------------------------------------- */

function TestimonialsBlock({ section }: { section: TestimonialsSection }) {
  return (
    <section className={`${PAPER} py-12 text-[#171A17] md:py-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label="Field reports / People"
          title={section.title || "What riders say"}
          note={section.subtitle}
        />

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {section.config.items.map((item, index) => (
            <figure key={`${item.name}-${index}`} className="grid grid-cols-[52px_1fr] gap-5">
              <div className="flex size-[52px] items-center justify-center bg-[#DDE0D7] font-poster text-xl">
                {item.name.charAt(0)}
              </div>
              <div>
                <figcaption className="flex flex-wrap items-baseline gap-2">
                  <span className="font-sans text-base font-semibold">{item.name}</span>
                  {item.role ? (
                    <span className="mt-0.5 block font-spec text-[10px] uppercase tracking-[0.14em] text-[#171A17]/70">
                      {item.role}
                    </span>
                  ) : null}
                </figcaption>
                <blockquote className="mt-2 text-sm leading-relaxed text-[#171A17]/70">
                  â€œ{item.text}â€
                </blockquote>
              </div>
            </figure>
          ))}
        </div>

        {section.config.brands.length > 0 ? (
          <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
            {section.config.brands.map((brand, index) => (
              <span
                key={`${brand}-${index}`}
                className="font-spec text-[11px] uppercase tracking-[0.18em] text-[#171A17]/70"
              >
                {brand}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                     */
/* -------------------------------------------------------------------------- */

function GalleryBlock({ section }: { section: GallerySection }) {
  return (
    <section className={`${PAPER} pb-12 text-[#171A17] md:pb-16`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SheetHeading
          label="From the floor / Gallery"
          title={section.title || "From the gallery"}
        />

        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {section.config.items.map((item, index) => (
            <figure key={`${item.title}-${index}`} className="group">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#DDE0D7]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    width={900}
                    height={700}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <span className="absolute left-0 top-0 bg-[#E9EAE4] px-2 py-1 font-spec text-[10px] uppercase tracking-[0.14em] text-[#171A17]">
                  PL-{String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <figcaption className="mt-3 flex items-center justify-between gap-3 text-[15px]">
                <span className="font-sans font-medium">{item.title}</span>
                <ArrowUpRight className="size-3.5 text-[#171A17]/75" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers + renderer                                                          */
/* -------------------------------------------------------------------------- */

function pickProducts(products: CatalogProduct[], config: ProductRowConfig): CatalogProduct[] {
  if (config.source === "manual" && config.productIds.length > 0) {
    const byId = new Map(products.map((product) => [product.id, product]));
    return config.productIds
      .map((id) => byId.get(id))
      .filter((product): product is CatalogProduct => product !== undefined)
      .slice(0, config.limit);
  }
  if (config.source === "category" && config.category) {
    const category = config.category.toLowerCase();
    return products
      .filter((product) => product.category.toLowerCase() === category)
      .slice(0, config.limit);
  }
  return products.slice(config.offset, config.offset + config.limit);
}

export function LandingSections({
  sections,
  products,
  categories,
  reviews,
}: {
  sections: PageLandingSection[];
  products: CatalogProduct[];
  categories: CatalogCategory[];
  reviews: ReviewRow[];
}) {
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case "hero":
            return <HeroBlock key={section.id} section={section} />;
          case "categories":
            return (
              <LiveCategoriesBlock key={section.id} section={section} categories={categories} />
            );
          case "reviews":
            return <LiveReviewsBlock key={section.id} section={section} reviews={reviews} />;
          case "services":
            return <ServicesBlock key={section.id} section={section} />;
          case "about":
            return <AboutBlock key={section.id} section={section} />;
          case "product_row":
            return <ProductRowBlock key={section.id} section={section} products={products} />;
          case "cta":
            return <CtaBlock key={section.id} section={section} />;
          case "features":
            return <FeaturesBlock key={section.id} section={section} />;
          case "category_cards":
            return <CategoryCardsBlock key={section.id} section={section} />;
          case "testimonials":
            return <TestimonialsBlock key={section.id} section={section} />;
          case "gallery":
            return <GalleryBlock key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </>
  );
}
