"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CreditCard,
  MessageSquare,
  CheckSquare,
  ShieldCheck,
  Bot,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Payroll", href: "/payroll", icon: DollarSign },
  { label: "Approvals", href: "/approvals", icon: CheckSquare },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Assistant", href: "/chat", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      {/* Logo */}
      <div className="flex h-14 items-center px-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-md bg-[var(--primary)] flex items-center justify-center">
            <Bot className="size-4 text-[var(--primary-foreground)]" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-[var(--foreground)]">
            Auto-Roll
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="ml-auto size-3.5 opacity-60" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
