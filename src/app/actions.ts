'use server';

import {
  generateAiIcebreaker as generateAiIcebreakerFlow,
  type GenerateAiIcebreakerInput,
  type GenerateAiIcebreakerOutput,
} from '@/ai/flows/generate-ai-icebreaker';

import {
  generateAiChatResponse as generateAiChatResponseFlow,
  type GenerateAiChatResponseInput,
  type GenerateAiChatResponseOutput,
} from '@/ai/flows/generate-ai-chat-response';


export async function generateAiIcebreaker(
  input: GenerateAiIcebreakerInput
): Promise<GenerateAiIcebreakerOutput> {
  return await generateAiIcebreakerFlow(input);
}

export async function generateAiChatResponse(
  input: GenerateAiChatResponseInput
): Promise<GenerateAiChatResponseOutput> {
  return await generateAiChatResponseFlow(input);
}
