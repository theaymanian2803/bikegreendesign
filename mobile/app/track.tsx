import { router } from "expo-router";
import { ArrowLeft, PackageSearch } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTabBar } from "../components/AppTabBar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { formatMoney, formatStatus } from "../lib/format";
import { useTrackOrders } from "../lib/queries";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

export default function TrackScreen() {
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState("");
  const { data, isFetching, isError } = useTrackOrders(searched);

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 16,
          paddingBottom: 30,
          paddingHorizontal: spacing.screen,
          paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              alignItems: "center",
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.pill,
              borderWidth: 1,
              height: 40,
              justifyContent: "center",
              width: 40,
            }}
          >
            <ArrowLeft color={colors.ink} size={22} />
          </Pressable>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.titleXl }}>
            Track order
          </Text>
        </View>

        <View style={{ alignItems: "center", paddingVertical: 10 }}>
          <View
            style={{
              alignItems: "center",
              backgroundColor: colors.primarySoft,
              borderRadius: radius.pill,
              height: 88,
              justifyContent: "center",
              width: 88,
            }}
          >
            <PackageSearch color={colors.primary} size={38} />
          </View>
        </View>
        <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.body }}>
          Enter the phone number you used at checkout to see your orders and their delivery status.
        </Text>
        <Input
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+1 555 010 2233"
        />
        <Button
          label={isFetching ? "Searching…" : "Find my orders"}
          onPress={() => setSearched(phone.trim())}
          loading={isFetching}
          disabled={phone.trim().length < 4}
        />

        {isError ? (
          <Text style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.label }}>
            Could not load orders. Check the number and try again.
          </Text>
        ) : null}

        {searched && !isFetching && !isError && (data?.length ?? 0) === 0 ? (
          <EmptyState
            message="No orders found"
            hint={`We could not find an order for ${searched}. Try the number used at checkout.`}
          />
        ) : null}

        {data?.map((order) => (
          <View
            key={order.id}
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              gap: 10,
              padding: 17,
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.title }}>
                {order.publicId}
              </Text>
              <Badge
                label={formatStatus(order.status)}
                variant={
                  order.status === "delivered"
                    ? "success"
                    : order.status === "cancelled"
                      ? "primary"
                      : "soft"
                }
              />
            </View>
            <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.caption }}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
            {order.items.map((item, index) => (
              <View
                key={`${order.id}-${index}`}
                style={{ flexDirection: "row", gap: 12, justifyContent: "space-between" }}
              >
                <Text
                  style={{
                    color: colors.muted,
                    flex: 1,
                    fontFamily: fonts.regular,
                    ...typeScale.bodySmall,
                  }}
                >
                  {item.qty} × {item.name}
                </Text>
                <Text
                  style={{ color: colors.ink, fontFamily: fonts.medium, ...typeScale.bodySmall }}
                >
                  {formatMoney((item.priceCents * item.qty) / 100)}
                </Text>
              </View>
            ))}
            <View
              style={{
                borderTopColor: colors.border,
                borderTopWidth: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 10,
              }}
            >
              <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.bodyLg }}>
                Total
              </Text>
              <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.price }}>
                {formatMoney(order.totalCents / 100)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <AppTabBar />
    </SafeAreaView>
  );
}
