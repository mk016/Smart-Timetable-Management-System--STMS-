import { NextRequest } from "next/server";

import { itemDelete, itemPut } from "@/lib/api-helpers";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return itemPut(request, "teachers", id);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return itemDelete(request, "teachers", id);
}
