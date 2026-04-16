import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { db } from "@/lib/db";
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
  const data = await getAppData();
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

  const updatedEntry = chosenEntries.find((item) => item.id === id)!;

  // Save updated entry to DB
  await db.timetableEntry.update({
    where: { id },
    data: {
      dayOfWeek: updatedEntry.dayOfWeek,
      roomId: updatedEntry.roomId,
      teacherId: updatedEntry.teacherId,
      isLocked: updatedEntry.isLocked,
      source: updatedEntry.source,
      slotIndexes: updatedEntry.slotIndexes
    }
  });

  // Save change log to DB
  await db.changeLog.create({
    data: {
      id: `log-${crypto.randomUUID().slice(0, 8)}`,
      timetableEntryId: id,
      changedBy: "admin",
      oldValue: JSON.stringify(entry),
      newValue: JSON.stringify(updatedEntry),
      changeType: "manual_update",
      timestamp: nowIso()
    }
  });

  const freshData = await getAppData();

  return NextResponse.json({
    message:
      chosenRoomId !== entry.roomId
        ? "Timetable slot updated and room auto-adjusted to keep it conflict-free."
        : "Timetable slot updated.",
    data: freshData,
    conflicts: []
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) return blocked;

  const { id } = await context.params;

  try {
    await db.timetableEntry.delete({
      where: { id }
    });

    // You could also log this deletion in changeLog if needed

    const freshData = await getAppData();

    return NextResponse.json({
      message: "Class deleted successfully.",
      data: freshData
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete from database" },
      { status: 500 }
    );
  }
}
