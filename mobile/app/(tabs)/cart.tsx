import { Image } from "expo-image";
import { router } from "expo-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { resolveMediaUrl } from "../../lib/api";
import { useCart } from "../../lib/cart";
import { formatMoney } from "../../lib/format";
import { useBootstrap } from "../../lib/queries";
import { colors, fonts, radius, shadows, spacing, typeScale } from "../../lib/theme";

export default function CartScreen() {
  const { items, count, subtotal, setQty, remove } = useCart();
  const { data } = useBootstrap();
  const threshold = (data?.settings.freeShippingThresholdCents ?? 30000) / 100;
  const flat = (data?.settings.flatShippingCents ?? 1900) / 100;
  const shipping = subtotal === 0 || subtotal >= threshold ? 0 : flat;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{
          alignItems: "center",
          backgroundColor: colors.background,
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: spacing.screen,
        }}
      >
        <ShoppingCart color={colors.primary} size={44} />
        <EmptyState
          message="Your cart is empty"
          hint="Browse the workshop shelves and add some parts to get rolling."
        />
        <Button label="Start shopping" onPress={() => router.push("/shop")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          gap: 16,
          paddingBottom: 30,
          paddingHorizontal: spacing.screen,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h1 }}>
            Cart
          </Text>
          <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.label }}>
            {count} {count === 1 ? "item" : "items"}
          </Text>
        </View>

        {items.map((item) => (
          <View
            key={item.id}
            style={{
              alignItems: "center",
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              flexDirection: "row",
              gap: 12,
              padding: 12,
              ...shadows.card,
            }}
          >
            <Pressable onPress={() => router.push(`/product/${item.id}`)}>
              <Image
                source={{ uri: resolveMediaUrl(item.image) }}
                style={{ borderRadius: radius.sm, height: 72, width: 72 }}
                contentFit="cover"
              />
            </Pressable>
            <View style={{ flex: 1, gap: 5 }}>
              <Text
                numberOfLines={2}
                style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}
              >
                {item.name}
              </Text>
              <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.price }}>
                {formatMoney(item.price)}
              </Text>
              <View style={{ alignItems: "center", flexDirection: "row", gap: 10, marginTop: 2 }}>
                <Pressable
                  onPress={() => setQty(item.id, item.qty - 1)}
                  style={{
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: radius.pill,
                    height: 32,
                    justifyContent: "center",
                    width: 32,
                  }}
                >
                  <Minus color={colors.ink} size={15} />
                </Pressable>
                <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}>
                  {item.qty}
                </Text>
                <Pressable
                  onPress={() => setQty(item.id, item.qty + 1)}
                  style={{
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: radius.pill,
                    height: 32,
                    justifyContent: "center",
                    width: 32,
                  }}
                >
                  <Plus color={colors.ink} size={15} />
                </Pressable>
              </View>
            </View>
            <Pressable onPress={() => remove(item.id)} style={{ padding: 8 }}>
              <Trash2 color={colors.primary} size={20} />
            </Pressable>
          </View>
        ))}

        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderWidth: 1,
            gap: 10,
            padding: 18,
            ...shadows.card,
          }}
        >
          <Row label="Subtotal" value={formatMoney(subtotal)} />
          <Row label="Shipping" value={shipping === 0 ? "Free" : formatMoney(shipping)} />
          <View style={{ backgroundColor: colors.border, height: 1, marginVertical: 4 }} />
          <Row label="Total" value={formatMoney(total)} strong />
          <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.caption }}>
            Free delivery over {formatMoney(threshold)}.
          </Text>
        </View>

        <Button label="Proceed to checkout" onPress={() => router.push("/checkout")} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text
        style={{
          color: strong ? colors.ink : colors.muted,
          fontFamily: strong ? fonts.bold : fonts.regular,
          ...(strong ? typeScale.title : typeScale.bodySmall),
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.ink,
          fontFamily: strong ? fonts.bold : fonts.semibold,
          ...(strong ? typeScale.price : typeScale.bodySmall),
        }}
      >
        {value}
      </Text>
    </View>
  );
}
