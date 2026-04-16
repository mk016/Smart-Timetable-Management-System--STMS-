import { createOpenAI } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  const result = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    messages: [{role: 'user', content: 'time table me kon konse tearchers h'}],
    maxSteps: 5,
    tools: {
      getTimetableContext: tool({
        description: "Fetch teachers",
        parameters: z.object({}),
        execute: async () => {
          return { teachers: "John Doe, Jane Dao" };
        }
      })
    }
  });

  console.log("FINAL TEXT:", result.text);
}

main().catch(console.error);
