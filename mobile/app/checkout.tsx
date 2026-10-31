import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTabBar } from "../components/AppTabBar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { formatMoney } from "../lib/format";
import { useBootstrap, usePlaceOrder } from "../lib/queries";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

export default function CheckoutScreen() {
  const { items, subtotal, clear } = useCart();
  const { data } = useBootstrap();
  const { user, loading: authLoading, signInGuest } = useAuth();
  const placeOrder = usePlaceOrder();
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    country: "United States",
    notes: "",
  });

  const threshold = (data?.settings.freeShippingThresholdCents ?? 30000) / 100;
  const flat = (data?.settings.flatShippingCents ?? 1900) / 100;
  const shipping = subtotal === 0 || subtotal >= threshold ? 0 : flat;
  const total = subtotal + shipping;

  useEffect(() => {
    if (!user) return;
    const [firstName = "", ...rest] = user.name.split(" ");
    setForm((prev) => ({
      ...prev,
      email: prev.email || (user.isGuest ? "" : user.email),
      firstName: prev.firstName || (user.isGuest ? "" : firstName),
      lastName: prev.lastName || (user.isGuest ? "" : rest.join(" ")),
    }));
  }, [user]);

  async function continueAsGuest() {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInGuest();
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "Could not start a guest session.");
    }
    setAuthBusy(false);
  }

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (items.length === 0) return;
    placeOrder.mutate(
      {
        ...form,
        notes: form.notes || undefined,
        items: items.map((item) => ({ name: item.name, price: item.price, qty: item.qty })),
      },
      {
        onSuccess: (order) => {
          clear();
          router.replace({
            pathname: "/order-confirmed",
            params: {
              publicId: order.publicId,
              email: order.email,
              total: String(order.total),
            },
          });
        },
      },
    );
  }

  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.phone.trim().length >= 6 &&
    form.address.trim() &&
    form.city.trim() &&
    form.postcode.trim() &&
    form.country.trim() &&
    items.length > 0;

  if (authLoading) {
    return (
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
        <Loading />
        <AppTabBar />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 18,
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
              Checkout
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              gap: 14,
              padding: 18,
            }}
          >
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
              Sign in to check out
            </Text>
            <Text
              style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
            >
              Use your email account or continue as a guest. Either way, your order is linked to a
              real session in the store.
            </Text>
            <Button
              label="Sign in or create account"
              onPress={() => router.push({ pathname: "/auth", params: { redirect: "/checkout" } })}
            />
            <Button
              label={authBusy ? "Starting…" : "Continue as guest"}
              variant="outline"
              onPress={continueAsGuest}
              loading={authBusy}
            />
            {authError ? (
              <Text
                style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.label }}
              >
                {authError}
              </Text>
            ) : null}
          </View>
        </ScrollView>
        <AppTabBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 18,
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
            Checkout
          </Text>
        </View>

        <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.label }}>
          {user.isGuest ? "Checking out as a guest" : `Signed in as ${user.email}`}
        </Text>

        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
            Contact & delivery
          </Text>
          <Input
            label="First name"
            value={form.firstName}
            onChangeText={(v) => set("firstName", v)}
          />
          <Input label="Last name" value={form.lastName} onChangeText={(v) => set("lastName", v)} />
          <Input
            label="Email"
            value={form.email}
            onChangeText={(v) => set("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChangeText={(v) => set("phone", v)}
            keyboardType="phone-pad"
          />
          <Input
            label="Street address"
            value={form.address}
            onChangeText={(v) => set("address", v)}
          />
          <Input label="City" value={form.city} onChangeText={(v) => set("city", v)} />
          <Input
            label="Postal code"
            value={form.postcode}
            onChangeText={(v) => set("postcode", v)}
          />
          <Input label="Country" value={form.country} onChangeText={(v) => set("country", v)} />
          <Input
            label="Order notes (optional)"
            value={form.notes}
            onChangeText={(v) => set("notes", v)}
            multiline
          />
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderWidth: 1,
            gap: 9,
            padding: 18,
          }}
        >
          <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
            Order summary
          </Text>
          {items.map((item) => (
            <View
              key={item.id}
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
              <Text style={{ color: colors.ink, fontFamily: fonts.medium, ...typeScale.bodySmall }}>
                {formatMoney(item.price * item.qty)}
              </Text>
            </View>
          ))}
          <View style={{ backgroundColor: colors.border, height: 1, marginVertical: 4 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text
              style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
            >
              Shipping
            </Text>
            <Text style={{ color: colors.ink, fontFamily: fonts.medium, ...typeScale.bodySmall }}>
              {shipping === 0 ? "Free" : formatMoney(shipping)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.title }}>
              Total
            </Text>
            <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.price }}>
              {formatMoney(total)}
            </Text>
          </View>
        </View>

        {placeOrder.isError ? (
          <Text style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.label }}>
            {placeOrder.error instanceof Error
              ? placeOrder.error.message
              : "Could not place order."}
          </Text>
        ) : null}

        <Button
          label={placeOrder.isPending ? "Placing order…" : "Place order"}
          onPress={submit}
          loading={placeOrder.isPending}
          disabled={!canSubmit}
        />
        <Text
          style={{
            color: colors.muted,
            fontFamily: fonts.regular,
            textAlign: "center",
            ...typeScale.caption,
          }}
        >
          Pay on delivery. Our workshop confirms every order by phone.
        </Text>
      </ScrollView>
      <AppTabBar />
    </SafeAreaView>
  );
}
