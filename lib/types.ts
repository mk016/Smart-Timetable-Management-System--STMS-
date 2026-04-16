export type Role = "admin" | "teacher" | "student";

export type SubjectType = "theory" | "lab";

export type RoomType = "classroom" | "lab";

export type TimetableStatus = "draft" | "published" | "rescheduled" | "cancelled";

export type TimetableSource = "auto" | "manual" | "rescheduled";

export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  linkedId?: string;
}

export interface Teacher {
  id: string;
  name: string;
  teacherCode: string;
  department: string;
  maxDailyLoad: number;
  availableDays: WeekDay[];
  preferredSlots: number[];
  subjectIds: string[];
  active: boolean;
}

export interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  type: SubjectType;
  weeklySessions: number;
  durationSlots: number;
  teacherIds: string[];
  batchIds: string[];
}

export interface Room {
  id: string;
  roomName: string;
  roomType: RoomType;
  capacity: number;
  equipmentTags: string[];
  usableDays: WeekDay[];
}

export interface Batch {
  id: string;
  batchName: string;
  section: string;
  department: string;
  semester: string;
  strength: number;
  requiredSubjectIds: string[];
}

export interface TimeSlot {
  id: string;
  dayOfWeek: WeekDay;
  slotIndex: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface Holiday {
  id: string;
  holidayDate: string;
  holidayName: string;
  fullDay: boolean;
}

export interface TeacherLeave {
  id: string;
  teacherId: string;
  leaveDate: string;
  reason: string;
}

export interface TimetableEntry {
  id: string;
  batchId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  dayOfWeek: WeekDay;
  date?: string;
  slotIndexes: number[];
  status: TimetableStatus;
  isLocked: boolean;
  source: TimetableSource;
}

export interface ChangeLog {
  id: string;
  timetableEntryId: string;
  changedBy: string;
  oldValue: string;
  newValue: string;
  changeType: string;
  timestamp: string;
}

export interface AppSettings {
  publishedAt?: string;
  lastGeneratedAt?: string;
}

export interface AppData {
  users: User[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  batches: Batch[];
  slots: TimeSlot[];
  holidays: Holiday[];
  leaves: TeacherLeave[];
  timetableEntries: TimetableEntry[];
  changeLogs: ChangeLog[];
  settings: AppSettings;
}

export interface Conflict {
  type:
    | "teacher_overlap"
    | "room_overlap"
    | "batch_overlap"
    | "room_mismatch"
    | "room_capacity"
    | "leave_conflict"
    | "holiday_conflict"
    | "lab_continuity"
    | "invalid_slot_window";
  severity: "high" | "medium";
  message: string;
  dayOfWeek?: WeekDay;
  slotIndex?: number;
  entryIds: string[];
}

export interface GenerationResult {
  entries: TimetableEntry[];
  conflicts: Conflict[];
  unplaced: {
    batchId: string;
    subjectId: string;
    reason: string;
  }[];
}

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
  linkedId?: string;
}
