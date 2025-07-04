'use client';

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clapperboard, Music, Tv, BookOpen, Repeat } from "lucide-react";

export type Subscription = {
  id: string;
  name: string;
  cost: number;
  icon: LucideIcon;
  lastUsed: string;
  cancellable?: boolean;
};

const subscriptions: Subscription[] = [
  { id: '1', name: 'Netflix', cost: 15.49, icon: Tv, lastUsed: '2 days ago' },
  { id: '2', name: 'Spotify', cost: 10.99, icon: Music, lastUsed: '1 hour ago' },
  { id: '3', name: 'Prime Video', cost: 8.99, icon: Clapperboard, lastUsed: '2 weeks ago', cancellable: true },
  { id: '4', name: 'Audible', cost: 14.95, icon: BookOpen, lastUsed: '3 months ago', cancellable: true },
];

export function SubscriptionManager() {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const totalMonthlyCost = subscriptions.reduce((acc, sub) => acc + sub.cost, 0);
  const potentialSavings = subscriptions
    .filter(s => s.cancellable)
    .reduce((acc, sub) => acc + sub.cost, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl">Subscriptions</CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Repeat className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="flex justify-between items-baseline pt-2">
            <CardDescription>Total monthly cost: <span className="font-semibold text-foreground">{formatter.format(totalMonthlyCost)}</span></CardDescription>
            {potentialSavings > 0 && (
                <CardDescription>Potential savings: <span className="font-semibold text-accent">{formatter.format(potentialSavings)}</span></CardDescription>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {subscriptions.map((sub, index) => (
            <li key={sub.id}>
              <div className="flex items-center gap-4">
                <sub.icon className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-semibold">{sub.name}</p>
                  <p className="text-sm text-muted-foreground">{formatter.format(sub.cost)} / month</p>
                </div>
                <div className="text-right">
                    {sub.cancellable ? (
                        <Badge variant="outline" className="border-destructive text-destructive">Suggestion</Badge>
                    ) : (
                        <p className="text-sm text-muted-foreground">Used {sub.lastUsed}</p>
                    )}
                </div>
                <Button variant={sub.cancellable ? "destructive" : "outline"} size="sm">
                  {sub.cancellable ? "Cancel" : "Manage"}
                </Button>
              </div>
              {index < subscriptions.length - 1 && <Separator className="mt-4" />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
