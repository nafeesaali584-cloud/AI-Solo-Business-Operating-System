/** Exact Color Tokens from user specification */
export const COLOR_TOKENS = {
  dark: {
    bg: "#0a0a0a",
    cardBg: "#131313",
    border: "#2a2a2a",
    accent: "#da4d01",
    accentSoftBg: "rgba(218, 77, 1, 0.14)",
    accentBorder: "rgba(218, 77, 1, 0.35)",
    textPrimary: "#fafafa",
    textMuted: "#9c9c9c",
    textExtraMuted: "#6e6e6e",
    textBody: "#c9c9c9",
    textSecondaryBody: "#d0d0d0",
  },
  light: {
    bg: "#ffffff",
    cardBg: "#f6f4ef",
    border: "#e3ded2",
    accent: "#da4d01",
    accentSoftBg: "rgba(218, 77, 1, 0.10)",
    accentBorder: "rgba(218, 77, 1, 0.40)",
    textPrimary: "#161513",
    textMuted: "#6b665c",
    textExtraMuted: "#8c8779",
    textBody: "#3a362f",
    textSecondaryBody: "#433f37",
  },
} as const;

export type ThemeMode = "dark" | "light";
