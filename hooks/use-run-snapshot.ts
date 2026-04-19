"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunSnapshot } from "@/lib/db/types";

export function useRunSnapshot(runId: string | null, pollMs = 2000) {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const statusRef = useRef<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    if (!runId) return;
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        const data: RunSnapshot = await res.json();
        setSnapshot(data);
        statusRef.current = data.run.status;
      }
    } catch {
      // ignore
    }
  }, [runId]);

  useEffect(() => {
    if (!runId) {
      setSnapshot(null);
      return;
    }
    setLoading(true);
    statusRef.current = null;
    fetchSnapshot().finally(() => setLoading(false));

    const interval = setInterval(() => {
      const s = statusRef.current;
      if (s !== "done" && s !== "rejected") fetchSnapshot();
    }, pollMs);

    return () => clearInterval(interval);
  }, [runId, fetchSnapshot, pollMs]);

  return { snapshot, loading, refresh: fetchSnapshot };
}
