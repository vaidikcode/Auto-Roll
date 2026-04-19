"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight } from "lucide-react";

function VaultShell({ children }: { children: ReactNode }) {
  return (
    <div className="ar-vault min-h-dvh flex flex-col">
      <div className="ar-vault-main flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export default function PayrollHomePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const start = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/runs/init", { method: "POST" });
      if (!res.ok) throw new Error("init failed");
      const { run_id } = await res.json();
      router.push(`/payroll/${run_id}`);
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  }, [router]);

  return (
    <VaultShell>
      <header className="border-b-4 border-zinc-900 bg-white shrink-0">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="h-9 w-9 border-2 border-zinc-900 bg-[#e8ff5a] text-black flex items-center justify-center font-black text-xs">
            AR
          </div>
          <div>
            <span className="ar-font-display font-black text-zinc-900 tracking-tight">Auto-Roll</span>
            <span className="text-zinc-400 mx-2">·</span>
            <span className="text-sm text-zinc-600 font-bold uppercase tracking-wide">Treasury</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-lg mx-auto w-full">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500 mb-4">
          Global payroll control
        </p>
        <h1 className="ar-font-display text-4xl sm:text-5xl font-black leading-tight text-zinc-900">
          One screen. Full ledger contrast.
        </h1>
        <p className="mt-5 text-zinc-600 text-sm leading-relaxed">
          Light canvas, ink-bordered panels, and chartreuse CTAs—plus{" "}
          <strong className="text-zinc-900">Add people</strong> on every run.
        </p>

        <ul className="mt-10 w-full space-y-2 text-left text-sm text-zinc-700">
          {[
            "Treasury ladder + gross-flow strip + completion meter",
            "Compliance grid with hard borders",
            "Operations desk with prefilled HR sync",
          ].map((t) => (
            <li
              key={t}
              className="flex gap-3 border-2 border-zinc-900 bg-white px-4 py-3 shadow-[3px_3px_0_0_#18181b] hover:bg-zinc-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-emerald-800 shrink-0 mt-0.5" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          className="mt-12 gap-2 min-w-[240px] rounded-none border-2 border-zinc-900 bg-[#e8ff5a] text-black font-black uppercase tracking-wide text-sm shadow-[5px_5px_0_0_#18181b] hover:brightness-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          onClick={start}
          disabled={busy}
        >
          {busy ? <Loader2 size={20} className="spinner" /> : <span aria-hidden>+</span>}
          New payroll run
        </Button>
      </main>
    </VaultShell>
  );
}
