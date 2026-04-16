import { NextRequest, NextResponse } from "next/server";

import { getRequestSession } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { createCsvExport } from "@/lib/services/exporters";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAppData({ ensureTimetable: true });
  const csv = createCsvExport(data, data.timetableEntries);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="stms-timetable.csv"'
    }
  });
}
