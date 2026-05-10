"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

function PaymentConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get("runId");
  const employeeId = searchParams.get("employeeId");

  const workspaceHref = useMemo(() => {
    if (!runId) return "/payroll";

    const params = new URLSearchParams();
    params.set("tab", "payments");
    params.set("payment", "completed");
    if (employeeId) params.set("employeeId", employeeId);

    return `/payroll/${runId}?${params.toString()}`;
  }, [employeeId, runId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace(workspaceHref);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [router, workspaceHref]);

  return (
    <main className="ar-vault min-h-dvh flex items-center justify-center px-4 text-zinc-900">
      <section className="w-full max-w-xl border-4 border-zinc-900 bg-white p-8 text-center shadow-[8px_8px_0_0_#18181b]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border-4 border-emerald-900 bg-emerald-100 text-emerald-800">
          <CheckCircle className="h-9 w-9" />
        </div>
        <h1 className="ar-font-display mt-6 text-4xl font-black">
          Payment completed
        </h1>
        <p className="mt-3 text-base font-semibold leading-relaxed text-zinc-600">
          Payroll successfully generated. Returning you to Auto-Roll now.
        </p>
        <div className="mt-7 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-500">
          <Loader2 className="h-4 w-4 spinner text-zinc-900" />
          Redirecting
        </div>
        <Link
          href={workspaceHref}
          className="mt-7 inline-flex h-11 items-center justify-center border-2 border-zinc-900 bg-[#e8ff5a] px-5 text-xs font-black uppercase tracking-wide text-black shadow-[3px_3px_0_0_#18181b] hover:brightness-95"
        >
          Back to payroll
        </Link>
      </section>
    </main>
  );
}

export default function PaymentConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="ar-vault min-h-dvh flex items-center justify-center text-sm font-bold uppercase tracking-wide text-zinc-600">
          Loading confirmation...
        </main>
      }
    >
      <PaymentConfirmedContent />
    </Suspense>
  );
}
