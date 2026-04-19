"use client";

import type { Employee, PayrollItem } from "@/lib/db/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PayslipPreview({
  employee,
  item,
  periodLabel = "April 2026",
  theme = "light",
}: {
  employee: Employee;
  item: PayrollItem;
  periodLabel?: string;
  theme?: "light" | "cosmos" | "vault";
}) {
  const vault = theme === "vault";
  const dark = theme === "cosmos" || vault;
  const rowDark = theme === "cosmos";

  return (
    <article
      className={cn(
        "overflow-hidden print:shadow-none",
        vault
          ? "rounded-none border-0 bg-white text-zinc-900 print:bg-white print:text-slate-900 print:border print:border-slate-300"
          : dark
            ? "rounded-none border-0 bg-slate-900/95 text-slate-100 print:bg-white print:text-slate-900 print:border print:border-slate-300"
            : "rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm print:border-slate-300"
      )}
    >
      <header
        className={cn(
          "px-6 py-4 flex justify-between items-start gap-4 border-b",
          vault
            ? "border-b-2 border-zinc-900 bg-zinc-100 print:bg-slate-50 print:border-slate-200"
            : dark
              ? "border-white/10 bg-gradient-to-r from-cyan-950/50 via-slate-900 to-fuchsia-950/40 print:bg-slate-50 print:border-slate-200"
              : "border-slate-100 bg-slate-50/80"
        )}
      >
        <div>
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em]",
              vault ? "text-zinc-600 print:text-slate-500" : dark ? "text-cyan-300/90 print:text-slate-500" : "text-slate-400"
            )}
          >
            Earnings statement
          </p>
          <h3
            className={cn(
              "text-base font-bold tracking-tight mt-0.5 ar-font-display",
              vault
                ? "text-zinc-900 print:text-slate-900"
                : dark
                  ? "text-white print:text-slate-900"
                  : "text-slate-900"
            )}
          >
            Auto-Roll Treasury
          </h3>
          <p
            className={cn(
              "text-xs mt-1",
              vault ? "text-zinc-600 print:text-slate-500" : dark ? "text-slate-400 print:text-slate-500" : "text-slate-500"
            )}
          >
            Confidential · {periodLabel}
          </p>
        </div>
        <div
          className={cn(
            "text-right text-xs",
            vault ? "text-zinc-700 print:text-slate-600" : dark ? "text-slate-300 print:text-slate-600" : "text-slate-600"
          )}
        >
          <div className={cn("font-bold", vault ? "text-zinc-900 print:text-slate-900" : dark ? "text-white print:text-slate-900" : "text-slate-900")}>
            {employee.name}
          </div>
          <div>{employee.email}</div>
          <div className="mt-1">
            {employee.country}
            {employee.tax_locale?.state ? ` · ${employee.tax_locale.state}` : ""}
          </div>
        </div>
      </header>

      <div className="px-6 py-4 grid grid-cols-2 gap-6">
        <div>
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-wide",
              vault ? "text-zinc-500" : dark ? "text-slate-500" : "text-slate-400"
            )}
          >
            Gross
          </p>
          <p className="text-lg font-bold tabular-nums mt-0.5">{formatCurrency(item.gross)}</p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-wide",
              vault ? "text-zinc-500" : dark ? "text-slate-500" : "text-slate-400"
            )}
          >
            Net pay
          </p>
          <p
            className={cn(
              "text-lg font-bold tabular-nums mt-0.5",
              vault
                ? "font-black text-emerald-800 print:text-emerald-800"
                : dark
                  ? "font-black bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent print:text-emerald-800"
                  : "text-emerald-800"
            )}
          >
            {formatCurrency(item.net_usd)}
          </p>
          <p className={cn("text-[11px] mt-0.5", vault ? "text-zinc-500" : "text-slate-500")}>USD settlement</p>
        </div>
      </div>

      <div className="px-6 pb-4">
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide mb-2",
            vault ? "text-zinc-500" : dark ? "text-slate-500" : "text-slate-400"
          )}
        >
          Deductions &amp; contributions
        </p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <Row dark={rowDark} label="Federal income tax" value={formatCurrency(item.federal_tax)} />
          <Row dark={rowDark} label="State / local" value={formatCurrency(item.state_tax)} />
          <Row dark={rowDark} label="FICA" value={formatCurrency(item.fica)} />
          <Row dark={rowDark} label="Medical" value={formatCurrency(item.healthcare)} />
          <Row dark={rowDark} label="Retirement (EE)" value={formatCurrency(item.retirement)} />
          <Row dark={rowDark} label="Other" value={formatCurrency(item.other_deductions)} />
          {item.fees > 0 && (
            <Row dark={rowDark} label="Transfer / corridor" value={formatCurrency(item.fees)} />
          )}
        </dl>
      </div>

      <footer
        className={cn(
          "px-6 py-3 border-t text-[10px] leading-relaxed",
          vault
            ? "border-zinc-200 bg-zinc-50 text-zinc-600 print:bg-white print:border-slate-200 print:text-slate-500"
            : dark
              ? "border-white/10 bg-slate-950/80 text-slate-500 print:bg-white print:border-slate-200 print:text-slate-500"
              : "bg-slate-50 border-slate-100 text-slate-500"
        )}
      >
        Generated from this payroll run for record-keeping. Not a substitute for statutory filings
        or issuer-branded tax forms.
      </footer>
    </article>
  );
}

function Row({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <>
      <dt className={dark ? "text-slate-400 print:text-slate-600" : "text-slate-600"}>{label}</dt>
      <dd
        className={cn(
          "text-right font-mono tabular-nums font-semibold",
          dark ? "text-slate-100 print:text-slate-900" : "text-slate-900"
        )}
      >
        {value}
      </dd>
    </>
  );
}
