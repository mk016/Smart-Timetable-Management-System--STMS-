import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding STMS database...\n");

  // ── Users ──────────────────────────────────────────────
  const users = [
    { id: "u-admin", name: "STMS Admin", email: "admin@stms.local", password: "admin123", role: "admin" },
    { id: "u-teacher", name: "Anita Sharma", email: "teacher@stms.local", password: "teacher123", role: "teacher", linkedId: "t-01" },
    { id: "u-student", name: "BCA 1st Year A", email: "student@stms.local", password: "student123", role: "student", linkedId: "b-01" },
  ];

  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: u, create: u });
  }
  console.log(`✅ Users: ${users.length}`);

  // ── Teachers ───────────────────────────────────────────
  const teachers = [
    {
      id: "t-01", name: "Anita Sharma", teacherCode: "CSE-101", department: "Computer Science",
      maxDailyLoad: 4, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      preferredSlots: [1, 2, 3], subjectIds: ["s-02", "s-03", "s-07"], active: true,
    },
    {
      id: "t-02", name: "Ravi Mehta", teacherCode: "CSE-102", department: "Computer Science",
      maxDailyLoad: 4, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      preferredSlots: [2, 3, 4], subjectIds: ["s-05", "s-06", "s-08"], active: true,
    },
    {
      id: "t-03", name: "Neha Iyer", teacherCode: "ECE-210", department: "Electronics",
      maxDailyLoad: 3, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      preferredSlots: [1, 2, 5], subjectIds: ["s-04"], active: true,
    },
    {
      id: "t-04", name: "Karan Singh", teacherCode: "MAT-115", department: "Applied Mathematics",
      maxDailyLoad: 4, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      preferredSlots: [1, 2], subjectIds: ["s-01"], active: true,
    },
  ];

  for (const t of teachers) {
    await prisma.teacher.upsert({ where: { teacherCode: t.teacherCode }, update: t, create: t });
  }
  console.log(`✅ Teachers: ${teachers.length}`);

  // ── Subjects ───────────────────────────────────────────
  const subjects = [
    { id: "s-01", subjectCode: "MTH101", subjectName: "Mathematics I", type: "theory", weeklySessions: 4, durationSlots: 1, teacherIds: ["t-04"], batchIds: ["b-01"] },
    { id: "s-02", subjectCode: "PFC101", subjectName: "Programming Fundamentals", type: "theory", weeklySessions: 3, durationSlots: 1, teacherIds: ["t-01"], batchIds: ["b-01"] },
    { id: "s-03", subjectCode: "PFL102", subjectName: "Programming Lab", type: "lab", weeklySessions: 1, durationSlots: 2, teacherIds: ["t-01"], batchIds: ["b-01"] },
    { id: "s-04", subjectCode: "DLD120", subjectName: "Digital Logic", type: "theory", weeklySessions: 3, durationSlots: 1, teacherIds: ["t-03"], batchIds: ["b-01"] },
    { id: "s-05", subjectCode: "DBS201", subjectName: "DBMS", type: "theory", weeklySessions: 3, durationSlots: 1, teacherIds: ["t-02"], batchIds: ["b-02"] },
    { id: "s-06", subjectCode: "DST202", subjectName: "Data Structures", type: "theory", weeklySessions: 4, durationSlots: 1, teacherIds: ["t-02"], batchIds: ["b-02"] },
    { id: "s-07", subjectCode: "WDT203", subjectName: "Web Development", type: "theory", weeklySessions: 3, durationSlots: 1, teacherIds: ["t-01"], batchIds: ["b-02"] },
    { id: "s-08", subjectCode: "DBL204", subjectName: "Database Lab", type: "lab", weeklySessions: 1, durationSlots: 2, teacherIds: ["t-02"], batchIds: ["b-02"] },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({ where: { subjectCode: s.subjectCode }, update: s, create: s });
  }
  console.log(`✅ Subjects: ${subjects.length}`);

  // ── Rooms ──────────────────────────────────────────────
  const rooms = [
    { id: "r-01", roomName: "Room 101", roomType: "classroom", capacity: 60, equipmentTags: ["projector"], usableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    { id: "r-02", roomName: "Room 202", roomType: "classroom", capacity: 60, equipmentTags: ["projector", "smart-board"], usableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    { id: "r-03", roomName: "Computer Lab A", roomType: "lab", capacity: 60, equipmentTags: ["desktop", "network"], usableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    { id: "r-04", roomName: "Innovation Lab", roomType: "lab", capacity: 50, equipmentTags: ["kits", "iot", "projector"], usableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({ where: { roomName: r.roomName }, update: r, create: r });
  }
  console.log(`✅ Rooms: ${rooms.length}`);

  // ── Batches ────────────────────────────────────────────
  const batches = [
    { id: "b-01", batchName: "BCA 1st Year", section: "A", department: "Computer Applications", semester: "Semester 1", strength: 54, requiredSubjectIds: ["s-01", "s-02", "s-03", "s-04"] },
    { id: "b-02", batchName: "BCA 2nd Year", section: "A", department: "Computer Applications", semester: "Semester 3", strength: 48, requiredSubjectIds: ["s-05", "s-06", "s-07", "s-08"] },
  ];

  for (const b of batches) {
    await prisma.batch.upsert({ where: { batchName: b.batchName }, update: b, create: b });
  }
  console.log(`✅ Batches: ${batches.length}`);

  // ── Time Slots (Mon–Fri × 6 slots) ────────────────────
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slotTimes = [
    { start: "09:00", end: "10:00" },
    { start: "10:05", end: "11:05" },
    { start: "11:15", end: "12:15" },
    { start: "13:00", end: "14:00" },
    { start: "14:05", end: "15:05" },
    { start: "15:10", end: "16:10" },
  ];

  let slotCount = 0;
  for (const day of days) {
    for (let i = 0; i < slotTimes.length; i++) {
      const id = `${day.toLowerCase()}-${i + 1}`;
      const slot = {
        id,
        dayOfWeek: day,
        slotIndex: i + 1,
        startTime: slotTimes[i].start,
        endTime: slotTimes[i].end,
        active: true,
      };
      await prisma.timeSlot.upsert({ where: { id }, update: slot, create: slot });
      slotCount++;
    }
  }
  console.log(`✅ TimeSlots: ${slotCount}`);

  // ── Holidays ───────────────────────────────────────────
  await prisma.holiday.upsert({
    where: { holidayDate: "2026-08-15" },
    update: { holidayName: "Independence Day", fullDay: true },
    create: { id: "h-01", holidayDate: "2026-08-15", holidayName: "Independence Day", fullDay: true },
  });
  console.log(`✅ Holidays: 1`);

  // ── Leaves ─────────────────────────────────────────────
  await prisma.teacherLeave.upsert({
    where: { id: "l-01" },
    update: { teacherId: "t-02", leaveDate: "2026-08-18", reason: "Faculty development workshop" },
    create: { id: "l-01", teacherId: "t-02", leaveDate: "2026-08-18", reason: "Faculty development workshop" },
  });
  console.log(`✅ Leaves: 1`);

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
