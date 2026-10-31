import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../../lib/theme";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.screen }}>{children}</View>
    </SafeAreaView>
  );
}
