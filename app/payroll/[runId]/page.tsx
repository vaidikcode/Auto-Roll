import { PayrollWorkspace } from "@/components/payroll/payroll-workspace";

export default async function PayrollRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  return <PayrollWorkspace runId={runId} />;
}
