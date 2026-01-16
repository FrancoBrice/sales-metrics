export function repairJson(input: string): string {
  let repaired = input.trim();

  if (!repaired.startsWith("{") && !repaired.startsWith("[")) {
    const startIndex = repaired.search(/[{\[]/);
    if (startIndex !== -1) {
      repaired = repaired.substring(startIndex);
    }
  }

  if (!repaired.endsWith("}") && !repaired.endsWith("]")) {
    const endIndex = Math.max(repaired.lastIndexOf("}"), repaired.lastIndexOf("]"));
    if (endIndex !== -1) {
      repaired = repaired.substring(0, endIndex + 1);
    }
  }

  repaired = repaired.replace(/,\s*([}\]])/g, "$1");

  repaired = repaired.replace(/'/g, '"');

  return repaired;
}

export function tryParseJson<T>(input: string): T | null {
  try {
    return JSON.parse(input);
  } catch {
    try {
      const repaired = repairJson(input);
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}
