const MESSAGE_MAP: Array<{ test: RegExp; message: string }> = [
  { test: /invalid credentials/i, message: "帳號或密碼不正確，請再試一次。" },
  { test: /email already exists/i, message: "這個 Email 已被註冊，請改用登入。" },
  { test: /invalid email/i, message: "Email 格式不正確，請重新確認。" },
  { test: /too small|string must contain at least 8|at least 8/i, message: "密碼至少需要 8 個字元。" },
  { test: /no files uploaded/i, message: "請至少選擇一張圖片後再上傳。" },
  { test: /file too large|image too large|max size/i, message: "圖片檔案過大，請將單張檔案控制在 20MB 內。" },
  { test: /api key is not configured/i, message: "此 Provider 尚未設定 API Key，請先到 API 設定頁完成設定。" },
  { test: /至少需要保留一個|at least one prompt/i, message: "至少需要保留一個 Prompt Template，無法全部刪除。" },
  { test: /已被歷史任務使用|cannot delete.*used/i, message: "這個 Prompt Template 已被歷史任務使用，不能刪除。" },
  { test: /invalid_api_key|incorrect api key|authentication/i, message: "API Key 驗證失敗，請確認是否貼上正確金鑰。" },
  { test: /must contain the word 'json'|contain the word json/i, message: "Prompt 需明確要求回傳 JSON，已調整系統設定，請重新生成一次。" },
  { test: /model.*not found|invalid model|unsupported model/i, message: "模型名稱無效，請到 API Settings 調整可用的模型名稱。" },
  { test: /rate limit|quota|insufficient/i, message: "模型配額不足或已達速率限制，請稍後再試或更換金鑰。" },
  {
    test: /image_sha256_key|unique constraint.*sha256|duplicate entry.*sha256/i,
    message: "資料庫結構尚未更新，請先執行 pnpm prisma:migrate 後重試。",
  },
  { test: /model response is not valid json|unexpected token|json/i, message: "模型回傳格式錯誤，請調整 Prompt 格式或稍後重試。" },
  {
    test: /\bforbidden\b/i,
    message: "您沒有權限執行此操作。",
  },
  {
    test: /\bunauthorized\b|invalid refresh token|access token|refresh token|token expired|jwt/i,
    message: "登入已失效，請重新登入。",
  },
  { test: /database|connect/i, message: "系統目前忙碌中，請稍後再試。" },
];

export function toFriendlyError(raw: string | undefined, fallback: string) {
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }

  const normalized = raw.toLowerCase();
  const matched = MESSAGE_MAP.find(({ test }) => test.test(normalized));
  return matched ? matched.message : fallback;
}
