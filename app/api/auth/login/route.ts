import { NextRequest, NextResponse } from "next/server";

import { COOKIE_NAME, createSessionToken } from "@/lib/auth";
import { readStore } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = await readStore();
  const user = data.users.find(
    (item) => item.email === body.email && item.password === body.password
  );

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const session = createSessionToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    linkedId: user.linkedId
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
