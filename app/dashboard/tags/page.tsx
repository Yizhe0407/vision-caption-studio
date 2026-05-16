"use client";

import { useEffect, useState } from "react";
import { Lock, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

type TagKey = {
  id: string;
  key: string;
  isDefault: boolean;
};

export default function TagsPage() {
  const [keys, setKeys] = useState<TagKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/tag-keys")
      .then((r) => r.json())
      .then((data: { ok: boolean; keys: TagKey[] }) => {
        if (data.ok) setKeys(data.keys);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase().replace(/\s+/g, "_");
    if (keys.some((k) => k.key === normalized)) return;
    setAdding(true);
    const optimistic: TagKey = { id: `temp-${Date.now()}`, key: normalized, isDefault: false };
    setKeys((prev) => [...prev, optimistic].sort((a, b) => a.key.localeCompare(b.key)));
    setInput("");
    try {
      const res = await fetch("/api/tag-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed }),
      });
      const data = (await res.json()) as { ok: boolean; entry?: TagKey; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Failed to add tag");
      setKeys((prev) => {
        const without = prev.filter((k) => k.id !== optimistic.id);
        if (!data.entry || without.some((k) => k.id === data.entry!.id)) return without;
        return [...without, data.entry].sort((a, b) => a.key.localeCompare(b.key));
      });
    } catch (err) {
      setKeys((prev) => prev.filter((k) => k.id !== optimistic.id));
      toast.error(err instanceof Error ? err.message : "Failed to add tag");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const removed = keys.find((k) => k.id === id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
    try {
      const res = await fetch(`/api/tag-keys/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Failed to delete tag");
    } catch (err) {
      if (removed) setKeys((prev) => [...prev, removed].sort((a, b) => a.key.localeCompare(b.key)));
      toast.error(err instanceof Error ? err.message : "Failed to delete tag");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2C2825] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-8">
      <p className="mb-6 text-sm text-[#A8A29E]">
        Define which structured tag fields the AI generates values for. Default tags cannot be removed.
      </p>

      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          <span
            key={k.id}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
            style={{
              background: k.isDefault ? "#EDE8DF" : "#2C2825",
              color: k.isDefault ? "#78716C" : "#FAF8F5",
            }}
          >
            {k.isDefault && <Lock className="h-3 w-3 opacity-50" />}
            {k.key}
            {!k.isDefault && (
              <button
                type="button"
                onClick={() => handleDelete(k.id)}
                className="ml-0.5 opacity-60 hover:opacity-100 hover:text-red-400 transition-opacity"
                aria-label={`Remove ${k.key}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !adding && handleAdd()}
          placeholder="Add a new tag key (e.g. occasion)"
          className="h-9 rounded-lg border border-black/10 bg-white px-3 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#2C2825]"
          style={{ minWidth: 260 }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !input.trim()}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#2C2825] px-3 text-sm text-[#FAF8F5] hover:bg-[#3C3530] disabled:opacity-40 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
