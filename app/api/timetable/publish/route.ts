import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { db } from "@/lib/db";
import { nowIso } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  // Update all timetable entries to published status
  await db.timetableEntry.updateMany({
    data: { status: "published" }
  });

  const data = await getAppData();

  return NextResponse.json({
    message: "Timetable published successfully.",
    data
  });
}
