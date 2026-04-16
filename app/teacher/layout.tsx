import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("teacher");

  return <DashboardShell role="teacher" session={session}>{children}</DashboardShell>;
}
