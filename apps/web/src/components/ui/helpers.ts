export function getLabel<T extends string>(
  labels: Record<T, string>,
  value: string | null | undefined
): string {
  if (!value) return "-";
  return labels[value as T] || value;
}
