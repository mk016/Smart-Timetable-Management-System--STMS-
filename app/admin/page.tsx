import Link from "next/link";
import { Activity, CalendarDays, GraduationCap, ShieldCheck, Users2, WandSparkles } from "lucide-react";

import { getAppData } from "@/lib/app-data";
import { validateTimetable } from "@/lib/services/scheduler";

export default async function AdminDashboardPage() {
  const data = await getAppData({ ensureTimetable: true });
  const conflicts = validateTimetable(data);

  const cards = [
    {
      label: "Teachers",
      value: data.teachers.length,
      hint: "Faculty records live",
      icon: Users2,
      color: "from-blue-500 to-blue-600"
    },
    {
      label: "Subjects",
      value: data.subjects.length,
      hint: "Weekly mappings active",
      icon: GraduationCap,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      label: "Entries",
      value: data.timetableEntries.length,
      hint: data.settings.publishedAt ? "Published" : "Draft",
      icon: CalendarDays,
      color: "from-violet-500 to-violet-600"
    },
    {
      label: "Conflicts",
      value: conflicts.length,
      hint: conflicts.length ? "Need review" : "All clear",
      icon: ShieldCheck,
      color: conflicts.length ? "from-red-500 to-red-600" : "from-emerald-500 to-emerald-600"
    }
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-forest to-[#253028] px-5 py-6 text-white shadow-lg sm:px-7 sm:py-8">
        <p className="text-[10px] uppercase tracking-widest text-accent">Admin Dashboard</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
          Scheduling <span className="text-accent">Operations</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
          Master data setup, timetable generation, validation, leave/holiday control, export aur AI assistance.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/admin/timetable"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition hover:bg-white hover:text-ink"
          >
            Open Timetable
          </Link>
          <Link
            href="/admin/teachers"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition hover:border-accent hover:text-accent"
          >
            Teachers
          </Link>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm sm:p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-widest text-ink/40">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{card.value}</p>
              <p className="mt-1 text-xs text-ink/45">{card.hint}</p>
            </div>
          );
        })}
      </section>

      {/* Status */}
      <section className="grid gap-4">
        <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2.5">
            <Activity className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-ink">Status Overview</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[10px] uppercase tracking-widest text-ink/40">Leaves</p>
              <p className="mt-2 text-2xl font-bold text-ink">{data.leaves.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[10px] uppercase tracking-widest text-ink/40">Holidays</p>
              <p className="mt-2 text-2xl font-bold text-ink">{data.holidays.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[10px] uppercase tracking-widest text-ink/40">Generated</p>
              <p className="mt-2 text-sm font-medium text-ink">{data.settings.lastGeneratedAt || "On demand"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[10px] uppercase tracking-widest text-ink/40">Published</p>
              <p className="mt-2 text-sm font-medium text-ink">{data.settings.publishedAt || "Not yet"}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
