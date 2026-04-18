"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubscribeButtonProps {
  plan: "starter" | "growth" | "enterprise";
}

export function SubscribeButton({ plan }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bag/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { checkoutUrl } = await res.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      className="w-full"
      variant={plan === "growth" ? "default" : "outline"}
      onClick={handleSubscribe}
      disabled={loading}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      Subscribe
    </Button>
  );
}
