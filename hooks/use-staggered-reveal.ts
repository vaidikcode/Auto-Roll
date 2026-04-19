"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals list items one at a time (e.g. one per second) for a calmer, guided feel.
 * When `runId` changes, the reveal queue resets.
 */
export function useStaggeredReveal<T extends { id: string }>(
  items: T[],
  runId: string | null,
  stepMs: number
): T[] {
  const [visibleCount, setVisibleCount] = useState(0);
  const prevRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (runId !== prevRunRef.current) {
      prevRunRef.current = runId;
      setVisibleCount(0);
    }
  }, [runId]);

  useEffect(() => {
    if (!runId || items.length === 0) {
      if (items.length === 0) setVisibleCount(0);
      return;
    }
    if (visibleCount >= items.length) return;
    const t = window.setTimeout(() => {
      setVisibleCount((c) => Math.min(c + 1, items.length));
    }, stepMs);
    return () => window.clearTimeout(t);
  }, [items.length, visibleCount, stepMs, runId]);

  return items.slice(0, visibleCount);
}
