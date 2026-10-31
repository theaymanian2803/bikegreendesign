import { Text, View } from "react-native";

import { colors, fonts, radius, typeScale } from "../../lib/theme";

export function Badge({
  label,
  variant = "primary",
}: {
  label: string;
  variant?: "primary" | "soft" | "success";
}) {
  const background =
    variant === "primary"
      ? colors.primary
      : variant === "success"
        ? colors.successSoft
        : colors.surface;
  const color =
    variant === "primary" ? colors.white : variant === "success" ? colors.success : colors.ink;
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: background,
        borderRadius: radius.pill,
        paddingHorizontal: 11,
        paddingVertical: 5,
      }}
    >
      <Text
        style={{
          color,
          fontFamily: fonts.bold,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          ...typeScale.micro,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
