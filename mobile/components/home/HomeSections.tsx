import { Image } from "expo-image";
import { router } from "expo-router";
import { Bike, Star } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { resolveMediaUrl } from "../../lib/api";
import { colors, fonts, radius, shadows, typeScale } from "../../lib/theme";
import type { CatalogCategory, CatalogProduct, LandingSection, Review } from "../../lib/types";
import { ProductCard } from "../ProductCard";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

export function openHref(href: string) {
  if (!href) return;
  if (/^https?:\/\//i.test(href)) {
    router.push(href as never);
    return;
  }
  const [path, query] = href.split("?");
  if (path === "/shop") {
    const category = new URLSearchParams(query ?? "").get("category");
    router.push(category ? { pathname: "/shop", params: { category } } : "/shop");
    return;
  }
  if (path.startsWith("/product/")) {
    router.push(`/product/${path.replace("/product/", "")}` as never);
    return;
  }
  router.push("/shop");
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  if (!title && !subtitle) return null;
  return (
    <View style={{ gap: 8 }}>
      {subtitle ? (
        <Text
          style={{
            alignSelf: "flex-start",
            backgroundColor: colors.primarySoft,
            borderRadius: radius.pill,
            color: colors.primary,
            fontFamily: fonts.bold,
            letterSpacing: 1,
            paddingHorizontal: 9,
            paddingVertical: 3,
            textTransform: "uppercase",
            ...typeScale.micro,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {title ? (
        <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h2 }}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

export function HeroSection({ section }: { section: LandingSection }) {
  const config = section.config as {
    ctaLabel?: string;
    ctaHref?: string;
    promoValue?: string;
    promoText?: string;
  };
  return (
    <View
      style={{
        backgroundColor: colors.primarySoft,
        borderColor: colors.border,
        borderRadius: radius.xl,
        borderWidth: 1,
        gap: 14,
        padding: 20,
      }}
    >
      {section.subtitle ? (
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: colors.primary,
            borderRadius: radius.pill,
            paddingHorizontal: 11,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontFamily: fonts.bold,
              letterSpacing: 0.5,
              ...typeScale.micro,
            }}
          >
            {section.subtitle}
          </Text>
        </View>
      ) : null}
      <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.display }}>
        {section.title}
      </Text>
      {config.promoValue ? (
        <Text style={{ color: colors.ink, fontFamily: fonts.medium, ...typeScale.body }}>
          <Text style={{ color: colors.primary, fontFamily: fonts.bold, ...typeScale.h2 }}>
            {config.promoValue}
          </Text>{" "}
          {config.promoText}
        </Text>
      ) : null}
      {section.imageUrl ? (
        <Image
          source={{ uri: resolveMediaUrl(section.imageUrl) }}
          style={{ borderRadius: radius.lg, height: 178, width: "100%" }}
          contentFit="cover"
        />
      ) : null}
      <Button
        label={config.ctaLabel || "Shop now"}
        onPress={() => openHref(config.ctaHref || "/shop")}
      />
    </View>
  );
}

export function CategoriesSection({
  section,
  categories,
}: {
  section: LandingSection;
  categories: CatalogCategory[];
}) {
  const limit = Number(section.config.limit ?? 12);
  const items = categories.slice(0, Number.isFinite(limit) ? limit : 12);
  if (items.length === 0) return <EmptyState message="No categories yet." />;
  return (
    <View style={{ gap: 14 }}>
      <Heading title={section.title} subtitle={section.subtitle} />
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}
      >
        {items.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => router.push({ pathname: "/shop", params: { category: category.slug } })}
            style={{
              alignItems: "center",
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              flexDirection: "row",
              gap: 12,
              padding: 10,
              width: "48%",
              ...shadows.card,
            }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: radius.sm,
                height: 44,
                justifyContent: "center",
                overflow: "hidden",
                width: 44,
              }}
            >
              {category.image ? (
                <Image
                  source={{ uri: resolveMediaUrl(category.image) }}
                  style={{ height: 44, width: 44 }}
                  contentFit="cover"
                />
              ) : (
                <Bike color={colors.primary} size={21} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}
              >
                {category.name}
              </Text>
              <Text
                style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.caption }}
              >
                {category.count} products
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ProductsSection({
  section,
  products,
}: {
  section: LandingSection;
  products: CatalogProduct[];
}) {
  const config = section.config as {
    source?: string;
    category?: string;
    productIds?: string[];
    limit?: number;
    offset?: number;
  };
  const limit = Number(config.limit ?? 8);
  let items = products;
  if (config.source === "manual" && config.productIds?.length) {
    const byId = new Map(products.map((product) => [product.id, product]));
    items = config.productIds
      .map((id) => byId.get(id))
      .filter((product): product is CatalogProduct => Boolean(product));
  } else if (config.source === "category" && config.category) {
    items = products.filter(
      (product) => product.category.toLowerCase() === config.category?.toLowerCase(),
    );
  } else if (config.source === "best_rated") {
    items = [...products].sort((a, b) => b.rating - a.rating);
  } else {
    items = products.slice(Number(config.offset ?? 0));
  }
  items = items.slice(0, Number.isFinite(limit) ? limit : 8);
  if (items.length === 0) return <EmptyState message="No products in this row yet." />;
  return (
    <View style={{ gap: 14 }}>
      <Heading title={section.title} subtitle={section.subtitle} />
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}
      >
        {items.map((product) => (
          <ProductCard key={product.id} product={product} width="48%" />
        ))}
      </View>
    </View>
  );
}

export function PromoSection({ section }: { section: LandingSection }) {
  const config = section.config as { ctaLabel?: string; ctaHref?: string };
  return (
    <View
      style={{
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        gap: 12,
        padding: 20,
        ...shadows.floating,
      }}
    >
      <Text style={{ color: colors.white, fontFamily: fonts.display, ...typeScale.h2 }}>
        {section.title}
      </Text>
      {section.subtitle ? (
        <Text
          style={{
            color: colors.white,
            fontFamily: fonts.regular,
            opacity: 0.9,
            ...typeScale.bodySmall,
          }}
        >
          {section.subtitle}
        </Text>
      ) : null}
      <Pressable
        onPress={() => openHref(config.ctaHref || "/shop")}
        style={{
          alignItems: "center",
          backgroundColor: colors.white,
          borderRadius: radius.pill,
          justifyContent: "center",
          marginTop: 4,
          minHeight: 48,
          paddingVertical: 13,
        }}
      >
        <Text style={{ color: colors.primary, fontFamily: fonts.bold, ...typeScale.body }}>
          {config.ctaLabel || "Shop now"}
        </Text>
      </Pressable>
    </View>
  );
}

export function LiveReviewsSection({
  section,
  reviews,
}: {
  section: LandingSection;
  reviews: Review[];
}) {
  const limit = Number(section.config.limit ?? 6);
  const items = reviews.slice(0, Number.isFinite(limit) ? limit : 6);
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 12 }}>
      <Heading title={section.title} subtitle={section.subtitle} />
      {items.map((review) => (
        <View
          key={review.id}
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderWidth: 1,
            gap: 7,
            padding: 16,
            ...shadows.card,
          }}
        >
          <View
            style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.bodySmall }}>
              {review.author}
            </Text>
            <View style={{ flexDirection: "row", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  color={n <= review.rating ? colors.star : colors.border}
                  fill={n <= review.rating ? colors.star : "transparent"}
                  size={14}
                />
              ))}
            </View>
          </View>
          {review.title ? (
            <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.bodySmall }}>
              {review.title}
            </Text>
          ) : null}
          <Text
            numberOfLines={3}
            style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
          >
            {review.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function FeaturesSection({ section }: { section: LandingSection }) {
  const items = (section.config.items as { title?: string; text?: string }[] | undefined) ?? [];
  return (
    <View style={{ gap: 12 }}>
      <Heading title={section.title} subtitle={section.subtitle} />
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}
      >
        {items.map((item, index) => (
          <View
            key={`${item.title}-${index}`}
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              gap: 6,
              padding: 16,
              width: "48%",
              ...shadows.card,
            }}
          >
            <Bike color={colors.primary} size={21} />
            <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}>
              {item.title}
            </Text>
            <Text
              style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
            >
              {item.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ImageCardsSection({ section }: { section: LandingSection }) {
  const items =
    (section.config.items as
      | { title?: string; label?: string; description?: string; image?: string; href?: string }[]
      | undefined) ?? [];
  return (
    <View style={{ gap: 12 }}>
      <Heading title={section.title} subtitle={section.subtitle} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {items.map((item, index) => (
          <Pressable
            key={`${item.title}-${index}`}
            onPress={() => openHref(item.href || "/shop")}
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              overflow: "hidden",
              width: 200,
              ...shadows.card,
            }}
          >
            {item.image ? (
              <Image
                source={{ uri: resolveMediaUrl(item.image) }}
                style={{ height: 120, width: "100%" }}
                contentFit="cover"
              />
            ) : null}
            <View style={{ gap: 5, padding: 12 }}>
              {item.label ? (
                <Text
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: colors.primarySoft,
                    borderRadius: radius.pill,
                    color: colors.primary,
                    fontFamily: fonts.bold,
                    letterSpacing: 0.4,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    ...typeScale.micro,
                  }}
                >
                  {item.label.toUpperCase()}
                </Text>
              ) : null}
              <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}>
                {item.title}
              </Text>
              {item.description ? (
                <Text
                  numberOfLines={3}
                  style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
                >
                  {item.description}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function AboutSection({ section }: { section: LandingSection }) {
  const config = section.config as { body?: string; ctaLabel?: string; ctaHref?: string };
  return (
    <View style={{ gap: 12 }}>
      <Heading title={section.title} subtitle={section.subtitle} />
      {section.imageUrl ? (
        <Image
          source={{ uri: resolveMediaUrl(section.imageUrl) }}
          style={{ borderRadius: radius.lg, height: 190, width: "100%" }}
          contentFit="cover"
        />
      ) : null}
      {config.body ? (
        <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.body }}>
          {config.body}
        </Text>
      ) : null}
      {config.ctaLabel ? (
        <Button label={config.ctaLabel} onPress={() => openHref(config.ctaHref || "/shop")} />
      ) : null}
    </View>
  );
}

export function TestimonialsSection({ section }: { section: LandingSection }) {
  const items =
    (section.config.items as { name?: string; role?: string; text?: string }[] | undefined) ?? [];
  return (
    <View style={{ gap: 12 }}>
      <Heading title={section.title} subtitle={section.subtitle} />
      {items.map((item, index) => (
        <View
          key={`${item.name}-${index}`}
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderWidth: 1,
            gap: 6,
            padding: 16,
            ...shadows.card,
          }}
        >
          <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.bodySmall }}>
            {item.name}
            {item.role ? (
              <Text
                style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.caption }}
              >
                {"  "}· {item.role}
              </Text>
            ) : null}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}>
            “{item.text}”
          </Text>
        </View>
      ))}
    </View>
  );
}

export function GallerySection({ section }: { section: LandingSection }) {
  const items = (section.config.items as { title?: string; image?: string }[] | undefined) ?? [];
  return (
    <View style={{ gap: 12 }}>
      <Heading title={section.title} />
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }}
      >
        {items.map((item, index) => (
          <View key={`${item.title}-${index}`} style={{ width: "48%" }}>
            {item.image ? (
              <Image
                source={{ uri: resolveMediaUrl(item.image) }}
                style={{ borderRadius: radius.md, height: 138, width: "100%" }}
                contentFit="cover"
              />
            ) : null}
            <Text
              style={{
                color: colors.ink,
                fontFamily: fonts.medium,
                marginTop: 6,
                ...typeScale.bodySmall,
              }}
            >
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
