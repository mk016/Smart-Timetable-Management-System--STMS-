import { nowIso } from "@/lib/utils";
import {
  AppData,
  Batch,
  Conflict,
  GenerationResult,
  Room,
  Subject,
  Teacher,
  TimetableEntry,
  TimeSlot,
  WeekDay,
  WEEK_DAYS
} from "@/lib/types";

type OccupancyMap = Map<string, Set<string>>;

function slotKey(dayOfWeek: WeekDay, slotIndex: number) {
  return `${dayOfWeek}-${slotIndex}`;
}

function getTeacherById(teachers: Teacher[], teacherId: string) {
  return teachers.find((teacher) => teacher.id === teacherId);
}

function getRoomCandidates(data: AppData, batch: Batch, subject: Subject) {
  return data.rooms.filter(
    (room) =>
      room.roomType === (subject.type === "lab" ? "lab" : "classroom") &&
      room.capacity >= batch.strength
  );
}

function registerOccupancy(
  occupancy: OccupancyMap,
  category: "teacher" | "room" | "batch",
  entityId: string,
  dayOfWeek: WeekDay,
  slotIndexes: number[],
  entryId: string
) {
  slotIndexes.forEach((slotIndex) => {
    const key = `${category}:${entityId}:${slotKey(dayOfWeek, slotIndex)}`;
    const set = occupancy.get(key) || new Set<string>();
    set.add(entryId);
    occupancy.set(key, set);
  });
}

function isOccupied(
  occupancy: OccupancyMap,
  category: "teacher" | "room" | "batch",
  entityId: string,
  dayOfWeek: WeekDay,
  slotIndexes: number[]
) {
  return slotIndexes.some((slotIndex) =>
    occupancy.has(`${category}:${entityId}:${slotKey(dayOfWeek, slotIndex)}`)
  );
}

function slotExists(slots: TimeSlot[], dayOfWeek: WeekDay, slotIndex: number) {
  return slots.some((slot) => slot.dayOfWeek === dayOfWeek && slot.slotIndex === slotIndex && slot.active);
}

function getDailyTeacherLoad(
  entries: TimetableEntry[],
  teacherId: string,
  dayOfWeek: WeekDay
) {
  return entries
    .filter((entry) => entry.teacherId === teacherId && entry.dayOfWeek === dayOfWeek)
    .reduce((acc, entry) => acc + entry.slotIndexes.length, 0);
}

function batchEntries(entries: TimetableEntry[], batchId: string, dayOfWeek: WeekDay) {
  return entries.filter((entry) => entry.batchId === batchId && entry.dayOfWeek === dayOfWeek);
}

function softScore(
  dayOfWeek: WeekDay,
  slotStart: number,
  teacher: Teacher | undefined,
  currentEntries: TimetableEntry[],
  batchId: string
) {
  const teacherBonus = teacher?.preferredSlots.includes(slotStart) ? 4 : 0;
  const batchLoadPenalty = batchEntries(currentEntries, batchId, dayOfWeek).length * 2;
  const daySpreadBonus = WEEK_DAYS.indexOf(dayOfWeek);
  return teacherBonus - batchLoadPenalty - daySpreadBonus;
}

export function validateTimetable(data: AppData, entries: TimetableEntry[] = data.timetableEntries): Conflict[] {
  const conflicts: Conflict[] = [];

  entries.forEach((entry) => {
    const batch = data.batches.find((item) => item.id === entry.batchId);
    const subject = data.subjects.find((item) => item.id === entry.subjectId);
    const room = data.rooms.find((item) => item.id === entry.roomId);
    const validWindow = entry.slotIndexes.every((slotIndex) => slotExists(data.slots, entry.dayOfWeek, slotIndex));

    if (!validWindow) {
      conflicts.push({
        type: "invalid_slot_window",
        severity: "high",
        message: `${entry.dayOfWeek} par requested slot window available nahi hai.`,
        dayOfWeek: entry.dayOfWeek,
        slotIndex: entry.slotIndexes[0],
        entryIds: [entry.id]
      });
    }

    if (!batch || !subject || !room) {
      return;
    }

    if (room.roomType !== (subject.type === "lab" ? "lab" : "classroom")) {
      conflicts.push({
        type: "room_mismatch",
        severity: "high",
        message: `${subject.subjectName} ko compatible room type nahi mila.`,
        dayOfWeek: entry.dayOfWeek,
        slotIndex: entry.slotIndexes[0],
        entryIds: [entry.id]
      });
    }

    if (room.capacity < batch.strength) {
      conflicts.push({
        type: "room_capacity",
        severity: "medium",
        message: `${room.roomName} ki capacity ${batch.batchName} ke liye kam hai.`,
        dayOfWeek: entry.dayOfWeek,
        slotIndex: entry.slotIndexes[0],
        entryIds: [entry.id]
      });
    }

    if (subject.type === "lab" && entry.slotIndexes.length !== subject.durationSlots) {
      conflicts.push({
        type: "lab_continuity",
        severity: "high",
        message: `${subject.subjectName} ko ${subject.durationSlots} continuous slots chahiye.`,
        dayOfWeek: entry.dayOfWeek,
        slotIndex: entry.slotIndexes[0],
        entryIds: [entry.id]
      });
    }

    if (
      subject.type === "lab" &&
      entry.slotIndexes.some((slotIndex, index) => index > 0 && slotIndex !== entry.slotIndexes[index - 1] + 1)
    ) {
      conflicts.push({
        type: "lab_continuity",
        severity: "high",
        message: `${subject.subjectName} ki lab slots continuous nahi hain.`,
        dayOfWeek: entry.dayOfWeek,
        slotIndex: entry.slotIndexes[0],
        entryIds: [entry.id]
      });
    }

    if (entry.date) {
      const leaveConflict = data.leaves.find(
        (leave) => leave.teacherId === entry.teacherId && leave.leaveDate === entry.date
      );
      if (leaveConflict) {
        conflicts.push({
          type: "leave_conflict",
          severity: "high",
          message: `Teacher leave ke din bhi class assigned hai: ${leaveConflict.reason}.`,
          dayOfWeek: entry.dayOfWeek,
          slotIndex: entry.slotIndexes[0],
          entryIds: [entry.id]
        });
      }

      const holidayConflict = data.holidays.find((holiday) => holiday.holidayDate === entry.date);
      if (holidayConflict) {
        conflicts.push({
          type: "holiday_conflict",
          severity: "high",
          message: `${holidayConflict.holidayName} par class schedule hui hai.`,
          dayOfWeek: entry.dayOfWeek,
          slotIndex: entry.slotIndexes[0],
          entryIds: [entry.id]
        });
      }
    }
  });

  for (const dayOfWeek of WEEK_DAYS) {
    const dayEntries = entries.filter((entry) => entry.dayOfWeek === dayOfWeek);
    const slotIndexes = [...new Set(dayEntries.flatMap((entry) => entry.slotIndexes))];

    slotIndexes.forEach((slotIndex) => {
      const currentEntries = dayEntries.filter((entry) => entry.slotIndexes.includes(slotIndex));
      const overlaps = [
        {
          type: "teacher_overlap" as const,
          key: "teacherId",
          label: "Teacher overlap"
        },
        {
          type: "room_overlap" as const,
          key: "roomId",
          label: "Room overlap"
        },
        {
          type: "batch_overlap" as const,
          key: "batchId",
          label: "Batch overlap"
        }
      ];

      overlaps.forEach(({ type, key, label }) => {
        const grouped = new Map<string, TimetableEntry[]>();
        currentEntries.forEach((entry) => {
          const groupKey = String(entry[key as keyof TimetableEntry]);
          const items = grouped.get(groupKey) || [];
          items.push(entry);
          grouped.set(groupKey, items);
        });

        grouped.forEach((groupEntries) => {
          if (groupEntries.length > 1) {
            conflicts.push({
              type,
              severity: "high",
              message: `${label} detected on ${dayOfWeek} slot ${slotIndex}.`,
              dayOfWeek,
              slotIndex,
              entryIds: groupEntries.map((item) => item.id)
            });
          }
        });
      });
    });
  }

  return conflicts;
}

export function generateTimetable(data: AppData): GenerationResult {
  const occupancy: OccupancyMap = new Map();
  const lockedEntries = data.timetableEntries.filter((entry) => entry.isLocked);
  const generatedEntries = [...lockedEntries];
  const unplaced: GenerationResult["unplaced"] = [];

  lockedEntries.forEach((entry) => {
    registerOccupancy(occupancy, "batch", entry.batchId, entry.dayOfWeek, entry.slotIndexes, entry.id);
    registerOccupancy(occupancy, "teacher", entry.teacherId, entry.dayOfWeek, entry.slotIndexes, entry.id);
    registerOccupancy(occupancy, "room", entry.roomId, entry.dayOfWeek, entry.slotIndexes, entry.id);
  });

  const subjects = [...data.subjects].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "lab" ? -1 : 1;
    }
    return right.durationSlots - left.durationSlots;
  });

  data.batches.forEach((batch) => {
    const batchSubjects = subjects.filter((subject) => subject.batchIds.includes(batch.id));

    batchSubjects.forEach((subject) => {
      for (let sessionIndex = 0; sessionIndex < subject.weeklySessions; sessionIndex += 1) {
        const teacher = getTeacherById(data.teachers, subject.teacherIds[0]);
        const roomCandidates = getRoomCandidates(data, batch, subject);
        const candidateWindows: Array<{
          dayOfWeek: WeekDay;
          slotIndexes: number[];
          room: Room;
          score: number;
        }> = [];

        WEEK_DAYS.forEach((dayOfWeek) => {
          if (!teacher?.availableDays.includes(dayOfWeek)) {
            return;
          }

          const teacherLoad = getDailyTeacherLoad(generatedEntries, teacher.id, dayOfWeek);
          if (teacherLoad + subject.durationSlots > teacher.maxDailyLoad) {
            return;
          }

          const daySlots = data.slots
            .filter((slot) => slot.dayOfWeek === dayOfWeek && slot.active)
            .map((slot) => slot.slotIndex)
            .sort((a, b) => a - b);

          daySlots.forEach((slotStart) => {
            const slotIndexes = Array.from({ length: subject.durationSlots }, (_, offset) => slotStart + offset);
            const areSlotsValid = slotIndexes.every((slotIndex) => slotExists(data.slots, dayOfWeek, slotIndex));
            if (!areSlotsValid) {
              return;
            }

            if (isOccupied(occupancy, "batch", batch.id, dayOfWeek, slotIndexes)) {
              return;
            }

            if (teacher && isOccupied(occupancy, "teacher", teacher.id, dayOfWeek, slotIndexes)) {
              return;
            }

            roomCandidates.forEach((room) => {
              if (!room.usableDays.includes(dayOfWeek)) {
                return;
              }

              if (isOccupied(occupancy, "room", room.id, dayOfWeek, slotIndexes)) {
                return;
              }

              candidateWindows.push({
                dayOfWeek,
                slotIndexes,
                room,
                score: softScore(dayOfWeek, slotStart, teacher, generatedEntries, batch.id)
              });
            });
          });
        });

        candidateWindows.sort((left, right) => right.score - left.score);
        const selected = candidateWindows[0];

        if (!selected || !teacher) {
          unplaced.push({
            batchId: batch.id,
            subjectId: subject.id,
            reason: "No conflict-free slot window found with current constraints."
          });
          continue;
        }

        const newEntry: TimetableEntry = {
          id: `tt-${subject.id}-${batch.id}-${sessionIndex + 1}-${Math.random().toString(36).substring(2, 8)}`,
          batchId: batch.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          roomId: selected.room.id,
          dayOfWeek: selected.dayOfWeek,
          slotIndexes: selected.slotIndexes,
          status: "draft",
          isLocked: false,
          source: "auto"
        };

        generatedEntries.push(newEntry);
        registerOccupancy(occupancy, "batch", newEntry.batchId, newEntry.dayOfWeek, newEntry.slotIndexes, newEntry.id);
        registerOccupancy(
          occupancy,
          "teacher",
          newEntry.teacherId,
          newEntry.dayOfWeek,
          newEntry.slotIndexes,
          newEntry.id
        );
        registerOccupancy(occupancy, "room", newEntry.roomId, newEntry.dayOfWeek, newEntry.slotIndexes, newEntry.id);
      }
    });
  });

  const entries = generatedEntries.map((entry) => ({
    ...entry,
    status: data.settings.publishedAt ? "published" : entry.status
  }));

  return {
    entries,
    conflicts: validateTimetable(data, entries),
    unplaced
  };
}

export function suggestAlternativeSlots(data: AppData, entry: TimetableEntry) {
  const subject = data.subjects.find((item) => item.id === entry.subjectId);
  const batch = data.batches.find((item) => item.id === entry.batchId);
  const teacher = data.teachers.find((item) => item.id === entry.teacherId);

  if (!subject || !batch || !teacher) {
    return [];
  }

  const otherEntries = data.timetableEntries.filter((item) => item.id !== entry.id);
  const cloneData: AppData = {
    ...data,
    timetableEntries: otherEntries
  };
  const occupancy: OccupancyMap = new Map();

  otherEntries.forEach((item) => {
    registerOccupancy(occupancy, "batch", item.batchId, item.dayOfWeek, item.slotIndexes, item.id);
    registerOccupancy(occupancy, "teacher", item.teacherId, item.dayOfWeek, item.slotIndexes, item.id);
    registerOccupancy(occupancy, "room", item.roomId, item.dayOfWeek, item.slotIndexes, item.id);
  });

  const roomCandidates = getRoomCandidates(cloneData, batch, subject);
  const suggestions: Array<{
    dayOfWeek: WeekDay;
    slotIndexes: number[];
    roomId: string;
    reason: string;
  }> = [];

  WEEK_DAYS.forEach((dayOfWeek) => {
    const daySlots = data.slots.filter((slot) => slot.dayOfWeek === dayOfWeek).map((slot) => slot.slotIndex);
    daySlots.forEach((slotStart) => {
      const slotIndexes = Array.from({ length: subject.durationSlots }, (_, offset) => slotStart + offset);
      if (!slotIndexes.every((slotIndex) => slotExists(data.slots, dayOfWeek, slotIndex))) {
        return;
      }
      if (isOccupied(occupancy, "batch", batch.id, dayOfWeek, slotIndexes)) {
        return;
      }
      if (isOccupied(occupancy, "teacher", teacher.id, dayOfWeek, slotIndexes)) {
        return;
      }
      const room = roomCandidates.find((candidate) => !isOccupied(occupancy, "room", candidate.id, dayOfWeek, slotIndexes));
      if (!room) {
        return;
      }
      suggestions.push({
        dayOfWeek,
        slotIndexes,
        roomId: room.id,
        reason: `Moves ${subject.subjectName} to ${dayOfWeek} slot ${slotIndexes.join(", ")} with ${room.roomName}.`
      });
    });
  });

  return suggestions.slice(0, 6);
}

export function summarizeSchedule(data: AppData) {
  const conflicts = validateTimetable(data);
  const published = Boolean(data.settings.publishedAt);
  return {
    totalEntries: data.timetableEntries.length,
    published,
    conflicts,
    generatedAt: data.settings.lastGeneratedAt || null
  };
}

export function resolveLeaveAndHolidayImpacts(data: AppData) {
  const impactedEntries = data.timetableEntries.filter((entry) => {
    if (entry.date) {
      return false;
    }

    const leaveDates = data.leaves
      .filter((leave) => leave.teacherId === entry.teacherId)
      .map((leave) => leave.leaveDate)
      .filter((leaveDate) => {
        const weekday = new Date(leaveDate).toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "Asia/Kolkata"
        });
        return weekday === entry.dayOfWeek;
      });

    const holidayDates = data.holidays
      .map((holiday) => holiday.holidayDate)
      .filter((holidayDate) => {
        const weekday = new Date(holidayDate).toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "Asia/Kolkata"
        });
        return weekday === entry.dayOfWeek;
      });

    return leaveDates.length > 0 || holidayDates.length > 0;
  });

  return impactedEntries.map((entry) => ({
    entry,
    alternatives: suggestAlternativeSlots(data, entry)
  }));
}

export function applyGenerationResult(data: AppData, result: GenerationResult): AppData {
  return {
    ...data,
    timetableEntries: result.entries,
    settings: {
      ...data.settings,
      lastGeneratedAt: nowIso()
    }
  };
}
