import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) return blocked;

  try {
    const snapshots = await db.timetableSnapshot.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Do not send the heavy 'entries' column for basic list
    const safeSnapshots = snapshots.map((s: { id: string, name: string, status: string, createdAt: Date }) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      createdAt: s.createdAt
    }));

    return NextResponse.json(safeSnapshots);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) return blocked;

  try {
    const { name, status } = await request.json();
    
    const entries = await db.timetableEntry.findMany();
    
    const snapshot = await db.timetableSnapshot.create({
      data: {
        name: name || `Draft - ${new Date().toLocaleDateString()}`,
        status: status || "DRAFT",
        entries: JSON.stringify(entries)
      }
    });

    return NextResponse.json({ message: "Draft saved successfully", snapshotId: snapshot.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
