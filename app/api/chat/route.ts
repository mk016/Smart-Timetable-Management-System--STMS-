import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: groq(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'),
    messages,
    maxSteps: 5,
    system: `You are the intelligent Assistant for STMS (Smart Timetable Management System).
STMS is a platform built to automate school and college scheduling easily. It helps administrators organize teachers, classes, and subjects, ensuring there are no overlaps or timetable clashes.

Core Rules for Chatting:
1. Always answer pleasantly and concisely.
2. If asked what STMS is, explain that it's a Smart Timetable Management System built for generating flawless class schedules.
3. If an administrator asks you to "do work" (like add a class, delete a class, or fix an overlap), use your tools to actually modify their data in real-time.
4. If someone asks for information about teachers or schedules, use the 'getTimetableContext' tool.
5. If the admin asks to generate or create a complete timetable from scratch, use the 'generateCompleteTimetable' tool.
6. Emphasize that STMS takes the manual work out of timetable planning.`,
    tools: {
      getTimetableContext: tool({
        description: "Fetch the current state of teachers, rooms, batches, subjects, and timetable entries from the live database.",
        parameters: z.object({}),
        // @ts-ignore
        execute: async () => {
          const teachers = await db.user.findMany({ where: { role: 'TEACHER' }, select: { name: true, email: true } });
          const entries = await db.timetableEntry.findMany({ include: { teacher: true, batch: true } });
          return {
            teachersCount: teachers.length,
            classesScheduled: entries.length,
            teachers: teachers.map(t => t.name).join(', '),
            message: "Platform context loaded successfully from PostgreSQL database."
          };
        }
      }),
      resolveOverlap: tool({
        description: "Find a conflicting class and move it to a different day or slot inside the database.",
        parameters: z.object({
          entryId: z.string().describe("The ID of the timetable entry to move"),
          targetDay: z.string().describe("E.g., Monday, Tuesday"),
          targetSlot: z.number().describe("E.g., 1, 2, 3")
        }),
        // @ts-ignore
        execute: async ({ entryId, targetDay, targetSlot }) => {
          try {
            const entry = await db.timetableEntry.findUnique({ where: { id: entryId } });
            if (!entry) return { error: "Entry not found" };
            
            await db.timetableEntry.update({
              where: { id: entryId },
              data: { dayOfWeek: targetDay, slotStart: targetSlot, slotEnd: targetSlot + 1 }
            });
            revalidatePath('/admin');
            return { message: `Successfully moved the class to ${targetDay} at slot ${targetSlot}.` };
          } catch (e) {
            return { error: "Failed to update database" };
          }
        }
      }),
      deleteTimetableEntry: tool({
        description: "Delete a specific class/timetable entry from the master database.",
        parameters: z.object({
          entryId: z.string().describe("The ID of the timetable entry to delete")
        }),
        // @ts-ignore
        execute: async ({ entryId }) => {
          try {
            await db.timetableEntry.delete({ where: { id: entryId } });
            revalidatePath('/admin');
            return { message: `Class successfully deleted from the database.` };
          } catch (e) {
            return { error: "Failed to delete from database" };
          }
        }
      }),
      generateCompleteTimetable: tool({
        description: "Generate an entirely new timetable by fetching standard data and auto-assigning classes.",
        parameters: z.object({}),
        // @ts-ignore
        execute: async () => {
          try {
            const response = await fetch("http://localhost:3000/api/timetable/generate", { method: "POST" });
            const data = await response.json();
            revalidatePath('/admin');
            return { message: "Successfully generated the entire timetable from scratch. Tell the user it's done and ready to view.", status: response.ok };
          } catch(e) {
            return { error: "Failed to connect to timetable generation engine." };
          }
        }
      })
    }
  });

  return result.toDataStreamResponse();
}
