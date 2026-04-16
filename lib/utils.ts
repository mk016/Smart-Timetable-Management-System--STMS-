import { WEEK_DAYS, WeekDay } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function formatDay(date: string): WeekDay {
  const weekday = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata"
  }) as WeekDay;
  return WEEK_DAYS.includes(weekday) ? weekday : "Monday";
}

export function nowIso() {
  return new Date().toISOString();
}

export function isSameArray(a: number[], b: number[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
