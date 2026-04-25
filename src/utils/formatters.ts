export function jsonText(value: unknown): { type: "text"; text: string } {
  return { type: "text", text: JSON.stringify(value, null, 2) };
}

export function buildQueryParams(
  input: Record<string, unknown>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      out[k] = v.join(",");
    } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    }
  }
  return out;
}
