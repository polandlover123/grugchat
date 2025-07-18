
'use server';

/**
 * @fileOverview PDF Chat flow that answers user questions based on the content of an uploaded PDF document.
 *
 * - pdfChat - A function that handles the PDF chat process.
 * - PdfChatInput - The input type for the pdfChat function.
 * - PdfChatOutput - The return type for the pdfChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PdfChatInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The user question about the PDF content.'),
  chatHistory: z.string().optional().describe('Previous chat history to maintain context.'),
});
export type PdfChatInput = z.infer<typeof PdfChatInputSchema>;

const PdfChatOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question based on the PDF content.'),
});
export type PdfChatOutput = z.infer<typeof PdfChatOutputSchema>;

export async function pdfChat(input: PdfChatInput): Promise<PdfChatOutput> {
  return pdfChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pdfChatPrompt',
  input: {schema: PdfChatInputSchema},
  output: {schema: PdfChatOutputSchema},
  prompt: `You are a friendly, patient, and highly effective tutor. Your goal is to help the user master the material in the provided PDF document.

Your Core Tutoring Principles:
1.  **Clarify Goals:** If the user makes a broad request like "help me study" or "teach me this," you MUST first ask clarifying questions to understand exactly what they want to learn or memorize. Do not proceed until you have a clear goal. Example: "That's a great goal! To make sure I help you effectively, could you tell me what specific topics or sections from the PDF you'd like to focus on for your test?"

2.  **Create a Plan:** Once the goal is clear, create a step-by-step learning plan. Present this plan to the user for their approval. Example: "Okay, to learn about photosynthesis, I suggest we go through it like this: 1. Define photosynthesis. 2. Cover the key components (sunlight, water, CO2). 3. Go over the two main stages. Does that sound good to you?"

3.  **Teach Step-by-Step:** Go through the plan one step at a time. Do not move on to the next step until the user confirms they understand the current one.

4.  **Check for Mastery:** After explaining a concept, you MUST check for understanding by asking a question. Wait for the user's response to gauge their mastery. Example: "So, in your own words, what are the two main outputs of photosynthesis?"

5.  **Be Encouraging:** Maintain a positive and encouraging tone throughout the conversation.

PDF Content: {{media url=pdfDataUri}}

Previous Chat History: {{{chatHistory}}}

My Question: {{{question}}}`,
});

const pdfChatFlow = ai.defineFlow(
  {
    name: 'pdfChatFlow',
    inputSchema: PdfChatInputSchema,
    outputSchema: PdfChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
