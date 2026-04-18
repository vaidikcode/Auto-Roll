"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ApprovalActionsProps {
  approvalId: string;
  userId: string;
}

export function ApprovalActions({ approvalId, userId }: ApprovalActionsProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handle = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      const { error } = await supabase
        .from("approvals")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", approvalId);

      if (!error && action === "approve") {
        // Also update the linked payroll run
        const { data: approval } = await supabase
          .from("approvals")
          .select("payroll_run_id")
          .eq("id", approvalId)
          .single();

        if (approval?.payroll_run_id) {
          await supabase
            .from("payroll_runs")
            .update({ status: "approved", approved_by: userId, approved_at: new Date().toISOString() })
            .eq("id", approval.payroll_run_id);
        }
      }

      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-red-800/50 text-red-400 hover:bg-red-900/20"
        onClick={() => handle("reject")}
        disabled={!!loading}
      >
        {loading === "reject" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <XCircle className="size-3.5" />
        )}
        Reject
      </Button>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-500 text-white"
        onClick={() => handle("approve")}
        disabled={!!loading}
      >
        {loading === "approve" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <CheckCircle className="size-3.5" />
        )}
        Approve
      </Button>
    </div>
  );
}
