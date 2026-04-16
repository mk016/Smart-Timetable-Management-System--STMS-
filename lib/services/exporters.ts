import { AppData, TimetableEntry, WEEK_DAYS } from "@/lib/types";

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildTimetableRows(data: AppData, entries: TimetableEntry[]) {
  return entries
    .map((entry) => {
      const batch = data.batches.find((item) => item.id === entry.batchId)?.batchName || entry.batchId;
      const subject = data.subjects.find((item) => item.id === entry.subjectId)?.subjectName || entry.subjectId;
      const teacher = data.teachers.find((item) => item.id === entry.teacherId)?.name || entry.teacherId;
      const room = data.rooms.find((item) => item.id === entry.roomId)?.roomName || entry.roomId;
      return {
        batch,
        subject,
        teacher,
        room,
        day: entry.dayOfWeek,
        slots: entry.slotIndexes.join(", "),
        status: entry.status
      };
    })
    .sort((left, right) => {
      const dayCompare = WEEK_DAYS.indexOf(left.day as (typeof WEEK_DAYS)[number]) - WEEK_DAYS.indexOf(right.day as (typeof WEEK_DAYS)[number]);
      if (dayCompare !== 0) {
        return dayCompare;
      }
      return left.batch.localeCompare(right.batch);
    });
}

export function createCsvExport(data: AppData, entries: TimetableEntry[]) {
  const rows = buildTimetableRows(data, entries);
  const header = "Batch,Subject,Teacher,Room,Day,Slots,Status";
  const body = rows
    .map((row) =>
      [row.batch, row.subject, row.teacher, row.room, row.day, row.slots, row.status]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return `${header}\n${body}`;
}

export function createPdfExport(data: AppData, entries: TimetableEntry[]) {
  const rows = buildTimetableRows(data, entries);
  const lines = [
    "Smart Timetable Management System",
    "",
    ...rows.map((row) => `${row.day} | ${row.batch} | ${row.subject} | ${row.teacher} | ${row.room} | ${row.slots}`)
  ].slice(0, 34);

  const content = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...lines.map((line, index) => `${index === 0 ? "" : "T*"}(${escapePdfText(line)}) Tj`),
    "ET"
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}
