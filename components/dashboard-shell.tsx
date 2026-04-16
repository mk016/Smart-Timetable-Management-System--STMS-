"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, GraduationCap, Layers3, Users2, DoorOpen, Menu, X } from "lucide-react";
import { useState } from "react";

import { SessionPayload } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

const navMap = {
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/teachers", label: "Teachers", icon: Users2 },
    { href: "/admin/subjects", label: "Subjects", icon: GraduationCap },
    { href: "/admin/rooms", label: "Rooms", icon: DoorOpen },
    { href: "/admin/batches", label: "Batches", icon: Layers3 },
    { href: "/admin/timetable", label: "Timetable", icon: CalendarRange }
  ],
  teacher: [{ href: "/teacher", label: "My Schedule", icon: CalendarRange }],
  student: [{ href: "/student", label: "My Timetable", icon: CalendarRange }]
} as const;

export function DashboardShell({
  children,
  session,
  role
}: {
  children: React.ReactNode;
  session: SessionPayload;
  role: keyof typeof navMap;
}) {
  const currentPath = usePathname();
  const items = navMap[role];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#111613]">
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-forest px-4 py-3 lg:hidden">
        <Link href="/" className="font-serif text-xl uppercase tracking-tight text-white">
          STMS <span className="text-accent">Flow</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/50">{session.name}</span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 transition"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-forest p-5 shadow-2xl animate-[slideIn_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="font-serif text-xl uppercase tracking-tight text-white">
                STMS <span className="text-accent">Flow</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-white/60 hover:bg-white/10 transition" type="button">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
              <p className="text-[10px] uppercase tracking-widest text-white/35">Signed In</p>
              <h2 className="mt-2 text-base font-semibold text-white">{session.name}</h2>
              <p className="mt-1 text-xs text-white/45">{role.toUpperCase()} workspace</p>
            </div>

            <nav className="space-y-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-accent text-white shadow-lg shadow-accent/20"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8">
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block border-r border-white/5 bg-forest px-5 py-7">
          <Link href="/" className="font-serif text-2xl uppercase tracking-tight text-white">
            STMS <span className="text-accent">Flow</span>
          </Link>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-white/35">Signed In As</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{session.name}</h2>
            <p className="mt-1 text-xs text-white/45">{role.toUpperCase()} workspace</p>
          </div>

          <nav className="mt-8 space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10">
            <LogoutButton />
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-h-screen bg-canvas px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
