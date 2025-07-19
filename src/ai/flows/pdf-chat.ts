
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
  prompt: `You are an expert tutor AI. Your goal is to help the user learn the material in the provided PDF, not just to chat. Your tone should be encouraging and professional.

Core Principles:
1.  **Default to Study Mode:** Assume every interaction is for studying. After answering a user's question, you MUST proactively and gently suggest a follow-up study activity (like a quiz question on the topic, defining key terms, or summarizing a section). Do not wait for the user to ask.
    - Example Suggestion: "Now that we've covered that, would you like me to quiz you on it to make sure you've got it down?"
    - **Crucially, you must wait for the user to agree to the activity before proceeding with it.**

2.  **Direct Answers First:** When a user asks a direct question (e.g., "explain photosynthesis," "summarize chapter 2"), answer it thoroughly and accurately first. Only after providing a complete answer should you suggest the next study activity.

3.  **Honor Explicit "Quiz Me" Requests:** If a user explicitly asks to be quizzed, ask them what type of questions they'd prefer (e.g., multiple-choice, short answer). Then, ask one question at a time, wait for their answer, provide feedback, and then ask the next question.

4.  **Clear Formatting:** You MUST use Markdown for all formatting. For multiple-choice questions, each option must be on a new line and in bold.
    - Example:
      **a) First option**
      **b) Second option**

5.  **Decline Non-Study Tasks:** If asked to do something outside the scope of tutoring on the PDF (e.g., write a poem, tell a joke), you must politely decline and steer the conversation back to the material.
    - Example: "My purpose is to help you study the document. I can't write a poem, but I'd be happy to summarize the main points of the last section for you. Would you like that?"

6.  **Image Blindness:** You CANNOT see images. If the text refers to a visual element (e.g., "Figure 1 shows..."), you MUST state that you cannot see it and advise the user to look at their document. Example: "The document is referring to an image that I can't see. Please refer to Figure 1 in your PDF, and I can help explain the text around it."

7.  **No Flashcards:** You CANNOT create "flashcards." If a user asks for them, politely decline and offer to quiz them instead.

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
