const MESSAGE_MAP: Array<{ test: RegExp; message: string }> = [
  { test: /invalid credentials/i, message: "Incorrect email or password, please try again." },
  { test: /email already exists/i, message: "This email is already registered. Please sign in instead." },
  { test: /invalid email/i, message: "Invalid email format, please check and try again." },
  { test: /too small|string must contain at least 8|at least 8/i, message: "Password must be at least 8 characters." },
  { test: /no files uploaded/i, message: "Please select at least one image before uploading." },
  { test: /file too large|image too large|max size/i, message: "Image file too large. Please keep each file under 20MB." },
  { test: /api key is not configured/i, message: "The API key for this provider is not configured. Please contact the system administrator." },
  { test: /至少需要保留一個|at least one prompt/i, message: "At least one prompt template must be kept." },
  { test: /已被歷史任務使用|cannot delete.*used/i, message: "This prompt template has been used in tasks and cannot be deleted." },
  { test: /invalid_api_key|incorrect api key|authentication/i, message: "API key validation failed. Please verify you have pasted the correct key." },
  { test: /must contain the word 'json'|contain the word json/i, message: "The prompt must explicitly request JSON output. System settings have been adjusted — please regenerate." },
  { test: /model.*not found|invalid model|unsupported model/i, message: "Invalid model name. Please update it in API Settings." },
  { test: /rate limit|quota|insufficient/i, message: "Model quota exceeded or rate limit reached. Please try again later or switch keys." },
  {
    test: /image_sha256_key|unique constraint.*sha256|duplicate entry.*sha256/i,
    message: "Database schema is out of date. Please run pnpm prisma:migrate and try again.",
  },
  { test: /model response is not valid json|unexpected token|json/i, message: "Model returned invalid format. Please adjust the prompt or try again later." },
  {
    test: /\bforbidden\b/i,
    message: "You do not have permission to perform this action.",
  },
  {
    test: /\bunauthorized\b|invalid refresh token|access token|refresh token|token expired|jwt/i,
    message: "Your session has expired. Please sign in again.",
  },
  { test: /database|connect/i, message: "The system is currently busy. Please try again later." },
];

export function toFriendlyError(raw: string | undefined, fallback: string) {
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }

  const normalized = raw.toLowerCase();
  const matched = MESSAGE_MAP.find(({ test }) => test.test(normalized));
  return matched ? matched.message : fallback;
}
