"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  ImageIcon,
  Layers,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/src/components/ui/status-badge";

type JobItem = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  errorMessage: string | null;
  createdAt?: string;
  image: { id: string; originalFilename: string };
};

type Template = { id: string };

type ApiError = { ok: false; error?: string };

function StatCard({
  label,
  value,
  icon,
  loading,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  loading: boolean;
  accent?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "#FAF8F5",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="section-label uppercase"
        >
          {label}
        </p>
        <span style={{ color: accent ?? "#78716C" }}>{icon}</span>
      </div>
      {loading ? (
        <div className="skeleton h-8 w-20 rounded-lg" />
      ) : (
        <p className="text-[36px] font-semibold leading-none text-[#1C1917]">
          {value}
        </p>
      )}
    </div>
  );
}

export default function DashboardHomePage() {
  const [jobs, setJobs]             = useState<JobItem[]>([]);
  const [templateCount, setTemplateCount] = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobsRes, templatesRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/prompt-templates"),
        ]);
        const jobsData = (await jobsRes.json()) as
          | { ok: true; jobs: JobItem[] }
          | ApiError;
        const tmplData = (await templatesRes.json()) as
          | { ok: true; templates: Template[] }
          | ApiError;

        if (jobsData.ok)  setJobs(jobsData.jobs ?? []);
        if (tmplData.ok)  setTemplateCount(tmplData.templates.length);
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const total     = jobs.length;
  const succeeded = jobs.filter((j) => j.status === "SUCCEEDED").length;
  const failed    = jobs.filter((j) => j.status === "FAILED").length;
  const recent    = [...jobs].slice(0, 10);

  const stats = [
    {
      label: "Total Tasks",
      value: total,
      icon: <Layers className="w-5 h-5" />,
    },
    {
      label: "Succeeded",
      value: succeeded,
      icon: <CheckCircle2 className="w-5 h-5" />,
      accent: "#3D7A5E",
    },
    {
      label: "Failed",
      value: failed,
      icon: <XCircle className="w-5 h-5" />,
      accent: "#B45050",
    },
    {
      label: "Prompt Templates",
      value: templateCount,
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-10 space-y-6 animate-fade-in">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} loading={loading} {...s} />
          ))}
        </div>

        {/* Recent Tasks */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#FAF8F5",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
          }}
        >
          <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
            <div>
              <h2 className="section-label uppercase text-[#78716C]">Recent Tasks</h2>
              <p className="body-text text-[#78716C] mt-0.5">最近 10 筆任務</p>
            </div>
            <Link
              href="/dashboard/images"
              className="section-label text-[#78716C] hover:text-[#1C1917] transition-colors"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton h-4 w-48 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                  <div className="skeleton h-4 w-32 rounded ml-auto" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ImageIcon className="w-10 h-10 text-[#A8A29E]" />
              <p className="text-sm text-[#78716C]">還沒有任務</p>
              <Link
                href="/dashboard/generate"
                className="text-xs font-medium text-[#2C2825] hover:text-[#1A1714] underline underline-offset-2 transition-colors"
              >
                上傳第一張圖片
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {["Filename", "Status", "Created at", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left section-label uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((job, idx) => (
                  <tr
                    key={job.id}
                    className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="body-text text-[#1C1917] truncate max-w-[240px] block">
                        {job.image.originalFilename}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="body-text text-[#78716C]"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString("zh-TW", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : `Task #${idx + 1}`}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href="/dashboard/images"
                        className="section-label text-[#D97757] hover:text-[#c4663d] transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
