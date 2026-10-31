import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Pathway",
  slug: "pathway-mobile",
  scheme: "pathway",
  userInterfaceStyle: "light",
  ios: { supportsTablet: true, bundleIdentifier: "shop.pathway.mobile" },
  android: { package: "shop.pathway.mobile" },
  plugins: ["expo-router", "expo-secure-store"],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8080",
  },
};

export default config;
