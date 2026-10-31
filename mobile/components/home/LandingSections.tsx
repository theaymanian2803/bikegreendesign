import { View } from "react-native";

import type { CatalogCategory, CatalogProduct, LandingSection, Review } from "../../lib/types";
import {
  AboutSection,
  CategoriesSection,
  FeaturesSection,
  GallerySection,
  HeroSection,
  ImageCardsSection,
  LiveReviewsSection,
  ProductsSection,
  PromoSection,
  TestimonialsSection,
} from "./HomeSections";

export function LandingSections({
  sections,
  categories,
  products,
  reviews,
}: {
  sections: LandingSection[];
  categories: CatalogCategory[];
  products: CatalogProduct[];
  reviews: Review[];
}) {
  return (
    <View style={{ gap: 18 }}>
      {sections.map((section) => {
        switch (section.type) {
          case "hero":
            return <HeroSection key={section.id} section={section} />;
          case "categories":
            return <CategoriesSection key={section.id} section={section} categories={categories} />;
          case "product_row":
            return <ProductsSection key={section.id} section={section} products={products} />;
          case "cta":
            return <PromoSection key={section.id} section={section} />;
          case "features":
            return <FeaturesSection key={section.id} section={section} />;
          case "category_cards":
          case "services":
            return <ImageCardsSection key={section.id} section={section} />;
          case "about":
            return <AboutSection key={section.id} section={section} />;
          case "testimonials":
            return <TestimonialsSection key={section.id} section={section} />;
          case "reviews":
            return <LiveReviewsSection key={section.id} section={section} reviews={reviews} />;
          case "gallery":
            return <GallerySection key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </View>
  );
}
