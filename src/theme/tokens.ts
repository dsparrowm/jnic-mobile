/** JNIC brand tokens — mobile-native scale. Midnight Executive theme: deep navy
 * surfaces, gold as the single accent, serif display numerals. */

export const colors = {
  bgBase: "#070D1F",
  bgSurface: "#0D1730",
  bgSubtle: "#131F42",
  navy: "#0D1B3E",
  navyDeep: "#04081A",
  navyMuted: "#16244B",
  textPrimary: "#E9EDF7",
  textMuted: "#7E8AAB",
  textOnNavy: "#F4F6FC",
  textOnNavyMuted: "rgba(233, 237, 247, 0.62)",
  gold: "#C9A050",
  /** Gold brightened for text/icons on dark surfaces (4.5:1+ contrast). */
  goldText: "#D9B870",
  goldHover: "#B8903A",
  goldSoft: "rgba(201, 160, 80, 0.14)",
  goldGlow: "rgba(201, 160, 80, 0.10)",
  goldBorder: "rgba(201, 160, 80, 0.35)",
  goldForeground: "#0A1020",
  border: "#1B2748",
  borderSubtle: "#141E3D",
  success: "#4ADE80",
  successSoft: "rgba(74, 222, 128, 0.14)",
  warning: "#FCD34D",
  warningSoft: "rgba(217, 119, 6, 0.20)",
  error: "#FCA5A5",
  errorSoft: "rgba(220, 38, 38, 0.18)",
  /** Error red for filled/icon usage on dark surfaces. */
  errorOnNavy: "#FCA5A5",
  info: "#93C5FD",
  infoSoft: "rgba(37, 99, 235, 0.20)",
  overlay: "rgba(4, 8, 26, 0.62)",
  navyGlow: "rgba(22, 36, 75, 0.90)",
  whiteGlow: "rgba(233, 237, 247, 0.06)",
  previewBackdrop: "#04081A",
  previewBorder: "#141E3D",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

/** Weight-keyed Plus Jakarta Sans families (loaded in app/_layout.tsx). */
export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  /** Fraunces — editorial serif for KPI numerals and display figures. */
  display: "Fraunces_500Medium",
  displayStrong: "Fraunces_600SemiBold",
} as const;

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: "700" as const,
    fontFamily: fonts.bold,
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  title1: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: fonts.bold,
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: fonts.bold,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  title3: {
    fontSize: 18,
    fontWeight: "600" as const,
    fontFamily: fonts.semibold,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    fontFamily: fonts.regular,
    lineHeight: 22,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: fonts.semibold,
    lineHeight: 22,
  },
  callout: {
    fontSize: 15,
    fontWeight: "400" as const,
    fontFamily: fonts.regular,
    lineHeight: 21,
  },
  footnote: {
    fontSize: 13,
    fontWeight: "400" as const,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    fontFamily: fonts.medium,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  overline: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: fonts.semibold,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  /** Serif figure for large KPI numerals (Fraunces). */
  numeral: {
    fontSize: 26,
    fontWeight: "500" as const,
    fontFamily: fonts.display,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
};

export const shadow = {
  soft: {
    boxShadow: "0 8px 24px rgba(4, 8, 26, 0.45)",
    shadowColor: "#04081A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 4,
  },
  float: {
    boxShadow: "0 12px 28px rgba(4, 8, 26, 0.6)",
    shadowColor: "#04081A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 8,
  },
};

export const layout = {
  screenPad: 20,
  tabBarHeight: 64,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;
