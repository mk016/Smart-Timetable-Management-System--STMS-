import { NextRequest, NextResponse } from "next/server";

import { getRequestSession } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { validateTimetable } from "@/lib/services/scheduler";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAppData({ ensureTimetable: true });
  const conflicts = validateTimetable(data);
  return NextResponse.json({
    conflicts,
    message: conflicts.length ? `${conflicts.length} conflicts found.` : "No hard conflicts found.",
    data
  });
}
