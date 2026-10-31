import { ActivityIndicator, Pressable, Text } from "react-native";

import { colors, fonts, radius, typeScale } from "../../lib/theme";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "light";
  disabled?: boolean;
  loading?: boolean;
}) {
  const background =
    variant === "primary" ? colors.primary : variant === "light" ? colors.white : "transparent";
  const textColor =
    variant === "primary" ? colors.white : variant === "light" ? colors.ink : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        alignItems: "center",
        backgroundColor: background,
        borderColor: variant === "outline" ? colors.border : background,
        borderRadius: radius.pill,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 50,
        opacity: disabled ? 0.5 : 1,
        paddingHorizontal: 20,
        paddingVertical: 14,
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontFamily: fonts.bold, ...typeScale.body }}>{label}</Text>
      )}
    </Pressable>
  );
}
