import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { validateDatasetWithHeuristics } from "@/lib/services/ai";

export async function GET(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }
  const data = await getAppData();
  const report = validateDatasetWithHeuristics(data);
  return NextResponse.json(report);
}
