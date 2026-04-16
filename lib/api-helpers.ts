import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, parseSessionToken } from "@/lib/auth";
import { getAppData } from "@/lib/app-data";
import { AppData, Role, TimetableEntry } from "@/lib/types";
import { db } from "@/lib/db";

export type EntityCollection = "teachers" | "subjects" | "rooms" | "batches" | "holidays" | "leaves";

function getPrismaModel(key: EntityCollection) {
  switch (key) {
    case "teachers": return db.teacher;
    case "subjects": return db.subject;
    case "rooms": return db.room;
    case "batches": return db.batch;
    case "holidays": return db.holiday;
    case "leaves": return db.teacherLeave;
  }
}

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
  const model = getPrismaModel(key);
  const items = await (model as any).findMany();
  // Include global app data since some callers might rely on it
  const data = await getAppData();
  return NextResponse.json({ items, data });
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
  const itemData = {
    // Optionally create ID if not provided. Prisma also handles default cuid().
    id: body.id || createId(prefix),
    ...body
  };

  const model = getPrismaModel(key);
  const item = await (model as any).create({ data: itemData });
  const items = await (model as any).findMany();
  
  // Re-fetch data for callers expecting a fresh state
  const data = await getAppData();
  return NextResponse.json({ item, items, data, message: "Saved successfully." });
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
  const model = getPrismaModel(key);
  const item = await (model as any).update({ where: { id }, data: body });
  const items = await (model as any).findMany();
  
  const data = await getAppData();
  return NextResponse.json({ item, items, data, message: "Updated successfully." });
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

  const model = getPrismaModel(key);
  await (model as any).delete({ where: { id } });
  const items = await (model as any).findMany();
  
  const data = await getAppData();
  return NextResponse.json({ items, data, message: "Deleted successfully." });
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
