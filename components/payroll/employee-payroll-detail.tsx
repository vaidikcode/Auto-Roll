"use client";

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
      <div className="min-h-screen bg-zinc-50 p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <p className="text-zinc-600 mb-4">We couldn’t find this person on this payroll run.</p>
        <Button asChild variant="outline">
          <Link href={`/payroll/${runId}`}>Back to this payroll</Link>
        </Button>
      </div>
    );
  }

  const payout = emp.payout_destination;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-zinc-600">
          <Link href={`/payroll/${runId}`}>
            <ArrowLeft size={14} />
            Back to payroll
          </Link>
        </Button>

        <header className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="text-4xl">{countryFlag(emp.country)}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-serif font-semibold text-zinc-900 tracking-tight">
              {emp.name}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {emp.employment_type === "domestic"
                ? "Paid on U.S. payroll with standard tax withholding."
                : "Paid outside the U.S. · pay is converted with the period’s exchange rate."}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="default" className="font-normal">
                Listed in {emp.source}
              </Badge>
              <Badge variant="outline" className="font-normal">
                Pay currency: {emp.currency}
              </Badge>
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Mail size={15} className="text-zinc-500" />
            Contact
          </h2>
          <p className="text-sm text-zinc-700">{emp.email}</p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MapPin size={15} className="text-zinc-500" />
            Location & tax details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-zinc-400 uppercase tracking-wide">Country</dt>
              <dd className="font-medium">{emp.country}</dd>
            </div>
            {emp.tax_locale?.state && (
              <div>
                <dt className="text-xs text-zinc-400 uppercase tracking-wide">State (U.S.)</dt>
                <dd className="font-medium">{emp.tax_locale.state}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-zinc-400 uppercase tracking-wide">Dependents listed</dt>
              <dd className="font-medium">{emp.dependents}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Wallet size={15} className="text-zinc-500" />
            How they get paid
          </h2>
          <p className="text-sm text-zinc-600">
            {payout.type === "ach"
              ? "Direct deposit to a U.S. bank account."
              : "International wire to their bank on file."}
          </p>
          <p className="text-sm text-zinc-800">
            {payout.bank_name} · ending in {payout.last4}
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Calculator size={15} className="text-zinc-500" />
            This period’s pay
          </h2>
          {!item ? (
            <p className="text-sm text-zinc-500">
              Numbers will show here after the assistant finishes this person’s calculation.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Take-home (USD)</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatCurrency(item.net_usd)}
                </span>
              </div>
              <div className="text-xs text-zinc-400 space-y-1 border-t border-zinc-100 pt-3">
                <div className="flex justify-between">
                  <span>Gross</span>
                  <span className="tabular-nums">{formatCurrency(item.gross)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Federal tax</span>
                  <span className="tabular-nums">{formatCurrency(item.federal_tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>State / local</span>
                  <span className="tabular-nums">{formatCurrency(item.state_tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Social Security & Medicare</span>
                  <span className="tabular-nums">{formatCurrency(item.fica)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Health plan</span>
                  <span className="tabular-nums">{formatCurrency(item.healthcare)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retirement (employee)</span>
                  <span className="tabular-nums">{formatCurrency(item.retirement)}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Shield size={15} className="text-zinc-500" />
            Rules & reminders (not legal advice)
          </h2>
          {!compliance ? (
            <p className="text-sm text-zinc-500">
              {emp.employment_type === "domestic"
                ? "No separate cross-border checklist was run for this U.S. role."
                : "A short summary from trusted public sources will appear here when ready."}
            </p>
          ) : (
            <>
              <Badge variant={compliance.status === "flagged" ? "warning" : "success"}>
                {compliance.status === "flagged" ? "Please review" : "No major flags"}
              </Badge>
              <p className="text-sm text-zinc-700 leading-relaxed">{compliance.summary}</p>
              {(compliance.sources ?? []).length > 0 && (
                <ul className="space-y-2">
                  {(compliance.sources ?? []).map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-900 underline-offset-2 hover:underline inline-flex items-center gap-1"
                      >
                        {s.title}
                        <ExternalLink size={12} />
                      </a>
                      {s.snippet && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{s.snippet}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {payLink && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Link2 size={15} className="text-zinc-500" />
              Pay link
            </h2>
            <Button asChild>
              <a href={payLink.url ?? "#"} target="_blank" rel="noopener noreferrer">
                Open payment page ({formatCurrency(payLink.amount)})
              </a>
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
