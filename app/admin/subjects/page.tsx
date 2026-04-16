import { EntityField, EntityManager } from "@/components/entity-manager";
import { getAppData } from "@/lib/app-data";

const fields: EntityField[] = [
  { key: "subjectName", label: "Subject Name", type: "text" },
  { key: "subjectCode", label: "Subject Code", type: "text" },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      { label: "Theory", value: "theory" },
      { label: "Lab", value: "lab" }
    ]
  },
  { key: "weeklySessions", label: "Weekly Sessions", type: "number" },
  { key: "durationSlots", label: "Duration Slots", type: "number" },
  { key: "teacherIds", label: "Teacher IDs", type: "csv", arraySubtype: "text" },
  { key: "batchIds", label: "Batch IDs", type: "csv", arraySubtype: "text" }
];

export default async function SubjectsPage() {
  const data = await getAppData();
  return (
    <EntityManager
      apiBase="/api/subjects"
      description="Subjects page weekly load, theory/lab type, teacher mapping aur batch mapping define karta hai."
      fields={fields}
      initialItems={data.subjects}
      title="Subjects"
    />
  );
}
