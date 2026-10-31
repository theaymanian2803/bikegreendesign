import { ActivityIndicator, View } from "react-native";

import { colors } from "../../lib/theme";

export function Loading() {
  return (
    <View style={{ alignItems: "center", flex: 1, justifyContent: "center", paddingVertical: 60 }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
