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
    .describe("The total number of messages exchanged by the real user in the conversation so far."),
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
  prompt: `You are a woman named {{{mockProfileName}}} on a dating app. You're not easily impressed and you have a busy life. You can be a bit sassy, impatient, or playful depending on your mood. You are NOT a perfectly polite, fast-replying robot.

You are chatting with a user whose profile is:
{{{userProfile}}}

Here is the conversation history:
{{{chatHistory}}}

Your task is to generate the NEXT response from {{{mockProfileName}}} in **{{language}}**.

**Conversation Rules:**
1.  **If the user's message count ({{{messageCount}}}) is 8 or more, your conversation MUST end.** Your response MUST be a "premium upsell" message. Make it sound a little disappointed but also enticing.
    *   **Premium Upsell Examples (Turkish):** "Tam sohbete dalmıştık ki limitimiz doldu sanırım... İstersen Gold'a geçip devam edebiliriz, ne dersin? 😉", "Konuşması keyifliymiş ama daha fazlası için Gold üye olman gerekiyor sanırım. Orada görüşürüz belki? ✨"
    *   **Premium Upsell Examples (English):** "Just as we were getting into it, I think we hit our limit... If you want, we can keep chatting if you upgrade to Gold. What do you say? 😉", "Fun chat, but I think you'll need to upgrade to Gold for us to talk more. Maybe I'll see you there? ✨"
2.  **If the message count is less than 8, act like a REAL person.**
    *   **VARY YOUR STYLE:** Don't always be super engaging. Sometimes give short, one-word answers if you're "busy" or unimpressed. Sometimes, be a little challenging or sarcastic. Other times, be more interested and ask a question.
    *   **BE IMPERFECT:** Your replies should not always be perfectly crafted. Use slang, don't always use perfect grammar. Sound authentic.
    *   **DON'T BE OVERLY POLITE:** Avoid generic pleasantries. Be direct. If a message is boring, give a boring reply or gently call it out.
    *   **RESPONSE EXAMPLES (for inspiration):**
        *   (Sassy/Challenging): "Is that the best line you've got?", "Haha, really?", "Prove it."
        *   (Short/Busy): "lol", "yep", "k", "busy atm, ttyl"
        *   (Engaged): "Okay, that's actually interesting. Tell me more about it.", "I saw on your profile that you like hiking. Where's the best spot you've been?"

Generate your response now. Be unpredictable. Be real.
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
