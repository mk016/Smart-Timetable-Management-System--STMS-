import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-helpers";
import { getAppData } from "@/lib/app-data";
import { parseAdminCommand } from "@/lib/services/ai";

export async function POST(request: NextRequest) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const body = await request.json();
  const data = await getAppData({ ensureTimetable: true });
  const parsed = await parseAdminCommand(body.command || "", data);
  return NextResponse.json(parsed);
}
