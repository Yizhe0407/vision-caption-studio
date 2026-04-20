"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Plug, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { toFriendlyError } from "@/src/lib/friendly-error";
import { cn } from "@/src/lib/cn";

type Provider = "OPENAI" | "OPENROUTER" | "GEMINI" | "CLAUDE" | "NVIDIA_NIM";
type ApiError = { ok: false; error?: string };
type SettingsResponse = {
  ok: true;
  settings: {
    preferredProvider: Provider;
    preferredPromptTemplateId: string | null;
    promptTemplates: Array<{ id: string; name: string; version: number }>;
    keys: Partial<Record<Provider, string>>;
    models: Partial<Record<Provider, string>>;
  };
};
type TestResult = { status: "ok" | "error"; message: string } | null;

const PROVIDERS: { id: Provider; label: string; description: string }[] = [
  {
    id: "OPENAI",
    label: "OpenAI",
    description: "GPT-4o 及 GPT-4 Vision — 穩定、廣泛支援。",
  },
  {
    id: "GEMINI",
    label: "Gemini",
    description: "Google Gemini Pro Vision — 強大圖像理解能力。",
  },
  {
    id: "CLAUDE",
    label: "Claude",
    description: "Anthropic Claude 3 — 精準描述與推理能力。",
  },
  {
    id: "OPENROUTER",
    label: "OpenRouter",
    description: "多模型閘道，支援 70+ 開放與私有模型。",
  },
  {
    id: "NVIDIA_NIM",
    label: "NVIDIA NIM",
    description: "NVIDIA NIM 推理平台 — 高效能加速模型部署。",
  },
];

const MODEL_PLACEHOLDERS: Record<Provider, string> = {
  OPENAI: "例如 gpt-4.1-mini",
  OPENROUTER: "例如 openai/gpt-4.1-mini",
  GEMINI: "例如 gemini-2.5-flash",
  NVIDIA_NIM: "例如 mistralai/mistral-large-3-675b-instruct-2512",
  CLAUDE: "例如 claude-3-5-sonnet-latest",
};

function InputStyles() {
  return (
    <style>{`
      .api-input:focus {
        border-color: #2C2825 !important;
        box-shadow: 0 0 0 3px rgba(44,40,37,0.08) !important;
      }
    `}</style>
  );
}

const emptyModels = (): Record<Provider, string> => ({
  OPENAI: "", OPENROUTER: "", GEMINI: "", CLAUDE: "", NVIDIA_NIM: "",
});

export default function ApiSettingsPage() {
  const [provider, setProvider] = useState<Provider>("OPENAI");
  const [models, setModels] = useState<Record<Provider, string>>(emptyModels());
  const [keys, setKeys] = useState<Record<Provider, string>>({
    OPENAI: "", OPENROUTER: "", GEMINI: "", CLAUDE: "", NVIDIA_NIM: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [promptTemplates, setPromptTemplates] = useState<Array<{ id: string; name: string; version: number }>>([]);
  const [preferredPromptTemplateId, setPreferredPromptTemplateId] = useState<string>("");

  const currentKey = keys[provider];
  const currentModel = models[provider];
  const providerInfo = PROVIDERS.find((p) => p.id === provider)!;

  /* ── Fetch ─────────────────────────────────────────── */

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = (await res.json()) as SettingsResponse | ApiError;
      if (!data.ok) throw new Error(data.error);
      setProvider(data.settings.preferredProvider);
      setKeys({
        OPENAI:      data.settings.keys.OPENAI      ?? "",
        OPENROUTER:  data.settings.keys.OPENROUTER  ?? "",
        GEMINI:      data.settings.keys.GEMINI      ?? "",
        CLAUDE:      data.settings.keys.CLAUDE      ?? "",
        NVIDIA_NIM:  data.settings.keys.NVIDIA_NIM  ?? "",
      });
      setModels({
        OPENAI:      data.settings.models.OPENAI      ?? "",
        OPENROUTER:  data.settings.models.OPENROUTER  ?? "",
        GEMINI:      data.settings.models.GEMINI      ?? "",
        CLAUDE:      data.settings.models.CLAUDE      ?? "",
        NVIDIA_NIM:  data.settings.models.NVIDIA_NIM  ?? "",
      });
      const templates = data.settings.promptTemplates ?? [];
      setPromptTemplates(templates);
      setPreferredPromptTemplateId(
        data.settings.preferredPromptTemplateId ?? templates[0]?.id ?? "",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "無法讀取 API 設定。"));
    }
  }

  useEffect(() => { void fetchSettings(); }, []); // mount only

  /* Clear test result on provider change */
  useEffect(() => { setTestResult(null); setShowKey(false); }, [provider]);

  /* ── Save ──────────────────────────────────────────── */

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: currentKey,
          preferredProvider: provider,
          preferredModel: currentModel.trim() || undefined,
          preferredPromptTemplateId: preferredPromptTemplateId || undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
      toast.success("API 設定已更新。");
      await fetchSettings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "儲存失敗，請稍後再試。"));
    } finally {
      setSaving(false);
    }
  }

  /* ── Test ──────────────────────────────────────────── */

  async function onTest() {
    if (!currentKey.trim()) {
      toast.error("請先輸入 API Key。");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: currentKey.trim(),
          model: currentModel.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Connection failed");
      setTestResult({ status: "ok", message: "Connected — API Key valid" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setTestResult({ status: "error", message: msg });
    } finally {
      setTesting(false);
    }
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="h-full overflow-y-auto">
      <InputStyles />
      <div className="max-w-[680px] mx-auto px-4 py-6 sm:px-10 space-y-6 animate-fade-in">

        {/* Provider selector (segmented control) */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FAF8F5",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
          }}
        >
          <h2 className="section-label uppercase text-[#78716C] mb-1">AI Provider</h2>
          <p className="body-text text-[#78716C] mb-4">
            選擇預設 Provider，後續生成任務會使用此設定。
          </p>

          {/* Segmented tabs */}
          <div
            className="flex p-1 rounded-xl gap-1"
            style={{ background: "#F2EDE4" }}
          >
            {PROVIDERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setProvider(id)}
                className={cn(
                  "flex-1 py-2 rounded-lg section-label transition-all duration-[120ms] truncate",
                  provider === id
                    ? "bg-[#FAF8F5] text-[#1C1917]"
                    : "text-[#78716C] hover:text-[#1C1917]",
                )}
                style={
                  provider === id
                    ? { boxShadow: "0 1px 3px rgba(28,25,23,0.10)" }
                    : {}
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-provider form */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "#FAF8F5",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
          }}
        >
          <div>
              <h3 className="section-label text-[#1C1917]">
                {providerInfo.label}
              </h3>
              <p className="body-text text-[#78716C] mt-0.5">
                {providerInfo.description}
              </p>
          </div>

          {/* API Key input */}
          <div>
            <label className="section-label block mb-1.5 uppercase">
              {providerInfo.label} API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={currentKey}
                onChange={(e) =>
                  setKeys((prev) => ({ ...prev, [provider]: e.target.value }))
                }
                placeholder={`輸入 ${providerInfo.label} API Key`}
                autoComplete="off"
                className="api-input w-full h-10 pl-3 pr-10 rounded-[10px] body-text text-[#1C1917] outline-none transition-all duration-[120ms]"
                style={{
                  background: "#F5F1EB",
                  border: "1px solid rgba(0,0,0,0.12)",
                  fontFamily: currentKey ? "var(--font-geist-mono)" : "inherit",
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#78716C] transition-colors"
                tabIndex={-1}
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="section-label block mb-1.5 uppercase">
              預設模型（Model）
            </label>
            <input
              value={currentModel}
              onChange={(e) => setModels((prev) => ({ ...prev, [provider]: e.target.value }))}
              placeholder={MODEL_PLACEHOLDERS[provider]}
              className="api-input w-full h-10 px-3 rounded-[10px] body-text text-[#1C1917] outline-none transition-all duration-[120ms]"
              style={{
                background: "#F5F1EB",
                border: "1px solid rgba(0,0,0,0.12)",
                fontFamily: currentModel ? "var(--font-geist-mono)" : "inherit",
              }}
            />
            <p className="section-label mt-1 text-[#A8A29E]">
              未填寫時會使用系統預設模型；填寫後生成與測試都會使用你指定的模型。每個 Provider 獨立記憶。
            </p>
          </div>

          <div>
            <label className="section-label block mb-1.5 uppercase">
              預設 Prompt Template
            </label>
            <select
              value={preferredPromptTemplateId}
              onChange={(e) => setPreferredPromptTemplateId(e.target.value)}
              className="api-input w-full h-10 px-3 rounded-[10px] body-text text-[#1C1917] outline-none transition-all duration-[120ms]"
              style={{
                background: "#F5F1EB",
                border: "1px solid rgba(0,0,0,0.12)",
              }}
            >
              {promptTemplates.length === 0 ? (
                <option value="">沒有可用模板</option>
              ) : (
                promptTemplates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} v{item.version}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Test connection */}
          <div>
            <button
              type="button"
              onClick={onTest}
              disabled={testing || !currentKey.trim()}
               className="h-9 px-4 rounded-[10px] body-text font-medium text-[#1C1917] flex items-center gap-2 border transition-all duration-[120ms] disabled:opacity-50 hover:bg-[#EDE8DF]"
              style={{ background: "#EDE8DF", borderColor: "rgba(0,0,0,0.07)" }}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plug className="w-4 h-4" />
              )}
              Test Connection
            </button>

            {/* Inline result */}
            {testResult && (
              <div
                className={cn(
                  "mt-2 flex items-center gap-2 body-text font-medium",
                  testResult.status === "ok"
                    ? "text-[#3D7A5E]"
                    : "text-[#B45050]",
                )}
              >
                {testResult.status === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {testResult.message}
              </div>
            )}
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full h-10 rounded-[10px] body-text font-medium text-[#FAF8F5] flex items-center justify-center gap-2 transition-all duration-[120ms] disabled:opacity-60"
            style={{ background: "#2C2825", boxShadow: "0 1px 3px rgba(28,25,23,0.20)" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Settings
          </button>

          <p className="section-label text-[#A8A29E] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            API Key 加密後存入資料庫，切換 Provider 時自動帶入對應值。
          </p>
        </div>
      </div>
    </div>
  );
}
