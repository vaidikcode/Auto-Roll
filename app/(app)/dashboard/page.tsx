import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch summary data
  const [
    { count: employeeCount },
    { data: recentRuns },
    { data: pendingApprovals },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("payroll_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("approvals")
      .select("*")
      .eq("status", "pending")
      .limit(10),
  ]);

  const totalPayroll = recentRuns?.reduce((sum, r) => sum + (r.total_gross || 0), 0) ?? 0;
  const lastRun = recentRuns?.[0];

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle={`Welcome back, ${user?.email?.split("@")[0] ?? "there"}`}
      />

      <div className="p-6 space-y-6">
        {/* Pending approvals banner */}
        {(pendingApprovals?.length ?? 0) > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="size-4" />
              <span className="text-sm font-medium">
                {pendingApprovals!.length} payroll{" "}
                {pendingApprovals!.length === 1 ? "run" : "runs"} pending approval
              </span>
            </div>
            <Link href="/approvals">
              <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                Review <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Active employees
                  </p>
                  <p className="font-display font-bold text-3xl">
                    {employeeCount ?? 0}
                  </p>
                </div>
                <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="size-4 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Last payroll
                  </p>
                  <p className="font-display font-bold text-3xl">
                    {lastRun ? formatCurrency(lastRun.total_gross) : "—"}
                  </p>
                </div>
                <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="size-4 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    YTD payroll
                  </p>
                  <p className="font-display font-bold text-3xl">
                    {formatCurrency(totalPayroll)}
                  </p>
                </div>
                <div className="size-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="size-4 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Pending approvals
                  </p>
                  <p className="font-display font-bold text-3xl">
                    {pendingApprovals?.length ?? 0}
                  </p>
                </div>
                <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="size-4 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent payroll runs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Recent payroll runs
                <Link href="/payroll">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!recentRuns || recentRuns.length === 0 ? (
                <div className="py-8 text-center text-[var(--muted-foreground)] text-sm">
                  No payroll runs yet.{" "}
                  <Link href="/payroll" className="text-[var(--primary)] hover:underline">
                    Run your first payroll →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(run.period_start)} – {formatDate(run.period_end)}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {run.employee_count} employees · Pay date {formatDate(run.pay_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">
                          {formatCurrency(run.total_gross)}
                        </span>
                        <StatusBadge status={run.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Run payroll", href: "/payroll", icon: DollarSign, color: "text-amber-400 bg-amber-500/10" },
                  { label: "Add employee", href: "/employees", icon: Users, color: "text-blue-400 bg-blue-500/10" },
                  { label: "Review approvals", href: "/approvals", icon: CheckCircle, color: "text-green-400 bg-green-500/10" },
                  { label: "Ask assistant", href: "/chat", icon: AlertTriangle, color: "text-purple-400 bg-purple-500/10" },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link key={label} href={href}>
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--secondary)] transition-colors cursor-pointer">
                      <div className={`size-8 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "info" | "secondary" }> = {
    draft: { label: "Draft", variant: "secondary" },
    pending_approval: { label: "Pending", variant: "warning" },
    approved: { label: "Approved", variant: "success" },
    paid: { label: "Paid", variant: "success" },
    failed: { label: "Failed", variant: "destructive" },
  };
  const config = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
