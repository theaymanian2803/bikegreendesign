import { router } from "expo-router";
import * as Linking from "expo-linking";
import {
  ChevronRight,
  Globe,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  ShoppingBag,
  UserRound,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiBaseUrl } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useBootstrap } from "../../lib/queries";
import { colors, fonts, radius, spacing, typeScale } from "../../lib/theme";

export default function MenuScreen() {
  const { data } = useBootstrap();
  const { user, loading, signInGuest, signOut } = useAuth();
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const topBar = data?.topBar;

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

  async function leaveAccount() {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut();
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "Could not sign out.");
    }
    setAuthBusy(false);
  }

  const links = [
    { label: "Track an order", href: "/track", icon: PackageSearch },
    { label: "Browse the shop", href: "/shop", icon: ShoppingBag },
  ] as const;

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          gap: 18,
          paddingBottom: 30,
          paddingHorizontal: spacing.screen,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h1 }}>Menu</Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderWidth: 1,
            gap: 12,
            padding: 16,
          }}
        >
          {loading ? (
            <Text
              style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
            >
              Checking your session…
            </Text>
          ) : user ? (
            <>
              <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: colors.primarySoft,
                    borderRadius: radius.pill,
                    height: 42,
                    justifyContent: "center",
                    width: 42,
                  }}
                >
                  <UserRound color={colors.primary} size={21} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}
                  >
                    {user.isGuest ? "Guest session" : user.name || user.email}
                  </Text>
                  <Text
                    style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.caption }}
                  >
                    {user.isGuest ? "Add an email to keep your orders" : user.email}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: user.isGuest ? colors.surface : colors.successSoft,
                    borderRadius: radius.pill,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                  }}
                >
                  <Text
                    style={{
                      color: user.isGuest ? colors.muted : colors.success,
                      fontFamily: fonts.bold,
                      ...typeScale.micro,
                    }}
                  >
                    {user.isGuest ? "GUEST" : "SIGNED IN"}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => router.push("/auth")}
                  style={{
                    alignItems: "center",
                    borderColor: colors.border,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    flex: 1,
                    flexDirection: "row",
                    gap: 7,
                    justifyContent: "center",
                    minHeight: 42,
                  }}
                >
                  <UserRound color={colors.ink} size={16} />
                  <Text
                    style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.label }}
                  >
                    {user.isGuest ? "Create account" : "Manage account"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={leaveAccount}
                  disabled={authBusy}
                  style={{
                    alignItems: "center",
                    borderColor: colors.border,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    flexDirection: "row",
                    gap: 7,
                    justifyContent: "center",
                    minHeight: 42,
                    opacity: authBusy ? 0.5 : 1,
                    paddingHorizontal: 14,
                  }}
                >
                  <LogOut color={colors.muted} size={16} />
                  <Text
                    style={{ color: colors.muted, fontFamily: fonts.semibold, ...typeScale.label }}
                  >
                    Sign out
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}>
                Sign in or continue as a guest
              </Text>
              <Pressable
                onPress={() => router.push("/auth")}
                style={{
                  alignItems: "center",
                  backgroundColor: colors.primary,
                  borderRadius: radius.pill,
                  flexDirection: "row",
                  gap: 8,
                  justifyContent: "center",
                  minHeight: 46,
                }}
              >
                <UserRound color={colors.white} size={17} />
                <Text style={{ color: colors.white, fontFamily: fonts.bold, ...typeScale.body }}>
                  Sign in with email
                </Text>
              </Pressable>
              <Pressable
                onPress={continueAsGuest}
                disabled={authBusy}
                style={{
                  alignItems: "center",
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  flexDirection: "row",
                  gap: 8,
                  justifyContent: "center",
                  minHeight: 46,
                  opacity: authBusy ? 0.5 : 1,
                }}
              >
                <LogIn color={colors.ink} size={17} />
                <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.body }}>
                  {authBusy ? "Starting…" : "Continue as guest"}
                </Text>
              </Pressable>
            </View>
          )}
          {authError ? (
            <Text
              style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.caption }}
            >
              {authError}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderWidth: 1,
            overflow: "hidden",
          }}
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href)}
                style={{
                  alignItems: "center",
                  borderBottomColor: colors.border,
                  borderBottomWidth: 1,
                  flexDirection: "row",
                  gap: 14,
                  minHeight: 56,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: colors.primarySoft,
                    borderRadius: radius.pill,
                    height: 36,
                    justifyContent: "center",
                    width: 36,
                  }}
                >
                  <Icon color={colors.primary} size={19} />
                </View>
                <Text
                  style={{
                    color: colors.ink,
                    flex: 1,
                    fontFamily: fonts.medium,
                    ...typeScale.bodyLg,
                  }}
                >
                  {link.label}
                </Text>
                <ChevronRight color={colors.muted} size={19} />
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => Linking.openURL(apiBaseUrl())}
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: 14,
              minHeight: 56,
              padding: 16,
            }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: colors.primarySoft,
                borderRadius: radius.pill,
                height: 36,
                justifyContent: "center",
                width: 36,
              }}
            >
              <Globe color={colors.primary} size={19} />
            </View>
            <Text
              style={{ color: colors.ink, flex: 1, fontFamily: fonts.medium, ...typeScale.bodyLg }}
            >
              Open the full website
            </Text>
            <ChevronRight color={colors.muted} size={19} />
          </Pressable>
        </View>

        {topBar ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              gap: 12,
              padding: 18,
            }}
          >
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.titleLg }}>
              Visit the workshop
            </Text>
            {topBar.location ? (
              <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
                <MapPin color={colors.primary} size={18} />
                <Text
                  style={{
                    color: colors.muted,
                    flex: 1,
                    fontFamily: fonts.regular,
                    ...typeScale.bodySmall,
                  }}
                >
                  {topBar.location}
                </Text>
              </View>
            ) : null}
            {topBar.phone ? (
              <Pressable
                onPress={() => Linking.openURL(`tel:${topBar.phone}`)}
                style={{ alignItems: "center", flexDirection: "row", gap: 12, minHeight: 32 }}
              >
                <Phone color={colors.primary} size={18} />
                <Text
                  style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
                >
                  {topBar.phone}
                </Text>
              </Pressable>
            ) : null}
            {topBar.email ? (
              <Pressable
                onPress={() => Linking.openURL(`mailto:${topBar.email}`)}
                style={{ alignItems: "center", flexDirection: "row", gap: 12, minHeight: 32 }}
              >
                <Mail color={colors.primary} size={18} />
                <Text
                  style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
                >
                  {topBar.email}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text
          style={{
            color: colors.muted,
            fontFamily: fonts.regular,
            textAlign: "center",
            ...typeScale.caption,
          }}
        >
          Pathway Bike Shop · Ride further.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
