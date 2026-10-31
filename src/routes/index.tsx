import { createFileRoute } from "@tanstack/react-router";

import { LandingSections } from "@/components/site/landing/landing-sections";
import { PromoPopup } from "@/components/site/PromoPopup";
import { HomeStatic } from "@/components/site/HomeStatic";
import { listCatalogCategories, listCatalogProducts } from "@/integrations/turso/catalog.functions";
import { getLandingSections, getPromoPopup } from "@/integrations/turso/landing.functions";
import { listApprovedReviews } from "@/integrations/turso/reviews.functions";
import { getSettings } from "@/lib/settings.functions";
import { resolveHomeSource } from "@/lib/home-source";
import { safeLoad } from "@/lib/safe-load";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, categories, reviews, sections, popup, settings] = await Promise.all([
      safeLoad([], () => listCatalogProducts()),
      safeLoad([], () => listCatalogCategories()),
      safeLoad([], () => listApprovedReviews({ data: 6 })),
      safeLoad([], () => getLandingSections()),
      safeLoad(null, () => getPromoPopup()),
      safeLoad(
        {
          freeShippingThresholdCents: 0,
          flatShippingCents: 0,
          storeEmail: "",
          storePhone: "",
          homeSource: "static",
        },
        () => getSettings(),
      ),
    ]);
    return {
      products,
      categories,
      reviews,
      sections,
      popup,
      homeSource: resolveHomeSource(settings.homeSource),
    };
  },
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const { products, categories, reviews, sections, popup, homeSource } = Route.useLoaderData();

  if (homeSource === "cms") {
    return (
      <div className="min-h-screen bg-background">
        <LandingSections
          sections={sections}
          products={products}
          categories={categories}
          reviews={reviews}
        />
        <PromoPopup popup={popup} />
      </div>
    );
  }

  return (
    <>
      <HomeStatic products={products} reviews={reviews} />
      <PromoPopup popup={popup} />
    </>
  );
}
