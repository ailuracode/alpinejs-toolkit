import type { QueryKey } from "@ailuracode/alpine-query";

const KEY_SEPARATOR = " › ";

export function formatKeyJson(key: QueryKey): string {
  return JSON.stringify(key);
}

function formatKeySegment(part: unknown): string {
  if (typeof part === "string") {
    return part;
  }

  if (typeof part === "number" || typeof part === "boolean") {
    return String(part);
  }

  if (part === null) {
    return "null";
  }

  if (part === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(part);
  } catch {
    return String(part);
  }
}

function normalizeAdapterToken(value: string): string {
  return value
    .replace(/\s+#\d+$/, "")
    .trim()
    .toLowerCase();
}

function adapterNameTokens(adapterName: string): Set<string> {
  const base = normalizeAdapterToken(adapterName);
  const tokens = new Set<string>([base]);

  for (const part of base.split(/[.\-_/ ]+/)) {
    if (part) {
      tokens.add(part);
    }
  }

  return tokens;
}

function segmentMatchesAdapter(segment: unknown, adapterName: string): boolean {
  return adapterNameTokens(adapterName).has(formatKeySegment(segment).toLowerCase());
}

/** Human-readable query key for list rows and headings. */
export function formatQueryKeyLabel(key: QueryKey, options?: { omitAdapterName?: string }): string {
  if (!Array.isArray(key)) {
    return formatKeySegment(key);
  }

  if (key.length === 0) {
    return "∅";
  }

  let segments: unknown[] = [...key];

  if (options?.omitAdapterName) {
    const filtered = segments.filter(
      (segment) => !segmentMatchesAdapter(segment, options.omitAdapterName ?? "")
    );

    if (filtered.length > 0) {
      segments = filtered;
    }
  }

  return segments.map(formatKeySegment).join(KEY_SEPARATOR);
}

export { KEY_SEPARATOR };
