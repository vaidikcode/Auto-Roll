"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunSnapshot } from "@/lib/db/types";

export function useRunSnapshot(runId: string | null, pollMs = 2000) {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const statusRef = useRef<string | null>(null);
  const hasUnsettledPaymentsRef = useRef(false);

  const fetchSnapshot = useCallback(async () => {
    if (!runId) return;
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        const data: RunSnapshot = await res.json();
        setSnapshot(data);
        statusRef.current = data.run.status;
        hasUnsettledPaymentsRef.current = data.payment_links.some(
          (link) => link.status === "created"
        );
      }
    } catch {
      // ignore
    }
  }, [runId]);

  useEffect(() => {
    if (!runId) {
      queueMicrotask(() => setSnapshot(null));
      hasUnsettledPaymentsRef.current = false;
      return;
    }
    queueMicrotask(() => setLoading(true));
    statusRef.current = null;
    const initialFetch = setTimeout(() => {
      void fetchSnapshot().finally(() => setLoading(false));
    }, 0);

    const interval = setInterval(() => {
      const s = statusRef.current;
      if (s !== "rejected" && (s !== "done" || hasUnsettledPaymentsRef.current)) {
        fetchSnapshot();
      }
    }, pollMs);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [runId, fetchSnapshot, pollMs]);

  return { snapshot, loading, refresh: fetchSnapshot };
}
