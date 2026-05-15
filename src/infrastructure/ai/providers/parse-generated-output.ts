import type { StructuredTags } from "@/src/infrastructure/ai/types";

function normalizeStructuredTags(raw: unknown): StructuredTags | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const result: StructuredTags = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      result[key] = val.filter((v): v is string => typeof v === "string");
    } else if (typeof val === "string") {
      result[key] = val;
    }
    // skip non-string, non-array values
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function flattenStructuredTags(tags: StructuredTags): string[] {
  const flat: string[] = [];
  for (const [key, val] of Object.entries(tags)) {
    const values = Array.isArray(val) ? val : [val];
    for (const v of values) {
      if (v) flat.push(`${key}:${v}`);
    }
  }
  return flat;
}

export function parseGeneratedOutput(payload: string) {
  const raw = payload.trim();
  const candidates = [
    raw,
    raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""),
    (() => {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      return start >= 0 && end > start ? raw.slice(start, end + 1) : "";
    })(),
  ].filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index);

  let parsed: {
    caption?: string;
    description?: string;
    tags?: unknown;
  } | null = null;

  for (const candidate of candidates) {
    try {
      parsed = JSON.parse(candidate) as {
        caption?: string;
        description?: string;
        tags?: unknown;
      };
      break;
    } catch {
      // try next
    }
  }

  if (!parsed) {
    throw new Error("Model response is not valid JSON.");
  }

  const description = (parsed.description ?? parsed.caption ?? "").trim();
  if (!description) {
    throw new Error("Model response missing description.");
  }

  const rawTags = parsed.tags;

  // Structured tags object
  if (rawTags && typeof rawTags === "object" && !Array.isArray(rawTags)) {
    const structuredTags = normalizeStructuredTags(rawTags);
    const tags = structuredTags ? flattenStructuredTags(structuredTags) : [];
    return { caption: description, tags, structuredTags };
  }

  // Legacy string array
  const tagArr = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === "string"
      ? rawTags.split(/[,，、\n]/)
      : [];
  const tags = tagArr
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => tag.length > 0);

  if (tags.length === 0) {
    throw new Error("Model response missing tags.");
  }

  return { caption: description, tags, structuredTags: undefined };
}
