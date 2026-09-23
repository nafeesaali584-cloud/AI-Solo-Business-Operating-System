/** Exact Color Tokens from user specification */
export const COLOR_TOKENS = {
  dark: {
    bg: "#0a0a0a",
    cardBg: "#131313",
    border: "#2a2a2a",
    accent: "#f97316",
    accentSoftBg: "rgba(249, 115, 22, 0.14)",
    accentBorder: "rgba(249, 115, 22, 0.35)",
    textPrimary: "#fafafa",
    textMuted: "#a3a3a3",
    textExtraMuted: "#9ca3af",
    textBody: "#d4d4d4",
    textSecondaryBody: "#d4d4d4",
  },
  light: {
    bg: "#ffffff",
    cardBg: "#f6f4ef",
    border: "#e3ded2",
    accent: "#c2410c",
    accentSoftBg: "rgba(194, 65, 12, 0.10)",
    accentBorder: "rgba(194, 65, 12, 0.35)",
    textPrimary: "#161513",
    textMuted: "#44403c",
    textExtraMuted: "#57534e",
    textBody: "#292524",
    textSecondaryBody: "#292524",
  },
} as const;

export type ThemeMode = "dark" | "light";
