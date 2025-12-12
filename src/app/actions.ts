'use server';

import {
  generateAiIcebreaker as generateAiIcebreakerFlow,
  type GenerateAiIcebreakerInput,
  type GenerateAiIcebreakerOutput,
} from '@/ai/flows/generate-ai-icebreaker';

export async function generateAiIcebreaker(
  input: GenerateAiIcebreakerInput
): Promise<GenerateAiIcebreakerOutput> {
  return await generateAiIcebreakerFlow(input);
}
