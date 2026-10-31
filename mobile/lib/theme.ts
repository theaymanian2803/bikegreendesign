/**
 * Mobile design tokens — mirrors `src/styles.css` on the web.
 *
 * Every colour here is the sRGB equivalent of an `oklch()` token in the web
 * theme; React Native has no oklch support, so the values are pre-converted.
 * Web and mobile must move together: change one, change the other.
 *
 * | web token            | oklch                  | here |
 * | -------------------- | ---------------------- | ---- |
 * | --background         | 0.967 0.014 89         | background |
 * | --surface            | 0.93 0.014 88          | surface |
 * | --card               | 0.99 0.009 88          | card |
 * | --border             | 0.86 0.018 88          | border |
 * | --ink                | 0.22 0.03 154          | ink |
 * | --muted-foreground   | 0.52 0.025 151         | muted |
 * | --primary            | 0.56 0.13 39           | primary |
 * | --secondary          | 0.35 0.07 157          | secondary |
 * | --accent             | 0.9 0.045 111          | accent |
 */
export const colors = {
  // Surfaces
  background: "#F8F4EA",
  surface: "#ECE8DE",
  card: "#FEFCF5",
  border: "#D6D1C4",
  white: "#FFFFFF",
  overlay: "rgba(15,31,20,0.45)",

  // Text
  ink: "#0F1F14",
  inkForeground: "#F9F5EB",
  muted: "#5F6D62",

  // Brand — terracotta
  primary: "#B35536",
  primaryDark: "#9E4B30",
  primarySoft: "#F1E3D9",
  primaryForeground: "#FCFAF4",
  sale: "#B35536",

  // Deep green
  secondary: "#13452B",
  secondaryForeground: "#F9F5EB",
  topbar: "#13452B",
  topbarForeground: "#EFEBE0",

  // Pale lime
  accent: "#DFE1C0",
  accentForeground: "#133922",

  // Feedback
  success: "#145B39",
  successSoft: "#DEE3D9",
  destructive: "#B93F33",
  star: "#DC9E2F",
};

export const fonts = {
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
  display: "SpaceGrotesk_700Bold",
  displaySemibold: "SpaceGrotesk_600SemiBold",
};

/** The web design is near-square: a 4px base radius, not the old 12–28px set. */
export const radius = {
  sm: 2,
  md: 4,
  lg: 6,
  xl: 10,
  pill: 999,
};

export const spacing = {
  screen: 18,
  section: 20,
  card: 14,
  gap: 12,
  touch: 48,
};

export const typeScale = {
  micro: { fontSize: 11, lineHeight: 15 },
  caption: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 13, lineHeight: 18 },
  bodySmall: { fontSize: 14, lineHeight: 21 },
  body: { fontSize: 15, lineHeight: 23 },
  bodyLg: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 17, lineHeight: 23 },
  titleLg: { fontSize: 19, lineHeight: 26 },
  h3: { fontSize: 20, lineHeight: 27 },
  h2: { fontSize: 23, lineHeight: 29 },
  titleXl: { fontSize: 26, lineHeight: 32 },
  h1: { fontSize: 29, lineHeight: 35 },
  display: { fontSize: 32, lineHeight: 38 },
  price: { fontSize: 18, lineHeight: 24 },
  priceLg: { fontSize: 28, lineHeight: 34 },
};

export const shadows = {
  card: {
    elevation: 2,
    shadowColor: "#0F1F14",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  floating: {
    elevation: 4,
    shadowColor: "#0F1F14",
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
};
