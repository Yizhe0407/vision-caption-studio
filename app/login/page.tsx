"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { toFriendlyError } from "@/src/lib/friendly-error";

type Tab = "signin" | "register";

export default function LoginPage() {
  const [tab, setTab]           = useState<Tab>("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const path =
    tab === "signin" ? "/api/auth/login" : "/api/auth/register";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (tab === "register" && Array.from(password).length < 8) {
      const msg = `密碼至少需要 8 個字元（目前 ${Array.from(password).length}）。`;
      setError(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        const msg = toFriendlyError(
          payload.error,
          tab === "signin" ? "登入失敗，請稍後再試。" : "註冊失敗，請稍後再試。",
        );
        setError(msg);
        toast.error(msg);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      const msg = "服務暫時不可用，請稍後再試。";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "var(--layer-page)",
        backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2C2825] flex items-center justify-center shadow-[0_1px_3px_rgba(28,25,23,0.20)]">
            <Sparkles className="w-5 h-5 text-[#FAF8F5]" />
          </div>
          <div className="text-center">
            <p className="page-title text-[#1C1917]">Vision Caption Studio</p>
            <p className="section-label text-[#78716C] mt-0.5">AI image tagging &amp; description workspace</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "#FAF8F5",
            borderColor: "rgba(0,0,0,0.07)",
            boxShadow:
              "0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
          }}
        >
          {/* Tab switcher */}
          <div
            className="flex p-1 rounded-[10px] mb-6"
            style={{ background: "var(--layer-page)" }}
          >
            {(["signin", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(null); }}
                  className="flex-1 py-1.5 rounded-lg body-text font-medium transition-all duration-[120ms]"
                style={
                  tab === t
                    ? {
                        background: "#FAF8F5",
                        color: "#1C1917",
                        boxShadow: "0 1px 3px rgba(28,25,23,0.10)",
                      }
                    : { color: "#78716C" }
                }
              >
                {t === "signin" ? "登入" : "建立帳號"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <label className="section-label block text-[#78716C] mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full h-10 px-3 rounded-[10px] body-text text-[#1C1917] outline-none transition-all duration-[120ms]"
                style={{
                  background: "#F5F1EB",
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2C2825";
                  e.target.style.boxShadow = "0 0 0 3px rgba(44,40,37,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(0,0,0,0.12)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="section-label block text-[#78716C] mb-1.5">
                密碼
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 8 個字元"
                   className="w-full h-10 pl-3 pr-10 rounded-[10px] body-text text-[#1C1917] outline-none transition-all duration-[120ms]"
                  style={{
                    background: "#F5F1EB",
                    border: "1px solid rgba(0,0,0,0.12)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2C2825";
                    e.target.style.boxShadow = "0 0 0 3px rgba(44,40,37,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(0,0,0,0.12)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#78716C] transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                 className="px-3 py-2 rounded-[10px] body-text text-[#991B1B]"
                style={{
                  background: "#FEE2E2",
                  border: "1px solid rgba(153,27,27,0.15)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
               className="w-full h-10 rounded-[10px] body-text font-medium text-[#FAF8F5] flex items-center justify-center gap-2 transition-all duration-[120ms] mt-2 disabled:opacity-60"
              style={{
                background: loading ? "#78716C" : "#2C2825",
                boxShadow: "0 1px 3px rgba(28,25,23,0.20)",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLElement).style.background = "#1A1714";
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.target as HTMLElement).style.background = "#2C2825";
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {tab === "signin" ? "登入" : "建立帳號"}
            </button>
          </form>

          {tab === "signin" && (
            <p className="mt-4 text-center">
              <button
                type="button"
                className="section-label text-[#78716C] hover:text-[#1C1917] transition-colors"
              >
                忘記密碼？
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
