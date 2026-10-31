import { CheckCircle2 } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { useSubscribeNewsletter } from "../../lib/queries";
import { colors, fonts, radius, typeScale } from "../../lib/theme";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const subscribe = useSubscribeNewsletter();

  function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    subscribe.mutate(email.trim());
  }

  if (subscribe.isSuccess) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: colors.successSoft,
          borderRadius: radius.lg,
          gap: 10,
          padding: 22,
        }}
      >
        <CheckCircle2 color={colors.success} size={34} />
        <Text
          style={{
            color: colors.ink,
            fontFamily: fonts.bold,
            textAlign: "center",
            ...typeScale.body,
          }}
        >
          You're on the list. Thanks for subscribing!
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.xl,
        borderWidth: 1,
        gap: 12,
        padding: 20,
      }}
    >
      <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
        Join the Pathway newsletter
      </Text>
      <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}>
        New arrivals, workshop tips and member-only offers, straight to your inbox.
      </Text>
      <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (invalid) setInvalid(false);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Your email address"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.pill,
            color: colors.ink,
            flex: 1,
            fontFamily: fonts.regular,
            minHeight: 48,
            paddingHorizontal: 16,
            paddingVertical: 12,
            ...typeScale.body,
          }}
        />
        <Pressable
          onPress={submit}
          disabled={subscribe.isPending}
          style={{
            alignItems: "center",
            backgroundColor: colors.primary,
            borderRadius: radius.pill,
            justifyContent: "center",
            minHeight: 48,
            paddingHorizontal: 18,
            paddingVertical: 12,
          }}
        >
          {subscribe.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={{ color: colors.white, fontFamily: fonts.bold, ...typeScale.body }}>
              Subscribe
            </Text>
          )}
        </Pressable>
      </View>
      {invalid ? (
        <Text style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.label }}>
          Enter a valid email address.
        </Text>
      ) : null}
      {subscribe.isError ? (
        <Text style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.label }}>
          {subscribe.error instanceof Error ? subscribe.error.message : "Could not subscribe."}
        </Text>
      ) : null}
    </View>
  );
}
