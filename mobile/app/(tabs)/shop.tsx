import { useLocalSearchParams } from "expo-router";
import { Check, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "../../components/ProductCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loading } from "../../components/ui/Loading";
import { useCategories, useProducts } from "../../lib/queries";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";
import type { CatalogProduct } from "../../lib/types";

type Sort = "featured" | "rating" | "price-asc" | "price-desc";
type PriceBand = "any" | "under150" | "150to250" | "250to350" | "over350";
type Availability = "any" | "in-stock" | "on-sale";

const priceBands: { id: PriceBand; label: string }[] = [
  { id: "any", label: "Any price" },
  { id: "under150", label: "Under $150" },
  { id: "150to250", label: "$150 – $250" },
  { id: "250to350", label: "$250 – $350" },
  { id: "over350", label: "$350+" },
];

const sortOptions: { id: Sort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "rating", label: "Top rated" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
];

function inPriceBand(product: CatalogProduct, band: PriceBand) {
  if (band === "under150") return product.price < 150;
  if (band === "150to250") return product.price >= 150 && product.price < 250;
  if (band === "250to350") return product.price >= 250 && product.price < 350;
  if (band === "over350") return product.price >= 350;
  return true;
}

function matchesFilters(
  product: CatalogProduct,
  brand: string | null,
  priceBand: PriceBand,
  availability: Availability,
) {
  if (brand && product.brand !== brand) return false;
  if (!inPriceBand(product, priceBand)) return false;
  if (availability === "in-stock" && product.badge === "Out of stock") return false;
  if (availability === "on-sale" && !product.badge?.startsWith("-")) return false;
  return true;
}

export default function ShopScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [category, setCategory] = useState<string | null>(
    typeof params.category === "string" ? params.category : null,
  );
  const [sort, setSort] = useState<Sort>("featured");
  const [brand, setBrand] = useState<string | null>(null);
  const [priceBand, setPriceBand] = useState<PriceBand>("any");
  const [availability, setAvailability] = useState<Availability>("any");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftBrand, setDraftBrand] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState<PriceBand>("any");
  const [draftAvailability, setDraftAvailability] = useState<Availability>("any");
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    setCategory(typeof params.category === "string" ? params.category : null);
  }, [params.category]);

  useEffect(() => {
    if (typeof params.q === "string") {
      setQuery(params.q);
      setDebounced(params.q);
    }
  }, [params.q]);

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const brands = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.brand)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const visible = products
    .filter(
      (product) => !category || product.category.toLowerCase().replace(/\s+/g, "-") === category,
    )
    .filter((product) => matchesFilters(product, brand, priceBand, availability))
    .filter(
      (product) =>
        !debounced ||
        `${product.name} ${product.brand ?? ""} ${product.category}`
          .toLowerCase()
          .includes(debounced.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "rating"
            ? b.rating - a.rating
            : 0,
    );

  const previewCount = products
    .filter(
      (product) => !category || product.category.toLowerCase().replace(/\s+/g, "-") === category,
    )
    .filter((product) => matchesFilters(product, draftBrand, draftPrice, draftAvailability))
    .filter(
      (product) =>
        !debounced ||
        `${product.name} ${product.brand ?? ""} ${product.category}`
          .toLowerCase()
          .includes(debounced.toLowerCase()),
    ).length;

  const activeFilters =
    (brand ? 1 : 0) + (priceBand !== "any" ? 1 : 0) + (availability !== "any" ? 1 : 0);
  const hasAnyFilter = activeFilters > 0 || Boolean(category) || Boolean(query.trim());
  const activeCategories = categories.filter((item) => item.count > 0);

  function openFilters() {
    setDraftBrand(brand);
    setDraftPrice(priceBand);
    setDraftAvailability(availability);
    setFiltersOpen(true);
  }

  function applyFilters() {
    setBrand(draftBrand);
    setPriceBand(draftPrice);
    setAvailability(draftAvailability);
    setFiltersOpen(false);
  }

  function resetDraft() {
    setDraftBrand(null);
    setDraftPrice("any");
    setDraftAvailability("any");
  }

  function clearAll() {
    setQuery("");
    setDebounced("");
    setCategory(null);
    setBrand(null);
    setPriceBand("any");
    setAvailability("any");
  }

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          gap: 16,
          paddingBottom: 28,
          paddingHorizontal: spacing.screen,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}
        >
          <View>
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h1 }}>
              Shop
            </Text>
            <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.label }}>
              {visible.length} {visible.length === 1 ? "product" : "products"}
            </Text>
          </View>
          <Pressable
            onPress={openFilters}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            style={{
              alignItems: "center",
              backgroundColor: activeFilters > 0 ? colors.primary : colors.card,
              borderColor: activeFilters > 0 ? colors.primary : colors.border,
              borderRadius: radius.pill,
              borderWidth: 1,
              flexDirection: "row",
              gap: 7,
              minHeight: 42,
              paddingHorizontal: 15,
            }}
          >
            <SlidersHorizontal color={activeFilters > 0 ? colors.white : colors.ink} size={18} />
            <Text
              style={{
                color: activeFilters > 0 ? colors.white : colors.ink,
                fontFamily: fonts.semibold,
                ...typeScale.label,
              }}
            >
              Filters{activeFilters > 0 ? ` · ${activeFilters}` : ""}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            alignItems: "center",
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.pill,
            borderWidth: 1,
            flexDirection: "row",
            gap: 10,
            minHeight: 50,
            paddingLeft: 16,
          }}
        >
          <Search color={colors.muted} size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search bikes, parts and gear…"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.ink,
              flex: 1,
              fontFamily: fonts.regular,
              paddingVertical: 12,
              ...typeScale.bodyLg,
            }}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} style={{ padding: 10 }} hitSlop={4}>
              <X color={colors.muted} size={18} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <FilterChip
            label="All"
            active={category === null}
            onPress={() => setCategory(null)}
            tone="primary"
          />
          {activeCategories.map((item) => (
            <FilterChip
              key={item.slug}
              label={`${item.name} · ${item.count}`}
              active={category === item.slug}
              onPress={() => setCategory(item.slug)}
              tone="primary"
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {sortOptions.map((option) => (
            <FilterChip
              key={option.id}
              label={option.label}
              active={sort === option.id}
              onPress={() => setSort(option.id)}
              tone="ink"
            />
          ))}
        </ScrollView>

        {hasAnyFilter ? (
          <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
            <Text
              style={{
                color: colors.muted,
                flex: 1,
                fontFamily: fonts.regular,
                ...typeScale.caption,
              }}
            >
              {category ? `Category: ${category.replace(/-/g, " ")}` : "All categories"}
              {brand ? ` · ${brand}` : ""}
              {priceBand !== "any"
                ? ` · ${priceBands.find((item) => item.id === priceBand)?.label}`
                : ""}
              {availability !== "any"
                ? ` · ${availability === "in-stock" ? "In stock" : "On sale"}`
                : ""}
            </Text>
            <Pressable onPress={clearAll} hitSlop={8}>
              <Text
                style={{ color: colors.primary, fontFamily: fonts.semibold, ...typeScale.label }}
              >
                Clear all
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <>
            <EmptyState
              message="No products found"
              hint="Try clearing a filter or searching for something else."
            />
            <Pressable
              onPress={clearAll}
              accessibilityRole="button"
              style={{
                alignItems: "center",
                alignSelf: "center",
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
                minHeight: 48,
                justifyContent: "center",
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ color: colors.white, fontFamily: fonts.bold, ...typeScale.body }}>
                Clear filters
              </Text>
            </Pressable>
          </>
        ) : (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} width="48%" />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={filtersOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <Pressable
          onPress={() => setFiltersOpen(false)}
          style={{
            backgroundColor: colors.overlay,
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              gap: 20,
              paddingBottom: insets.bottom + 18,
              paddingHorizontal: 20,
              paddingTop: 12,
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
                Filters
              </Text>
              <Pressable
                onPress={() => setFiltersOpen(false)}
                accessibilityLabel="Close filters"
                style={{ padding: 8 }}
              >
                <X color={colors.ink} size={22} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: windowHeight * 0.55 }}
              contentContainerStyle={{ gap: 20 }}
            >
              <View style={{ gap: 10 }}>
                <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.label }}>
                  Price
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {priceBands.map((option) => (
                    <FilterChip
                      key={option.id}
                      label={option.label}
                      active={draftPrice === option.id}
                      onPress={() => setDraftPrice(option.id)}
                      tone="primary"
                    />
                  ))}
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.label }}>
                  Availability
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {(
                    [
                      ["any", "Any"],
                      ["in-stock", "In stock"],
                      ["on-sale", "On sale"],
                    ] as const
                  ).map(([value, label]) => (
                    <FilterChip
                      key={value}
                      label={label}
                      active={draftAvailability === value}
                      onPress={() => setDraftAvailability(value)}
                      tone="primary"
                    />
                  ))}
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.label }}>
                  Brand
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <FilterChip
                    label="Any"
                    active={draftBrand === null}
                    onPress={() => setDraftBrand(null)}
                    tone="primary"
                  />
                  {brands.map((item) => (
                    <FilterChip
                      key={item}
                      label={item}
                      active={draftBrand === item}
                      onPress={() => setDraftBrand(item)}
                      tone="primary"
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={resetDraft}
                style={{
                  alignItems: "center",
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  flex: 1,
                  justifyContent: "center",
                  minHeight: 50,
                }}
              >
                <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}>
                  Reset
                </Text>
              </Pressable>
              <Pressable
                onPress={applyFilters}
                style={{
                  alignItems: "center",
                  backgroundColor: colors.primary,
                  borderRadius: radius.pill,
                  flex: 2,
                  flexDirection: "row",
                  gap: 8,
                  justifyContent: "center",
                  minHeight: 50,
                  paddingHorizontal: 16,
                }}
              >
                <Check color={colors.white} size={18} />
                <Text style={{ color: colors.white, fontFamily: fonts.bold, ...typeScale.body }}>
                  Show {previewCount} {previewCount === 1 ? "product" : "products"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  tone,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone: "primary" | "ink";
}) {
  const activeColor = tone === "ink" ? colors.ink : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={5}
      style={{
        alignItems: "center",
        backgroundColor: active ? activeColor : colors.card,
        borderColor: active ? activeColor : colors.border,
        borderRadius: radius.pill,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 38,
        paddingHorizontal: 14,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          color: active ? colors.white : colors.ink,
          fontFamily: fonts.semibold,
          ...typeScale.label,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
