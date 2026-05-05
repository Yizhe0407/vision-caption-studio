import type { StructuredTags } from "@/src/infrastructure/ai/types";

const EMPTY_STRUCTURED_TAGS: StructuredTags = {
  category: "",
  product_type: "",
  shape: "",
  material: [],
  texture: [],
  pattern: [],
  pattern_layout: "",
  technique: [],
  color: { primary: [], secondary: [], accent: [] },
  style: [],
  details: [],
  mood: [],
};

function normalizeStructuredTags(raw: unknown): StructuredTags {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...EMPTY_STRUCTURED_TAGS, color: { primary: [], secondary: [], accent: [] } };
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const colorRaw = r.color && typeof r.color === "object" && !Array.isArray(r.color)
    ? (r.color as Record<string, unknown>)
    : {};

  return {
    category: str(r.category),
    product_type: str(r.product_type),
    shape: str(r.shape),
    material: arr(r.material),
    texture: arr(r.texture),
    pattern: arr(r.pattern),
    pattern_layout: str(r.pattern_layout),
    technique: arr(r.technique),
    color: {
      primary: arr(colorRaw.primary),
      secondary: arr(colorRaw.secondary),
      accent: arr(colorRaw.accent),
    },
    style: arr(r.style),
    details: arr(r.details),
    mood: arr(r.mood),
  };
}

function flattenStructuredTags(st: StructuredTags): string[] {
  const tags: string[] = [];
  if (st.category) tags.push(`category:${st.category}`);
  if (st.product_type) tags.push(`product_type:${st.product_type}`);
  if (st.shape) tags.push(`shape:${st.shape}`);
  if (st.pattern_layout) tags.push(`pattern_layout:${st.pattern_layout}`);
  for (const v of st.material) tags.push(`material:${v}`);
  for (const v of st.texture) tags.push(`texture:${v}`);
  for (const v of st.pattern) tags.push(`pattern:${v}`);
  for (const v of st.technique) tags.push(`technique:${v}`);
  for (const v of st.color.primary) tags.push(`color.primary:${v}`);
  for (const v of st.color.secondary) tags.push(`color.secondary:${v}`);
  for (const v of st.color.accent) tags.push(`color.accent:${v}`);
  for (const v of st.style) tags.push(`style:${v}`);
  for (const v of st.details) tags.push(`details:${v}`);
  for (const v of st.mood) tags.push(`mood:${v}`);
  return tags;
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
    const tags = flattenStructuredTags(structuredTags);
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
