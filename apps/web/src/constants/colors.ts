// Color constants for consistent usage across the application
export const colors = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  secondary: "#10b981",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#eab308",
  purple: "#8884d8",
  background: "#0f172a",
  surface: "#1e293b",
  surfaceElevated: "#334155",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  border: "#475569",
} as const;

// Opportunity matrix quadrant colors
export const quadrantColors = {
  highValue: colors.success,      // #22c55e
  quickWins: colors.info,         // #eab308
  development: colors.warning,    // #f59e0b
  lowPriority: colors.danger,     // #ef4444
} as const;

// Chart fill colors
export const chartColors = {
  default: colors.purple,         // #8884d8
} as const;

// Lead source colors
export const leadSourceColors: Record<string, string> = {
  Google: "#4285F4",
  Linkedin: "#0077B5",
  LinkedIn: "#0077B5",
  Recomendación: "#34A853",
  Conferencia: "#EA4335",
  Feria: "#FBBC05",
  Artículo: "#FF6D01",
  Webinar: "#46BDC6",
  Email: "#D44638",
  Networking: "#7B1FA2",
  Podcast: "#C2185B",
  Desconocido: "#9E9E9E",
  Otro: "#607D8B",
} as const;

// Chart color palette
export const chartPalette = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
  "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800",
  "#FF5722", "#795548", "#9E9E9E", "#607D8B"
] as const;

// Closure analysis performance colors
export const performanceColors = {
  excellent: "#22c55e",    // > 15%
  good: "#84cc16",         // 5-15%
  neutral: "#eab308",      // -5 to 5%
  warning: "#f59e0b",      // -15 to -5%
  poor: "#ef4444",         // < -15%
} as const;

// Business model colors
export const businessModelColors = {
  B2B: "#3b82f6",
  B2C: "#ec4899",
  B2B2C: "#8b5cf6",
  MARKETPLACE: "#10b981",
} as const;

// Volume unit colors
export const volumeUnitColors = {
  DIARIO: "#06b6d4",
  SEMANAL: "#6366f1",
  MENSUAL: "#f97316",
} as const;

// Volume status colors
export const volumeStatusColors = {
  withPeaks: "#f59e0b",
  withoutPeaks: "#6b7280",
  noVolume: "#9ca3af",
  default: "#cccccc",
} as const;

export const sankeyColorList = [
  "#3b82f6",
  colors.danger,
  colors.secondary,
  colors.warning,
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  colors.primary,
  "#84cc16",
];
