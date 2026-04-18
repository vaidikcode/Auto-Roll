"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";

export function RunComplianceButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRun = async () => {
    setLoading(true);
    try {
      await fetch("/api/agents/compliance", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleRun} disabled={loading} size="sm">
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShieldCheck className="size-4" />
      )}
      {loading ? "Scanning..." : "Run compliance scan"}
    </Button>
  );
}
