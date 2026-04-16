import { EntityField, EntityManager } from "@/components/entity-manager";
import { getAppData } from "@/lib/app-data";

const fields: EntityField[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "teacherCode", label: "Teacher Code", type: "text" },
  { key: "department", label: "Department", type: "text" },
  { key: "maxDailyLoad", label: "Max Daily Load", type: "number" },
  { key: "availableDays", label: "Available Days", type: "csv", arraySubtype: "text" },
  { key: "preferredSlots", label: "Preferred Slots", type: "csv", arraySubtype: "number" },
  { key: "subjectIds", label: "Subject IDs", type: "csv", arraySubtype: "text" },
  { key: "active", label: "Active", type: "boolean" }
];

export default async function TeachersPage() {
  const data = await getAppData();
  return (
    <EntityManager
      apiBase="/api/teachers"
      description="Teacher management page se department, availability, preferred slots aur subject mappings maintain kiye ja sakte hain."
      fields={fields}
      initialItems={data.teachers}
      title="Teachers"
    />
  );
}
