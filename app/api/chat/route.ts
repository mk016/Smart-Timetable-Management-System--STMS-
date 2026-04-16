import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getAppData } from '@/lib/app-data';
import { validateTimetable } from '@/lib/services/scheduler';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: groq(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'),
    messages,
    system: `You are the STMS Timetable Schedule Assistant.
Your goal is to help administrators fix conflicts, build schedules, and customize timetables.
DO NOT allow overlaps. Always use tools to check constraints before confirming an action.
If the administrator asks to generate the entire timetable, suggest they use the "Generate" button, but if they insist on creating specific entries, use the createEntry tool and verify it doesn't overlap.`,
    tools: {
      getTimetableContext: tool({
        description: "Fetch the current state of teachers, rooms, batches, holidays, and active timetable entries.",
        parameters: z.object({}),
        // @ts-ignore - Bypass AI SDK inference bug
        execute: async () => {
          const data = await getAppData();
          const conflicts = validateTimetable(data);
          return {
            teachersCount: data.teachers.length,
            classesScheduled: data.timetableEntries.length,
            currentConflicts: conflicts,
            teachers: data.teachers.map(t => ({ id: t.id, name: t.name, subjectIds: t.subjectIds })),
            batches: data.batches.map(b => ({ id: b.id, name: b.batchName })),
          };
        }
      }),
      resolveOverlap: tool({
        description: "Find an alternative slot for a conflicting class",
        parameters: z.object({
          entryId: z.string().describe("The ID of the timetable entry to move"),
          preferredDay: z.string().optional().describe("E.g., Monday")
        }),
        // @ts-ignore - Bypass AI SDK inference bug
        execute: async ({ entryId, preferredDay }) => {
          const data = await getAppData();
          const entry = data.timetableEntries.find(e => e.id === entryId);
          if (!entry) return { error: "Entry not found" };
          
          return { 
            message: `Mock: Successfully found alternative slot for ${entry.subjectId} on ${preferredDay || 'Tuesday'} slot 3 without overlaps.`, 
            suggestedDay: preferredDay || 'Tuesday', 
            suggestedSlotStart: 3 
          };
        }
      })
    }
  });

  return result.toTextStreamResponse();
}
