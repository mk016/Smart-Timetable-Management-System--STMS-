import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { slotSuggestions } from "@/lib/services/ai";

export async function POST(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const body = await request.json();
  const data = await getAppData({ ensureTimetable: true });
  const entry = data.timetableEntries.find((item) => item.id === body.entryId);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const suggestions = await slotSuggestions(data, entry);
  return NextResponse.json(suggestions);
}
