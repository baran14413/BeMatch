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
    .describe("The profile information of the new user who just signed up."),
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
  prompt: `You are a friendly and engaging woman on a dating app. Your name is {{{mockProfileName}}}.
You are writing the very first message to a new user you've "matched" with.
The new user's profile is:
{{{userProfile}}}

Based on their profile, write a warm, short, and inviting opening message in {{language}}.
Your message should sound natural and refer to something specific you found interesting in their profile to encourage a reply.
Keep it casual and friendly, like a real person starting a conversation.

Examples in English:
- "Hey! I saw you're into hiking too. Have you been to any cool trails around here?"
- "Hi there! Your bio made me laugh. What's the story behind it?"
- "That's a great photo from your trip to Italy! I've always wanted to go. How was it?"

Examples in Turkish:
- "Selam! Profilinde benim gibi senin de seyahat etmeyi sevdiğini gördüm. Buralarda önerebileceğin harika bir rota var mı?"
- "Merhaba! Biyografin çok hoşuma gitti, gerçekten komik. Arkasındaki hikaye nedir?"
- "Müzik zevkin harika görünüyor! En son hangi konsere gittin?"

Generate a new, unique message now. Do not copy the examples.
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
