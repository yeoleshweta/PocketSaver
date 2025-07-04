'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar } from "lucide-react";
import { addWeeks, format } from "date-fns";

type SavingsGoalCardProps = {
  goal: number;
  current: number;
  weeklyContribution: number;
};

export function SavingsGoalCard({ goal, current, weeklyContribution }: SavingsGoalCardProps) {
  const progress = (current / goal) * 100;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const weeksLeft = weeklyContribution > 0 ? Math.ceil((goal - current) / weeklyContribution) : Infinity;
  const targetDate = isFinite(weeksLeft) ? addWeeks(new Date(), weeksLeft) : null;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl">Savings Goal</CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardDescription>Your progress towards your financial target.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-baseline">
          <span className="text-3xl font-bold text-primary">{formatter.format(current)}</span>
          <span className="text-lg text-muted-foreground">of {formatter.format(goal)}</span>
        </div>
        <Progress value={progress} aria-label={`${Math.round(progress)}% of savings goal reached`} />
        {targetDate ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              Estimated goal date: <span className="font-semibold text-foreground">{format(targetDate, "MMMM d, yyyy")}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center text-sm text-muted-foreground">
            Set a weekly contribution to see your timeline.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
