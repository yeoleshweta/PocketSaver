'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, Pencil, CheckCircle } from "lucide-react";
import { addWeeks, format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SavingsGoalCardProps = {
  goal: number;
  current: number;
  weeklyContribution: number;
  onGoalUpdate: (data: { goal: number; weeklyContribution: number }) => void;
};

export function SavingsGoalCard({ goal, current, weeklyContribution, onGoalUpdate }: SavingsGoalCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedGoal, setEditedGoal] = useState(goal);
  const [editedContribution, setEditedContribution] = useState(weeklyContribution);

  const hasGoal = goal > 0;
  const goalReached = hasGoal && current >= goal;
  const progress = hasGoal ? (current / goal) * 100 : 0;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const weeksLeft = hasGoal && !goalReached && weeklyContribution > 0 ? Math.ceil((goal - current) / weeklyContribution) : Infinity;
  const targetDate = isFinite(weeksLeft) ? addWeeks(new Date(), weeksLeft) : null;

  const handleSave = () => {
    onGoalUpdate({ goal: Number(editedGoal), weeklyContribution: Number(editedContribution) });
    setIsDialogOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setEditedGoal(goal);
      setEditedContribution(weeklyContribution);
    }
    setIsDialogOpen(open);
  };

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{hasGoal ? 'Edit' : 'Set'} Savings Goal</DialogTitle>
        <DialogDescription>
          Update your savings goal and weekly contribution. Set goal to 0 to remove it.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="goal" className="text-right">Goal</Label>
          <Input id="goal" type="number" value={editedGoal} onChange={(e) => setEditedGoal(Number(e.target.value))} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="contribution" className="text-right">Weekly Contribution</Label>
          <Input id="contribution" type="number" value={editedContribution} onChange={(e) => setEditedContribution(Number(e.target.value))} className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-2xl">Savings Goal</CardTitle>
            <div className="flex items-center gap-2">
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-5 w-5" />
                  <span className="sr-only">Edit Goal</span>
                </Button>
              </DialogTrigger>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
          {hasGoal && <CardDescription>Your progress towards your financial target.</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {hasGoal ? (
            <>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold text-primary">{formatter.format(current)}</span>
                <span className="text-lg text-muted-foreground">of {formatter.format(goal)}</span>
              </div>
              <Progress value={progress} aria-label={`${Math.round(progress)}% of savings goal reached`} />
              {goalReached ? (
                 <div className="flex items-center text-sm font-semibold text-accent">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Congratulations! You've reached your goal!</span>
                </div>
              ) : targetDate ? (
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <p className="mb-4 text-muted-foreground">You don't have a savings goal set.</p>
              <DialogTrigger asChild>
                <Button>Set a Savings Goal</Button>
              </DialogTrigger>
            </div>
          )}
        </CardContent>
      </Card>
      {dialogContent}
    </Dialog>
  );
}
