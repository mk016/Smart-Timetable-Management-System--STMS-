import { NextRequest, NextResponse } from "next/server";

import { getAppData, getRoleScopedEntries } from "@/lib/app-data";
import { getRequestSession } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAppData({ ensureTimetable: true });
  const entries = getRoleScopedEntries(data, session.role, session.linkedId);
  return NextResponse.json({
    data: {
      ...data,
      timetableEntries: entries
    }
  });
}
