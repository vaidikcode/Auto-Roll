import { tool } from "ai";
import { z } from "zod";
import { jsonSafe } from "@/lib/ai/json-safe";
import { getAdminClient } from "@/lib/db/client";
import type { Employee, ActionableStep, ComplianceSource } from "@/lib/db/types";

const COMPLIANCE_FALLBACK: Record<string, {
  summary: string;
  sources: ComplianceSource[];
  actionable_steps: ActionableStep[];
  status: "clear" | "flagged";
}> = {
  IN: {
    summary: "India's FEMA governs inbound cross-border transfers. Individuals can receive up to USD 250,000 per year under the Liberalised Remittance Scheme. Transfers above $10,000 must be reported to RBI via AD banks. Contractors should obtain a FIRC for tax documentation.",
    sources: [
      { title: "RBI FEMA Guidelines 2024", url: "https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12189", snippet: "LRS limit USD 250,000 per FY" },
      { title: "CBDT Remittance Reporting", url: "https://incometaxindia.gov.in", snippet: "Form 15CA/CB required for certain payments" },
    ],
    actionable_steps: [
      { id: "in-1", description: "Obtain FIRC from AD bank within 30 days of receipt", priority: "high", category: "documentation" },
      { id: "in-2", description: "Verify annual total stays below USD 250,000 LRS ceiling", priority: "high", category: "limit" },
      { id: "in-3", description: "File Form 15CA/CB if payment exceeds ₹5 lakh per quarter", priority: "medium", category: "reporting" },
      { id: "in-4", description: "Maintain TRC for DTAA benefit claims", priority: "low", category: "tax" },
    ],
    status: "clear",
  },
  DE: {
    summary: "Germany/EU imposes no general limits on inbound USD transfers. Transfers above €10,000 require AML reporting under the 6th EU AML Directive. Employers must withhold German income tax at source for German tax residents.",
    sources: [
      { title: "EU AML 6th Directive", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018L1673", snippet: "Transactions ≥€10,000 subject to enhanced due diligence" },
      { title: "BaFin Cross-Border Guide", url: "https://bafin.de", snippet: "No FX controls for OECD member states" },
    ],
    actionable_steps: [
      { id: "de-1", description: "File AML report for transfers ≥ €10,000 equivalent", priority: "medium", category: "regulatory" },
      { id: "de-2", description: "Confirm worker tax residency status with local tax advisor", priority: "medium", category: "tax" },
      { id: "de-3", description: "Retain SWIFT/SEPA confirmation receipts for 10 years", priority: "low", category: "documentation" },
    ],
    status: "clear",
  },
  BR: {
    summary: "Brazil's Central Bank (BCB) regulates all cross-border transfers under Resolution 4,963. USD payments must flow through BCB-registered institutions. Annual remittance reporting (DCBE) is required for amounts above BRL 300,000.",
    sources: [
      { title: "BCB Resolution 4,963", url: "https://www.bcb.gov.br/estabilidadefinanceira/capitaisestrangeiros", snippet: "All FX transactions must use authorized BCB institutions" },
      { title: "Receita Federal Remittance Rules", url: "https://receita.fazenda.gov.br", snippet: "DCBE filing mandatory above BRL 300k" },
    ],
    actionable_steps: [
      { id: "br-1", description: "Use BCB-authorized financial institution for FX conversion", priority: "high", category: "regulatory" },
      { id: "br-2", description: "File DCBE declaration if annual amount exceeds BRL 300,000", priority: "high", category: "reporting" },
      { id: "br-3", description: "Attach IOF (tax on FX) receipts to payroll records", priority: "medium", category: "tax" },
    ],
    status: "clear",
  },
  NG: {
    summary: "Nigeria's CBN regulates forex through the I&E Window. Inbound transfers above USD 10,000 require BVN verification. Annual inbound limit for individuals is ~USD 100,000. Contractors must use CBN-compliant domiciliary accounts.",
    sources: [
      { title: "CBN FX Manual 2024", url: "https://cbn.gov.ng/forex/fxmanual.asp", snippet: "FX receipts must be sold or retained in domiciliary account" },
      { title: "FIRS Tax Treaty Guide", url: "https://firs.gov.ng", snippet: "Non-resident contractor income subject to 10% WHT" },
    ],
    actionable_steps: [
      { id: "ng-1", description: "Ensure recipient has a CBN-compliant domiciliary account", priority: "high", category: "regulatory" },
      { id: "ng-2", description: "Withhold 10% tax on non-resident contractor fees per FIRS rules", priority: "high", category: "tax" },
      { id: "ng-3", description: "Obtain BVN verification for transfers above USD 10,000", priority: "medium", category: "documentation" },
      { id: "ng-4", description: "Keep annual total below USD 100,000 individual limit", priority: "medium", category: "limit" },
    ],
    status: "flagged",
  },
  GB: {
    summary: "UK has no restrictions on inbound foreign currency transfers. HMRC requires correct PAYE treatment for UK resident employees. Without a UK entity, employers may need to register as non-resident employers or use an EOR.",
    sources: [
      { title: "HMRC Non-Resident Employer Guidance", url: "https://gov.uk/hmrc/non-resident-employer", snippet: "PAYE obligations apply to UK residents regardless of employer location" },
      { title: "FCA AML Requirements", url: "https://fca.org.uk", snippet: "Transactions ≥£10,000 require enhanced CDD" },
    ],
    actionable_steps: [
      { id: "gb-1", description: "Register as non-resident employer with HMRC or use UK EOR", priority: "high", category: "regulatory" },
      { id: "gb-2", description: "Apply correct PAYE/NIC bands for UK tax year", priority: "high", category: "tax" },
      { id: "gb-3", description: "Complete AML enhanced due diligence for transfers ≥ £10,000", priority: "medium", category: "regulatory" },
    ],
    status: "clear",
  },
  PH: {
    summary: "BSP (Bangko Sentral ng Pilipinas) governs inbound FX under BSP Circular 1049. Annual individual receipt threshold for simplified reporting is USD 50,000. Contractors must file BIR Form 1901.",
    sources: [
      { title: "BSP Circular 1049", url: "https://bsp.gov.ph/regulations/", snippet: "Inbound remittances exceeding USD 50k require enhanced documentation" },
      { title: "BIR Self-Employment Income", url: "https://bir.gov.ph", snippet: "Form 1901 required for freelancer/contractor income registration" },
    ],
    actionable_steps: [
      { id: "ph-1", description: "Channel transfers through BSP-authorized bank or remittance provider", priority: "high", category: "regulatory" },
      { id: "ph-2", description: "Advise employee to file BIR Form 1901 if not yet registered", priority: "medium", category: "tax" },
      { id: "ph-3", description: "Limit annual transfers to USD 50,000 for simplified BSP reporting", priority: "medium", category: "limit" },
    ],
    status: "clear",
  },
};

export function makeCheckComplianceTool(runId: string) {
  return tool({
    description:
      "Check cross-border payment compliance for an international employee. Searches Tavily for the latest regulations, then generates a structured summary with actionable steps. Results are persisted to the database.",
    inputSchema: z.object({
      employee_id: z.string().describe("UUID of the employee"),
      amount_usd: z.number().describe("Annual USD amount to be paid"),
    }),
    execute: async ({ employee_id, amount_usd }: { employee_id: string; amount_usd: number }) => {
      const db = getAdminClient();
      const start = Date.now();

      const { data: employee, error: empErr } = await db
        .from("employees")
        .select("*")
        .eq("id", employee_id)
        .eq("run_id", runId)
        .single();

      if (empErr || !employee) throw new Error(`Employee not found: ${empErr?.message}`);

      const emp = employee as Employee;
      const country = emp.country;

      let sources: ComplianceSource[] = [];
      let actionableSteps: ActionableStep[] = [];
      let summary = "";
      let status: "clear" | "flagged" = "clear";

      const tavilyKey = process.env.TAVILY_API_KEY;
      if (tavilyKey) {
        try {
          const query = `${country} inbound wire transfer compliance regulations USD payroll 2025 2026`;
          const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: tavilyKey,
              query,
              max_results: 5,
              search_depth: "basic",
            }),
          });
          const data = await response.json();
          if (data.results?.length > 0) {
            sources = data.results.map((r: { title: string; url: string; content: string }) => ({
              title: r.title,
              url: r.url,
              snippet: r.content?.slice(0, 200) ?? "",
            }));
          }
        } catch {
          // Fall through to static data
        }
      }

      const fallback = COMPLIANCE_FALLBACK[country];
      if (fallback) {
        summary = fallback.summary;
        actionableSteps = fallback.actionable_steps;
        status = fallback.status;
        if (sources.length === 0) sources = fallback.sources;
      } else {
        summary = `No specific compliance data found for ${country}. Consult a local legal advisor.`;
        actionableSteps = [
          { id: "gen-1", description: "Consult a local legal or payroll advisor in the destination country", priority: "high", category: "regulatory" },
          { id: "gen-2", description: "Verify banking channels are authorized for cross-border FX", priority: "high", category: "regulatory" },
        ];
      }

      if (amount_usd > 90000) status = "flagged";

      const { data: report, error: reportErr } = await db
        .from("compliance_reports")
        .insert({
          run_id: runId,
          employee_id,
          country,
          summary,
          sources,
          actionable_steps: actionableSteps,
          status,
        })
        .select()
        .single();

      if (reportErr) throw new Error(`Failed to save compliance report: ${reportErr.message}`);

      await db.from("tool_events").insert({
        run_id: runId,
        tool_name: "check_cross_border_compliance",
        args: { employee_id, amount_usd },
        result: { status, steps_count: actionableSteps.length },
        duration_ms: Date.now() - start,
      });

      return jsonSafe({
        employee_name: emp.name,
        country,
        summary,
        status,
        sources,
        actionable_steps: actionableSteps,
        report_id: report?.id,
      });
    },
  });
}
