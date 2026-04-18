"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { company_name: company } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="size-10 rounded-xl bg-[var(--primary)] flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
          <Bot className="size-5 text-black" />
        </div>
        <h1 className="font-display font-bold text-2xl">Create your workspace</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Start your free 14-day trial
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company name</Label>
          <Input
            id="company"
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Create workspace
        </Button>
      </form>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
        By signing up, you agree to our Terms of Service.
        Payments via <span className="text-amber-400">Bag</span> — our Merchant of Record.
      </p>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
