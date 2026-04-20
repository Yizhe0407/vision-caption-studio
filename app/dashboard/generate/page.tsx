"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, Tag, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { toFriendlyError } from "@/src/lib/friendly-error";
import { cn } from "@/src/lib/cn";

type JobItem = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  errorMessage: string | null;
  createdAt?: string;
  image: { id: string; originalFilename: string };
};

type ImageDetail = {
  id: string;
  originalFilename: string;
  imageUrl: string;
  captions: Array<{ id: string; content: string }>;
  tags: Array<{ tag: { name: string } }>;
};

type ApiError = { ok: false; error?: string };

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
}

function getFileKey(file: File) {
  return `${file.name}::${file.size}::${file.lastModified}::${file.type}`;
}


export default function GeneratePage() {
  const fileInputRef             = useRef<HTMLInputElement>(null);
  const [files, setFiles]        = useState<File[]>([]);
  const [dragOver, setDragOver]  = useState(false);
  const [provider, setProvider]  = useState<string>("OPENAI");
  const [providerReady, setProviderReady] = useState(false);
  const [jobs, setJobs]          = useState<JobItem[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [imageDetail, setImageDetail] = useState<ImageDetail | null>(null);
  const [uploading, setUploading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

const activeJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId) ?? null,
    [jobs, activeJobId],
  );
  const activeJobStatus = activeJob?.status;
  const activeImageId = activeJob?.image.id;

  const hasProcessing = useMemo(
    () => jobs.some((j) => j.status === "QUEUED" || j.status === "PROCESSING"),
    [jobs],
  );

  /* ── Fetch helpers ─────────────────────────────────── */

  const fetchJobs = useCallback(async (silent = true) => {
    try {
      const res = await fetch("/api/jobs");
      const data = (await res.json()) as { ok: true; jobs: JobItem[] } | ApiError;
      if (data.ok) setJobs(data.jobs ?? []);
    } catch {
      if (!silent) toast.error("目前無法載入任務列表。");
    }
  }, []);

  const fetchImageDetail = useCallback(async (imageId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/images/${imageId}`);
      const data = (await res.json()) as { ok: true; image: ImageDetail } | ApiError;
      if (!data.ok) throw new Error(data.error);
      setImageDetail(data.image);
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "無法載入圖片結果。"));
    } finally {
      setDetailLoading(false);
    }
  }, []);

const previewItems = useMemo(
    () =>
      files.map((file) => ({
        key: getFileKey(file),
        file,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const item of previewItems) URL.revokeObjectURL(item.url);
    };
  }, [previewItems]);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = (await res.json()) as
        | { ok: true; settings: { preferredProvider: string } }
        | ApiError;
      if (data.ok) {
        setProvider(data.settings.preferredProvider);
        setProviderReady(true);
      }
    } catch {
      // non-critical
    }
  }

  /* ── Effects ───────────────────────────────────────── */

  useEffect(() => {
    void fetchSettings();
    void fetchJobs();
    const timer = setInterval(() => void fetchJobs(), 3000);
    return () => clearInterval(timer);
  }, [fetchJobs]);

useEffect(() => {
    if (!activeJobId || !activeImageId || !activeJobStatus) return;
    if (activeJobStatus === "SUCCEEDED" || activeJobStatus === "FAILED") {
      void fetchImageDetail(activeImageId);
      return;
    }
    setImageDetail(null);
  }, [activeJobId, activeImageId, activeJobStatus, fetchImageDetail]);

  /* ── File handling ─────────────────────────────────── */

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const seen = new Set<string>();
      return [...prev, ...valid].filter((file) => {
        const key = getFileKey(file);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  /* ── Upload ─────────────────────────────────────────── */

  async function onUpload() {
    if (files.length === 0) { toast.error("請先選擇至少一張圖片。"); return; }
    if (!providerReady)     { toast.error("尚未讀取 API 設定，請稍後再試。"); return; }

    setUploading(true);
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("provider", provider);

    try {
      const res = await fetch("/api/upload/batch", { method: "POST", body: form });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
      toast.success(`${files.length} 張圖片已排入生成佇列。`);
      setFiles([]);
      await fetchJobs(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "上傳失敗，請稍後再試。"));
    } finally {
      setUploading(false);
    }
  }

  /* ── Select job ─────────────────────────────────────── */

  function selectJob(job: JobItem) {
    setActiveJobId(job.id);
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div className="flex h-full overflow-hidden bg-[var(--layer-page)]">
      <div className="mx-auto flex h-full w-full max-w-[1200px] gap-6 overflow-hidden px-4 py-6 sm:px-10">
      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div
        className="flex h-full w-full max-w-[320px] flex-shrink-0 flex-col overflow-y-auto rounded-2xl border"
        style={{
          background: "var(--layer-card)",
          borderColor: "rgba(28,25,23,0.06)",
          boxShadow: "0 1px 4px rgba(28,25,23,0.04)",
        }}
      >
        {/* Upload zone */}
        <div className="p-4 border-b border-black/[0.06]">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Drop area */}
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "min-h-[140px] rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-[120ms] select-none flex flex-col items-center justify-center",
              dragOver
                ? "border-[#2C2825] bg-[rgba(255,255,255,0.9)]"
                : "border-[rgba(0,0,0,0.20)] bg-[rgba(255,255,255,0.6)] hover:border-[#2C2825] hover:bg-[rgba(255,255,255,0.9)]",
            )}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <UploadCloud
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: dragOver ? "#D97757" : "#A8A29E" }}
            />
            <p className="body-text text-[#1C1917]">
              Drop images here or click to browse
            </p>
            <p className="section-label mt-1 text-[#A8A29E]">
              PNG, JPG, WebP · 最大 20MB
            </p>
          </div>

          {/* Thumbnail strip */}
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {previewItems.slice(0, 8).map(({ key, file, url }) => (
                <div
                  key={key}
                  className="w-10 h-10 rounded-md overflow-hidden bg-[#EDE8DF] flex-shrink-0"
                >
                  <img
                    src={url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {files.length > 8 && (
                <div className="w-10 h-10 rounded-md bg-[#EDE8DF] flex items-center justify-center text-xs font-medium text-[#78716C]">
                  +{files.length - 8}
                </div>
              )}
            </div>
          )}

          {/* Upload button */}
          {files.length > 0 && (
            <button
              type="button"
              onClick={onUpload}
              disabled={uploading}
              className="mt-3 w-full h-9 rounded-[10px] body-text font-medium text-[#FAF8F5] flex items-center justify-center gap-2 transition-all duration-[120ms] disabled:opacity-60"
              style={{
                background: uploading ? "#78716C" : "#2C2825",
                boxShadow: "0 1px 3px rgba(28,25,23,0.20)",
              }}
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              上傳 {files.length} 張圖片
            </button>
          )}

          {/* Provider badge */}
          {providerReady && (
            <p className="mt-2 section-label text-[#A8A29E] text-center">
              Provider:{" "}
              <span
                className="font-medium text-[#78716C]"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {provider}
              </span>
            </p>
          )}
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <p className="section-label uppercase">Queue</p>
            {hasProcessing && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#FEF3C7", color: "#92400E", fontFamily: "var(--font-geist-mono)" }}
              >
                <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-current mr-1" />
                PROCESSING
              </span>
            )}
          </div>

          {jobs.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-center px-4">
              <ImageIcon className="w-8 h-8 text-[#A8A29E]" />
              <p className="text-sm text-[#78716C]">還沒有任務</p>
              <p className="text-xs text-[#A8A29E]">上傳圖片後會在此顯示</p>
            </div>
          ) : (
            <div className="px-2 pb-4 space-y-0.5">
              {jobs.map((job) => {
                const active = job.id === activeJobId;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => selectJob(job)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-[120ms] group",
                      active
                        ? "border-l-[3px] border-[#D97757] bg-[#D97757]/6 pl-[9px]"
                        : "hover:bg-black/[0.03]",
                      job.status === "PROCESSING" && !active && "animate-[pulse_3s_ease-in-out_infinite]",
                    )}
                  >
                    <div className="w-9 h-9 rounded-md bg-[#EDE8DF] flex-shrink-0 overflow-hidden">
                      <img
                        src={`/api/images/${job.image.id}/file`}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="body-text text-[#1C1917] truncate leading-tight">
                        {job.image.originalFilename}
                      </p>
                      <p
                        className="text-[11px] text-[#A8A29E] mt-0.5"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {formatTime(job.createdAt)}
                      </p>
                    </div>

                    <StatusBadge status={job.status} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MIDDLE + RIGHT PANELS ─────────────────────── */}
      <div className="flex min-w-0 flex-1 gap-6 overflow-hidden">
        <div
          className="flex-1 overflow-y-auto rounded-2xl border p-6"
          style={{ background: "var(--layer-card)", borderColor: "rgba(0,0,0,0.07)" }}
        >
          {!activeJobId ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "#EDE8DF" }}
              >
                <ImageIcon className="w-8 h-8 text-[#A8A29E]" />
              </div>
              <div>
                <p className="body-text font-medium text-[#1C1917]">
                  Select a task to view details
                </p>
                <p className="body-text text-[#78716C] mt-1">
                  點選左側任務查看原圖、描述與標籤
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in w-full h-full space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="body-text font-medium text-[#1C1917] truncate flex-1">
                  {activeJob?.image.originalFilename ?? imageDetail?.originalFilename}
                </h2>
                {activeJob && <StatusBadge status={activeJob.status} />}
              </div>
              {imageDetail ? (
                <img
                  src={imageDetail.imageUrl}
                  alt={imageDetail.originalFilename}
                  className="w-full h-auto rounded-2xl object-contain border border-black/[0.07]"
                />
              ) : (
                <div className="flex items-center justify-center h-[360px] rounded-2xl bg-[#EDE8DF]">
                  {activeJob?.status === "PROCESSING" || activeJob?.status === "QUEUED" ? (
                    <Loader2 className="w-6 h-6 text-[#A8A29E] animate-spin" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-[#A8A29E]" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="w-[280px] flex-shrink-0 overflow-y-auto space-y-4">
          {activeJob?.status === "FAILED" && (
            <div
              className="px-4 py-3 rounded-xl body-text text-[#991B1B]"
              style={{ background: "#FEE2E2", border: "1px solid rgba(153,27,27,0.12)" }}
            >
              生成失敗：{toFriendlyError(activeJob.errorMessage ?? undefined, "請檢查 API Key 或模型設定。")}
            </div>
          )}

          <div
            className="rounded-xl p-4"
            style={{ background: "var(--layer-card)", border: "1px solid rgba(0,0,0,0.07)" }}
          >
            <p className="section-label mb-2 uppercase">Description</p>
            {detailLoading ? (
              <div className="space-y-2">
                <div className="skeleton h-3.5 rounded w-full" />
                <div className="skeleton h-3.5 rounded w-4/5" />
                <div className="skeleton h-3.5 rounded w-3/5" />
              </div>
            ) : (
              <p className="body-text text-[#1C1917] leading-relaxed whitespace-pre-wrap">
                {imageDetail?.captions[0]?.content ?? (
                  <span className="text-[#A8A29E]">
                    {activeJob?.status === "QUEUED" || activeJob?.status === "PROCESSING"
                      ? "生成中，請稍候…"
                      : "（尚未生成）"}
                  </span>
                )}
              </p>
            )}
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: "var(--layer-card)", border: "1px solid rgba(0,0,0,0.07)" }}
          >
            <p className="section-label mb-2 uppercase flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              Tags
            </p>
            {detailLoading ? (
              <div className="flex gap-2 flex-wrap">
                {[60, 80, 50, 90, 70].map((w, i) => (
                  <div key={i} className="skeleton h-6 rounded-full" style={{ width: w }} />
                ))}
              </div>
            ) : imageDetail && imageDetail.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {imageDetail.tags.map((item) => (
                  <span
                    key={item.tag.name}
                    className="px-3 py-1 rounded-full section-label border text-[#1C1917]"
                    style={{ borderColor: "rgba(0,0,0,0.12)", background: "#F5F1EB" }}
                  >
                    {item.tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="body-text text-[#A8A29E]">
                {activeJob?.status === "QUEUED" || activeJob?.status === "PROCESSING"
                  ? "生成中…"
                  : "（無標籤）"}
              </p>
            )}
          </div>

        </div>
      </div>
      </div>
    </div>
  );
}
