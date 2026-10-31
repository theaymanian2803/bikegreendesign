import { router, usePathname } from "expo-router";
import { Heart, Home, Menu, ShoppingBag, ShoppingCart } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "../lib/cart";
import { useFavorites } from "../lib/favorites";
import { colors, fonts, radius, typeScale } from "../lib/theme";

type TabKey = "home" | "shop" | "saved" | "cart" | "menu";

const items = [
  { key: "home", label: "Home", href: "/", icon: Home },
  { key: "shop", label: "Shop", href: "/shop", icon: ShoppingBag },
  { key: "saved", label: "Saved", href: "/favorites", icon: Heart },
  { key: "cart", label: "Cart", href: "/cart", icon: ShoppingCart },
  { key: "menu", label: "Menu", href: "/menu", icon: Menu },
] as const;

function activeKey(pathname: string): TabKey {
  if (pathname === "/auth") return "menu";
  if (pathname.startsWith("/product")) return "shop";
  if (pathname === "/checkout" || pathname === "/order-confirmed") return "cart";
  if (pathname === "/track") return "menu";
  if (pathname === "/shop") return "shop";
  if (pathname === "/favorites") return "saved";
  if (pathname === "/cart") return "cart";
  if (pathname === "/menu") return "menu";
  return "home";
}

export function AppTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { count: cartCount } = useCart();
  const { count: favoriteCount } = useFavorites();
  const active = activeKey(pathname);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        flexDirection: "row",
        paddingBottom: Math.max(insets.bottom, 8),
        paddingHorizontal: 4,
        paddingTop: 6,
      }}
    >
      {items.map((item) => {
        const selected = item.key === active;
        const Icon = item.icon;
        const badge = item.key === "cart" ? cartCount : item.key === "saved" ? favoriteCount : 0;
        return (
          <Pressable
            key={item.key}
            onPress={() => router.navigate(item.href)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            style={{
              alignItems: "center",
              flex: 1,
              gap: 2,
              justifyContent: "center",
              minHeight: 50,
            }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: selected ? colors.primarySoft : "transparent",
                borderRadius: radius.pill,
                height: 30,
                justifyContent: "center",
                width: 52,
              }}
            >
              <Icon
                color={selected ? colors.primary : colors.muted}
                size={22}
                strokeWidth={selected ? 2.4 : 2}
              />
              {badge > 0 ? (
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
                    right: 1,
                    top: -3,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontFamily: fonts.bold,
                      fontSize: 10,
                      lineHeight: 13,
                    }}
                  >
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={{
                color: selected ? colors.primary : colors.muted,
                fontFamily: selected ? fonts.bold : fonts.semibold,
                ...typeScale.micro,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
