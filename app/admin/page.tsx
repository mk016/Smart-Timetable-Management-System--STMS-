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
      icon: Users2
    },
    {
      label: "Subjects",
      value: data.subjects.length,
      hint: "Weekly mappings active",
      icon: GraduationCap
    },
    {
      label: "Timetable Entries",
      value: data.timetableEntries.length,
      hint: data.settings.publishedAt ? "Published schedule" : "Draft schedule",
      icon: CalendarDays
    },
    {
      label: "Conflicts",
      value: conflicts.length,
      hint: conflicts.length ? "Need admin review" : "All clear",
      icon: ShieldCheck
    }
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-forest px-4 py-6 text-white shadow-halo sm:px-8 sm:py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Admin Dashboard</p>
        <h1 className="mt-3 text-balance font-serif text-3xl uppercase tracking-tight sm:text-5xl">
          Run The Full <span className="text-accent">Scheduling Operation</span>
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-white/65">
          PRD ke core modules yahan se accessible hain: master data setup, timetable generation, validation,
          leave/holiday control, export aur AI assistance.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/admin/timetable" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-xs uppercase tracking-[0.2em] text-forest transition hover:bg-accent hover:text-white">
            Open Timetable
          </Link>
          <Link href="/admin/teachers" className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:border-accent hover:text-accent">
            Manage Teachers
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(45,50,47,0.12)] sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-ink/45">{card.label}</p>
              <p className="mt-3 text-3xl text-ink sm:text-5xl">{card.value}</p>
              <p className="mt-2 text-sm text-ink/55">{card.hint}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(45,50,47,0.12)] sm:p-6">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">Current Status</p>
              <h2 className="font-serif text-2xl uppercase tracking-tight text-ink sm:text-3xl">
                Operational Snapshot
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-canvas/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Leaves</p>
              <p className="mt-3 text-3xl text-ink sm:text-4xl">{data.leaves.length}</p>
              <p className="mt-2 text-sm text-ink/55">Teacher unavailability records stored</p>
            </div>
            <div className="rounded-3xl bg-canvas/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Holidays</p>
              <p className="mt-3 text-3xl text-ink sm:text-4xl">{data.holidays.length}</p>
              <p className="mt-2 text-sm text-ink/55">Academic closures tracked</p>
            </div>
            <div className="rounded-3xl bg-canvas/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Last Generated</p>
              <p className="mt-3 text-lg text-ink">{data.settings.lastGeneratedAt || "Auto-seeded on demand"}</p>
            </div>
            <div className="rounded-3xl bg-canvas/70 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Published</p>
              <p className="mt-3 text-lg text-ink">{data.settings.publishedAt || "Not published yet"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-forest p-5 text-white shadow-halo sm:p-6">
          <div className="flex items-center gap-3">
            <WandSparkles className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">AI Layer</p>
              <h2 className="font-serif text-2xl uppercase tracking-tight sm:text-3xl">Groq-Ready Endpoints</h2>
            </div>
          </div>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-white/65">
            <li>`/api/ai/validate-dataset` for completeness checks</li>
            <li>`/api/ai/explain-conflicts` for human-readable conflict summaries</li>
            <li>`/api/ai/suggest-slots` for alternate slot ranking</li>
            <li>`/api/ai/parse-command` for natural language admin actions</li>
            <li>`/api/ai/summarize-quality` for schedule quality snapshots</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
