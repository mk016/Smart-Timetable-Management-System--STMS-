import { TimetableWorkspace } from "@/components/timetable-workspace";
import { getAppData } from "@/lib/app-data";

export default async function TimetablePage() {
  const data = await getAppData({ ensureTimetable: true });
  return <TimetableWorkspace initialData={data} />;
}
