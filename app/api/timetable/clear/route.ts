import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAppData } from "@/lib/app-data";

export async function POST() {
  try {
    await db.timetableEntry.deleteMany();


    const newData = await getAppData();

    return NextResponse.json({
      message: "Started a fresh blank timetable draft.",
      data: newData,
      conflicts: []
    });
  } catch (error) {
    console.error("Clear Error:", error);
    return NextResponse.json({ error: "Failed to clear timetable" }, { status: 500 });
  }
}
