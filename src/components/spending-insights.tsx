"use client";

import { useState } from "react";
import { getSpendingInsights } from "@/ai/flows/spending-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MOCK_TRANSACTION_HISTORY = `
- 2024-05-21: Coffee Shop - $4.50
- 2024-05-21: Grocery Store - $75.20
- 2024-05-20: Netflix Subscription - $15.49
- 2024-05-20: Gas Station - $45.10
- 2024-05-19: Restaurant - $55.00
- 2024-05-18: Online Shopping (Amazon) - $120.30
- 2024-05-18: Coffee Shop - $4.50
- 2024-05-17: Spotify Subscription - $10.99
- 2024-05-15: Movie Ticket - $18.00
- 2024-05-14: Coffee Shop - $4.50
`;

export function SpendingInsights() {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetInsights = async () => {
    setIsLoading(true);
    setInsights(null);
    try {
      const result = await getSpendingInsights({ transactionHistory: MOCK_TRANSACTION_HISTORY });
      setInsights(result.recommendations);
    } catch (error) {
      console.error("Failed to get spending insights:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch spending insights. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-2xl">AI Spending Insights</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Lightbulb className="h-6 w-6 text-accent" />
            </div>
        </div>
        <CardDescription>Get AI-powered tips to boost your savings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGetInsights} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Generate Recommendations"
          )}
        </Button>

        {insights && (
            <Alert>
                <AlertTitle className="font-headline">Recommendations</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc space-y-2 pl-5">
                    {insights.split('\n').filter(line => line.trim().startsWith('-')).map((rec, index) => (
                        <li key={index}>{rec.substring(1).trim()}</li>
                    ))}
                    </ul>
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
