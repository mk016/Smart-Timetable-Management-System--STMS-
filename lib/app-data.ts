import { readStore, writeStore } from "@/lib/store";
import { applyGenerationResult, generateTimetable } from "@/lib/services/scheduler";
import { AppData, Role, TimetableEntry } from "@/lib/types";

export async function getAppData(options?: { ensureTimetable?: boolean }) {
  const data = await readStore();
  if (!options?.ensureTimetable || data.timetableEntries.length > 0) {
    return data;
  }

  const result = generateTimetable(data);
  const updated = applyGenerationResult(data, result);
  await writeStore(updated);
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
