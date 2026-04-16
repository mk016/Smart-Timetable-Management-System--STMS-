import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { updateStore } from "@/lib/store";
import { nowIso } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const data = await updateStore((current) => ({
    ...current,
    timetableEntries: current.timetableEntries.map((entry) => ({
      ...entry,
      status: "published"
    })),
    settings: {
      ...current.settings,
      publishedAt: nowIso()
    }
  }));

  return NextResponse.json({
    message: "Timetable published successfully.",
    data
  });
}
