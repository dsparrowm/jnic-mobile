/** JNIC brand tokens — mobile-native scale (mirrors web brand, not web layout) */

export const colors = {
  bgBase: "#F4F6FB",
  bgSurface: "#FFFFFF",
  bgSubtle: "#EEF1F8",
  navy: "#0D1B3E",
  navyDeep: "#081229",
  navyMuted: "#1A2B52",
  textPrimary: "#111827",
  textMuted: "#6B7280",
  textOnNavy: "#F8FAFC",
  textOnNavyMuted: "rgba(248, 250, 252, 0.68)",
  gold: "#C9A050",
  goldHover: "#B8903A",
  goldSoft: "rgba(201, 160, 80, 0.16)",
  goldGlow: "rgba(201, 160, 80, 0.14)",
  goldBorder: "rgba(201, 160, 80, 0.35)",
  goldForeground: "#FFFFFF",
  border: "#E5E7EB",
  borderSubtle: "#EEF0F4",
  success: "#16A34A",
  successSoft: "rgba(22, 163, 74, 0.12)",
  warning: "#D97706",
  warningSoft: "rgba(217, 119, 6, 0.12)",
  error: "#DC2626",
  errorSoft: "rgba(220, 38, 38, 0.10)",
  info: "#2563EB",
  infoSoft: "rgba(37, 99, 235, 0.10)",
  overlay: "rgba(8, 18, 41, 0.45)",
  navyGlow: "rgba(26, 43, 82, 0.90)",
  whiteGlow: "rgba(255, 255, 255, 0.04)",
  previewBackdrop: "#111827",
  previewBorder: "#1F2937",
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

export const typography = {
  display: { fontSize: 34, fontWeight: "700" as const, letterSpacing: -0.6, lineHeight: 40 },
  title1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.4, lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3, lineHeight: 28 },
  title3: { fontSize: 18, fontWeight: "600" as const, letterSpacing: -0.2, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  callout: { fontSize: 15, fontWeight: "400" as const, lineHeight: 21 },
  footnote: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16, letterSpacing: 0.2 },
  overline: {
    fontSize: 11,
    fontWeight: "600" as const,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
};

export const shadow = {
  soft: {
    boxShadow: "0 8px 24px rgba(13, 27, 62, 0.08)",
    shadowColor: "#0D1B3E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  float: {
    boxShadow: "0 12px 28px rgba(13, 27, 62, 0.14)",
    shadowColor: "#0D1B3E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export const layout = {
  screenPad: 20,
  tabBarHeight: 64,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;
