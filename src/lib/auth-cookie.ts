export function shouldUseSecureCookies(req: Request) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    ?.toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return true;
  }
}
