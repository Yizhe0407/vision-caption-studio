"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, Search, Tag, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { toFriendlyError } from "@/src/lib/friendly-error";
import { cn } from "@/src/lib/cn";

type JobStatus = "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
type FilterTab = "ALL" | JobStatus;

type JobItem = {
  id: string;
  status: JobStatus;
  errorMessage: string | null;
  image: {
    id: string;
    originalFilename: string;
    captions: Array<{ content: string }>;
    tags: Array<{ tag: { name: string } }>;
  };
};

type ImageDetail = {
  id: string;
  originalFilename: string;
  imageUrl: string;
  captions: Array<{ id: string; content: string }>;
  tags: Array<{ tag: { name: string } }>;
};

type ApiError = { ok: false; error?: string };

const FILTERS: { label: string; value: FilterTab }[] = [
  { label: "全部",     value: "ALL" },
  { label: "成功",     value: "SUCCEEDED" },
  { label: "失敗",     value: "FAILED" },
];

/* ── Tag input ─────────────────────────────────────────── */
function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border text-[#1C1917]"
            style={{ background: "#F5F1EB", borderColor: "rgba(0,0,0,0.12)" }}
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="text-[#A8A29E] hover:text-[#B45050] transition-colors ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); add(); }
        }}
        placeholder="輸入標籤後按 Enter"
        className="w-full h-9 px-3 rounded-[10px] text-sm text-[#1C1917] outline-none transition-all duration-[120ms]"
        style={{ background: "#F5F1EB", border: "1px solid rgba(0,0,0,0.12)" }}
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
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function ImagesPage() {
  const [jobs, setJobs]           = useState<JobItem[]>([]);
  const [keyword, setKeyword]     = useState("");
  const [filter, setFilter]       = useState<FilterTab>("ALL");
  const [loadingList, setLoadingList] = useState(true);

  const [activeJob, setActiveJob]         = useState<JobItem | null>(null);
  const [activeImage, setActiveImage]     = useState<ImageDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [captionDraft, setCaptionDraft] = useState("");
  const [tagsDraft, setTagsDraft]       = useState<string[]>([]);
  const [saving, setSaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeDrawerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return jobs.filter((j) => {
      const filename = j.image.originalFilename.toLowerCase();
      const description = (j.image.captions[0]?.content ?? "").toLowerCase();
      const tagText = j.image.tags.map((item) => item.tag.name.toLowerCase()).join(" ");
      const matchKw = !kw || filename.includes(kw) || description.includes(kw) || tagText.includes(kw);
      const matchFilter = filter === "ALL" || j.status === filter;
      return matchKw && matchFilter;
    });
  }, [jobs, keyword, filter]);

  /* ── Fetch ─────────────────────────────────────────── */

  async function fetchJobs() {
    try {
      const res = await fetch("/api/jobs");
      const data = (await res.json()) as { ok: true; jobs: JobItem[] } | ApiError;
      if (data.ok) setJobs(data.jobs ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "無法載入資料清單。"));
    } finally {
      setLoadingList(false);
    }
  }

  async function openDrawer(job: JobItem) {
    if (closeDrawerTimerRef.current) clearTimeout(closeDrawerTimerRef.current);
    setActiveJob(job);
    setDrawerLoading(true);
    setActiveImage(null);
    setConfirmDelete(false);
    try {
      const res = await fetch(`/api/images/${job.image.id}`);
      const data = (await res.json()) as { ok: true; image: ImageDetail } | ApiError;
      if (!data.ok) throw new Error(data.error);
      setActiveImage(data.image);
      setCaptionDraft(data.image.captions[0]?.content ?? "");
      setTagsDraft(data.image.tags.map((t) => t.tag.name));
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "無法載入圖片詳情。"));
    } finally {
      setDrawerLoading(false);
    }
  }

  function closeDrawer() {
    setDrawerVisible(false);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setConfirmDelete(false);
    closeDrawerTimerRef.current = setTimeout(() => {
      setActiveJob(null);
      setActiveImage(null);
    }, 220);
  }

  useEffect(() => {
    void fetchJobs();
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (closeDrawerTimerRef.current) clearTimeout(closeDrawerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!activeJob) {
      setDrawerVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setDrawerVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [activeJob]);

  /* ── Save ──────────────────────────────────────────── */

  async function onSave() {
    if (!activeImage) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/images/${activeImage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: captionDraft.trim(), tags: tagsDraft }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
      toast.success("描述與標籤已更新。");
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "更新失敗，請稍後再試。"));
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ────────────────────────────────────────── */

  function onDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 2000);
    } else {
      void onDeleteConfirm();
    }
  }

  async function onDeleteConfirm() {
    if (!activeImage) return;
    try {
      const res = await fetch(`/api/images/${activeImage.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
      toast.success("資料已刪除。");
      closeDrawer();
      await fetchJobs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "刪除失敗，請稍後再試。"));
    }
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-10">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E] pointer-events-none" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜尋檔名、描述、標籤…"
              className="w-full h-10 pl-9 pr-9 rounded-[10px] body-text text-[#1C1917] outline-none transition-all duration-[120ms]"
              style={{ background: "#FAF8F5", border: "1px solid rgba(0,0,0,0.12)" }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2C2825";
                e.target.style.boxShadow = "0 0 0 3px rgba(44,40,37,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0,0,0,0.12)";
                e.target.style.boxShadow = "none";
              }}
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#78716C] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5">
            {FILTERS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                   "px-3 py-2 rounded-[10px] section-label transition-all duration-[120ms]",
                  filter === value
                    ? "bg-[#2C2825] text-[#FAF8F5]"
                    : "bg-[#FAF8F5] text-[#78716C] hover:bg-[#EDE8DF]",
                )}
                style={{ border: "1px solid rgba(0,0,0,0.07)" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        {!loadingList && (
          <p className="body-text text-[#78716C] mb-4">
            {filtered.length} 張圖片
          </p>
        )}

        {/* Grid */}
        {loadingList ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="skeleton aspect-[4/3] w-full" />
                <div className="p-3 space-y-1.5">
                  <div className="skeleton h-3.5 rounded w-3/4" />
                  <div className="skeleton h-4 rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <ImageIcon className="w-10 h-10 text-[#A8A29E]" />
            <p className="text-sm text-[#78716C]">No images found</p>
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="text-xs font-medium text-[#2C2825] underline underline-offset-2 hover:text-[#1A1714] transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => openDrawer(job)}
                className="group rounded-2xl overflow-hidden text-left transition-all duration-[120ms] hover:scale-[1.02]"
                style={{
                  background: "#FAF8F5",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 16px rgba(28,25,23,0.10), 0 1px 4px rgba(28,25,23,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)";
                }}
              >
                <div
                  className="aspect-[4/3] overflow-hidden"
                  style={{ background: "#EDE8DF" }}
                >
                  <img
                    src={`/api/images/${job.image.id}/file`}
                    alt={job.image.originalFilename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <p className="body-text text-[#1C1917] truncate flex-1">
                    {job.image.originalFilename}
                  </p>
                  <StatusBadge status={job.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right Drawer ─────────────────────────────────── */}
      {activeJob && (
        <>
          {/* Overlay */}
          <div
            className={cn(
              "fixed inset-0 z-40 md:hidden transition-opacity duration-200",
              drawerVisible ? "opacity-100" : "opacity-0",
            )}
            style={{ background: "rgba(0,0,0,0.15)" }}
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div
            className={cn(
              "fixed z-50 flex flex-col w-full left-0 right-0 bottom-0 max-h-[86vh] rounded-t-2xl overflow-hidden md:w-[420px] md:left-auto md:right-3 md:top-16 md:bottom-4 md:max-h-none md:rounded-2xl transition-transform duration-[220ms] [transition-timing-function:cubic-bezier(0.32,0,0.08,1)]",
              drawerVisible
                ? "translate-y-0 md:translate-y-0 md:translate-x-0"
                : "translate-y-full md:translate-y-0 md:translate-x-full",
            )}
            style={{
              background: "#FAF8F5",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06]">
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-[#78716C]"
              >
                <X className="w-4 h-4" />
              </button>
               <h2 className="section-label text-[#1C1917] truncate flex-1">
                 {activeJob.image.originalFilename}
               </h2>
              <StatusBadge status={activeJob.status} />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-0">
              {drawerLoading ? (
                <>
                  <div className="skeleton aspect-[4/3] rounded-xl w-full" />
                  <div className="skeleton h-4 rounded w-3/4" />
                  <div className="skeleton h-24 rounded-xl w-full" />
                </>
              ) : activeImage ? (
                <>
                  {/* Image */}
                  <div
                    className="border-t border-black/[0.06] pt-4 mb-5"
                  >
                    <div
                      className="rounded-[12px] overflow-hidden w-full aspect-[4/3]"
                      style={{ background: "#EDE8DF" }}
                    >
                      <img
                        src={activeImage.imageUrl}
                        alt={activeImage.originalFilename}
                        className="w-full h-full object-cover rounded-xl border-1 border-[#0000001F]"
                      />
                    </div>
                  </div>

                  {/* Error banner */}
                  {activeJob.status === "FAILED" && (
                    <div
                      className="px-4 py-3 rounded-xl text-sm text-[#991B1B] mb-5"
                      style={{ background: "#FEE2E2", border: "1px solid rgba(153,27,27,0.12)" }}
                    >
                      生成失敗：{activeJob.errorMessage ?? "請檢查 API Key 設定。"}
                    </div>
                  )}

                  {/* Caption */}
                  <div className="border-t border-black/[0.06] pt-4 mb-5">
                    <label
                      className="block mb-1.5 uppercase"
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#78716C",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      rows={10}
                      placeholder="描述內容…"
                      className="w-full px-3 py-2.5 rounded-[10px] text-sm text-[#1C1917] resize-none outline-none transition-all duration-[120ms]"
                      style={{
                        background: "#F5F1EB",
                        border: "1px solid rgba(0,0,0,0.12)",
                        lineHeight: 1.6,
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

                  {/* Tags */}
                  <div className="border-t border-black/[0.06] pt-4">
                    <label
                      className="block mb-1.5 uppercase flex items-center gap-1.5"
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#78716C",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <Tag className="w-3 h-3" />
                      Tags
                    </label>
                    <TagInput tags={tagsDraft} onChange={setTagsDraft} />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 text-[#A8A29E] animate-spin" />
                </div>
              )}
            </div>

            {/* Sticky action bar */}
            <div
              className="sticky bottom-0 flex items-center justify-between gap-3 px-5 py-3 border-t"
              style={{ background: "#FAF8F5", borderColor: "rgba(0,0,0,0.08)" }}
            >
              <button
                type="button"
                onClick={onDeleteClick}
                disabled={!activeImage}
                className={cn(
                  "h-9 px-2 text-sm font-medium flex items-center gap-1.5 transition-all duration-[120ms] disabled:opacity-50",
                  confirmDelete ? "text-white bg-[#B45050] rounded-[10px] px-3" : "text-[#B45050] bg-transparent border-0",
                )}
              >
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? "確認刪除？" : "刪除"}
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !activeImage}
                className="h-9 min-w-[96px] rounded-[10px] text-sm font-medium text-[#FAF8F5] flex items-center justify-center gap-2 transition-all duration-[120ms] disabled:opacity-50"
                style={{ background: "#2C2825" }}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                儲存
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
