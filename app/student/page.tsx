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
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-forest px-8 py-8 text-white shadow-halo">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Student Dashboard</p>
        <h1 className="mt-3 font-serif text-5xl uppercase tracking-tight">
          Batch Timetable <span className="text-accent">{batch?.batchName}</span>
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-white/65">
          Daily aur weekly timetable ke saath room information aur current schedule visibility yahan milti hai.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6">
          <Layers3 className="h-5 w-5 text-accent" />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-ink/45">Batch</p>
          <p className="mt-3 text-3xl text-ink">{batch?.section || "A"}</p>
        </div>
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6">
          <CalendarClock className="h-5 w-5 text-accent" />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-ink/45">Weekly Classes</p>
          <p className="mt-3 text-5xl text-ink">{entries.length}</p>
        </div>
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6">
          <BookOpenText className="h-5 w-5 text-accent" />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-ink/45">Subjects</p>
          <p className="mt-3 text-5xl text-ink">{batch?.requiredSubjectIds.length || 0}</p>
        </div>
      </section>

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
