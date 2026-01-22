export const BREAKDOWN_LABELS = {
  leadSources: "Lead Sources",
  jtbd: "Jobs To Be Done (JTBD)",
  industries: "Industries",
} as const;

export const STATISTICAL_LABELS = {
  avgConversion: "Average conversion",
  topPerformers: "Top performers",
  underperformers: "Underperformers",
  highVolumeOpportunities: "High volume opportunities",
  significantFindings: "Significant findings",
} as const;

export const URGENCY_SENTIMENT_LABELS = {
  byUrgency: "Conversion by urgency",
  bySentiment: "Conversion by sentiment",
  topCombinations: "Top urgency/sentiment combinations",
} as const;

export const TRENDS_LABELS = {
  title: "Trends (last periods)",
  improving: "Improving",
  declining: "Stable/Declining",
} as const;

export const FILTERS_LABELS = {
  applied: "Applied filters",
  note: "Note: Insights are based on this filtered data.",
  seller: "Seller",
  dateFrom: "From",
  dateTo: "To",
} as const;

export const STAGES_LABELS = {
  closed: "closed",
  conversionFromPrevious: "conversion from previous",
  dropOff: "drop-off",
} as const;
