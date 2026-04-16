import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { readStore, writeStore } from "@/lib/store";
import { applyGenerationResult, generateTimetable } from "@/lib/services/scheduler";

export async function POST(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const data = await readStore();
  const result = generateTimetable(data);
  const updated = applyGenerationResult(data, result);
  await writeStore(updated);

  return NextResponse.json({
    message: result.unplaced.length
      ? `${updated.timetableEntries.length} entries generated, but ${result.unplaced.length} items remain unplaced.`
      : "Timetable generated successfully.",
    data: updated,
    conflicts: result.conflicts,
    unplaced: result.unplaced
  });
}
