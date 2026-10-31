import { router } from "expo-router";
import { Heart } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductCard } from "../../components/ProductCard";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFavorites } from "../../lib/favorites";
import { colors, fonts, spacing, typeScale } from "../../lib/theme";

export default function FavoritesScreen() {
  const { items, count, clear } = useFavorites();

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
              Saved
            </Text>
            <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.label }}>
              {count} {count === 1 ? "item" : "items"}
            </Text>
          </View>
          {count > 0 ? (
            <Text
              onPress={clear}
              style={{ color: colors.primary, fontFamily: fonts.semibold, ...typeScale.label }}
            >
              Clear all
            </Text>
          ) : null}
        </View>

        {items.length === 0 ? (
          <>
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Heart color={colors.primary} size={40} />
            </View>
            <EmptyState
              message="Nothing saved yet"
              hint="Tap the heart on any bike or part to keep it here."
            />
            <Button label="Browse the shop" onPress={() => router.push("/shop")} />
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
            {items.map((product) => (
              <ProductCard key={product.id} product={product} width="48%" />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
