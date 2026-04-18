"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6">
      <div>
        <h1 className="font-display text-lg font-semibold text-[var(--foreground)]">{title}</h1>
        {subtitle && (
          <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-8">
          <Search className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 relative">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[var(--primary)]" />
        </Button>
      </div>
    </header>
  );
}
