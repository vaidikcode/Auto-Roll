import { EmployeePayrollDetail } from "@/components/payroll/employee-payroll-detail";

export default async function EmployeePayrollPage({
  params,
}: {
  params: Promise<{ runId: string; employeeId: string }>;
}) {
  const { runId, employeeId } = await params;
  return <EmployeePayrollDetail runId={runId} employeeId={employeeId} />;
}
