"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RunSnapshot } from "@/lib/db/types";
import type { GatewayTabId } from "@/lib/payroll/gateway-copy";

export type SelectionMode = "all" | "subset";

interface PayrollRunContextValue {
  runId: string;
  snapshot: RunSnapshot | null;
  loading: boolean;
  tab: GatewayTabId;
  setTab: (t: GatewayTabId) => void;
  selectionMode: SelectionMode;
  setSelectionMode: (m: SelectionMode) => void;
  selectedIds: string[];
  toggleEmployee: (id: string) => void;
  selectAllInRoster: () => void;
  clearSelection: () => void;
  /** Effective list of employee IDs for pipeline / payslips (all roster when mode=all) */
  effectiveSelectedIds: string[] | null;
}

const PayrollRunContext = createContext<PayrollRunContextValue | null>(null);

export function PayrollRunProvider({
  runId,
  snapshot,
  loading,
  tab,
  setTab,
  children,
}: {
  runId: string;
  snapshot: RunSnapshot | null;
  loading: boolean;
  tab: GatewayTabId;
  setTab: (t: GatewayTabId) => void;
  children: ReactNode;
}) {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const setSelectionModeSafe = useCallback(
    (m: SelectionMode) => {
      if (m === "subset" && snapshot?.employees.length && selectedIds.length === 0) {
        setSelectedIds(snapshot.employees.map((e) => e.id));
      }
      setSelectionMode(m);
    },
    [snapshot?.employees, selectedIds.length]
  );

  const effectiveSelectedIds = useMemo(() => {
    if (!snapshot?.employees.length) return null;
    if (selectionMode === "all") return null;
    return selectedIds;
  }, [snapshot?.employees.length, selectionMode, selectedIds]);

  const toggleEmployee = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((x) => x !== id);
          if (next.length === 0 && selectionMode === "subset") return prev;
          return next;
        }
        return [...prev, id];
      });
    },
    [selectionMode]
  );

  const selectAllInRoster = useCallback(() => {
    setSelectionMode("subset");
    setSelectedIds((snapshot?.employees ?? []).map((e) => e.id));
  }, [snapshot?.employees]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const value = useMemo(
    () => ({
      runId,
      snapshot,
      loading,
      tab,
      setTab,
      selectionMode,
      setSelectionMode: setSelectionModeSafe,
      selectedIds,
      toggleEmployee,
      selectAllInRoster,
      clearSelection,
      effectiveSelectedIds,
    }),
    [
      runId,
      snapshot,
      loading,
      tab,
      setTab,
      selectionMode,
      selectedIds,
      toggleEmployee,
      selectAllInRoster,
      clearSelection,
      effectiveSelectedIds,
    ]
  );

  return (
    <PayrollRunContext.Provider value={value}>{children}</PayrollRunContext.Provider>
  );
}

export function usePayrollRun() {
  const ctx = useContext(PayrollRunContext);
  if (!ctx) throw new Error("usePayrollRun must be used within PayrollRunProvider");
  return ctx;
}
