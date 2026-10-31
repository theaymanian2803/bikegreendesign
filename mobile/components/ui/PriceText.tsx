import { Text, View } from "react-native";

import { formatMoney } from "../../lib/format";
import { colors, fonts, typeScale } from "../../lib/theme";

export function PriceText({
  value,
  old,
  size = typeScale.price.fontSize,
}: {
  value: number;
  old?: number;
  size?: number;
}) {
  return (
    <View style={{ alignItems: "baseline", flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Text
        style={{
          color: colors.primary,
          fontFamily: fonts.bold,
          fontSize: size,
          lineHeight: size + 6,
        }}
      >
        {formatMoney(value)}
      </Text>
      {old && old > value ? (
        <Text
          style={{
            color: colors.muted,
            fontFamily: fonts.regular,
            fontSize: size - 4,
            lineHeight: size + 2,
            textDecorationLine: "line-through",
          }}
        >
          {formatMoney(old)}
        </Text>
      ) : null}
    </View>
  );
}
