import { Text, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from "react-native";

import { colors, fonts, radius, typeScale } from "../../lib/theme";

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  autoCapitalize,
  autoCorrect,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      {label ? (
        <Text style={{ color: colors.muted, fontFamily: fonts.semibold, ...typeScale.label }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.md,
          borderWidth: 1,
          color: colors.ink,
          fontFamily: fonts.regular,
          minHeight: multiline ? 108 : 50,
          paddingHorizontal: 15,
          paddingVertical: 13,
          textAlignVertical: multiline ? "top" : "center",
          ...typeScale.bodyLg,
        }}
      />
    </View>
  );
}
