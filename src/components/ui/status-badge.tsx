type Status = "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";

const configs: Record<
  Status,
  { className: string; label: string; dot: boolean }
> = {
  QUEUED: {
    className: "bg-[#E8E4DE] text-[#78716C]",
    label: "QUEUED",
    dot: false,
  },
  PROCESSING: {
    className: "bg-[#FEF3C7] text-[#92400E]",
    label: "PROCESSING",
    dot: true,
  },
  SUCCEEDED: {
    className: "bg-[#D1FAE5] text-[#065F46]",
    label: "SUCCEEDED",
    dot: false,
  },
  FAILED: {
    className: "bg-[#FEE2E2] text-[#991B1B]",
    label: "FAILED",
    dot: false,
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = configs[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wider uppercase ${cfg.className}`}
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      {cfg.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current pulse-dot"
          aria-hidden="true"
        />
      )}
      {cfg.label}
    </span>
  );
}
