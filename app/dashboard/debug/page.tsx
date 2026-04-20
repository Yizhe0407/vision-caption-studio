"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/cn";

type LogEntry = {
  id: string;
  provider: string;
  model: string;
  status: string;
  taskType: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: string;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

function duration(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function reltime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LogEntry | null>(null);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debug/logs");
      const data = (await res.json()) as { ok: boolean; logs?: LogEntry[]; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Failed");
      setLogs(data.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#0F0E0D" }}>
      <div className="max-w-[1080px] mx-auto px-4 py-6 sm:px-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-[#A8A29E] uppercase tracking-widest">
              Debug — AI Request Logs
            </h2>
            <p className="text-[11px] text-[#57534E] mt-0.5">
              Last 100 requests · secret panel (type <kbd className="bg-[#1C1917] text-[#78716C] px-1 rounded text-[10px]">d e v</kbd> anywhere to reopen)
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[#78716C] border border-[#2C2825] hover:border-[#44403C] hover:text-[#A8A29E] transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-[#7C3030] bg-[#1A0E0E] px-4 py-3 text-[12px] text-[#F87171]">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-[#57534E] text-[12px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading…
          </div>
        )}

        {/* Table */}
        {!loading && logs.length === 0 && !error && (
          <p className="text-[12px] text-[#57534E]">No requests yet.</p>
        )}

        {!loading && logs.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-[#1C1917]">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr style={{ background: "#161412" }}>
                  {["Time", "Provider", "Model", "Status", "Tokens", "Cost", "Duration"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-medium text-[#57534E] uppercase tracking-wider whitespace-nowrap border-b border-[#1C1917]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const isError = log.status === "FAILED";
                  const isOk = log.status === "SUCCEEDED";
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(selected?.id === log.id ? null : log)}
                      className={cn(
                        "cursor-pointer transition-colors border-b border-[#1A1714]",
                        i % 2 === 0 ? "bg-[#0F0E0D]" : "bg-[#111009]",
                        "hover:bg-[#1C1917]",
                        selected?.id === log.id && "bg-[#1C1917]",
                      )}
                    >
                      <td className="px-3 py-2 text-[#57534E] whitespace-nowrap font-mono">
                        {reltime(log.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-[#A8A29E] whitespace-nowrap">{log.provider}</td>
                      <td className="px-3 py-2 text-[#78716C] font-mono max-w-[180px] truncate">{log.model}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center gap-1 font-medium",
                          isOk ? "text-[#4ADE80]" : isError ? "text-[#F87171]" : "text-[#78716C]",
                        )}>
                          {isOk
                            ? <CheckCircle2 className="w-3 h-3" />
                            : isError
                              ? <XCircle className="w-3 h-3" />
                              : <Clock className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[#57534E] font-mono whitespace-nowrap">
                        {log.totalTokens > 0 ? log.totalTokens.toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-[#57534E] font-mono whitespace-nowrap">
                        {parseFloat(log.estimatedCostUsd) > 0
                          ? `$${parseFloat(log.estimatedCostUsd).toFixed(5)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-[#57534E] font-mono whitespace-nowrap">
                        {duration(log.startedAt, log.finishedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div
            className="rounded-xl border border-[#2C2825] p-4 space-y-3"
            style={{ background: "#161412" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                Request Detail
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-[#57534E] hover:text-[#78716C] text-[11px]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px]">
              {[
                ["ID", selected.id],
                ["Provider", selected.provider],
                ["Model", selected.model],
                ["Status", selected.status],
                ["Task", selected.taskType],
                ["Input tokens", selected.inputTokens],
                ["Output tokens", selected.outputTokens],
                ["Total tokens", selected.totalTokens],
                ["Cost (USD)", `$${parseFloat(selected.estimatedCostUsd).toFixed(6)}`],
                ["Duration", duration(selected.startedAt, selected.finishedAt)],
                ["Created", new Date(selected.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex gap-2">
                  <span className="text-[#57534E] min-w-[90px] shrink-0">{label}</span>
                  <span className="text-[#A8A29E] font-mono break-all">{String(value)}</span>
                </div>
              ))}
            </div>

            {selected.errorMessage && (
              <div className="rounded-lg border border-[#7C3030] bg-[#1A0E0E] px-3 py-2">
                <p className="text-[10px] text-[#57534E] mb-1 uppercase tracking-wider">Error</p>
                <p className="text-[11px] text-[#F87171] font-mono whitespace-pre-wrap break-all">
                  {selected.errorMessage}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
