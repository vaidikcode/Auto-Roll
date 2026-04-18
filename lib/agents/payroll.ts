import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { makeDbTools } from "./tools/db";
import { calcTools } from "./tools/calc";
import type { PayrollRun } from "@/lib/supabase/types";

export interface PayrollRunInput {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  requestedBy: string;
}

export interface PayrollRunResult {
  success: boolean;
  payrollRun?: PayrollRun;
  summary?: string;
  anomaly?: boolean;
  anomalyMessage?: string;
  error?: string;
}

export async function runPayrollAgent(input: PayrollRunInput): Promise<PayrollRunResult> {
  const { tenantId, periodStart, periodEnd, payDate } = input;
  const dbTools = makeDbTools(tenantId);

  try {
    const { text, toolCalls } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are Auto-Roll's Payroll Run Agent — an expert payroll processor.
Your job:
1. Fetch all active employees using getEmployees
2. Fetch the last 3 payroll runs for comparison using getPayrollHistory
3. For each employee, call computePayrollTotals to compute their gross-to-net breakdown
4. Call detectAnomaly comparing this run's total to the prior run's total
5. Call createPayrollRun to persist the run (status: pending_approval)
6. Call createLineItems with all computed line items
7. Call logAgentRun to record this run in the audit table
8. Return a JSON summary: { payrollRunId, totalGross, totalNet, employeeCount, anomaly, anomalyMessage, summary }

Pay period: ${periodStart} to ${periodEnd}, pay date: ${payDate}
Use pay_period_divisor=24 (semi-monthly) unless employee is hourly.
Round all currency values to 2 decimal places.
Always complete all steps — do not stop early.`,
      tools: {
        ...dbTools,
        ...calcTools,
      },
      stopWhen: stepCountIs(20),
    });

    const toolCallNames = toolCalls?.map((tc) => tc.toolName) ?? [];
    void toolCallNames;

    let parsed: {
      payrollRunId?: string;
      totalGross?: number;
      totalNet?: number;
      employeeCount?: number;
      anomaly?: boolean;
      anomalyMessage?: string;
      summary?: string;
    } = {};

    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
      }
    } catch {
      // If can't parse, just use the text as summary
    }

    return {
      success: true,
      summary: parsed.summary ?? text,
      anomaly: parsed.anomaly ?? false,
      anomalyMessage: parsed.anomalyMessage,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
