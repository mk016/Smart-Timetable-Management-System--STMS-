import { NextRequest, NextResponse } from "next/server";

import { getAppData } from "@/lib/app-data";
import { requireApiRole } from "@/lib/api-helpers";
import { summarizeQuality } from "@/lib/services/ai";

export async function GET(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }
  const data = await getAppData({ ensureTimetable: true });
  const summary = await summarizeQuality(data);
  return NextResponse.json({
    ...summary,
    message: `AI quality score: ${summary.score}`
  });
}
