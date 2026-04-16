import { NextRequest, NextResponse } from "next/server";

import { getAppData, getRoleScopedEntries } from "@/lib/app-data";
import { getRequestSession } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAppData({ ensureTimetable: true });
  const entries = getRoleScopedEntries(data, session.role, session.linkedId);
  return NextResponse.json({
    data: {
      ...data,
      timetableEntries: entries
    }
  });
}

export async function POST(request: NextRequest) {
  const session = getRequestSession(request);
  const { db } = await import("@/lib/db");
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { batchId, subjectId, teacherId, roomId, dayOfWeek, slotStart } = payload;

    const data = await getAppData();
    const subject = data.subjects.find((s) => s.id === subjectId);
    if (!subject) return NextResponse.json({ error: "Invalid subject" }, { status: 400 });

    const slotIndexes = Array.from({ length: subject.durationSlots }, (_, i) => Number(slotStart) + i);

    await db.timetableEntry.create({
      data: {
        batchId,
        subjectId,
        teacherId,
        roomId,
        dayOfWeek,
        slotIndexes,
        status: "draft",
        isLocked: true,
        source: "manual"
      }
    });

    const newData = await getAppData();
    return NextResponse.json({ message: "Class added successfully.", data: newData });
  } catch (error) {
    console.error("Add Error:", error);
    return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
  }
}
