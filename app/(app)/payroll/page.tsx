import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Zap, AlertTriangle } from "lucide-react";
import { RunPayrollButton } from "@/components/payroll/run-payroll-button";
import type { PayrollRun } from "@/lib/supabase/types";

export default async function PayrollPage() {
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("payroll_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: employeeCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  return (
    <div>
      <Topbar title="Payroll" subtitle="Manage payroll runs and approvals" />
      <div className="p-6 space-y-6">
        {/* Run payroll card */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="size-4 text-amber-400" />
                  <h3 className="font-display font-semibold">Run payroll with AI</h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] max-w-md">
                  The Payroll Run Agent will compute gross-to-net for all{" "}
                  {employeeCount ?? 0} active employees, detect anomalies, generate pay
                  stubs, and queue the run for your approval.
                </p>
              </div>
              <RunPayrollButton employeeCount={employeeCount ?? 0} />
            </div>
          </CardContent>
        </Card>

        {/* Payroll history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payroll history</CardTitle>
          </CardHeader>
          <CardContent>
            {!runs || runs.length === 0 ? (
              <div className="py-10 text-center text-[var(--muted-foreground)] text-sm">
                No payroll runs yet. Click &ldquo;Run payroll with AI&rdquo; above to start.
              </div>
            ) : (
              <div className="space-y-0 rounded-lg border border-[var(--border)] overflow-hidden">
                <div className="grid grid-cols-6 bg-[var(--secondary)] px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  <div className="col-span-2">Period</div>
                  <div>Pay date</div>
                  <div>Employees</div>
                  <div>Total gross</div>
                  <div>Status</div>
                </div>
                {(runs as PayrollRun[]).map((run) => (
                  <div
                    key={run.id}
                    className="grid grid-cols-6 px-4 py-3 border-t border-[var(--border)] hover:bg-[var(--secondary)]/50 transition-colors text-sm items-center"
                  >
                    <div className="col-span-2">
                      <p className="font-medium">{formatDate(run.period_start)} – {formatDate(run.period_end)}</p>
                    </div>
                    <div className="text-[var(--muted-foreground)]">{formatDate(run.pay_date)}</div>
                    <div>{run.employee_count}</div>
                    <div className="font-mono font-medium">{formatCurrency(run.total_gross)}</div>
                    <div className="flex items-center gap-2">
                      <RunStatusBadge status={run.status} />
                      {run.status === "pending_approval" && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/approvals`}>
                            <AlertTriangle className="size-3 text-amber-400" />
                            Review
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "info" | "secondary" }> = {
    draft: { label: "Draft", variant: "secondary" },
    pending_approval: { label: "Pending approval", variant: "warning" },
    approved: { label: "Approved", variant: "success" },
    paid: { label: "Paid", variant: "success" },
    failed: { label: "Failed", variant: "destructive" },
  };
  const config = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
