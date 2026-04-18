import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateFull } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { ApprovalActions } from "@/components/payroll/approval-actions";

interface ApprovalRecord {
  id: string;
  summary: string;
  status: string;
  created_at: string;
  details: Record<string, unknown>;
  payroll_run_id?: string | null;
}

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: approvals } = await supabase
    .from("approvals")
    .select("*, agent_runs(*)")
    .order("created_at", { ascending: false })
    .limit(30);

  const typedApprovals = (approvals ?? []) as ApprovalRecord[];
  const pending = typedApprovals.filter((a) => a.status === "pending");
  const resolved = typedApprovals.filter((a) => a.status !== "pending");

  return (
    <div>
      <Topbar
        title="Approvals"
        subtitle={`${pending.length} pending`}
      />
      <div className="p-6 space-y-6">
        {/* Pending */}
        {pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4 text-amber-400" />
                Pending review ({pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  userId={user?.id ?? ""}
                  isPending
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Resolved */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.length === 0 && pending.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No approvals yet. They will appear here when the payroll agent creates a run.
              </div>
            ) : resolved.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No resolved approvals yet.</p>
            ) : (
              resolved.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  userId={user?.id ?? ""}
                  isPending={false}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ApprovalCard({
  approval,
  userId,
  isPending,
}: {
  approval: ApprovalRecord;
  userId: string;
  isPending: boolean;
}) {
  const details = approval.details ?? {};

  return (
    <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 size-8 rounded-lg flex items-center justify-center shrink-0 ${
              isPending
                ? "bg-amber-500/10"
                : approval.status === "approved"
                ? "bg-green-500/10"
                : "bg-red-500/10"
            }`}
          >
            {isPending ? (
              <AlertTriangle className="size-4 text-amber-400" />
            ) : approval.status === "approved" ? (
              <CheckCircle className="size-4 text-green-400" />
            ) : (
              <XCircle className="size-4 text-red-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{approval.summary}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {formatDateFull(approval.created_at)}
            </p>
            {!!details.totalGross && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Total gross:{" "}
                <span className="text-[var(--foreground)] font-mono">
                  {formatCurrency(details.totalGross as number)}
                </span>
                {details.employeeCount != null && ` · ${details.employeeCount as number} employees`}
              </p>
            )}
            {!!details.anomaly && (
              <div className="flex items-center gap-1.5 mt-1.5 text-amber-400 text-xs">
                <AlertTriangle className="size-3" />
                <span>{details.anomalyMessage as string}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isPending && (
            <Badge variant={approval.status === "approved" ? "success" : "destructive"}>
              {approval.status === "approved" ? "Approved" : "Rejected"}
            </Badge>
          )}
          {isPending && (
            <ApprovalActions approvalId={approval.id} userId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}
