import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { readStore, writeStore } from "@/lib/store";
import { validateTimetable } from "@/lib/services/scheduler";
import { AppData, TimetableEntry } from "@/lib/types";
import { nowIso } from "@/lib/utils";

function getCompatibleRooms(data: AppData, entry: TimetableEntry) {
  const subject = data.subjects.find((item) => item.id === entry.subjectId);
  const batch = data.batches.find((item) => item.id === entry.batchId);

  if (!subject || !batch) {
    return [];
  }

  const targetRoomType = subject.type === "lab" ? "lab" : "classroom";
  return data.rooms.filter(
    (room) => room.roomType === targetRoomType && room.capacity >= batch.strength
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const { id } = await context.params;
  const body = await request.json();
  const data = await readStore();
  const entry = data.timetableEntries.find((item) => item.id === id);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const subject = data.subjects.find((item) => item.id === entry.subjectId);
  const duration = subject?.durationSlots || entry.slotIndexes.length;
  const slotStart = Number(body.slotStart || entry.slotIndexes[0]);
  const slotIndexes = Array.from({ length: duration }, (_, index) => slotStart + index);
  const targetDayOfWeek = body.dayOfWeek || entry.dayOfWeek;
  const validWindow = slotIndexes.every((slotIndex) =>
    data.slots.some((slot) => slot.dayOfWeek === targetDayOfWeek && slot.slotIndex === slotIndex && slot.active)
  );

  if (!validWindow) {
    return NextResponse.json(
      {
        error: "Selected slot window is not available for this class duration."
      },
      { status: 400 }
    );
  }

  const preferredRoomIds = [
    body.roomId,
    entry.roomId,
    ...getCompatibleRooms(data, entry).map((room) => room.id)
  ].filter((roomId, index, array): roomId is string => Boolean(roomId) && array.indexOf(roomId) === index);

  let chosenEntries = data.timetableEntries;
  let chosenRoomId = entry.roomId;
  let blockingConflicts: ReturnType<typeof validateTimetable> = [];

  for (const roomId of preferredRoomIds) {
    const candidateEntries = data.timetableEntries.map((item) =>
      item.id === id
        ? {
            ...item,
            dayOfWeek: targetDayOfWeek,
            roomId,
            teacherId: body.teacherId || item.teacherId,
            isLocked: body.isLocked ?? true,
            source: "manual" as const,
            slotIndexes
          }
        : item
    );

    const conflicts = validateTimetable({ ...data, timetableEntries: candidateEntries }, candidateEntries);
    const blocking = conflicts.filter((conflict) => conflict.entryIds.includes(id));
    if (blocking.length === 0) {
      chosenEntries = candidateEntries;
      chosenRoomId = roomId;
      blockingConflicts = [];
      break;
    }
    blockingConflicts = blocking;
  }

  if (blockingConflicts.length) {
    return NextResponse.json(
      {
        error: "Manual update causes conflicts.",
        conflicts: blockingConflicts
      },
      { status: 400 }
    );
  }

  const updated = {
    ...data,
    timetableEntries: chosenEntries,
    changeLogs: [
      {
        id: `log-${crypto.randomUUID().slice(0, 8)}`,
        timetableEntryId: id,
        changedBy: "admin",
        oldValue: JSON.stringify(entry),
        newValue: JSON.stringify(
          chosenEntries.find((item) => item.id === id)
        ),
        changeType: "manual_update",
        timestamp: nowIso()
      },
      ...data.changeLogs
    ]
  };

  await writeStore(updated);

  return NextResponse.json({
    message:
      chosenRoomId !== entry.roomId
        ? "Timetable slot updated and room auto-adjusted to keep it conflict-free."
        : "Timetable slot updated.",
    data: updated,
    conflicts: []
  });
}
