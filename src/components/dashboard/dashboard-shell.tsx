"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Database,
  FileText,
  Home,
  LogOut,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/src/components/ui/sidebar";
import { cn } from "@/src/lib/cn";
import { toFriendlyError } from "@/src/lib/friendly-error";

type NavGroup = {
  label?: string;
  items: Array<{ href: string; label: string; icon: React.ElementType; exact: boolean }>;
};

function buildNavGroups(isAdmin: boolean): NavGroup[] {
  return [
    {
      items: [
        { href: "/dashboard", label: "Dashboard", icon: Home, exact: true },
        { href: "/dashboard/generate", label: "Generate", icon: Sparkles, exact: false },
        { href: "/dashboard/images", label: "Image Library", icon: Database, exact: false },
      ],
    },
    {
      label: "Configure",
      items: [
        { href: "/dashboard/prompt-templates", label: "Prompt Templates", icon: FileText, exact: false },
        { href: "/dashboard/settings/api", label: "API Settings", icon: Settings2, exact: false },
        ...(isAdmin
          ? [{ href: "/dashboard/admin/users", label: "User Management", icon: ShieldCheck, exact: false }]
          : []),
      ],
    },
  ];
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/generate": "Generate",
  "/dashboard/images": "Image Library",
  "/dashboard/prompt-templates": "Prompt Templates",
  "/dashboard/settings/api": "API Settings",
  "/dashboard/admin/users": "User Management",
  "/dashboard/debug": "Debug Logs",
};

function isActive(href: string, exact: boolean, pathname: string) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<"USER" | "ADMIN" | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Secret debug panel: type "dev" in sequence within 1.5s
  useEffect(() => {
    const SEQ = ["d", "e", "v"];
    const buf: string[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      buf.push(e.key.toLowerCase());
      if (buf.length > SEQ.length) buf.shift();
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => buf.splice(0), 1500);
      if (buf.join("") === SEQ.join("")) {
        buf.splice(0);
        router.push("/dashboard/debug");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as
          | { ok: true; user: { email: string; role: "USER" | "ADMIN" } }
          | { ok: false };
        if (!res.ok || !data.ok) {
          router.replace("/login");
          return;
        }

        setRole(data.user.role);
        setEmail(data.user.email);
      } catch {
        router.replace("/login");
      }
    }
    void fetchMe();
  }, [router]);

  const navGroups = useMemo(() => buildNavGroups(role === "ADMIN"), [role]);
  const allItems = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);

  async function onLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Logout failed");
      }
      window.location.href = "/login";
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      toast.error(toFriendlyError(msg, "登出失敗，請稍後再試。"));
    }
  }

  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <SidebarProvider className="overflow-hidden bg-[var(--layer-page)]">
      <div className="hidden h-full shrink-0 p-3 pr-2 md:flex">
        <Sidebar
          style={{
            background: "var(--layer-sidebar)",
            borderColor: "rgba(28,25,23,0.06)",
            boxShadow:
              "0 0 0 1px rgba(28,25,23,0.03), 0 4px 24px rgba(28,25,23,0.08), 0 1px 4px rgba(28,25,23,0.04)",
          }}
        >
          <div className="px-4 pb-3 pt-5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "#2C2825", boxShadow: "0 1px 3px rgba(28,25,23,0.25)" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#FAF8F5]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight text-[#1C1917]">Vision Studio</p>
                <p className="mt-0.5 text-[10px] leading-tight text-[#A8A29E]">Caption &amp; Tag</p>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-2 h-px bg-black/[0.06]" />

          <SidebarContent className="px-2 py-1">
            {navGroups.map((group, gi) => (
              <SidebarGroup key={gi} className="mb-4">
                {group.label && <SidebarGroupLabel style={{ color: "#A8A29E" }}>{group.label}</SidebarGroupLabel>}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href, item.exact, pathname);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            active
                              ? "bg-[#2C2825] text-[#FAF8F5]"
                              : "text-[#78716C] hover:bg-black/[0.05] hover:text-[#1C1917]",
                          )}
                          style={
                            active
                              ? {
                                  boxShadow:
                                    "0 1px 4px rgba(28,25,23,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
                                }
                              : undefined
                          }
                        >
                          <Link href={item.href}>
                            <Icon className="h-[15px] w-[15px] shrink-0" />
                            {item.label}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-black/[0.06] px-3 py-3">
            <div className="mb-2 rounded-lg px-2 py-1.5">
              <p className="truncate text-[12px] text-[#1C1917]">{email ?? "-"}</p>
              <p className="mt-0.5 text-[10px] text-[#A8A29E]">
                {role === "ADMIN" ? "管理員" : "一般使用者"}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-[#B45050] transition-colors hover:bg-[rgba(180,80,80,0.06)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              登出
            </button>
          </SidebarFooter>
        </Sidebar>
      </div>

      <SidebarInset>
        <header className="shrink-0 px-4 pt-4 sm:px-10 sm:pt-6">
          <h1 className="page-title truncate text-[#1C1917]">{title}</h1>
        </header>
        <main className="flex-1 overflow-hidden pb-20 md:pb-0">{children}</main>
      </SidebarInset>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around px-2 pt-2 md:hidden"
        style={{
          height: "calc(62px + env(safe-area-inset-bottom))",
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
          background: "rgba(250,248,245,0.98)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(0,0,0,0.12)",
          boxShadow: "0 -8px 20px rgba(28,25,23,0.10)",
        }}
      >
        {allItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors",
                active ? "text-[#2C2825]" : "text-[#6B645F] hover:text-[#2C2825]",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate text-[10px] font-medium leading-none">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </SidebarProvider>
  );
}
