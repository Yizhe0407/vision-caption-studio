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
    tags?: string[] | string;
  } | null = null;

  for (const candidate of candidates) {
    try {
      parsed = JSON.parse(candidate) as {
        caption?: string;
        description?: string;
        tags?: string[] | string;
      };
      break;
    } catch {
      // Try next candidate
    }
  }

  if (!parsed) {
    throw new Error("Model response is not valid JSON.");
  }

  const description = (parsed.description ?? parsed.caption ?? "").trim();
  const rawTags = Array.isArray(parsed.tags)
    ? parsed.tags
    : typeof parsed.tags === "string"
      ? parsed.tags.split(/[,，、\n]/)
      : [];
  const tags = rawTags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => tag.length > 0);

  if (!description) {
    throw new Error("Model response missing description.");
  }
  if (tags.length === 0) {
    throw new Error("Model response missing tags.");
  }

  return { caption: description, tags };
}
