import { BookOpenText, CalendarClock, Layers3 } from "lucide-react";

import { TimetableWorkspace } from "@/components/timetable-workspace";
import { getAppData, getRoleScopedEntries } from "@/lib/app-data";
import { getSession } from "@/lib/auth";

export default async function StudentPage() {
  const session = await getSession();
  const data = await getAppData({ ensureTimetable: true });
  const entries = getRoleScopedEntries(data, "student", session?.linkedId);
  const batch = data.batches.find((item) => item.id === session?.linkedId);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-forest to-[#253028] px-5 py-6 text-white shadow-lg sm:px-7 sm:py-8">
        <p className="text-[10px] uppercase tracking-widest text-accent">Student Dashboard</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Batch <span className="text-accent">{batch?.batchName}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
          Daily aur weekly timetable ke saath room information aur current schedule.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
          <Layers3 className="h-4 w-4 text-accent" />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-ink/40">Batch</p>
          <p className="mt-1 text-xl font-bold text-ink sm:text-2xl">{batch?.section || "A"}</p>
        </div>
        <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
          <CalendarClock className="h-4 w-4 text-accent" />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-ink/40">Classes</p>
          <p className="mt-1 text-xl font-bold text-ink sm:text-2xl">{entries.length}</p>
        </div>
        <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
          <BookOpenText className="h-4 w-4 text-accent" />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-ink/40">Subjects</p>
          <p className="mt-1 text-xl font-bold text-ink sm:text-2xl">{batch?.requiredSubjectIds.length || 0}</p>
        </div>
      </section>

      {/* Timetable */}
      <TimetableWorkspace
        initialData={{
          ...data,
          timetableEntries: entries
        }}
        readOnly
      />
    </div>
  );
}
