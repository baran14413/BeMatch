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
  matchProfile: z
    .string()
    .describe('The profile information of the match to generate an icebreaker for.'),
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
  prompt: `You are a dating app assistant helping users start conversations with new matches.

  Generate a creative and engaging icebreaker message based on the following match profile information:

  {{matchProfile}}

  The icebreaker should be no more than 2 sentences.`,
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
