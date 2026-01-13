"use server";

import {
  generatePersonalizedTestimonial,
  type GeneratePersonalizedTestimonialInput,
} from '@/ai/flows/generate-personalized-testimonials';

export async function getPersonalizedTestimonial(input: GeneratePersonalizedTestimonialInput): Promise<string> {
  try {
    const personalizedText = await generatePersonalizedTestimonial(input);
    return personalizedText;
  } catch (error) {
    console.error('Error generating personalized testimonial:', error);
    // Return base testimonial as a fallback
    return `Error: Could not generate personalized content. ${input.baseTestimonial}`;
  }
}
