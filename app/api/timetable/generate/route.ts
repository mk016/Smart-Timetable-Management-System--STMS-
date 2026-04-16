import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { db } from "@/lib/db";
import { applyGenerationResult, generateTimetable } from "@/lib/services/scheduler";

export async function POST(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const data = await getAppData();
  const result = generateTimetable(data);
  const updated = applyGenerationResult(data, result);

  // Save generated entries to database
  await db.$transaction([
    db.timetableEntry.deleteMany(),
    db.timetableEntry.createMany({ data: updated.timetableEntries })
  ]);

  return NextResponse.json({
    message: result.unplaced.length
      ? `${updated.timetableEntries.length} entries generated, but ${result.unplaced.length} items remain unplaced.`
      : "Timetable generated successfully.",
    data: updated,
    conflicts: result.conflicts,
    unplaced: result.unplaced
  });
}
