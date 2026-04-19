import { Suspense } from "react";
import { PayrollWorkspace } from "@/components/payroll/payroll-workspace";

export default async function PayrollRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return (
    <Suspense
      fallback={
        <div className="ar-vault min-h-dvh flex items-center justify-center text-sm font-bold uppercase tracking-wide text-zinc-600">
          Loading workspace…
        </div>
      }
    >
      <PayrollWorkspace runId={runId} />
    </Suspense>
  );
}
