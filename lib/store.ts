import { promises as fs } from "fs";
import path from "path";

import { AppData, Batch, Room, Subject, Teacher, TimeSlot, WEEK_DAYS } from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

function defaultSlots(): TimeSlot[] {
  const slotTemplates = [
    ["09:00", "10:00"],
    ["10:05", "11:05"],
    ["11:15", "12:15"],
    ["13:00", "14:00"],
    ["14:05", "15:05"],
    ["15:10", "16:10"]
  ];

  return WEEK_DAYS.flatMap((dayOfWeek) =>
    slotTemplates.map(([startTime, endTime], index) => ({
      id: `${dayOfWeek.toLowerCase()}-${index + 1}`,
      dayOfWeek,
      slotIndex: index + 1,
      startTime,
      endTime,
      active: true
    }))
  );
}

function defaultTeachers(): Teacher[] {
  return [
    {
      id: "t-01",
      name: "Anita Sharma",
      teacherCode: "CSE-101",
      department: "Computer Science",
      maxDailyLoad: 4,
      availableDays: [...WEEK_DAYS],
      preferredSlots: [1, 2, 3],
      subjectIds: ["s-02", "s-03", "s-07"],
      active: true
    },
    {
      id: "t-02",
      name: "Ravi Mehta",
      teacherCode: "CSE-102",
      department: "Computer Science",
      maxDailyLoad: 4,
      availableDays: [...WEEK_DAYS],
      preferredSlots: [2, 3, 4],
      subjectIds: ["s-05", "s-06", "s-08"],
      active: true
    },
    {
      id: "t-03",
      name: "Neha Iyer",
      teacherCode: "ECE-210",
      department: "Electronics",
      maxDailyLoad: 3,
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      preferredSlots: [1, 2, 5],
      subjectIds: ["s-04"],
      active: true
    },
    {
      id: "t-04",
      name: "Karan Singh",
      teacherCode: "MAT-115",
      department: "Applied Mathematics",
      maxDailyLoad: 4,
      availableDays: [...WEEK_DAYS],
      preferredSlots: [1, 2],
      subjectIds: ["s-01"],
      active: true
    }
  ];
}

function defaultSubjects(): Subject[] {
  return [
    {
      id: "s-01",
      subjectCode: "MTH101",
      subjectName: "Mathematics I",
      type: "theory",
      weeklySessions: 4,
      durationSlots: 1,
      teacherIds: ["t-04"],
      batchIds: ["b-01"]
    },
    {
      id: "s-02",
      subjectCode: "PFC101",
      subjectName: "Programming Fundamentals",
      type: "theory",
      weeklySessions: 3,
      durationSlots: 1,
      teacherIds: ["t-01"],
      batchIds: ["b-01"]
    },
    {
      id: "s-03",
      subjectCode: "PFL102",
      subjectName: "Programming Lab",
      type: "lab",
      weeklySessions: 1,
      durationSlots: 2,
      teacherIds: ["t-01"],
      batchIds: ["b-01"]
    },
    {
      id: "s-04",
      subjectCode: "DLD120",
      subjectName: "Digital Logic",
      type: "theory",
      weeklySessions: 3,
      durationSlots: 1,
      teacherIds: ["t-03"],
      batchIds: ["b-01"]
    },
    {
      id: "s-05",
      subjectCode: "DBS201",
      subjectName: "DBMS",
      type: "theory",
      weeklySessions: 3,
      durationSlots: 1,
      teacherIds: ["t-02"],
      batchIds: ["b-02"]
    },
    {
      id: "s-06",
      subjectCode: "DST202",
      subjectName: "Data Structures",
      type: "theory",
      weeklySessions: 4,
      durationSlots: 1,
      teacherIds: ["t-02"],
      batchIds: ["b-02"]
    },
    {
      id: "s-07",
      subjectCode: "WDT203",
      subjectName: "Web Development",
      type: "theory",
      weeklySessions: 3,
      durationSlots: 1,
      teacherIds: ["t-01"],
      batchIds: ["b-02"]
    },
    {
      id: "s-08",
      subjectCode: "DBL204",
      subjectName: "Database Lab",
      type: "lab",
      weeklySessions: 1,
      durationSlots: 2,
      teacherIds: ["t-02"],
      batchIds: ["b-02"]
    }
  ];
}

function defaultRooms(): Room[] {
  return [
    {
      id: "r-01",
      roomName: "Room 101",
      roomType: "classroom",
      capacity: 60,
      equipmentTags: ["projector"],
      usableDays: [...WEEK_DAYS]
    },
    {
      id: "r-02",
      roomName: "Room 202",
      roomType: "classroom",
      capacity: 60,
      equipmentTags: ["projector", "smart-board"],
      usableDays: [...WEEK_DAYS]
    },
    {
      id: "r-03",
      roomName: "Computer Lab A",
      roomType: "lab",
      capacity: 60,
      equipmentTags: ["desktop", "network"],
      usableDays: [...WEEK_DAYS]
    },
    {
      id: "r-04",
      roomName: "Innovation Lab",
      roomType: "lab",
      capacity: 50,
      equipmentTags: ["kits", "iot", "projector"],
      usableDays: [...WEEK_DAYS]
    }
  ];
}

function defaultBatches(): Batch[] {
  return [
    {
      id: "b-01",
      batchName: "BCA 1st Year",
      section: "A",
      department: "Computer Applications",
      semester: "Semester 1",
      strength: 54,
      requiredSubjectIds: ["s-01", "s-02", "s-03", "s-04"]
    },
    {
      id: "b-02",
      batchName: "BCA 2nd Year",
      section: "A",
      department: "Computer Applications",
      semester: "Semester 3",
      strength: 48,
      requiredSubjectIds: ["s-05", "s-06", "s-07", "s-08"]
    }
  ];
}

export function createSeedData(): AppData {
  return {
    users: [
      {
        id: "u-admin",
        name: "STMS Admin",
        email: "admin@stms.local",
        password: "admin123",
        role: "admin"
      },
      {
        id: "u-teacher",
        name: "Anita Sharma",
        email: "teacher@stms.local",
        password: "teacher123",
        role: "teacher",
        linkedId: "t-01"
      },
      {
        id: "u-student",
        name: "BCA 1st Year A",
        email: "student@stms.local",
        password: "student123",
        role: "student",
        linkedId: "b-01"
      }
    ],
    teachers: defaultTeachers(),
    subjects: defaultSubjects(),
    rooms: defaultRooms(),
    batches: defaultBatches(),
    slots: defaultSlots(),
    holidays: [
      {
        id: "h-01",
        holidayDate: "2026-08-15",
        holidayName: "Independence Day",
        fullDay: true
      }
    ],
    leaves: [
      {
        id: "l-01",
        teacherId: "t-02",
        leaveDate: "2026-08-18",
        reason: "Faculty development workshop"
      }
    ],
    timetableEntries: [],
    changeLogs: [],
    settings: {}
  };
}

async function ensureStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(createSeedData(), null, 2), "utf8");
  }
}

export async function readStore(): Promise<AppData> {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(raw) as AppData;
}

export async function writeStore(data: AppData) {
  await ensureStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  return data;
}

export async function updateStore(updater: (current: AppData) => AppData | Promise<AppData>) {
  const current = await readStore();
  const updated = await updater(current);
  await writeStore(updated);
  return updated;
}
