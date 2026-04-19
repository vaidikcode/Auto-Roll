"use client";

import { useCallback, useEffect, useState } from "react";
import type { UsageReport } from "@/lib/db/types";

export function useUsageReport(companyId = "demo_company") {
  const [report, setReport]   = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/usage?company_id=${encodeURIComponent(companyId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: UsageReport = await res.json();
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { report, loading, error, refresh: fetchReport };
}
