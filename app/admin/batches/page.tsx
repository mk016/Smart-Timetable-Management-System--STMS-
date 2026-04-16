import { EntityField, EntityManager } from "@/components/entity-manager";
import { getAppData } from "@/lib/app-data";

const fields: EntityField[] = [
  { key: "batchName", label: "Batch Name", type: "text" },
  { key: "section", label: "Section", type: "text" },
  { key: "department", label: "Department", type: "text" },
  { key: "semester", label: "Semester", type: "text" },
  { key: "strength", label: "Strength", type: "number" },
  { key: "requiredSubjectIds", label: "Required Subject IDs", type: "csv", arraySubtype: "text" }
];

export default async function BatchesPage() {
  const data = await getAppData();
  return (
    <EntityManager
      apiBase="/api/batches"
      description="Batch/section configuration schedule generator ke liye foundational data provide karti hai."
      fields={fields}
      initialItems={data.batches}
      title="Batches"
    />
  );
}
