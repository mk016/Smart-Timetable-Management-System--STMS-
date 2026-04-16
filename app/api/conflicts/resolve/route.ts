import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { resolveLeaveAndHolidayImpacts, validateTimetable } from "@/lib/services/scheduler";

export async function POST(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const data = await getAppData({ ensureTimetable: true });
  const impacts = resolveLeaveAndHolidayImpacts(data);
  const conflicts = validateTimetable(data);

  return NextResponse.json({
    message: impacts.length
      ? "Preview generated for impacted entries."
      : conflicts.length
        ? "No leave-based impact मिला, but validation conflicts are still present."
        : "No active conflicts or leave impacts found.",
    impacts,
    conflicts,
    data
  });
}
