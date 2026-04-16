"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, User } from "lucide-react";
import toast from "react-hot-toast";
import { toFriendlyError } from "@/src/lib/friendly-error";

type UserRole = "USER" | "ADMIN";

type UserItem = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

type ApiError = { ok: false; error?: string };

function roleLabel(role: UserRole) {
  return role === "ADMIN" ? "管理員" : "一般使用者";
}

export function AdminUsersManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const [usersRes, meRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/auth/me")]);
      const usersData = (await usersRes.json()) as { ok: true; users: UserItem[] } | ApiError;
      const meData = (await meRes.json()) as
        | { ok: true; user: { userId: string; role: UserRole } }
        | ApiError;

      if (!usersData.ok) {
        throw new Error(usersData.error);
      }
      setUsers(usersData.users);
      if (meData.ok) {
        setCurrentUserId(meData.user.userId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "無法載入使用者清單。"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  async function onChangeRole(userId: string, role: UserRole) {
    setSavingUserId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = (await res.json()) as { ok: true; user: UserItem } | ApiError;
      if (!data.ok) {
        throw new Error(data.error);
      }
      toast.success("使用者角色已更新。");
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "更新角色失敗，請稍後再試。"));
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-10">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#FAF8F5",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
          }}
        >
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <h2 className="section-label uppercase text-[#78716C]">使用者管理</h2>
            <p className="body-text text-[#78716C] mt-0.5">可調整使用者角色（ADMIN / USER）</p>
          </div>

          {loading ? (
            <div className="px-5 py-10 flex justify-center">
              <Loader2 className="w-5 h-5 text-[#A8A29E] animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[#78716C]">尚無使用者資料</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className="px-5 py-3 text-left section-label uppercase">Email</th>
                  <th className="px-5 py-3 text-left section-label uppercase">角色</th>
                  <th className="px-5 py-3 text-left section-label uppercase">建立時間</th>
                  <th className="px-5 py-3 text-left section-label uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const saving = savingUserId === user.id;
                  const isCurrentUser = currentUserId === user.id;
                  const nextRole: UserRole = user.role === "ADMIN" ? "USER" : "ADMIN";
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3 body-text text-[#1C1917]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#A8A29E]" />
                          <span className="truncate max-w-[360px]">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: user.role === "ADMIN" ? "#E6F4EA" : "#EDE8DF",
                            color: user.role === "ADMIN" ? "#166534" : "#57534E",
                          }}
                        >
                          {user.role === "ADMIN" ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-5 py-3 body-text text-[#78716C]">
                        {new Date(user.createdAt).toLocaleString("zh-TW", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onChangeRole(user.id, nextRole)}
                           className="h-8 px-3 rounded-[10px] section-label text-[#1C1917] border border-black/[0.08] hover:bg-[#EDE8DF] transition-colors disabled:opacity-60"
                        >
                          {saving ? "更新中..." : isCurrentUser ? `切換為${roleLabel(nextRole)}（自己）` : `切換為${roleLabel(nextRole)}`}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
