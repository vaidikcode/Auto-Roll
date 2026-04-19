import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { getAdminClient } from "@/lib/db/client";
import type { EmploymentType } from "@/lib/db/types";

/** Map common column name aliases to canonical field names. */
const ALIAS: Record<string, string> = {
  // name
  full_name: "name", fullname: "name", employee_name: "name",
  // email
  email_address: "email", work_email: "email",
  // country
  country_code: "country",
  // currency
  currency_code: "currency",
  // salary
  annual_salary: "base_salary_usd", salary: "base_salary_usd", salary_usd: "base_salary_usd",
  annual_base: "base_salary_usd", base_salary: "base_salary_usd",
  // type
  type: "employment_type", emp_type: "employment_type", worker_type: "employment_type",
  // state
  state: "state", province: "state",
  // department / title (go to metadata)
  department: "department", dept: "department",
  title: "title", job_title: "title",
};

function normalise(key: string): string {
  const k = key.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  return ALIAS[k] ?? k;
}

function currency(country: string): string {
  const map: Record<string, string> = {
    US: "USD", CA: "CAD", GB: "GBP", IN: "INR", DE: "EUR", FR: "EUR",
    AU: "AUD", BR: "BRL", NG: "NGN", JP: "JPY", SG: "SGD",
  };
  return map[country?.toUpperCase()] ?? "USD";
}

type RawRow = Record<string, string | number | null | undefined>;

function rowToEmployee(raw: RawRow, runId: string, idx: number) {
  const r: Record<string, string | number | null | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    r[normalise(k)] = v;
  }

  const name = String(r.name ?? "").trim();
  const email = String(r.email ?? "").trim().toLowerCase();
  if (!name || !email) return null; // skip empty rows

  const country = String(r.country ?? "US").trim().toUpperCase();
  const empType: EmploymentType = String(r.employment_type ?? "")
    .toLowerCase()
    .includes("intl") ||
    String(r.employment_type ?? "")
      .toLowerCase()
      .includes("international") ||
    (country !== "US" && !["PR", "VI", "GU"].includes(country))
    ? "international"
    : "domestic";

  const salary = parseFloat(String(r.base_salary_usd ?? r.annual_salary ?? 60000)) || 60000;

  return {
    run_id: runId,
    name,
    email,
    country,
    currency: String(r.currency ?? currency(country)).trim().toUpperCase(),
    base_salary_usd: salary,
    employment_type: empType,
    tax_locale: r.state ? { state: String(r.state).trim().toUpperCase() } : {},
    dependents: parseInt(String(r.dependents ?? 0)) || 0,
    benefits: { healthcare_plan: "basic" as const, healthcare_monthly_deduction: 150 },
    retirement_match_pct: parseFloat(String(r.retirement_pct ?? 0)) || 0,
    payout_destination: { type: "wire" as const },
    source: `Upload #${idx + 1}`,
    metadata: {
      department: String(r.department ?? "").trim() || undefined,
      title: String(r.title ?? "").trim() || undefined,
    },
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const name = file.name.toLowerCase();
  let rows: RawRow[] = [];

  if (name.endsWith(".csv") || file.type === "text/csv") {
    const text = new TextDecoder().decode(bytes);
    const parsed = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
    rows = parsed.data;
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".ods")) {
    const wb = XLSX.read(bytes, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null });
  } else {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a .csv, .xlsx, or .xls file." },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "File is empty or has no data rows." }, { status: 400 });
  }

  const employees = rows
    .map((r, i) => rowToEmployee(r, runId, i))
    .filter(Boolean);

  if (employees.length === 0) {
    return NextResponse.json(
      { error: "No valid employees found. Ensure rows have at least a name and email column." },
      { status: 400 }
    );
  }

  const db = getAdminClient();
  const { data: inserted, error } = await db
    .from("employees")
    .insert(employees)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: inserted?.length ?? 0,
    skipped: rows.length - employees.length,
    employees: inserted,
  });
}
