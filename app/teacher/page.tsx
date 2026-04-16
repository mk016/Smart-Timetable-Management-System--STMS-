import { CalendarClock, Clock3, MapPin } from "lucide-react";

import { TimetableWorkspace } from "@/components/timetable-workspace";
import { getAppData, getRoleScopedEntries, getUpcomingByDay } from "@/lib/app-data";
import { getSession } from "@/lib/auth";

export default async function TeacherPage() {
  const session = await getSession();
  const data = await getAppData({ ensureTimetable: true });
  const entries = getRoleScopedEntries(data, "teacher", session?.linkedId);
  const grouped = getUpcomingByDay(entries);
  const nextDay = Object.keys(grouped)[0];
  const nextClass = nextDay ? grouped[nextDay][0] : null;

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-forest px-8 py-8 text-white shadow-halo">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Teacher Dashboard</p>
        <h1 className="mt-3 font-serif text-5xl uppercase tracking-tight">Weekly Teaching View</h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-white/65">
          Aapke assigned classes, room allocation aur weekly slots yahan neatly visible hain.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6">
          <CalendarClock className="h-5 w-5 text-accent" />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-ink/45">Weekly Classes</p>
          <p className="mt-3 text-5xl text-ink">{entries.length}</p>
        </div>
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6">
          <Clock3 className="h-5 w-5 text-accent" />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-ink/45">Next Day</p>
          <p className="mt-3 text-3xl text-ink">{nextDay || "No class"}</p>
        </div>
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6">
          <MapPin className="h-5 w-5 text-accent" />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-ink/45">Next Room</p>
          <p className="mt-3 text-2xl text-ink">
            {nextClass
              ? data.rooms.find((room) => room.id === nextClass.roomId)?.roomName || nextClass.roomId
              : "TBD"}
          </p>
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
