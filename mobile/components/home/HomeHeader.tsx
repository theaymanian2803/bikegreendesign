import { router } from "expo-router";
import { Bike, Heart, Search, ShoppingCart } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useCart } from "../../lib/cart";
import { useFavorites } from "../../lib/favorites";
import { colors, fonts, radius, shadows, spacing, typeScale } from "../../lib/theme";

export function HomeHeader() {
  const { count } = useCart();
  const { count: favoriteCount } = useFavorites();
  const [query, setQuery] = useState("");

  function submit() {
    const q = query.trim();
    router.push(q ? { pathname: "/shop", params: { q } } : "/shop");
  }

  return (
    <View style={{ gap: 14, paddingHorizontal: spacing.screen, paddingTop: 10 }}>
      <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            height: 44,
            justifyContent: "center",
            width: 44,
          }}
        >
          <Bike color={colors.white} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h2 }}>
            Pathway
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontFamily: fonts.semibold,
              letterSpacing: 1.3,
              ...typeScale.micro,
            }}
          >
            BIKE SHOP
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/favorites")}
          accessibilityLabel="Favorites"
          style={{
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: radius.pill,
            height: 42,
            justifyContent: "center",
            width: 42,
          }}
        >
          <Heart color={colors.ink} size={24} />
          {favoriteCount > 0 ? (
            <View
              style={{
                alignItems: "center",
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
                height: 17,
                justifyContent: "center",
                minWidth: 17,
                paddingHorizontal: 4,
                position: "absolute",
                right: -2,
                top: -2,
              }}
            >
              <Text style={{ color: colors.white, fontFamily: fonts.bold, ...typeScale.micro }}>
                {favoriteCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={() => router.push("/cart")}
          accessibilityLabel="Cart"
          style={{
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: radius.pill,
            height: 42,
            justifyContent: "center",
            width: 42,
          }}
        >
          <ShoppingCart color={colors.ink} size={24} />
          {count > 0 ? (
            <View
              style={{
                alignItems: "center",
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
                height: 17,
                justifyContent: "center",
                minWidth: 17,
                paddingHorizontal: 4,
                position: "absolute",
                right: -2,
                top: -2,
              }}
            >
              <Text style={{ color: colors.white, fontFamily: fonts.bold, ...typeScale.micro }}>
                {count}
              </Text>
            </View>
          ) : null}
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
          minHeight: 52,
          paddingLeft: 16,
          ...shadows.card,
        }}
      >
        <Search color={colors.muted} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          placeholder="Search bikes, parts and gear…"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={{
            color: colors.ink,
            flex: 1,
            fontFamily: fonts.regular,
            paddingVertical: 12,
            ...typeScale.bodyLg,
          }}
        />
        <Pressable
          onPress={submit}
          accessibilityLabel="Search"
          style={{
            alignItems: "center",
            backgroundColor: colors.primary,
            borderRadius: radius.pill,
            height: 38,
            justifyContent: "center",
            marginRight: 5,
            width: 38,
          }}
        >
          <Search color={colors.white} size={18} />
        </Pressable>
      </View>

      <View style={{ alignItems: "center", flexDirection: "row", gap: 6, paddingLeft: 4 }}>
        <View style={{ backgroundColor: colors.primary, borderRadius: 3, height: 6, width: 6 }} />
        <Text style={{ color: colors.muted, fontFamily: fonts.medium, ...typeScale.micro }}>
          Free delivery over $300 · 30-day returns
        </Text>
      </View>
    </View>
  );
}
