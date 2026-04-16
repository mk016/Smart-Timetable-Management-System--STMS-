"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, GraduationCap, Layers3, Users2, DoorOpen } from "lucide-react";

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

  return (
    <div className="dashboard-grid min-h-screen bg-[#111613]">
      <aside className="border-b border-white/5 bg-forest px-3 py-4 sm:px-4 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
        <div className="flex flex-col gap-4 sm:gap-5 lg:block">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link href="/" className="font-serif text-2xl uppercase tracking-tight text-white">
              STMS <span className="text-accent">Flow</span>
            </Link>
            <div className="lg:hidden">
              <LogoutButton />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 lg:mt-10 lg:p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Signed In As</p>
            <h2 className="mt-3 text-lg text-white sm:text-xl">{session.name}</h2>
            <p className="mt-2 text-sm text-white/55">{role.toUpperCase()} workspace</p>
          </div>
        </div>

        <nav className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
          {items.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[9rem] shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-sm transition sm:min-w-0 sm:justify-start",
                  active
                    ? "bg-accent text-white shadow-lg shadow-accent/25"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 hidden lg:block">
          <LogoutButton />
        </div>
      </aside>

      <main className="min-h-screen bg-canvas px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
