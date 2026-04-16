import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, parseSessionToken } from "@/lib/auth";
import { getAppData } from "@/lib/app-data";
import { updateStore } from "@/lib/store";
import { AppData, Role, TimetableEntry } from "@/lib/types";

export type EntityCollection = "teachers" | "subjects" | "rooms" | "batches" | "holidays" | "leaves";

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function getRequestSession(request: NextRequest) {
  return parseSessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

export function requireApiRole(request: NextRequest, roles: Role[]) {
  const session = getRequestSession(request);
  if (!session || !roles.includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function collectionGet(request: NextRequest, key: EntityCollection) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }
  const data = await getAppData();
  return NextResponse.json({ items: data[key], data });
}

export async function collectionPost(
  request: NextRequest,
  key: EntityCollection,
  prefix: string
) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const body = await request.json();
  const item = {
    id: createId(prefix),
    ...body
  };

  type EntityRecord = { id: string } & Record<string, unknown>;
  const data = await updateStore((current) => ({
    ...current,
    [key]: [item, ...((current[key] as unknown) as EntityRecord[])]
  })) as AppData;

  return NextResponse.json({ item, items: data[key], data, message: "Saved successfully." });
}

export async function itemPut(
  request: NextRequest,
  key: EntityCollection,
  id: string
) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  const body = await request.json();
  type EntityRecord = { id: string } & Record<string, unknown>;
  const data = await updateStore((current) => ({
    ...current,
    [key]: (((current[key] as unknown) as EntityRecord[]).map((item) =>
      item.id === id ? { ...item, ...body, id } : item
    )) as EntityRecord[]
  })) as AppData;

  const item = ((data[key] as unknown) as EntityRecord[]).find((entity) => entity.id === id);
  return NextResponse.json({ item, items: data[key], data, message: "Updated successfully." });
}

export async function itemDelete(
  request: NextRequest,
  key: EntityCollection,
  id: string
) {
  const blocked = requireApiRole(request, ["admin"]);
  if (blocked) {
    return blocked;
  }

  type EntityRecord = { id: string } & Record<string, unknown>;
  const data = await updateStore((current) => ({
    ...current,
    [key]: (((current[key] as unknown) as EntityRecord[]).filter((item) => item.id !== id)) as EntityRecord[]
  })) as AppData;

  return NextResponse.json({ items: data[key], data, message: "Deleted successfully." });
}

export function entrySnapshot(data: AppData, entry: TimetableEntry) {
  return {
    entry,
    batch: data.batches.find((item) => item.id === entry.batchId)?.batchName,
    subject: data.subjects.find((item) => item.id === entry.subjectId)?.subjectName,
    teacher: data.teachers.find((item) => item.id === entry.teacherId)?.name,
    room: data.rooms.find((item) => item.id === entry.roomId)?.roomName
  };
}
