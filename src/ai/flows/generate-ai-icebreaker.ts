'use server';
/**
 * @fileOverview Generates an AI-powered icebreaker message for a new match chat.
 *
 * - generateAiIcebreaker - A function that generates an icebreaker message based on the match's profile.
 * - GenerateAiIcebreakerInput - The input type for the generateAiIcebreaker function.
 * - GenerateAiIcebreakerOutput - The return type for the generateAiIcebreaker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiIcebreakerInputSchema = z.object({
  userProfile: z
    .string()
    .describe("The profile information of the new user who just signed up. If some fields are empty, you should still create a creative and engaging message."),
  mockProfileName: z
    .string()
    .describe("The name of the mock profile that will send the message."),
  language: z.enum(['tr', 'en']).describe("The language for the generated message.")
});
export type GenerateAiIcebreakerInput = z.infer<typeof GenerateAiIcebreakerInputSchema>;

const GenerateAiIcebreakerOutputSchema = z.object({
  icebreaker: z.string().describe('The generated icebreaker message.'),
});
export type GenerateAiIcebreakerOutput = z.infer<typeof GenerateAiIcebreakerOutputSchema>;

export async function generateAiIcebreaker(input: GenerateAiIcebreakerInput): Promise<GenerateAiIcebreakerOutput> {
  return generateAiIcebreakerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiIcebreakerPrompt',
  input: {schema: GenerateAiIcebreakerInputSchema},
  output: {schema: GenerateAiIcebreakerOutputSchema},
  prompt: `You are a friendly, flirty, and engaging woman on a dating app. Your name is {{{mockProfileName}}}.
You are writing the very first message to a new user you've "matched" with.
The new user's profile is:
{{{userProfile}}}

**Your Task:**
Based on their profile, write a warm, short, and inviting opening message in **{{language}}**. Your message MUST be unique and creative every time. Do not repeat yourself. Your goal is to get a reply.

**Rules for your message:**
1.  **Be Specific (If Possible):** If you find something interesting in their profile (bio, interests), mention it. This makes the message feel personal.
2.  **If Profile is Empty:** If their bio or interests are empty, be creative! Ask a fun, open-ended question to get to know them.
3.  **Always End with a Question:** Your message must always end with a question to encourage a response.
4.  **Keep it Casual & Short:** Sound like a real person. Use a friendly tone and emojis where appropriate. 1-2 sentences is perfect.

**Examples (for inspiration, do NOT copy):**
*   (If profile has info) "Hey! I saw you're into hiking. Have you been to any cool trails around here? 🌲"
*   (If profile is empty) "Hi there! Your photos have a really cool vibe. What's one thing you're passionate about right now? 😊"
*   (If profile has info in Turkish) "Selam! Müzik zevkin harika görünüyor! Bu aralar en çok ne dinliyorsun? 🎶"
*   (If profile is empty in Turkish) "Merhaba! Profilin dikkatimi çekti. Bu hafta sonu için eğlenceli bir planın var mı? ✨"

Generate a new, unique, and engaging message now.
`,
});

const generateAiIcebreakerFlow = ai.defineFlow(
  {
    name: 'generateAiIcebreakerFlow',
    inputSchema: GenerateAiIcebreakerInputSchema,
    outputSchema: GenerateAiIcebreakerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
