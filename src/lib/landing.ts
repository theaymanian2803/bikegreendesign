// Shared landing-page model. Client-safe: types/schemas/zod only, no server imports.

import { z } from "zod";

export const LANDING_SECTION_TYPES = [
  "hero",
  "categories",
  "services",
  "about",
  "product_row",
  "cta",
  "features",
  "category_cards",
  "testimonials",
  "reviews",
  "gallery",
  "promo_popup",
] as const;

export type LandingSectionType = (typeof LANDING_SECTION_TYPES)[number];

export const landingSectionTypeSchema = z.enum(LANDING_SECTION_TYPES);

export const LANDING_SECTION_LABELS: Record<LandingSectionType, string> = {
  hero: "Hero banner",
  categories: "Live categories",
  services: "Services (image + description)",
  about: "About section",
  product_row: "Product row",
  cta: "CTA banner",
  features: "Feature icons",
  category_cards: "Category cards",
  testimonials: "Testimonials",
  reviews: "Customer reviews",
  gallery: "Gallery (image + title)",
  promo_popup: "Promo popup",
};

export const LANDING_PLATFORMS = ["web", "mobile", "both"] as const;
export type LandingPlatform = (typeof LANDING_PLATFORMS)[number];
export const landingPlatformSchema = z.enum(LANDING_PLATFORMS);
export const LANDING_PLATFORM_LABELS: Record<LandingPlatform, string> = {
  web: "Website",
  mobile: "Mobile app",
  both: "Website + mobile",
};

export const LANDING_ICON_KEYS = ["bike", "shopping-bag", "award", "tag"] as const;
export type LandingIconKey = (typeof LANDING_ICON_KEYS)[number];

const ctaLabel = z.string().trim().max(60);
const ctaHref = z.string().trim().max(300);
const imageUrl = z.string().trim().max(1000);

export const heroConfigSchema = z.object({
  ctaLabel,
  ctaHref,
});

export const categoriesConfigSchema = z.object({
  limit: z.number().int().min(1).max(24),
});

export const servicesConfigSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().trim().max(120),
        label: z.string().trim().max(80),
        description: z.string().trim().max(600).default(""),
        image: imageUrl,
      }),
    )
    .max(12),
});

export const aboutConfigSchema = z.object({
  body: z.string().trim().max(4000),
  secondaryImage: imageUrl,
  ctaLabel,
  ctaHref,
});

export const productRowConfigSchema = z.object({
  source: z.enum(["latest", "category", "manual"]),
  category: z.string().trim().max(120),
  productIds: z.array(z.string().max(120)).max(60),
  limit: z.number().int().min(1).max(24),
  offset: z.number().int().min(0).max(200),
});

export const ctaConfigSchema = z.object({
  ctaLabel,
  ctaHref,
});

export const featuresConfigSchema = z.object({
  items: z
    .array(
      z.object({
        icon: z.enum(LANDING_ICON_KEYS),
        title: z.string().trim().max(120),
        text: z.string().trim().max(500),
      }),
    )
    .max(8),
});

export const categoryCardsConfigSchema = z.object({
  items: z
    .array(
      z.object({
        label: z.string().trim().max(80),
        title: z.string().trim().max(120),
        image: imageUrl,
        href: z.string().trim().max(300),
      }),
    )
    .max(8),
});

export const testimonialsConfigSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().max(120),
        role: z.string().trim().max(80),
        text: z.string().trim().max(1000),
      }),
    )
    .max(12),
  brands: z.array(z.string().trim().max(80)).max(12),
});

export const reviewsConfigSchema = z.object({
  limit: z.number().int().min(1).max(12),
});

export const galleryConfigSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().trim().max(200),
        image: imageUrl,
      }),
    )
    .max(12),
});

export const promoPopupConfigSchema = z.object({
  enabled: z.boolean(),
  couponCode: z.string().trim().max(60),
  delaySeconds: z.number().int().min(0).max(120),
  ctaLabel,
  ctaHref,
});

export type HeroConfig = z.infer<typeof heroConfigSchema>;
export type CategoriesConfig = z.infer<typeof categoriesConfigSchema>;
export type ServicesConfig = z.infer<typeof servicesConfigSchema>;
export type AboutConfig = z.infer<typeof aboutConfigSchema>;
export type ProductRowConfig = z.infer<typeof productRowConfigSchema>;
export type CtaConfig = z.infer<typeof ctaConfigSchema>;
export type FeaturesConfig = z.infer<typeof featuresConfigSchema>;
export type CategoryCardsConfig = z.infer<typeof categoryCardsConfigSchema>;
export type TestimonialsConfig = z.infer<typeof testimonialsConfigSchema>;
export type ReviewsConfig = z.infer<typeof reviewsConfigSchema>;
export type GalleryConfig = z.infer<typeof galleryConfigSchema>;
export type PromoPopupConfig = z.infer<typeof promoPopupConfigSchema>;

export type LandingConfig =
  | HeroConfig
  | CategoriesConfig
  | ServicesConfig
  | AboutConfig
  | ProductRowConfig
  | CtaConfig
  | FeaturesConfig
  | CategoryCardsConfig
  | TestimonialsConfig
  | ReviewsConfig
  | GalleryConfig
  | PromoPopupConfig;

export type LandingSectionBase = {
  id: number;
  sectionKey: string;
  type: LandingSectionType;
  title: string;
  subtitle: string;
  imageUrl: string;
  visible: boolean;
  sortOrder: number;
  platform: LandingPlatform;
};

export type HeroSection = LandingSectionBase & { type: "hero"; config: HeroConfig };
export type CategoriesSection = LandingSectionBase & {
  type: "categories";
  config: CategoriesConfig;
};
export type ServicesSection = LandingSectionBase & { type: "services"; config: ServicesConfig };
export type AboutSection = LandingSectionBase & { type: "about"; config: AboutConfig };
export type ProductRowSection = LandingSectionBase & {
  type: "product_row";
  config: ProductRowConfig;
};
export type CtaSection = LandingSectionBase & { type: "cta"; config: CtaConfig };
export type FeaturesSection = LandingSectionBase & { type: "features"; config: FeaturesConfig };
export type CategoryCardsSection = LandingSectionBase & {
  type: "category_cards";
  config: CategoryCardsConfig;
};
export type TestimonialsSection = LandingSectionBase & {
  type: "testimonials";
  config: TestimonialsConfig;
};
export type ReviewsSection = LandingSectionBase & { type: "reviews"; config: ReviewsConfig };
export type GallerySection = LandingSectionBase & { type: "gallery"; config: GalleryConfig };
export type PromoPopupSection = LandingSectionBase & {
  type: "promo_popup";
  config: PromoPopupConfig;
};

export type PageLandingSection =
  | HeroSection
  | CategoriesSection
  | ServicesSection
  | AboutSection
  | ProductRowSection
  | CtaSection
  | FeaturesSection
  | CategoryCardsSection
  | TestimonialsSection
  | ReviewsSection
  | GallerySection;

export type LandingSection = PageLandingSection | PromoPopupSection;

export const landingConfigSchemas: Record<LandingSectionType, z.ZodTypeAny> = {
  hero: heroConfigSchema,
  categories: categoriesConfigSchema,
  services: servicesConfigSchema,
  about: aboutConfigSchema,
  product_row: productRowConfigSchema,
  cta: ctaConfigSchema,
  features: featuresConfigSchema,
  category_cards: categoryCardsConfigSchema,
  testimonials: testimonialsConfigSchema,
  reviews: reviewsConfigSchema,
  gallery: galleryConfigSchema,
  promo_popup: promoPopupConfigSchema,
};

export function defaultConfigFor(type: LandingSectionType): LandingConfig {
  switch (type) {
    case "hero":
      return { ctaLabel: "Shop Now", ctaHref: "/shop" };
    case "categories":
      return { limit: 12 };
    case "services":
      return {
        items: [
          {
            title: "New service",
            label: "Bike Service",
            description: "",
            image: "/menu/service-part.jpg",
          },
        ],
      };
    case "about":
      return {
        body: "",
        secondaryImage: "/menu/about-mechanic.jpg",
        ctaLabel: "Read More",
        ctaHref: "/shop",
      };
    case "product_row":
      return { source: "latest", category: "", productIds: [], limit: 4, offset: 0 };
    case "cta":
      return { ctaLabel: "Shop Now", ctaHref: "/shop" };
    case "features":
      return { items: [{ icon: "bike", title: "New feature", text: "" }] };
    case "category_cards":
      return {
        items: [
          {
            label: "New collection",
            title: "New category",
            image: "/menu/cat-red-bike.jpg",
            href: "/shop",
          },
        ],
      };
    case "testimonials":
      return { items: [{ name: "Customer", role: "Customer", text: "" }], brands: [] };
    case "reviews":
      return { limit: 6 };
    case "gallery":
      return { items: [{ title: "New gallery item", image: "/menu/service-repair.jpg" }] };
    case "promo_popup":
      return {
        enabled: false,
        couponCode: "",
        delaySeconds: 4,
        ctaLabel: "Shop now",
        ctaHref: "/shop",
      };
  }
}

export function defaultTitleFor(type: LandingSectionType): string {
  switch (type) {
    case "hero":
      return "New hero";
    case "categories":
      return "Shop by category";
    case "services":
      return "Our services";
    case "about":
      return "About us";
    case "product_row":
      return "New product row";
    case "cta":
      return "New CTA banner";
    case "features":
      return "Why shop with us";
    case "category_cards":
      return "Shop by category";
    case "testimonials":
      return "What customers say";
    case "reviews":
      return "Customer reviews";
    case "gallery":
      return "From the gallery";
    case "promo_popup":
      return "Promo popup";
  }
}

export function parseLandingConfig(type: LandingSectionType, raw: unknown): LandingConfig {
  const normalized = type === "services" && Array.isArray(raw) ? { items: raw } : raw;
  const result = landingConfigSchemas[type].safeParse(normalized);
  return (result.success ? result.data : defaultConfigFor(type)) as LandingConfig;
}

export const LANDING_IMAGE_OPTIONS = [
  { value: "", label: "No image" },
  { value: "/menu/hero-bike-snow.jpg", label: "Hero bike in snow" },
  { value: "/menu/cta-road.jpg", label: "Road cyclist CTA" },
  { value: "/menu/cat-red-bike.jpg", label: "Red bike" },
  { value: "/menu/cat-blue-bike.jpg", label: "Blue bike" },
  { value: "/menu/about-shop.jpg", label: "Shop interior" },
  { value: "/menu/about-mechanic.jpg", label: "Mechanic at work" },
  { value: "/menu/service-part.jpg", label: "Part replacement" },
  { value: "/menu/service-maintenance.jpg", label: "Bike maintenance" },
  { value: "/menu/service-repair.jpg", label: "Damage repair" },
  { value: "/menu/service-test.jpg", label: "E-bike test" },
  { value: "/menu/p-derailleur.jpg", label: "Derailleur" },
  { value: "/menu/p-wheel.jpg", label: "Wheel" },
  { value: "/menu/p-crank.jpg", label: "Crank" },
  { value: "/menu/p-stem.jpg", label: "Stem" },
  { value: "/menu/p-suspension.jpg", label: "Suspension" },
  { value: "/menu/p-helmet-red.jpg", label: "Red helmet" },
  { value: "/menu/p-helmet-black.jpg", label: "Black helmet" },
  { value: "/menu/p-helmet-pink.jpg", label: "Pink helmet" },
] as const;

export const LANDING_ICON_OPTIONS = [
  { value: "bike", label: "Bike" },
  { value: "shopping-bag", label: "Shopping bag" },
  { value: "award", label: "Award" },
  { value: "tag", label: "Tag" },
] as const;
