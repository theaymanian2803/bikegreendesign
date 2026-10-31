import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTabBar } from "../components/AppTabBar";
import { Button } from "../components/ui/Button";
import { formatMoney } from "../lib/format";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

export default function OrderConfirmedScreen() {
  const params = useLocalSearchParams<{ publicId?: string; email?: string; total?: string }>();
  const total = Number(params.total ?? 0);

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      <View
        style={{
          alignItems: "center",
          flex: 1,
          gap: 14,
          justifyContent: "center",
          paddingHorizontal: spacing.screen,
        }}
      >
        <View
          style={{
            alignItems: "center",
            backgroundColor: colors.successSoft,
            borderRadius: radius.pill,
            height: 96,
            justifyContent: "center",
            width: 96,
          }}
        >
          <CheckCircle2 color={colors.success} size={46} />
        </View>
        <Text
          style={{
            color: colors.ink,
            fontFamily: fonts.display,
            textAlign: "center",
            ...typeScale.h1,
          }}
        >
          Thank you, your order is placed!
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontFamily: fonts.regular,
            textAlign: "center",
            ...typeScale.body,
          }}
        >
          Order <Text style={{ color: colors.ink, fontFamily: fonts.bold }}>{params.publicId}</Text>{" "}
          — a confirmation was sent to {params.email}. Our workshop will pack and ship within 24
          hours.
        </Text>
        <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.priceLg }}>
          {formatMoney(Number.isFinite(total) ? total : 0)}
        </Text>
        <View style={{ gap: 12, marginTop: 10, width: "100%" }}>
          <Button label="Track this order" onPress={() => router.replace("/track")} />
          <Button
            label="Continue shopping"
            variant="outline"
            onPress={() => router.replace("/shop")}
          />
        </View>
      </View>
      <AppTabBar />
    </SafeAreaView>
  );
}
