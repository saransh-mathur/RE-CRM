export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bg: string;
  headerBg: string;
  cardBg: string;
  cardBgSecondary: string;
  cardBgElevated: string;
  glassBackdrop: string;
  glassBorder: string;
  glassBorderHighlight: string;
  glassShadow: string;
  glassShadowGlow: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentHover: string;
  accentBg: string;
  crystalAccent: string;
  // Harmonious, non-jarring semantic indicators matching the white/crystal aesthetic
  success: string;
  successBg: string;
  successBorder: string;
  warning: string;
  warningBg: string;
  warningBorder: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  watermarkOpacity: number;
  tableHeaderBg: string;
  tableRowHover: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  light: {
    // Pure White Crystal Glass: Luminous, pristine, frosted silver & specular crystal reflections
    bg: "radial-gradient(ellipse at 15% 10%, rgba(240, 245, 255, 0.85) 0%, transparent 45%), radial-gradient(ellipse at 85% 90%, rgba(245, 247, 250, 0.9) 0%, transparent 50%), linear-gradient(135deg, #ffffff 0%, #f8fafc 45%, #f1f5f9 100%)",
    headerBg: "rgba(255, 255, 255, 0.82)",
    cardBg: "rgba(255, 255, 255, 0.72)",
    cardBgSecondary: "rgba(248, 250, 252, 0.75)",
    cardBgElevated: "rgba(255, 255, 255, 0.92)",
    glassBackdrop: "blur(24px) saturate(190%)",
    glassBorder: "1px solid rgba(255, 255, 255, 0.95)",
    glassBorderHighlight: "1px solid rgba(226, 232, 240, 0.8)",
    glassShadow: "0 10px 35px -5px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02), inset 0 1px 1px 0 rgba(255, 255, 255, 1)",
    glassShadowGlow: "0 14px 40px -4px rgba(15, 23, 42, 0.08), inset 0 1px 2px 0 rgba(255, 255, 255, 1)",
    border: "rgba(226, 232, 240, 0.85)",
    borderSubtle: "rgba(241, 245, 249, 0.9)",
    textPrimary: "#0f172a", // High contrast luxury deep slate
    textSecondary: "#334155", // Balanced slate
    textMuted: "#64748b",
    accentPrimary: "#0f172a", // Monochromatic luxury slate primary
    accentHover: "#1e293b",
    accentBg: "rgba(15, 23, 42, 0.05)",
    crystalAccent: "#2563eb", // Subtle crystalline sapphire for interactive focal dots
    
    // Subdued, elegant badges that harmonize with the white theme (no shouting red/green)
    success: "#1e293b",
    successBg: "rgba(15, 23, 42, 0.04)",
    successBorder: "rgba(15, 23, 42, 0.12)",

    warning: "#334155",
    warningBg: "rgba(15, 23, 42, 0.04)",
    warningBorder: "rgba(15, 23, 42, 0.12)",

    danger: "#1e293b",
    dangerBg: "rgba(15, 23, 42, 0.04)",
    dangerBorder: "rgba(15, 23, 42, 0.14)",

    watermarkOpacity: 0.18,
    tableHeaderBg: "rgba(248, 250, 252, 0.85)",
    tableRowHover: "rgba(241, 245, 249, 0.65)"
  },
  dark: {
    // Obsidian Crystal Glass: Midnight glass with crystalline edge highlights
    bg: "radial-gradient(ellipse at 15% 10%, rgba(20, 30, 50, 0.6) 0%, transparent 45%), radial-gradient(ellipse at 85% 90%, rgba(15, 23, 42, 0.7) 0%, transparent 50%), linear-gradient(135deg, #090d16 0%, #0d1322 45%, #080c14 100%)",
    headerBg: "rgba(13, 19, 34, 0.82)",
    cardBg: "rgba(17, 24, 39, 0.68)",
    cardBgSecondary: "rgba(30, 41, 59, 0.52)",
    cardBgElevated: "rgba(24, 33, 53, 0.85)",
    glassBackdrop: "blur(24px) saturate(190%)",
    glassBorder: "1px solid rgba(255, 255, 255, 0.12)",
    glassBorderHighlight: "1px solid rgba(255, 255, 255, 0.2)",
    glassShadow: "0 12px 36px 0 rgba(0, 0, 0, 0.55), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)",
    glassShadowGlow: "0 16px 45px 0 rgba(0, 0, 0, 0.65), inset 0 1px 2px 0 rgba(255, 255, 255, 0.18)",
    border: "rgba(51, 65, 85, 0.65)",
    borderSubtle: "rgba(71, 85, 105, 0.45)",
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    accentPrimary: "#f8fafc",
    accentHover: "#e2e8f0",
    accentBg: "rgba(255, 255, 255, 0.08)",
    crystalAccent: "#38bdf8",

    success: "#e2e8f0",
    successBg: "rgba(255, 255, 255, 0.06)",
    successBorder: "rgba(255, 255, 255, 0.15)",

    warning: "#e2e8f0",
    warningBg: "rgba(255, 255, 255, 0.06)",
    warningBorder: "rgba(255, 255, 255, 0.15)",

    danger: "#f8fafc",
    dangerBg: "rgba(255, 255, 255, 0.06)",
    dangerBorder: "rgba(255, 255, 255, 0.18)",

    watermarkOpacity: 0.18,
    tableHeaderBg: "rgba(15, 23, 42, 0.85)",
    tableRowHover: "rgba(30, 41, 59, 0.55)"
  }
};
