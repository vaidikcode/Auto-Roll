"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, CheckCircle, AlertTriangle } from "lucide-react";

interface RunPayrollButtonProps {
  employeeCount: number;
}

export function RunPayrollButton({ employeeCount }: RunPayrollButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    summary?: string;
    anomaly?: boolean;
    anomalyMessage?: string;
    error?: string;
  } | null>(null);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const defaultStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const defaultEnd = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  const defaultPay = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [payDate, setPayDate] = useState(defaultPay);

  const router = useRouter();

  const handleRun = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/agents/payroll-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodStart, periodEnd, payDate }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    if (result?.success) {
      router.refresh();
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={employeeCount === 0}>
        <Zap className="size-4" />
        Run payroll
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Run payroll with AI</DialogTitle>
            <DialogDescription>
              The agent will compute payroll for all {employeeCount} active employees.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-4">
              {result.success ? (
                <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="size-4" />
                    <span className="font-medium">Payroll run created</span>
                  </div>
                  {result.anomaly && (
                    <div className="flex items-start gap-2 text-amber-400 text-sm mt-2">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <span>{result.anomalyMessage}</span>
                    </div>
                  )}
                  <p className="text-sm text-[var(--muted-foreground)]">{result.summary}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-4 text-red-400 text-sm">
                  {result.error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Period start</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Period end</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Pay date</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button onClick={handleRun} disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Running agent..." : "Run payroll"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
