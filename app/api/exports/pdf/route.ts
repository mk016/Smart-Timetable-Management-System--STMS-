import { NextRequest, NextResponse } from "next/server";

import { getRequestSession } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { createPdfExport } from "@/lib/services/exporters";

export async function GET(request: NextRequest) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAppData({ ensureTimetable: true });
  const pdf = createPdfExport(data, data.timetableEntries);

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="stms-timetable.pdf"'
    }
  });
}
