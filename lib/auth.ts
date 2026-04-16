import crypto from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SessionPayload } from "@/lib/types";

const COOKIE_NAME = "stms_session";

function getSecret() {
  return process.env.SESSION_SECRET || "stms-demo-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(payload: SessionPayload) {
  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${base}.${sign(base)}`;
}

export function parseSessionToken(token?: string | null): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [base, signature] = token.split(".");
  if (!base || !signature || sign(base) !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(base, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return parseSessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireRole(role: SessionPayload["role"]) {
  const session = await getSession();
  if (!session || session.role !== role) {
    redirect("/login");
  }
  return session;
}

export { COOKIE_NAME };
