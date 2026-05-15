"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import { toFriendlyError } from "@/src/lib/friendly-error";

type DictEntry = {
  id: string;
  category: string;
  value: string;
  isDefault: boolean;
};

const CATEGORY_ORDER = [
  "category",
  "product_type",
  "shape",
  "material",
  "texture",
  "pattern",
  "pattern_layout",
  "technique",
  "color.primary",
  "color.secondary",
  "color.accent",
  "style",
  "details",
  "mood",
];

function displayName(cat: string): string {
  const map: Record<string, string> = {
    "color.primary": "Color (Primary)",
    "color.secondary": "Color (Secondary)",
    "color.accent": "Color (Accent)",
    product_type: "Product Type",
    pattern_layout: "Pattern Layout",
  };
  return (
    map[cat] ??
    cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function TagsPage() {
  const [entries, setEntries] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // per-category input values
  const [inputs, setInputs] = useState<Record<string, string>>({});
  // per-category adding state
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  // per-entry deleting state
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/tag-dictionary");
      const data = (await res.json()) as
        | { ok: true; entries: DictEntry[] }
        | { ok: false; error?: string };
      if (!data.ok) throw new Error((data as { ok: false; error?: string }).error);
      setEntries(data.entries);
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "Failed to load tag dictionary."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEntries();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Group entries by category
  const grouped = (() => {
    const map: Record<string, DictEntry[]> = {};
    for (const entry of entries) {
      if (!map[entry.category]) map[entry.category] = [];
      map[entry.category].push(entry);
    }
    // Sort each category's values A-Z
    for (const cat of Object.keys(map)) {
      map[cat].sort((a, b) => a.value.localeCompare(b.value));
    }
    return map;
  })();

  // Determine final display order: CATEGORY_ORDER first, then any extras
  const allCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c] !== undefined || true),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ].filter((c, i, arr) => arr.indexOf(c) === i);

  async function onAdd(category: string) {
    const value = (inputs[category] ?? "").trim();
    if (!value) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempEntry: DictEntry = { id: tempId, category, value, isDefault: false };
    setEntries((prev) => [...prev, tempEntry]);
    setInputs((prev) => ({ ...prev, [category]: "" }));
    setAdding((prev) => ({ ...prev, [category]: true }));

    try {
      const res = await fetch("/api/tag-dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, value }),
      });
      const data = (await res.json()) as
        | { ok: true; entry: DictEntry }
        | { ok: false; error?: string };
      if (!data.ok) throw new Error((data as { ok: false; error?: string }).error);
      // Replace temp with real entry
      setEntries((prev) =>
        prev.map((e) =>
          e.id === tempId ? (data as { ok: true; entry: DictEntry }).entry : e,
        ),
      );
    } catch (err) {
      // Roll back optimistic update
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "Failed to add tag."));
    } finally {
      setAdding((prev) => ({ ...prev, [category]: false }));
    }
  }

  async function onDelete(entry: DictEntry) {
    if (entry.isDefault) return;

    // Optimistic update
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setDeletingIds((prev) => new Set(prev).add(entry.id));

    try {
      const res = await fetch(`/api/tag-dictionary/${entry.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error);
    } catch (err) {
      // Roll back
      setEntries((prev) => {
        const next = [...prev, entry];
        next.sort((a, b) => a.value.localeCompare(b.value));
        return next;
      });
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "Failed to delete tag."));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  }

  /* ── Render ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#A8A29E]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-10">
        <div className="mb-6">
          <p className="body-text text-[#78716C]">
            Manage the tag vocabulary used during image captioning. Default tags are read-only; add your own to any category.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCategories.map((cat) => {
            const catEntries = grouped[cat] ?? [];
            const isAdding = adding[cat] ?? false;
            const inputVal = inputs[cat] ?? "";

            return (
              <div
                key={cat}
                className="flex flex-col rounded-2xl border overflow-hidden"
                style={{
                  background: "var(--layer-card)",
                  borderColor: "rgba(0,0,0,0.07)",
                }}
              >
                {/* Category header */}
                <div className="px-4 pt-4 pb-2.5 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-[#A8A29E] shrink-0" />
                    <p className="section-label uppercase text-[#78716C]">
                      {displayName(cat)}
                    </p>
                  </div>
                </div>

                {/* Pills */}
                <div className="flex-1 px-4 py-3">
                  {catEntries.length === 0 ? (
                    <p className="text-[12px] text-[#A8A29E] italic">No tags yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {catEntries.map((entry) => (
                        <Pill
                          key={entry.id}
                          entry={entry}
                          isDeleting={deletingIds.has(entry.id)}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Add input */}
                <div className="px-4 pb-4 pt-2">
                  <AddInput
                    value={inputVal}
                    isAdding={isAdding}
                    onChange={(v) =>
                      setInputs((prev) => ({ ...prev, [cat]: v }))
                    }
                    onAdd={() => onAdd(cat)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function Pill({
  entry,
  isDeleting,
  onDelete,
}: {
  entry: DictEntry;
  isDeleting: boolean;
  onDelete: (entry: DictEntry) => void;
}) {
  if (entry.isDefault) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
        style={{
          background: "#EDE8DF",
          color: "#A8A29E",
        }}
      >
        {entry.value}
      </span>
    );
  }

  return (
    <span
      className="group/pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium transition-all duration-[120ms]"
      style={{
        background: "rgba(44,40,37,0.06)",
        color: "#1C1917",
      }}
    >
      {entry.value}
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => onDelete(entry)}
        className="ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-[#A8A29E] hover:text-[#B45050] hover:bg-[rgba(180,80,80,0.10)] transition-colors disabled:opacity-40"
        aria-label={`Remove ${entry.value}`}
      >
        {isDeleting ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
        ) : (
          <X className="w-2.5 h-2.5" />
        )}
      </button>
    </span>
  );
}

function AddInput({
  value,
  isAdding,
  onChange,
  onAdd,
}: {
  value: string;
  isAdding: boolean;
  onChange: (v: string) => void;
  onAdd: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-1.5">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onAdd();
        }}
        placeholder="Add a tag…"
        disabled={isAdding}
        className="flex-1 min-w-0 h-7 rounded-lg px-2.5 text-[12px] text-[#1C1917] placeholder-[#C4BFBA] outline-none transition-all duration-[120ms] disabled:opacity-50"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.12)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#2C2825";
          e.target.style.boxShadow = "0 0 0 2px rgba(44,40,37,0.08)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(0,0,0,0.12)";
          e.target.style.boxShadow = "none";
        }}
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={isAdding || !value.trim()}
        className="h-7 px-3 rounded-lg text-[12px] font-medium text-[#FAF8F5] flex items-center gap-1 transition-all duration-[120ms] disabled:opacity-40"
        style={{ background: "#2C2825", boxShadow: "0 1px 3px rgba(28,25,23,0.20)" }}
      >
        {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
      </button>
    </div>
  );
}
