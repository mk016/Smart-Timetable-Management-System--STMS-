import { NextRequest } from "next/server";

import { collectionGet, collectionPost } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  return collectionGet(request, "holidays");
}

export async function POST(request: NextRequest) {
  return collectionPost(request, "holidays", "h");
}
