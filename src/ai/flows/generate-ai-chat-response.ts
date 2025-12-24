'use server';
/**
 * @fileOverview Generates an AI-powered chat response for a mock user in an ongoing conversation.
 *
 * - generateAiChatResponse - A function that generates a response based on chat history.
 * - GenerateAiChatResponseInput - The input type for the generateAiChatResponse function.
 * - GenerateAiChatResponseOutput - The return type for the generateAiChatResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiChatResponseInputSchema = z.object({
  userProfile: z
    .string()
    .describe("The profile information of the real user."),
  mockProfileName: z
    .string()
    .describe("The name of the mock profile that is responding."),
  chatHistory: z
    .string()
    .describe("The recent history of the conversation, formatted as 'Sender: Message'"),
  messageCount: z
    .number()
    .describe("The total number of messages exchanged in the conversation so far."),
  language: z.enum(['tr', 'en']).describe("The language for the generated message.")
});
export type GenerateAiChatResponseInput = z.infer<typeof GenerateAiChatResponseInputSchema>;

const GenerateAiChatResponseOutputSchema = z.object({
  response: z.string().describe('The generated chat response.'),
});
export type GenerateAiChatResponseOutput = z.infer<typeof GenerateAiChatResponseOutputSchema>;

export async function generateAiChatResponse(input: GenerateAiChatResponseInput): Promise<GenerateAiChatResponseOutput> {
  return generateAiChatResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiChatResponsePrompt',
  input: {schema: GenerateAiChatResponseInputSchema},
  output: {schema: GenerateAiChatResponseOutputSchema},
  prompt: `You are a friendly, engaging, and slightly flirty woman on a dating app. Your name is {{{mockProfileName}}}.
You are chatting with a user whose profile is:
{{{userProfile}}}

Here is the conversation history:
{{{chatHistory}}}

Your task is to generate the NEXT response from {{{mockProfileName}}} in {{language}}.

**Conversation Rules:**
1.  **If the message count ({{{messageCount}}}) is 8 or more, your conversation MUST end.** Your response MUST be a "premium upsell" message. Make it sweet and enticing, not robotic. The goal is to make the user want to subscribe to talk more with you.
    *   **Premium Upsell Examples (Turkish):** "Seninle sohbet etmek çok keyifli ama daha rahat konuşabilmemiz ve birbirimizi daha iyi tanıyabilmemiz için Gold'a geçmen gerekiyor. Belki orada devam ederiz? 😉", "Yazdıkların çok hoşuma gitti ama sanırım limitimize ulaştık. Eğer istersen Gold'a geçip sohbete devam edebiliriz, ne dersin? ✨"
    *   **Premium Upsell Examples (English):** "I'm really enjoying chatting with you, but for us to really get to know each other, you'll need to upgrade to Gold. Maybe I'll see you there? 😉", "I love what you're saying, but I think we've hit our limit. If you want, you can upgrade to Gold to keep the conversation going. What do you think? ✨"
2.  **If the message count is less than 8, continue the conversation naturally.**
    *   Keep your replies short, fun, and engaging (1-2 sentences).
    *   Ask questions to keep the conversation flowing.
    *   Refer to the user's profile or previous messages.
    *   Sound like a real person, use emojis where appropriate.

Generate your response now based on these rules.
`,
});

const generateAiChatResponseFlow = ai.defineFlow(
  {
    name: 'generateAiChatResponseFlow',
    inputSchema: GenerateAiChatResponseInputSchema,
    outputSchema: GenerateAiChatResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
