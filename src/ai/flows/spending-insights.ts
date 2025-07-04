'use server';

/**
 * @fileOverview AI agent that provides personalized recommendations on how to reduce spending.
 *
 * - getSpendingInsights - A function that generates spending insights based on transaction history.
 * - SpendingInsightsInput - The input type for the getSpendingInsights function.
 * - SpendingInsightsOutput - The return type for the getSpendingInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingInsightsInputSchema = z.object({
  transactionHistory: z
    .string()
    .describe('A detailed history of the user\'s transactions, including dates, amounts, and descriptions.'),
});
export type SpendingInsightsInput = z.infer<typeof SpendingInsightsInputSchema>;

const SpendingInsightsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('Personalized recommendations on how to reduce spending, based on the transaction history.'),
});
export type SpendingInsightsOutput = z.infer<typeof SpendingInsightsOutputSchema>;

export async function getSpendingInsights(input: SpendingInsightsInput): Promise<SpendingInsightsOutput> {
  return spendingInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spendingInsightsPrompt',
  input: {schema: SpendingInsightsInputSchema},
  output: {schema: SpendingInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's transaction history and provide personalized recommendations on how to reduce their spending.

Transaction History:
{{{transactionHistory}}}

Recommendations:`, // Provide more detailed instructions here
});

const spendingInsightsFlow = ai.defineFlow(
  {
    name: 'spendingInsightsFlow',
    inputSchema: SpendingInsightsInputSchema,
    outputSchema: SpendingInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
