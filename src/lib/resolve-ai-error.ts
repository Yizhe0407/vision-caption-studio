export function resolveAIError(error: unknown): string {
  if (!(error instanceof Error)) return "Unknown error";

  // OpenRouter wraps the provider's raw error inside error.error.metadata.raw
  const maybeRaw = (
    error as Error & { error?: { metadata?: { raw?: string } } }
  ).error?.metadata?.raw;

  if (typeof maybeRaw === "string" && maybeRaw.trim().length > 0) {
    try {
      const parsed = JSON.parse(maybeRaw) as { error?: { message?: string } };
      const msg = parsed.error?.message?.trim();
      if (msg) return msg;
    } catch {
      // fall through
    }
    // raw might itself be a plain string message
    if (maybeRaw.length < 300) return maybeRaw;
  }

  return error.message;
}
