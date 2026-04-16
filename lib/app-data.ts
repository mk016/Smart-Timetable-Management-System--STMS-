import { applyGenerationResult, generateTimetable } from "@/lib/services/scheduler";
import {
  AppData,
  Batch,
  ChangeLog,
  Holiday,
  Role,
  Room,
  Subject,
  Teacher,
  TeacherLeave,
  TimetableEntry,
  TimeSlot,
  User
} from "@/lib/types";
import { db } from "@/lib/db";

export async function getAppData(options?: { ensureTimetable?: boolean }): Promise<AppData> {
  const users = (await db.user.findMany()) as User[];
  const teachers = (await db.teacher.findMany()) as Teacher[];
  const subjects = (await db.subject.findMany()) as Subject[];
  const rooms = (await db.room.findMany()) as Room[];
  const batches = (await db.batch.findMany()) as Batch[];
  const slots = (await db.timeSlot.findMany()) as TimeSlot[];
  const holidays = (await db.holiday.findMany()) as Holiday[];
  const leaves = (await db.teacherLeave.findMany()) as TeacherLeave[];
  const timetableEntries = (await db.timetableEntry.findMany()) as TimetableEntry[];
  const changeLogs = (await db.changeLog.findMany()) as ChangeLog[];

  const data: AppData = {
    users,
    teachers,
    subjects,
    rooms,
    batches,
    slots,
    holidays,
    leaves,
    timetableEntries,
    changeLogs,
    settings: {}
  };

  if (!options?.ensureTimetable || data.timetableEntries.length > 0) {
    return data;
  }

  const result = generateTimetable(data);
  const updated = applyGenerationResult(data, result);

  if (updated.timetableEntries.length > 0) {
    await db.$transaction([
      db.timetableEntry.deleteMany(),
      db.timetableEntry.createMany({ data: updated.timetableEntries })
    ]);
  }

  return updated;
}

export function getRoleScopedEntries(data: AppData, role: Role, linkedId?: string) {
  if (role === "teacher" && linkedId) {
    return data.timetableEntries.filter((entry) => entry.teacherId === linkedId);
  }

  if (role === "student" && linkedId) {
    return data.timetableEntries.filter((entry) => entry.batchId === linkedId);
  }

  return data.timetableEntries;
}

export function getUpcomingByDay(entries: TimetableEntry[]) {
  return entries.reduce<Record<string, TimetableEntry[]>>((acc, entry) => {
    acc[entry.dayOfWeek] = acc[entry.dayOfWeek] || [];
    acc[entry.dayOfWeek].push(entry);
    acc[entry.dayOfWeek].sort((left, right) => left.slotIndexes[0] - right.slotIndexes[0]);
    return acc;
  }, {});
}

export function dashboardStats(data: AppData) {
  return [
    {
      label: "Teachers",
      value: data.teachers.length,
      subtext: "Faculty profiles configured"
    },
    {
      label: "Subjects",
      value: data.subjects.length,
      subtext: "Mapped into active batches"
    },
    {
      label: "Rooms & Labs",
      value: data.rooms.length,
      subtext: "Scheduling infrastructure ready"
    },
    {
      label: "Live Entries",
      value: data.timetableEntries.length,
      subtext: data.settings.publishedAt ? "Published timetable available" : "Draft timetable loaded"
    }
  ];
}
