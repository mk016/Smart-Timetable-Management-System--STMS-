import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-helpers";

// Helper function from utils to regenerate IDs if desired, or we just insert as new
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) return blocked;

  const { id } = await context.params;

  try {
    const snapshot = await db.timetableSnapshot.findUnique({
      where: { id }
    });

    if (!snapshot) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });

    const entries = JSON.parse(snapshot.entries);

    // Run delete multiple and insert multiple in a transaction to safely swap out the active timetable
    await db.$transaction(async (tx) => {
      await tx.timetableEntry.deleteMany();
      
      if (entries && entries.length > 0) {
        await tx.timetableEntry.createMany({
          data: entries.map((e: any) => ({
            id: crypto.randomUUID(), // generate new IDs to avoid conflicts
            batchId: e.batchId,
            subjectId: e.subjectId,
            teacherId: e.teacherId,
            roomId: e.roomId,
            dayOfWeek: e.dayOfWeek,
            date: e.date,
            slotIndexes: e.slotIndexes,
            status: e.status,
            isLocked: e.isLocked,
            source: e.source
          }))
        });
      }
    });

    return NextResponse.json({ message: "Timetable restored from snapshot successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to restore snapshot" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) return blocked;

  const { id } = await context.params;

  try {
    await db.timetableSnapshot.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Snapshot deleted." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete snapshot" }, { status: 500 });
  }
}
