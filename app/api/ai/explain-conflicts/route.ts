import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { explainConflicts } from "@/lib/services/ai";
import { validateTimetable } from "@/lib/services/scheduler";

export async function GET(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }
  const data = await getAppData({ ensureTimetable: true });
  const conflicts = validateTimetable(data);
  const explanation = await explainConflicts(data, conflicts);
  return NextResponse.json({ conflicts, ...explanation });
}
