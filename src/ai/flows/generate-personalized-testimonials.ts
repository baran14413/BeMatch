'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized customer testimonials.
 *
 * The flow takes a base testimonial and a customer persona as input, and uses a generative AI
 * to personalize the testimonial to better resonate with the persona.
 *
 * @public
 * @param {GeneratePersonalizedTestimonialInput} input - The input for the flow.
 * @returns {Promise<string>} - A promise that resolves to the personalized testimonial.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';


const GeneratePersonalizedTestimonialInputSchema = z.object({
  baseTestimonial: z.string().describe('The original customer testimonial.'),
  customerPersona: z.string().describe('A description of the target customer persona.'),
});

export type GeneratePersonalizedTestimonialInput = z.infer<typeof GeneratePersonalizedTestimonialInputSchema>;

const GeneratePersonalizedTestimonialOutputSchema = z.string().describe('The personalized customer testimonial.');

export type GeneratePersonalizedTestimonialOutput = z.infer<typeof GeneratePersonalizedTestimonialOutputSchema>;


export async function generatePersonalizedTestimonial(input: GeneratePersonalizedTestimonialInput): Promise<GeneratePersonalizedTestimonialOutput> {
  return generatePersonalizedTestimonialFlow(input);
}

const personalizedTestimonialPrompt = ai.definePrompt({
  name: 'personalizedTestimonialPrompt',
  input: {schema: GeneratePersonalizedTestimonialInputSchema},
  output: {schema: GeneratePersonalizedTestimonialOutputSchema},
  prompt: `You are an expert marketing copywriter.
  Your goal is to personalize customer testimonials to make them more relevant and impactful for specific customer personas.

  Given the following base testimonial and customer persona, rewrite the testimonial to be more compelling and believable for that persona.  Maintain a positive and enthusiastic tone.

  Base Testimonial: {{{baseTestimonial}}}
  Customer Persona: {{{customerPersona}}}

  Personalized Testimonial:`,
});

const generatePersonalizedTestimonialFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedTestimonialFlow',
    inputSchema: GeneratePersonalizedTestimonialInputSchema,
    outputSchema: GeneratePersonalizedTestimonialOutputSchema,
  },
  async input => {
    const {text} = await personalizedTestimonialPrompt(input);
    return text!;
  }
);
