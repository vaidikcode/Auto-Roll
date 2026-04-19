"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ChevronRight } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-100 via-white to-zinc-50">
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="font-semibold text-zinc-900">Auto-Roll</span>
          <span className="text-zinc-300">|</span>
          <span className="text-sm text-zinc-500">Payroll workspace</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-lg mx-auto">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-zinc-900 tracking-tight">
          Run this month’s payroll in one guided flow
        </h1>
        <p className="mt-4 text-zinc-600 text-sm leading-relaxed">
          We’ll pull your team list, work out pay and taxes, flag anything to double-check for
          people outside the U.S., ask you to sign off, then set up how each person gets paid.
        </p>
        <ul className="mt-8 text-left text-sm text-zinc-600 space-y-3 w-full">
          {[
            "Plain-language updates across the page—not just a chat box",
            "A personal page for every employee: pay, bank details, rules, links",
            "A calm pace so you can follow along (a short pause between each person on the list)",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <ChevronRight size={16} className="text-zinc-400 shrink-0 mt-0.5" />
              {t}
            </li>
          ))}
        </ul>
        <Button size="lg" className="mt-10 gap-2 min-w-[220px]" onClick={start} disabled={busy}>
          {busy ? <Loader2 size={18} className="spinner" /> : <Sparkles size={18} />}
          Start a new payroll run
        </Button>
      </main>
    </div>
  );
}
