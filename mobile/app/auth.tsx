import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Mail, Phone } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTabBar } from "../components/AppTabBar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Loading } from "../components/ui/Loading";
import { useAuth } from "../lib/auth";
import { useBootstrap } from "../lib/queries";
import { colors, fonts, radius, spacing, typeScale } from "../lib/theme";

type Mode = "signin" | "register";

export default function AuthScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { user, loading, signInEmail, registerEmail, signInGuest, upgradeGuest, signOut } =
    useAuth();
  const { data } = useBootstrap();
  const supportEmail = data?.settings.storeEmail || data?.topBar?.email;
  const supportPhone = data?.settings.storePhone || data?.topBar?.phone;
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestedRedirect =
    typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//");
  const destination = requestedRedirect ? redirect : "/";

  function finish() {
    if (requestedRedirect) {
      router.replace(destination as never);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      finish();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    }
    setBusy(false);
  }

  function submit() {
    if (mode === "register") {
      void run(() => registerEmail(name.trim(), email.trim(), password));
    } else {
      void run(() => signInEmail(email.trim(), password));
    }
  }

  function submitUpgrade() {
    void run(() => upgradeGuest(name.trim(), email.trim(), password));
  }

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 18,
            paddingBottom: 30,
            paddingHorizontal: spacing.screen,
            paddingTop: 10,
          }}
          keyboardShouldPersistTaps="handled"
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
              accessibilityLabel="Go back"
            >
              <ArrowLeft color={colors.ink} size={22} />
            </Pressable>
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.titleXl }}>
              {user ? (user.isGuest ? "Guest session" : "Your account") : "Sign in"}
            </Text>
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primary,
                borderRadius: radius.md,
                borderWidth: 1,
                padding: 12,
              }}
            >
              <Text
                style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.label }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {user ? (
            <View style={{ gap: 16 }}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  gap: 6,
                  padding: 16,
                }}
              >
                <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.title }}>
                  {user.isGuest ? "Browsing as a guest" : user.name || user.email}
                </Text>
                <Text
                  style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
                >
                  {user.isGuest
                    ? "Your orders are linked to this guest session. Add an email and password to keep the account across devices."
                    : user.email}
                </Text>
              </View>

              {user.isGuest ? (
                <View style={{ gap: 12 }}>
                  <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
                    Create an account
                  </Text>
                  <Input label="Full name" value={name} onChangeText={setName} />
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <Button
                    label={busy ? "Creating account…" : "Create account"}
                    onPress={submitUpgrade}
                    loading={busy}
                    disabled={!name.trim() || !email.trim() || password.length < 8}
                  />
                </View>
              ) : null}

              <Button label="Continue" onPress={finish} />
              <Button label="Sign out" variant="outline" onPress={() => void run(signOut)} />
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.body }}>
                Sign in with your email, create an account, or continue as a guest.
              </Text>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {(
                  [
                    ["signin", "Sign in"],
                    ["register", "Create account"],
                  ] as const
                ).map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setMode(value);
                      setError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mode === value }}
                    style={{
                      alignItems: "center",
                      backgroundColor: mode === value ? colors.primary : colors.card,
                      borderColor: mode === value ? colors.primary : colors.border,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      flex: 1,
                      justifyContent: "center",
                      minHeight: 42,
                    }}
                  >
                    <Text
                      style={{
                        color: mode === value ? colors.white : colors.ink,
                        fontFamily: fonts.semibold,
                        ...typeScale.label,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ gap: 12 }}>
                {mode === "register" ? (
                  <Input label="Full name" value={name} onChangeText={setName} />
                ) : null}
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                {mode === "register" ? (
                  <Text
                    style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.caption }}
                  >
                    Use at least 8 characters.
                  </Text>
                ) : null}
                <Button
                  label={busy ? "Working…" : mode === "register" ? "Create account" : "Sign in"}
                  onPress={submit}
                  loading={busy}
                  disabled={
                    !email.trim() ||
                    !password ||
                    (mode === "register" && (!name.trim() || password.length < 8))
                  }
                />
              </View>

              {mode === "signin" ? (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    gap: 8,
                    padding: 14,
                  }}
                >
                  <Text
                    style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}
                  >
                    Forgot your password?
                  </Text>
                  <Text
                    style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.caption }}
                  >
                    Passwords are stored securely and cannot be recovered. Contact the shop and we
                    will help you set a new one, or create a new account above.
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
                    {supportEmail ? (
                      <Pressable
                        onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
                        style={{
                          alignItems: "center",
                          flexDirection: "row",
                          gap: 5,
                          minHeight: 28,
                        }}
                      >
                        <Mail color={colors.primary} size={14} />
                        <Text
                          style={{
                            color: colors.primary,
                            fontFamily: fonts.semibold,
                            ...typeScale.caption,
                          }}
                        >
                          {supportEmail}
                        </Text>
                      </Pressable>
                    ) : null}
                    {supportPhone ? (
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${supportPhone}`)}
                        style={{
                          alignItems: "center",
                          flexDirection: "row",
                          gap: 5,
                          minHeight: 28,
                        }}
                      >
                        <Phone color={colors.primary} size={14} />
                        <Text
                          style={{
                            color: colors.primary,
                            fontFamily: fonts.semibold,
                            ...typeScale.caption,
                          }}
                        >
                          {supportPhone}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {!supportEmail && !supportPhone ? (
                    <Text
                      style={{
                        color: colors.muted,
                        fontFamily: fonts.regular,
                        ...typeScale.caption,
                      }}
                    >
                      Use the contact details on the website.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
                <View style={{ backgroundColor: colors.border, flex: 1, height: 1 }} />
                <Text
                  style={{ color: colors.muted, fontFamily: fonts.semibold, ...typeScale.micro }}
                >
                  OR
                </Text>
                <View style={{ backgroundColor: colors.border, flex: 1, height: 1 }} />
              </View>

              <Button
                label={busy ? "Starting…" : "Continue as guest"}
                variant="outline"
                onPress={() => void run(signInGuest)}
                loading={busy}
              />
              <Text
                style={{
                  color: colors.muted,
                  fontFamily: fonts.regular,
                  textAlign: "center",
                  ...typeScale.caption,
                }}
              >
                Guest sessions are saved to the store so your order can be linked to you.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      <AppTabBar />
    </SafeAreaView>
  );
}
