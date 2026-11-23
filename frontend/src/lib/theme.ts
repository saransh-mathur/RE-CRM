export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  headerBg: string;
  sidebarBg: string;
  sidebarBorder: string;
  sidebarText: string;
  sidebarTextMuted: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
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
  goldAccent: string;
  goldGradient: string;
  goldBg: string;
  goldBorder: string;
  primaryBtnBg: string;
  primaryBtnText: string;
  emeraldSurface: string;
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
  tableHeaderText: string;
  tableRowHover: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  light: {
    isDark: false,
    // Crisp Daylight Workspace with Familiar Dark Charcoal Sidebar & Teal-Emerald Accent
    bg: "#F4F6F9",
    headerBg: "#FFFFFF",
    sidebarBg: "#151B23",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    sidebarText: "#E2E8F0",
    sidebarTextMuted: "#94A3B8",
    sidebarActiveBg: "#1BA88E",
    sidebarActiveText: "#FFFFFF",
    cardBg: "#FFFFFF",
    cardBgSecondary: "#F8FAFC",
    cardBgElevated: "#FFFFFF",
    glassBackdrop: "none",
    glassBorder: "1px solid #E2E8F0",
    glassBorderHighlight: "1px solid rgba(27, 168, 142, 0.45)",
    glassShadow: "0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)",
    glassShadowGlow: "0 12px 28px -6px rgba(15, 23, 42, 0.14)",
    border: "#E2E8F0",
    borderSubtle: "#F1F5F9",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",
    accentPrimary: "#1BA88E",
    accentHover: "#158E78",
    accentBg: "rgba(27, 168, 142, 0.10)",
    crystalAccent: "#1BA88E",

    goldAccent: "#0F8A73",
    goldGradient: "linear-gradient(135deg, #1BA88E 0%, #148671 100%)",
    goldBg: "rgba(27, 168, 142, 0.10)",
    goldBorder: "rgba(27, 168, 142, 0.35)",
    primaryBtnBg: "#1BA88E",
    primaryBtnText: "#FFFFFF",
    emeraldSurface: "#EDF7F5",

    success: "#15803D",
    successBg: "#F0FDF4",
    successBorder: "#BBF7D0",

    warning: "#B45309",
    warningBg: "#FFFBEB",
    warningBorder: "#FDE68A",

    danger: "#DC2626",
    dangerBg: "#FEF2F2",
    dangerBorder: "#FECACA",

    watermarkOpacity: 0.05,
    tableHeaderBg: "#1B2436",
    tableHeaderText: "#F8FAFC",
    tableRowHover: "#F8FAFC"
  },
  dark: {
    isDark: true,
    // Deep Forest Slate & Teal-Gold Night Mode
    bg: "#0B1218",
    headerBg: "#111A22",
    sidebarBg: "#0E151C",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    sidebarText: "#E2E8F0",
    sidebarTextMuted: "#94A3B8",
    sidebarActiveBg: "#1BA88E",
    sidebarActiveText: "#FFFFFF",
    cardBg: "#131D26",
    cardBgSecondary: "#192531",
    cardBgElevated: "#192531",
    glassBackdrop: "none",
    glassBorder: "1px solid rgba(148, 163, 184, 0.16)",
    glassBorderHighlight: "1px solid rgba(27, 168, 142, 0.45)",
    glassShadow: "0 4px 16px rgba(0, 0, 0, 0.32)",
    glassShadowGlow: "0 16px 36px rgba(0, 0, 0, 0.50)",
    border: "rgba(148, 163, 184, 0.16)",
    borderSubtle: "rgba(148, 163, 184, 0.10)",
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    accentPrimary: "#2DD4BF",
    accentHover: "#14B8A6",
    accentBg: "rgba(45, 212, 191, 0.12)",
    crystalAccent: "#2DD4BF",

    goldAccent: "#2DD4BF",
    goldGradient: "linear-gradient(135deg, #1BA88E 0%, #0F766E 100%)",
    goldBg: "rgba(45, 212, 191, 0.12)",
    goldBorder: "rgba(45, 212, 191, 0.36)",
    primaryBtnBg: "#1BA88E",
    primaryBtnText: "#FFFFFF",
    emeraldSurface: "rgba(27, 168, 142, 0.14)",

    success: "#4ADE80",
    successBg: "rgba(34, 197, 94, 0.14)",
    successBorder: "rgba(74, 222, 128, 0.28)",

    warning: "#FBBF24",
    warningBg: "rgba(245, 158, 11, 0.14)",
    warningBorder: "rgba(251, 191, 36, 0.30)",

    danger: "#F87171",
    dangerBg: "rgba(239, 68, 68, 0.14)",
    dangerBorder: "rgba(248, 113, 113, 0.30)",

    watermarkOpacity: 0.05,
    tableHeaderBg: "#0F172A",
    tableHeaderText: "#F8FAFC",
    tableRowHover: "rgba(255, 255, 255, 0.04)"
  }
};
