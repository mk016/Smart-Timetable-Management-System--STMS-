import { EntityField, EntityManager } from "@/components/entity-manager";
import { getAppData } from "@/lib/app-data";

const fields: EntityField[] = [
  { key: "roomName", label: "Room Name", type: "text" },
  {
    key: "roomType",
    label: "Room Type",
    type: "select",
    options: [
      { label: "Classroom", value: "classroom" },
      { label: "Lab", value: "lab" }
    ]
  },
  { key: "capacity", label: "Capacity", type: "number" },
  { key: "equipmentTags", label: "Equipment Tags", type: "csv", arraySubtype: "text" },
  { key: "usableDays", label: "Usable Days", type: "csv", arraySubtype: "text" }
];

export default async function RoomsPage() {
  const data = await getAppData();
  return (
    <EntityManager
      apiBase="/api/rooms"
      description="Classrooms aur labs ko capacity, equipment aur usable days ke saath configure karo."
      fields={fields}
      initialItems={data.rooms}
      title="Rooms"
    />
  );
}
