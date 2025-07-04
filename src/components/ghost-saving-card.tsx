'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function GhostIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
    </svg>
  );
}


type GhostSavingCardProps = {
  isActive: boolean;
  onToggle: (isActive: boolean) => void;
  amount: number;
};

export function GhostSavingCard({ isActive, onToggle, amount }: GhostSavingCardProps) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });

  return (
    <Card>
      <CardHeader>
      <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl">Ghost Saving</CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <GhostIcon className="h-6 w-6 text-accent" />
          </div>
        </div>
        <CardDescription>Automatically save small, random amounts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="ghost-saving-toggle" className="font-medium">
                Stealth Mode
            </Label>
            <Switch
                id="ghost-saving-toggle"
                checked={isActive}
                onCheckedChange={onToggle}
                aria-label="Toggle Ghost Saving Stealth Mode"
            />
        </div>
        <div className="text-center">
            <p className="text-sm text-muted-foreground">Total saved in stealth mode</p>
            <p className="text-2xl font-bold text-accent">{formatter.format(amount)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
