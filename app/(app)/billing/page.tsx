import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, ExternalLink, Zap } from "lucide-react";
import { BAG_PLANS } from "@/lib/bag/client";
import { SubscribeButton } from "@/components/billing/subscribe-button";

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const currentPlan = subscription?.plan;

  return (
    <div>
      <Topbar title="Billing" subtitle="Subscription and payment history" />
      <div className="p-6 space-y-6">
        {/* Current plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4 text-amber-400" />
              Current plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-xl">
                      {BAG_PLANS[currentPlan as keyof typeof BAG_PLANS]?.name ?? currentPlan}
                    </span>
                    <Badge
                      variant={
                        subscription.status === "active"
                          ? "success"
                          : subscription.status === "past_due"
                          ? "warning"
                          : "destructive"
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    ${BAG_PLANS[currentPlan as keyof typeof BAG_PLANS]?.priceUsd ?? "—"}/month
                  </p>
                  {subscription.current_period_end && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Renews {formatDate(subscription.current_period_end)}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://getbags.app" target="_blank" rel="noopener noreferrer">
                    Manage in Bag <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  No active subscription. Choose a plan to unlock payroll automation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(Object.entries(BAG_PLANS) as [string, (typeof BAG_PLANS)[keyof typeof BAG_PLANS]][]).map(
                    ([key, plan]) => (
                      <div
                        key={key}
                        className={`rounded-lg border p-4 ${
                          key === "growth"
                            ? "border-amber-500/40 bg-amber-500/5"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-semibold">{plan.name}</span>
                          {key === "growth" && (
                            <Badge variant="warning" className="text-xs">Popular</Badge>
                          )}
                        </div>
                        <p className="font-mono text-lg font-bold mb-1">
                          ${plan.priceUsd}<span className="text-xs font-normal text-[var(--muted-foreground)]">/mo</span>
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] mb-3">{plan.description}</p>
                        <SubscribeButton plan={key as "starter" | "growth" | "enterprise"} />
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Powered by Bag notice */}
        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <Zap className="size-4 text-amber-400 shrink-0" />
          <p className="text-sm text-[var(--muted-foreground)]">
            Billing is powered by{" "}
            <a href="https://getbags.app" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
              Bag
            </a>{" "}
            — Merchant of Record in 100+ countries. We accept USDC and card payments globally.
            Tax collection and compliance are fully managed.
          </p>
        </div>

        {/* Invoice history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice history</CardTitle>
          </CardHeader>
          <CardContent>
            {!invoices || invoices.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                No invoices yet.
              </p>
            ) : (
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--secondary)] border-b border-[var(--border)]">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Description</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-t border-[var(--border)] hover:bg-[var(--secondary)]/50">
                        <td className="px-4 py-3">{formatDate(inv.created_at)}</td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">{inv.description ?? "Subscription"}</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(inv.amount_usd ?? 0)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={inv.status === "paid" ? "success" : "warning"}>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
