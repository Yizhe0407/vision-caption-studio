"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { toFriendlyError } from "@/src/lib/friendly-error";
import { cn } from "@/src/lib/cn";

type Template = {
  id: string;
  name: string;
  version: number;
  taskType: "CAPTION" | "TAG";
  content: string;
  isActive: boolean;
  updatedAt?: string;
  _count?: { aiRequests?: number };
};

type ApiError = { ok: false; error?: string };

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("zh-TW", {
    month: "short",
    day: "numeric",
  });
}

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [name, setName]           = useState("");
  const [content, setContent]     = useState("");
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [creating, setCreating]   = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [editingName, setEditingName] = useState(false);

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === activeId) ?? null,
    [templates, activeId],
  );

  const canDelete = templates.length > 1;
  const usedInTasks = (activeTemplate?._count?.aiRequests ?? 0) > 0;

  /* ── Fetch ─────────────────────────────────────────── */

  const fetchTemplates = useCallback(async (preserveActive = true) => {
    try {
      const res = await fetch("/api/prompt-templates");
      const data = (await res.json()) as
        | { ok: true; templates: Template[] }
        | ApiError;
      if (!data.ok) throw new Error(data.error);
      setTemplates(data.templates);
      if (!preserveActive || !activeId) {
        const first = data.templates[0];
        if (first) { setActiveId(first.id); setContent(first.content); }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "無法載入 Prompt Template。"));
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => { void fetchTemplates(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sync textarea when active changes */
  useEffect(() => {
    if (!activeTemplate) return;
    setName(activeTemplate.name);
    setContent(activeTemplate.content);
    setEditingName(false);
  }, [activeTemplate]);

  /* ── Actions ────────────────────────────────────────── */

  async function onSave() {
    if (!activeTemplate) return;
    if (name.trim().length === 0) {
      toast.error("Prompt Title 不能為空白。");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/prompt-templates/${activeTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
      toast.success("Prompt Template 已更新。");
      await fetchTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "更新失敗，請稍後再試。"));
    } finally {
      setSaving(false);
    }
  }

  async function onCreate(mode: "blank" | "copy") {
    if (!activeTemplate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/prompt-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseTemplateId: activeTemplate.id,
          content: mode === "copy" ? content : undefined,
          mode,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; template?: Template };
      if (!data.ok || !data.template) throw new Error(data.error);
      toast.success(mode === "copy" ? "已複製目前內容為新版本。" : "已新增空白版本。");
      setActiveId(data.template.id);
      await fetchTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "新增失敗，請稍後再試。"));
    } finally {
      setCreating(false);
    }
  }

  async function onDelete() {
    if (!activeTemplate || !canDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/prompt-templates/${activeTemplate.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
      toast.success("Prompt Template 已刪除。");
      const remaining = templates.filter((t) => t.id !== activeTemplate.id);
      setActiveId(remaining[0]?.id ?? null);
      await fetchTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "刪除失敗，至少需保留一個 Prompt。"));
    } finally {
      setDeleting(false);
    }
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-10">
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* ── Template list ──────────────────────────────── */}
          <div
            className="flex flex-col min-h-[620px] rounded-2xl border overflow-hidden"
            style={{ background: "var(--layer-card)", borderColor: "rgba(0,0,0,0.07)" }}
          >
            <div className="px-5 pt-5 pb-3 border-b border-black/[0.06]">
              <p className="section-label uppercase">Templates</p>
            </div>

            {loading ? (
              <div className="p-3 space-y-2">
                {[80, 65, 90].map((w, i) => (
                  <div key={i} className="p-3 rounded-xl">
                    <div className="skeleton h-4 rounded mb-1.5" style={{ width: `${w}%` }} />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 px-4 text-center">
                <FileText className="w-8 h-8 text-[#A8A29E]" />
                <p className="body-text text-[#78716C]">No templates</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {templates.map((t) => {
                  const active = t.id === activeId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveId(t.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-[120ms]",
                        active
                          ? "border-l-[3px] border-[#D97757] bg-[#D97757]/6 pl-[9px]"
                          : "hover:bg-black/[0.03]",
                      )}
                    >
                      <p className="body-text font-medium leading-tight text-[#1C1917]">{t.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            background: active ? "rgba(217,119,87,0.15)" : "#EDE8DF",
                            color: "#78716C",
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        >
                          v{t.version}
                        </span>
                        <span className="text-[11px] text-[#A8A29E]">{t.taskType}</span>
                        {t.updatedAt && (
                          <span className="text-[11px] text-[#A8A29E] ml-auto">
                            {formatDate(t.updatedAt)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="p-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => onCreate("blank")}
                disabled={creating || !activeTemplate}
                className="w-full h-9 rounded-xl body-text font-medium text-[#78716C] flex items-center justify-center gap-2 border border-dashed transition-all duration-[120ms] hover:border-black/20 hover:text-[#1C1917] disabled:opacity-40"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                新增新版本（空白）
              </button>
            </div>
          </div>

          {/* ── Editor ─────────────────────────────────────── */}
          <div
            className="flex flex-col min-h-[620px] rounded-2xl border overflow-hidden"
            style={{ background: "var(--layer-card)", borderColor: "rgba(0,0,0,0.07)" }}
          >
            {!activeTemplate ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <FileText className="w-10 h-10 text-[#A8A29E]" />
                <p className="body-text text-[#78716C]">Select a template to edit</p>
              </div>
            ) : (
              <>
                <div className="px-6 pt-5 pb-4 border-b border-black/[0.06] flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {editingName ? (
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoFocus
                          onBlur={() => setEditingName(false)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingName(false);
                            if (e.key === "Escape") {
                              setName(activeTemplate.name);
                              setEditingName(false);
                            }
                          }}
                          className="h-10 w-full max-w-xl rounded-lg px-3 text-[20px] font-semibold text-[#1C1917] outline-none transition-colors"
                          style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)" }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingName(true)}
                          className="group/title inline-flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-black/[0.04]"
                        >
                          <h2 className="text-[20px] font-semibold text-[#1C1917] leading-tight">{name}</h2>
                          <Pencil className="w-4 h-4 text-[#A8A29E] opacity-0 transition-opacity group-hover/title:opacity-100" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "#EDE8DF", color: "#78716C", fontFamily: "var(--font-geist-mono)" }}
                      >
                        v{activeTemplate.version}
                      </span>
                      <span className="section-label text-[#A8A29E]">
                        {activeTemplate.taskType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full resize-none body-text text-[#1C1917] rounded-xl px-4 py-3 outline-none transition-all duration-[120ms]"
                    placeholder="輸入 Prompt 內容…&#10;&#10;可使用 {{filename}}, {{tags}} 等變數"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.12)",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "14px",
                      lineHeight: 1.7,
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

                <div
                  className="sticky bottom-0 px-6 py-3 border-t flex items-center gap-2"
                  style={{ borderColor: "rgba(0,0,0,0.08)", background: "var(--layer-page)" }}
                >
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="h-9 px-4 rounded-[10px] body-text font-medium text-[#FAF8F5] flex items-center gap-2 transition-all duration-[120ms] disabled:opacity-60"
                    style={{ background: "#2C2825", boxShadow: "0 1px 3px rgba(28,25,23,0.20)" }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    儲存
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreate("copy")}
                    disabled={creating}
                    className="h-9 px-4 rounded-[10px] body-text font-medium text-[#1C1917] flex items-center gap-2 border transition-all duration-[120ms] disabled:opacity-60 hover:bg-[#EDE8DF]"
                    style={{ background: "#EDE8DF", borderColor: "rgba(0,0,0,0.07)" }}
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    複製目前內容成新版本
                  </button>

                  <div className="flex-1" />
                  <div className="relative group/delete">
                    <button
                      type="button"
                      onClick={onDelete}
                      disabled={!canDelete || deleting || usedInTasks}
                      className={cn(
                        "h-9 px-3 rounded-[10px] body-text font-medium flex items-center gap-2 transition-all duration-[120ms]",
                        canDelete && !usedInTasks
                          ? "text-[#B45050] hover:bg-[rgba(180,80,80,0.06)]"
                          : "text-[#A8A29E] cursor-not-allowed",
                      )}
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      刪除
                    </button>

                    {(!canDelete || usedInTasks) && (
                      <div
                        className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs text-[#78716C] whitespace-nowrap pointer-events-none opacity-0 group-hover/delete:opacity-100 transition-opacity"
                        style={{
                          background: "#FAF8F5",
                          border: "1px solid rgba(0,0,0,0.07)",
                          boxShadow: "0 4px 12px rgba(28,25,23,0.10)",
                        }}
                      >
                        {!canDelete ? "Must keep at least one template" : "Used in tasks — cannot delete"}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
