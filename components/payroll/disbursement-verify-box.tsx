"use client";

import { useEffect, useState } from "react";
import type { PaymentLink } from "@/lib/db/types";
import { Link2, Loader2 } from "lucide-react";

export function DisbursementVerifyBox({
  pl,
  refreshSnapshot,
}: {
  pl: PaymentLink;
  /** When provided, polled every 2s while status is `created` so the badge syncs after /disburse. */
  refreshSnapshot?: () => void | Promise<void>;
}) {
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowVerify(true), 2000);
    return () => clearTimeout(t);
  }, [pl.id, pl.status]);

  useEffect(() => {
    if (pl.status !== "created" || !refreshSnapshot) return;
    const id = window.setInterval(() => void refreshSnapshot(), 2000);
    return () => clearInterval(id);
  }, [pl.status, pl.id, refreshSnapshot]);

  return (
    <div className="mt-3 border-2 border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs">
      {!showVerify ? (
        <div className="flex items-center gap-2 text-zinc-500 font-semibold">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>Preparing confirmation link…</span>
        </div>
      ) : pl.status === "paid" ? (
        <p className="font-black uppercase tracking-wide text-emerald-800">
          Payment recorded — status synced
        </p>
      ) : pl.verify_url ? (
        <a
          href={pl.verify_url}
          className="inline-flex items-center gap-1.5 font-black text-zinc-900 underline decoration-2 underline-offset-2 hover:text-emerald-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Link2 className="h-3.5 w-3.5 shrink-0" />
          Record payment on Auto-Roll (after Bag checkout)
        </a>
      ) : null}
    </div>
  );
}
