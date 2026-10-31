import { Image } from "expo-image";
import { router } from "expo-router";
import { Heart, Plus, Star } from "lucide-react-native";
import { Pressable, Text, View, type DimensionValue } from "react-native";

import { useCart } from "../lib/cart";
import { useFavorites } from "../lib/favorites";
import { formatMoney } from "../lib/format";
import { colors, fonts, radius, shadows, typeScale } from "../lib/theme";
import { resolveMediaUrl } from "../lib/api";
import type { CatalogProduct } from "../lib/types";

export function ProductCard({
  product,
  width = "47%",
}: {
  product: CatalogProduct;
  width?: DimensionValue;
}) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(product.id);
  return (
    <Pressable
      onPress={() => router.push(`/product/${product.id}`)}
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderRadius: radius.lg,
        borderWidth: 1,
        overflow: "hidden",
        width,
        ...shadows.card,
      }}
    >
      <View>
        <Image
          source={{ uri: resolveMediaUrl(product.image) }}
          style={{ height: 168, width: "100%" }}
          contentFit="cover"
        />
        {product.badge ? (
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.pill,
              left: 8,
              paddingHorizontal: 9,
              paddingVertical: 4,
              position: "absolute",
              top: 8,
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontFamily: fonts.bold,
                letterSpacing: 0.3,
                ...typeScale.micro,
              }}
            >
              {product.badge}
            </Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => toggle(product)}
          hitSlop={8}
          accessibilityLabel={saved ? "Remove from favorites" : "Add to favorites"}
          style={{
            alignItems: "center",
            backgroundColor: colors.white,
            borderRadius: radius.pill,
            height: 36,
            justifyContent: "center",
            position: "absolute",
            right: 8,
            top: 8,
            width: 36,
            ...shadows.floating,
          }}
        >
          <Heart
            color={saved ? colors.primary : colors.muted}
            fill={saved ? colors.primary : "transparent"}
            size={18}
          />
        </Pressable>
      </View>
      <View style={{ gap: 6, padding: 12 }}>
        <Text
          numberOfLines={1}
          style={{
            color: colors.muted,
            fontFamily: fonts.semibold,
            letterSpacing: 0.6,
            ...typeScale.micro,
          }}
        >
          {(product.brand || product.category || "Pathway").toUpperCase()}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            color: colors.ink,
            fontFamily: fonts.semibold,
            minHeight: 44,
            ...typeScale.bodySmall,
          }}
        >
          {product.name}
        </Text>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 4 }}>
          <Star color={colors.star} fill={colors.star} size={13} />
          <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.caption }}>
            {product.rating.toFixed(1)}
          </Text>
        </View>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <View style={{ alignItems: "baseline", flexDirection: "row", gap: 6 }}>
            <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.price }}>
              {formatMoney(product.price)}
            </Text>
            {product.oldPrice ? (
              <Text
                style={{
                  color: colors.muted,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                  lineHeight: 17,
                  textDecorationLine: "line-through",
                }}
              >
                {formatMoney(product.oldPrice)}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() =>
              add({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
              })
            }
            hitSlop={6}
            accessibilityLabel={`Add ${product.name} to cart`}
            style={{
              alignItems: "center",
              backgroundColor: colors.primary,
              borderRadius: radius.pill,
              height: 36,
              justifyContent: "center",
              width: 36,
              ...shadows.floating,
            }}
          >
            <Plus color={colors.white} size={18} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
