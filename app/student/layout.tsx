import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("student");

  return <DashboardShell role="student" session={session}>{children}</DashboardShell>;
}
