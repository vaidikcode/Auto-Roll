"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type LoadState = "loading" | "paid" | "error";

type LinkInfo = {
  employee_name: string;
  amount: number;
  currency: string;
  status: string;
  run_id: string;
};

export default function DisburseCheckoutPage() {
  const params = useParams();
  const paymentLinkId = params.paymentLinkId as string;
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [info, setInfo] = useState<LinkInfo | null>(null);

  useEffect(() => {
    if (!paymentLinkId) return;

    let cancelled = false;

    async function run() {
      try {
        const getRes = await fetch(`/api/payment-links/${paymentLinkId}`);
        if (!getRes.ok) {
          if (!cancelled) setLoadState("error");
          return;
        }
        const data = (await getRes.json()) as LinkInfo;
        if (cancelled) return;
        setInfo(data);

        if (data.status === "paid") {
          setLoadState("paid");
          return;
        }

        const postRes = await fetch(`/api/payment-links/${paymentLinkId}/complete`, {
          method: "POST",
        });
        if (!postRes.ok) {
          if (!cancelled) setLoadState("error");
          return;
        }
        if (!cancelled) setLoadState("paid");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [paymentLinkId]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-zinc-100">
      <div className="w-full max-w-md border-2 border-zinc-900 bg-white p-8 shadow-[8px_8px_0_0_#18181b]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          Auto-Roll disbursement
        </p>
        <h1 className="ar-font-display text-2xl font-black text-zinc-900 mt-2">
          {loadState === "paid" ? "Payment recorded" : "Disbursement checkout"}
        </h1>

        {loadState === "loading" && info === null && (
          <div className="mt-8 flex items-center gap-3 text-zinc-700">
            <Loader2 className="h-6 w-6 animate-spin shrink-0" />
            <span className="text-sm font-semibold">Loading checkout…</span>
          </div>
        )}

        {loadState === "loading" && info !== null && (
          <div className="mt-8 flex items-center gap-3 text-zinc-700">
            <Loader2 className="h-6 w-6 animate-spin shrink-0" />
            <span className="text-sm font-semibold">
              Recording payment for {info.employee_name} ({formatCurrency(info.amount, info.currency)})…
            </span>
          </div>
        )}

        {loadState === "paid" && info && (
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 border-2 border-emerald-800 bg-emerald-50 p-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-800 shrink-0" />
              <div>
                <p className="font-black text-emerald-950">Paid</p>
                <p className="text-sm text-emerald-900 mt-1">
                  {info.employee_name} ·{" "}
                  <span className="tabular-nums font-bold">
                    {formatCurrency(info.amount, info.currency)}
                  </span>
                </p>
              </div>
            </div>
            <Button
              asChild
              className="w-full rounded-none border-2 border-zinc-900 bg-[#e8ff5a] text-black font-black uppercase text-xs h-11 shadow-[3px_3px_0_0_#18181b] hover:brightness-95"
            >
              <Link href={`/payroll/${info.run_id}?tab=payments`}>Back to payroll</Link>
            </Button>
          </div>
        )}

        {loadState === "error" && (
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 border-2 border-zinc-900 bg-zinc-50 p-4">
              <XCircle className="h-8 w-8 text-zinc-800 shrink-0" />
              <p className="text-sm font-semibold text-zinc-800">
                This payment link is invalid or could not be completed.
              </p>
            </div>
            <Button
              asChild
              variant="secondary"
              className="w-full rounded-none border-2 border-zinc-900 font-black uppercase text-xs"
            >
              <Link href="/payroll">Payroll home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
