import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { RunComplianceButton } from "@/components/compliance/run-compliance-button";
import { createClient } from "@/lib/supabase/server";

export default async function CompliancePage() {
  const supabase = await createClient();

  const { data: latestRun } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("agent", "compliance")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const output = latestRun?.output as {
    issues?: string[];
    recommendations?: string[];
    summary?: string;
  } | null;

  return (
    <div>
      <Topbar title="Compliance" subtitle="AI-powered compliance monitoring" />
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--muted-foreground)] max-w-lg">
              The Compliance Agent scans your workforce and payroll history for filing
              deadlines, missing tax IDs, and jurisdiction rule changes.
            </p>
          </div>
          <RunComplianceButton />
        </div>

        {output ? (
          <div className="space-y-5">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="size-4 text-green-400" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">{output.summary}</p>
              </CardContent>
            </Card>

            {/* Issues */}
            {output.issues && output.issues.length > 0 && (
              <Card className="border-red-800/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="size-4 text-red-400" />
                    Issues ({output.issues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {output.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="size-4 rounded-full bg-red-900/30 text-red-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                          {i + 1}
                        </span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {output.recommendations && output.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="size-4 text-green-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {output.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="size-4 rounded-full bg-green-900/30 text-green-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                          {i + 1}
                        </span>
                        <span className="text-[var(--muted-foreground)]">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
              <div className="size-12 rounded-xl bg-[var(--secondary)] flex items-center justify-center">
                <RefreshCw className="size-5 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="font-display font-semibold">No compliance scan yet</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 max-w-sm">
                  Run the Compliance Agent to check for filing deadlines, missing tax IDs, and jurisdiction issues.
                </p>
              </div>
              <RunComplianceButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
