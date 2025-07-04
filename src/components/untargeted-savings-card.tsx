import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet } from "lucide-react";

type UntargetedSavingsCardProps = {
  amount: number;
};

export function UntargetedSavingsCard({ amount }: UntargetedSavingsCardProps) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl">General Savings</CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardDescription>Your savings without a specific goal.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">{formatter.format(amount)}</p>
      </CardContent>
    </Card>
  );
}
