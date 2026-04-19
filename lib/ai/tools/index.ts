import { makeCollectEmployeesTool } from "./collect-employees";
import { makeCalculateDomesticPayrollTool } from "./calculate-domestic-payroll";
import { makeFetchFxRateTool } from "./fetch-fx-rate";
import { makeCheckComplianceTool } from "./check-compliance";
import { makeCalculateInternationalPayrollTool } from "./calculate-international-payroll";
import { makeRequestApprovalTool } from "./request-approval";
import { makeCreatePaymentLinkTool } from "./create-payment-link";

export function buildTools(runId: string) {
  return {
    collect_employees: makeCollectEmployeesTool(runId),
    calculate_domestic_payroll: makeCalculateDomesticPayrollTool(runId),
    fetch_fx_rate: makeFetchFxRateTool(runId),
    check_cross_border_compliance: makeCheckComplianceTool(runId),
    calculate_international_payroll: makeCalculateInternationalPayrollTool(runId),
    request_human_approval: makeRequestApprovalTool(runId),
    create_payment_link: makeCreatePaymentLinkTool(runId),
  };
}
