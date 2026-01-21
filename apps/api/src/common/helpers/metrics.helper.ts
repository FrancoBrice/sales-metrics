export function calculateConversionRate(total: number, closed: number): number {
  return total > 0 ? (closed / total) * 100 : 0;
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateConversionRateRounded(total: number, closed: number): number {
  return roundToOneDecimal(calculateConversionRate(total, closed));
}
