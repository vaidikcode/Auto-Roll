import { makeGetUsageReportTool } from "./get-usage-report";
import { makeCalculateBillTool } from "./calculate-bill";
import { makeGetPricingTableTool } from "./get-pricing-table";

export function buildBillingTools() {
  return {
    get_usage_report:  makeGetUsageReportTool(),
    calculate_bill:    makeCalculateBillTool(),
    get_pricing_table: makeGetPricingTableTool(),
  };
}
