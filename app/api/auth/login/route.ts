import { NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.findFirst({
    where: { email: body.email, password: body.password }
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const session = createSessionToken({
    userId: user.id,
    role: user.role as import("@/lib/types").Role,
    name: user.name,
    linkedId: user.linkedId || undefined
  });

  const response = NextResponse.json({
    message: "Login successful.",
    destination: user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/student"
  });

  response.cookies.set(COOKIE_NAME, session, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12
  });

  return response;
}
