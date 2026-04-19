import { tool } from "ai";
import { z } from "zod";
import { agentProcessingDelay } from "@/lib/ai/agent-processing-delay";
import { jsonSafe } from "@/lib/ai/json-safe";
import { getAdminClient } from "@/lib/db/client";
import type { Employee, ActionableStep, ComplianceSource } from "@/lib/db/types";

interface TavilySearchResponse {
  results?: Array<{ title: string; url: string; content: string }>;
  answer?: string;
}

function stepsFromAnswer(answer: string, sources: ComplianceSource[]): ActionableStep[] {
  const lines = answer
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 24);

  const out: ActionableStep[] = [];
  let i = 0;
  for (const line of lines.slice(0, 8)) {
    const lower = line.toLowerCase();
    const priority: ActionableStep["priority"] =
      lower.includes("must") || lower.includes("required") || lower.includes("mandatory")
        ? "high"
        : lower.includes("should") || lower.includes("recommend")
          ? "medium"
          : "low";
    out.push({
      id: `tv-${i++}`,
      description: line.slice(0, 320),
      priority,
      category: "regulatory",
    });
  }

  if (out.length === 0 && sources.length > 0) {
    sources.slice(0, 5).forEach((s, j) => {
      out.push({
        id: `src-${j}`,
        description: `Review official guidance: ${s.title}`.slice(0, 320),
        priority: "medium",
        category: "regulatory",
      });
    });
  }

  return out.slice(0, 10);
}

function inferStatus(
  answer: string,
  amountUsd: number,
  sourcesCount: number
): "clear" | "flagged" {
  const a = answer.toLowerCase();
  const risky =
    a.includes("aml") ||
    a.includes("reporting obligation") ||
    a.includes("tax withholding") ||
    a.includes("prohibited") ||
    a.includes("restriction") ||
    a.includes("penalt") ||
    amountUsd > 95_000;
  if (risky) return "flagged";
  if (sourcesCount === 0) return "flagged";
  return "clear";
}

async function runTavilyComplianceSearch(
  country: string,
  employeeName: string,
  amountUsd: number
): Promise<{ answer: string; sources: ComplianceSource[] }> {
  const tavilyKey = process.env.TAVILY_API_KEY?.trim();
  if (!tavilyKey) {
    throw new Error(
      "TAVILY_API_KEY is not set. Add a Tavily API key so cross-border checks use live web search (see https://tavily.com)."
    );
  }

  const query = [
    `${country} employer paying remote worker or contractor in ${country}`,
    `USD ${Math.round(amountUsd)} annual equivalent payroll wire transfer`,
    "tax withholding reporting AML cross-border 2025 2026 official guidance",
  ].join(". ");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: tavilyKey,
      query,
      max_results: 8,
      search_depth: "advanced",
      include_answer: "advanced",
      topic: "finance",
    }),
  });

  const text = await response.text();
  let data: TavilySearchResponse;
  try {
    data = text ? (JSON.parse(text) as TavilySearchResponse) : {};
  } catch {
    throw new Error(`Tavily returned non-JSON (${response.status}): ${text.slice(0, 400)}`);
  }

  if (!response.ok) {
    throw new Error(`Tavily API error ${response.status}: ${text.slice(0, 500)}`);
  }

  const sources: ComplianceSource[] = (data.results ?? []).map((r) => ({
    title: r.title || "Source",
    url: r.url || "",
    snippet: (r.content ?? "").slice(0, 280),
  }));

  const answer =
    (typeof data.answer === "string" && data.answer.trim()) ||
    (sources.length > 0
      ? `Summary for ${employeeName} (${country}): based on recent sources, review remittance, tax residency, and employer reporting obligations before paying. Key references are linked below. Consult a qualified payroll or tax advisor for your situation.`
      : "");

  if (!answer && sources.length === 0) {
    throw new Error(
      "Tavily returned no results and no answer for this query. Try again or narrow the employee context."
    );
  }

  return { answer: answer || "", sources };
}

export function makeCheckComplianceTool(runId: string) {
  return tool({
    description:
      "Check cross-border payment compliance for an international employee using live web search (Tavily). Persists summary, sources, and suggested follow-ups. Not legal advice.",
    inputSchema: z.object({
      employee_id: z.string().describe("UUID of the employee"),
      amount_usd: z.number().describe("Annual USD amount to be paid"),
    }),
    execute: async ({ employee_id, amount_usd }: { employee_id: string; amount_usd: number }) => {
      await agentProcessingDelay();
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

      if (emp.employment_type === "domestic") {
        const summary =
          "This person is on U.S. payroll. Cross-border inbound rules do not apply the same way; use your normal U.S. withholding and state rules.";
        const { data: report, error: reportErr } = await db
          .from("compliance_reports")
          .insert({
            run_id: runId,
            employee_id,
            country,
            summary,
            sources: [],
            actionable_steps: [
              {
                id: "us-1",
                description: "Confirm state unemployment and disability filings for their work state.",
                priority: "medium",
                category: "tax",
              },
            ],
            status: "clear",
          })
          .select()
          .single();

        if (reportErr) throw new Error(`Failed to save compliance report: ${reportErr.message}`);

        await db.from("tool_events").insert({
          run_id: runId,
          tool_name: "check_cross_border_compliance",
          args: { employee_id, amount_usd },
          result: { status: "clear", steps_count: 1, note: "domestic" },
          duration_ms: Date.now() - start,
        });

        return jsonSafe({
          employee_name: emp.name,
          country,
          summary,
          status: "clear" as const,
          sources: [] as ComplianceSource[],
          actionable_steps: report?.actionable_steps ?? [],
          report_id: report?.id,
        });
      }

      const { answer, sources } = await runTavilyComplianceSearch(country, emp.name, amount_usd);
      const actionableSteps = stepsFromAnswer(answer, sources);
      const status = inferStatus(answer, amount_usd, sources.length);

      const { data: report, error: reportErr } = await db
        .from("compliance_reports")
        .insert({
          run_id: runId,
          employee_id,
          country,
          summary: answer.slice(0, 4000),
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
        result: { status, steps_count: actionableSteps.length, sources: sources.length },
        duration_ms: Date.now() - start,
      });

      return jsonSafe({
        employee_name: emp.name,
        country,
        summary: answer.slice(0, 4000),
        status,
        sources,
        actionable_steps: actionableSteps,
        report_id: report?.id,
      });
    },
  });
}
