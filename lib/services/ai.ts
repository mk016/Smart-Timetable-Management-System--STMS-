import { AppData, Conflict, TimetableEntry } from "@/lib/types";
import { suggestAlternativeSlots, summarizeSchedule, validateTimetable } from "@/lib/services/scheduler";

type GroqMessage = {
  role: "system" | "user";
  content: string;
};

async function callGroq(messages: GroqMessage[]) {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`Groq request failed with ${response.status}`);
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content as string | undefined;
}

export function validateDatasetWithHeuristics(data: AppData) {
  const issues: string[] = [];

  data.subjects.forEach((subject) => {
    if (subject.teacherIds.length === 0) {
      issues.push(`${subject.subjectName} ke liye teacher mapping missing hai.`);
    }
    if (subject.batchIds.length === 0) {
      issues.push(`${subject.subjectName} kisi batch ke saath mapped nahi hai.`);
    }
  });

  data.batches.forEach((batch) => {
    if (batch.requiredSubjectIds.length === 0) {
      issues.push(`${batch.batchName} ke paas koi required subject configured nahi hai.`);
    }
  });

  data.rooms.forEach((room) => {
    const mappedBatch = data.batches.find((batch) => batch.strength > room.capacity && room.roomType === "classroom");
    if (mappedBatch) {
      issues.push(`${room.roomName} ki capacity ${mappedBatch.batchName} se kam ho sakti hai.`);
    }
  });

  return {
    ok: issues.length === 0,
    issues
  };
}

export async function explainConflicts(data: AppData, conflicts: Conflict[]) {
  if (conflicts.length === 0) {
    return {
      summary: "Current timetable validation ke hisab se koi hard conflict nahi mila.",
      bullets: ["Timetable publish karne ke liye ready lag raha hai."]
    };
  }

  const fallback = {
    summary: `${conflicts.length} hard conflicts detect hue hain. Sabse pehle overlaps aur lab continuity issues resolve karo.`,
    bullets: conflicts.slice(0, 5).map((conflict) => conflict.message)
  };

  try {
    const content = await callGroq([
      {
        role: "system",
        content: "You explain timetable conflicts in concise, plain English/Hinglish bullet points for admins."
      },
      {
        role: "user",
        content: JSON.stringify(conflicts)
      }
    ]);

    if (!content) {
      return fallback;
    }

    return {
      summary: "Groq explanation generated successfully.",
      bullets: content.split("\n").filter(Boolean)
    };
  } catch {
    return fallback;
  }
}

export async function summarizeQuality(data: AppData) {
  const snapshot = summarizeSchedule(data);
  const fallback = {
    score: Math.max(40, 100 - snapshot.conflicts.length * 12),
    highlights: [
      `${snapshot.totalEntries} timetable entries configured hain.`,
      snapshot.published ? "Schedule published state me hai." : "Schedule abhi draft mode me hai.",
      `${snapshot.conflicts.length} validation issues pending hain.`
    ]
  };

  try {
    const content = await callGroq([
      {
        role: "system",
        content: "You rate timetable quality from 0 to 100 and return short bullet highlights."
      },
      {
        role: "user",
        content: JSON.stringify(snapshot)
      }
    ]);

    if (!content) {
      return fallback;
    }

    return {
      ...fallback,
      aiNotes: content
    };
  } catch {
    return fallback;
  }
}

export async function parseAdminCommand(command: string, data: AppData) {
  const lower = command.toLowerCase();
  const teacher = data.teachers.find((item) => lower.includes(item.name.toLowerCase().split(" ")[0]));
  const batch = data.batches.find((item) => lower.includes(item.batchName.toLowerCase().split(" ")[0]));
  const day = ["monday", "tuesday", "wednesday", "thursday", "friday"].find((item) => lower.includes(item));
  const targetShift = lower.includes("morning")
    ? [1, 2, 3]
    : lower.includes("afternoon")
      ? [4, 5, 6]
      : undefined;

  const fallback = {
    intent: "move_classes",
    filters: {
      teacherId: teacher?.id || null,
      batchId: batch?.id || null,
      dayOfWeek: day ? `${day.charAt(0).toUpperCase()}${day.slice(1)}` : null
    },
    targetSlots: targetShift,
    note: "Heuristic parser output. Final apply se pehle preview dikhana recommended hai."
  };

  try {
    const content = await callGroq([
      {
        role: "system",
        content: "Return a concise JSON interpretation of an admin scheduling command."
      },
      {
        role: "user",
        content: command
      }
    ]);

    if (!content) {
      return fallback;
    }

    return {
      ...fallback,
      aiNotes: content
    };
  } catch {
    return fallback;
  }
}

export async function slotSuggestions(data: AppData, entry: TimetableEntry) {
  const suggestions = suggestAlternativeSlots(data, entry);
  const fallback = {
    options: suggestions,
    summary: suggestions.length
      ? "Available alternate slots mil gaye."
      : "Current constraints me alternate slots nahi mile."
  };

  try {
    const content = await callGroq([
      {
        role: "system",
        content: "Rank timetable slot alternatives and explain the best option briefly."
      },
      {
        role: "user",
        content: JSON.stringify(suggestions)
      }
    ]);

    if (!content) {
      return fallback;
    }

    return {
      ...fallback,
      aiNotes: content
    };
  } catch {
    return fallback;
  }
}

export function getConflictSnapshot(data: AppData) {
  return validateTimetable(data);
}
