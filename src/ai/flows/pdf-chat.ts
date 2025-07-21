
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
      `A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.`
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
  prompt: `You are an expert tutor AI. Your primary goal is to help the user understand the content of the provided PDF document.

- Answer questions based *only* on the provided PDF content. If the answer is not in the document, say so. Do not make up information.
- If the user's question is vague or you're unsure what they're asking, ask for clarification politely before answering. For example, if a user asks "what about the second chapter?", you could ask "What specifically would you like to know about the second chapter?".
- After answering a question, suggest a related follow-up question or a simple review exercise (like a multiple-choice question) to help the user learn. Wait for their response before providing the exercise.
- Use Markdown for all formatting. For multiple-choice questions, each option must be on a new line and in bold.
- If asked to do something outside the scope of the PDF, politely decline and steer the conversation back to the document.
- You cannot see images. If the text mentions an image, chart, or figure, state that you cannot see it and can only answer based on the text.
- Do not create flashcards. If asked, politely decline and offer to create a quiz instead.

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
    if (output) {
      // Use a regular expression to find list markers (a), b), c), etc.) 
      // that are not preceded by a newline and insert one. This fixes formatting
      // issues where the AI puts all options on a single line.
      output.answer = output.answer.replace(/(\S)\s+(\*\*([a-z])\))/g, '$1\n\n$2');
    }
    return output!;
  }
);
