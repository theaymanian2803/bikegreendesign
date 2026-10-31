import { Text, View } from "react-native";

import { colors, fonts, typeScale } from "../../lib/theme";

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <View style={{ alignItems: "center", paddingHorizontal: 12, paddingVertical: 40 }}>
      <Text
        style={{
          color: colors.ink,
          fontFamily: fonts.display,
          textAlign: "center",
          ...typeScale.titleLg,
        }}
      >
        {message}
      </Text>
      {hint ? (
        <Text
          style={{
            color: colors.muted,
            fontFamily: fonts.regular,
            marginTop: 8,
            textAlign: "center",
            ...typeScale.bodySmall,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
