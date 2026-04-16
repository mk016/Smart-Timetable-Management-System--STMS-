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
    <div className="space-y-5">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-forest to-[#253028] px-5 py-6 text-white shadow-lg sm:px-7 sm:py-8">
        <p className="text-[10px] uppercase tracking-widest text-accent">Teacher Dashboard</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Weekly Teaching <span className="text-accent">View</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
          Aapke assigned classes, room allocation aur weekly slots yahan visible hain.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
          <CalendarClock className="h-4 w-4 text-accent" />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-ink/40">Classes</p>
          <p className="mt-1 text-xl font-bold text-ink sm:text-2xl">{entries.length}</p>
        </div>
        <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
          <Clock3 className="h-4 w-4 text-accent" />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-ink/40">Next Day</p>
          <p className="mt-1 text-lg font-bold text-ink sm:text-xl">{nextDay || "None"}</p>
        </div>
        <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
          <MapPin className="h-4 w-4 text-accent" />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-ink/40">Next Room</p>
          <p className="mt-1 text-lg font-bold text-ink sm:text-xl">
            {nextClass
              ? data.rooms.find((room) => room.id === nextClass.roomId)?.roomName || nextClass.roomId
              : "TBD"}
          </p>
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
