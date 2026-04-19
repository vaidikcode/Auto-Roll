"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRunSnapshot } from "@/hooks/use-run-snapshot";
import { formatCurrency, countryFlag } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Wallet,
  Shield,
  Calculator,
  Link2,
  ExternalLink,
} from "lucide-react";

function VaultShell({ children }: { children: ReactNode }) {
  return (
    <div className="ar-vault min-h-dvh flex flex-col overflow-y-auto">
      <div className="ar-vault-main flex-1">{children}</div>
    </div>
  );
}

export function EmployeePayrollDetail({
  runId,
  employeeId,
}: {
  runId: string;
  employeeId: string;
}) {
  const { snapshot, loading } = useRunSnapshot(runId, 2500);
  const emp = snapshot?.employees.find((e) => e.id === employeeId);
  const item = snapshot?.payroll_items.find((i) => i.employee_id === employeeId);
  const compliance = snapshot?.compliance_reports.find((c) => c.employee_id === employeeId);
  const payLink = snapshot?.payment_links.find((l) => l.employee_id === employeeId);

  if (loading && !snapshot) {
    return (
      <VaultShell>
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48 bg-zinc-200 border-2 border-zinc-300" />
          <Skeleton className="h-40 w-full rounded-none bg-zinc-200 border-2 border-zinc-300" />
        </div>
      </VaultShell>
    );
  }

  if (!emp) {
    return (
      <VaultShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <p className="text-zinc-600 mb-4">We couldn’t find this person on this payroll run.</p>
          <Button
            asChild
            variant="secondary"
            className="rounded-none border-2 border-zinc-900 bg-white text-zinc-900 font-black uppercase text-xs hover:bg-zinc-100 shadow-[3px_3px_0_0_#18181b]"
          >
            <Link href={`/payroll/${runId}?tab=roster`}>Back to roster</Link>
          </Button>
        </div>
      </VaultShell>
    );
  }

  const payout = emp.payout_destination;

  return (
    <VaultShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 -ml-2 text-zinc-600 hover:text-zinc-900 rounded-none"
        >
          <Link href={`/payroll/${runId}?tab=roster`}>
            <ArrowLeft size={14} />
            Back to roster
          </Link>
        </Button>

        <header className="border-2 border-zinc-900 bg-white p-6 sm:p-8 shadow-[5px_5px_0_0_#18181b] flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="h-20 w-20 border-2 border-zinc-900 bg-[#e8ff5a] flex items-center justify-center text-5xl shrink-0">
            {countryFlag(emp.country)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="ar-font-display text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
              {emp.name}
            </h1>
            <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
              {emp.employment_type === "domestic"
                ? "Paid on U.S. payroll with standard tax withholding."
                : "Paid outside the U.S. · pay is converted with the period’s exchange rate."}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="font-bold rounded-none border-2 border-zinc-300 bg-zinc-100 text-zinc-800">
                Listed in {emp.source}
              </Badge>
              <Badge variant="outline" className="font-bold rounded-none border-2 border-zinc-900 text-zinc-900">
                Pay currency: {emp.currency}
              </Badge>
            </div>
          </div>
        </header>

        <section className="border-2 border-zinc-900 bg-white p-6 space-y-3 shadow-[5px_5px_0_0_#18181b]">
          <h2 className="text-sm font-black flex items-center gap-2.5 text-zinc-900 uppercase tracking-wide">
            <span className="h-7 w-7 border-2 border-zinc-900 bg-zinc-900 flex items-center justify-center text-[#e8ff5a]">
              <Mail size={13} />
            </span>
            Contact
          </h2>
          <p className="text-sm text-zinc-700">{emp.email}</p>
        </section>

        <section className="border-2 border-zinc-900 bg-white p-6 space-y-4 shadow-[5px_5px_0_0_#18181b]">
          <h2 className="text-sm font-black flex items-center gap-2.5 text-zinc-900 uppercase tracking-wide">
            <span className="h-7 w-7 border-2 border-zinc-900 bg-zinc-900 flex items-center justify-center text-[#e8ff5a]">
              <MapPin size={13} />
            </span>
            Location & tax details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="border-2 border-zinc-200 bg-zinc-50 px-4 py-3">
              <dt className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.14em]">
                Country
              </dt>
              <dd className="font-black mt-0.5 text-zinc-900">{emp.country}</dd>
            </div>
            {emp.tax_locale?.state && (
              <div className="border-2 border-zinc-200 bg-zinc-50 px-4 py-3">
                <dt className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.14em]">
                  State (U.S.)
                </dt>
                <dd className="font-black mt-0.5 text-zinc-900">{emp.tax_locale.state}</dd>
              </div>
            )}
            <div className="border-2 border-zinc-200 bg-zinc-50 px-4 py-3">
              <dt className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.14em]">
                Dependents listed
              </dt>
              <dd className="font-black mt-0.5 text-zinc-900">{emp.dependents}</dd>
            </div>
          </dl>
        </section>

        <section className="border-2 border-zinc-900 bg-white p-6 space-y-3 shadow-[5px_5px_0_0_#18181b]">
          <h2 className="text-sm font-black flex items-center gap-2.5 text-zinc-900 uppercase tracking-wide">
            <span className="h-7 w-7 border-2 border-zinc-900 bg-zinc-900 flex items-center justify-center text-[#e8ff5a]">
              <Wallet size={13} />
            </span>
            How they get paid
          </h2>
          <p className="text-sm text-zinc-600">
            {payout.type === "ach"
              ? "Direct deposit to a U.S. bank account."
              : "International wire to their bank on file."}
          </p>
          <p className="text-sm text-zinc-900 font-black">
            {payout.bank_name} · ending in{" "}
            <span className="font-mono tabular-nums text-emerald-800">{payout.last4}</span>
          </p>
        </section>

        <section className="border-2 border-zinc-900 bg-white p-6 space-y-4 shadow-[5px_5px_0_0_#18181b]">
          <h2 className="text-sm font-black flex items-center gap-2.5 text-zinc-900 uppercase tracking-wide">
            <span className="h-7 w-7 border-2 border-zinc-900 bg-zinc-900 flex items-center justify-center text-[#e8ff5a]">
              <Calculator size={13} />
            </span>
            This period’s pay
          </h2>
          {!item ? (
            <p className="text-sm text-zinc-500">
              Numbers will show here after gross-to-net completes for this person.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-zinc-900 bg-[#e8ff5a] px-5 py-4 flex items-end justify-between text-black shadow-[4px_4px_0_0_#18181b]">
                <span className="text-xs uppercase tracking-[0.14em] font-black">Take-home (USD)</span>
                <span className="text-2xl font-black tabular-nums">{formatCurrency(item.net_usd)}</span>
              </div>
              <div className="text-xs text-zinc-500 space-y-2 pt-1 px-1">
                <Row label="Gross" value={formatCurrency(item.gross)} />
                <Row label="Federal tax" value={formatCurrency(item.federal_tax)} />
                <Row label="State / local" value={formatCurrency(item.state_tax)} />
                <Row label="Social Security & Medicare" value={formatCurrency(item.fica)} />
                <Row label="Health plan" value={formatCurrency(item.healthcare)} />
                <Row label="Retirement (employee)" value={formatCurrency(item.retirement)} />
              </div>
            </div>
          )}
        </section>

        <section className="border-2 border-zinc-900 bg-white p-6 space-y-4 shadow-[5px_5px_0_0_#18181b]">
          <h2 className="text-sm font-black flex items-center gap-2.5 text-zinc-900 uppercase tracking-wide">
            <span className="h-7 w-7 border-2 border-zinc-900 bg-zinc-900 flex items-center justify-center text-[#e8ff5a]">
              <Shield size={13} />
            </span>
            Rules & reminders
            <span className="text-[10px] font-bold text-zinc-500 ml-1 normal-case">not legal advice</span>
          </h2>
          {!compliance ? (
            <p className="text-sm text-zinc-600">
              {emp.employment_type === "domestic"
                ? "No separate cross-border checklist was run for this U.S. role."
                : "A short summary from trusted public sources will appear here when ready."}
            </p>
          ) : (
            <>
              <Badge variant={compliance.status === "flagged" ? "warning" : "success"} className="rounded-none border-2 font-black">
                {compliance.status === "flagged" ? "Please review" : "No major flags"}
              </Badge>
              <p className="text-sm text-zinc-700 leading-relaxed">{compliance.summary}</p>
              {(compliance.sources ?? []).length > 0 && (
                <ul className="space-y-3 pt-2">
                  {(compliance.sources ?? []).map((s, i) => (
                    <li key={i} className="border-2 border-zinc-200 bg-zinc-50 px-4 py-3">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-black text-zinc-900 hover:text-emerald-800 inline-flex items-center gap-1.5 underline decoration-2 underline-offset-2"
                      >
                        {s.title}
                        <ExternalLink size={12} />
                      </a>
                      {s.snippet && (
                        <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed">{s.snippet}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {payLink && (
          <section className="border-2 border-zinc-900 bg-white p-6 space-y-4 shadow-[5px_5px_0_0_#18181b]">
            <h2 className="text-sm font-black flex items-center gap-2.5 text-zinc-900 uppercase tracking-wide">
              <span className="h-7 w-7 border-2 border-zinc-900 bg-zinc-900 flex items-center justify-center text-[#e8ff5a]">
                <Link2 size={13} />
              </span>
              Disbursement link
            </h2>
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-none font-black uppercase border-2 border-zinc-900 bg-[#e8ff5a] text-black shadow-[4px_4px_0_0_#18181b] hover:brightness-95"
            >
              <a href={payLink.url ?? "#"} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} />
                Open payment page · {formatCurrency(payLink.amount)}
              </a>
            </Button>
          </section>
        )}
      </div>
    </VaultShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-600">{label}</span>
      <span className="tabular-nums font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
