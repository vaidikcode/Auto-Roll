import Link from "next/link";
import { ArrowRight, Bot, DollarSign, ShieldCheck, Zap, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BAG_PLANS } from "@/lib/bag/client";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bot className="size-4.5 text-black" />
          </div>
          <span className="font-display font-bold text-xl">Auto-Roll</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-400 mb-8">
          <Zap className="size-3.5" />
          Powered by GPT-4o + Bag Payments
        </div>

        <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[1.05] tracking-tight max-w-4xl mb-6">
          Payroll that{" "}
          <span className="text-amber-400">runs itself</span>
        </h1>

        <p className="text-zinc-400 text-lg sm:text-xl max-w-xl leading-relaxed mb-10">
          AI agents compute, verify, and approve payroll for your entire team.
          Bag handles tax, compliance, and cross-border payments globally.
        </p>

        <div className="flex items-center gap-3">
          <Link href="/signup">
            <Button size="xl" className="group">
              Start free trial
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="xl">See how it works</Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-8 border border-zinc-800 rounded-2xl px-8 py-6 bg-zinc-900/50 backdrop-blur">
          {[
            { label: "Countries supported", value: "100+" },
            { label: "Avg. time to run payroll", value: "< 2 min" },
            { label: "Tax compliance", value: "Zero-touch" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="font-display font-bold text-2xl text-amber-400">{value}</div>
              <div className="text-xs text-zinc-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 px-8 py-20 max-w-6xl mx-auto">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-center mb-4">
          Six agents, zero manual work
        </h2>
        <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
          A coordinated team of AI agents handles every part of the payroll lifecycle.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Users,
              title: "Onboarding Agent",
              desc: "Add employees via chat or CSV. Classifies workers, collects comp & tax info automatically.",
              color: "text-blue-400",
              bg: "bg-blue-400/10 border-blue-400/20",
            },
            {
              icon: DollarSign,
              title: "Payroll Run Agent",
              desc: "Computes gross-to-net, deductions, proration, and bonuses for every employee every cycle.",
              color: "text-amber-400",
              bg: "bg-amber-400/10 border-amber-400/20",
            },
            {
              icon: ShieldCheck,
              title: "Anomaly Agent",
              desc: "Diffs each run vs. prior cycles. Flags deviations over threshold for human review.",
              color: "text-red-400",
              bg: "bg-red-400/10 border-red-400/20",
            },
            {
              icon: ShieldCheck,
              title: "Compliance Agent",
              desc: "Monitors filing deadlines, missing tax IDs, and jurisdiction rule changes year-round.",
              color: "text-green-400",
              bg: "bg-green-400/10 border-green-400/20",
            },
            {
              icon: Bot,
              title: "Employee Q&A Agent",
              desc: "Answers 'why was my paycheck lower?' and PTO questions using RAG over policies and stubs.",
              color: "text-purple-400",
              bg: "bg-purple-400/10 border-purple-400/20",
            },
            {
              icon: Globe,
              title: "Billing Recon Agent",
              desc: "Reconciles Bag settlement invoices with your internal ledger daily. Zero surprises.",
              color: "text-cyan-400",
              bg: "bg-cyan-400/10 border-cyan-400/20",
            },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className={`rounded-xl border p-5 ${bg} backdrop-blur-sm`}
            >
              <div className={`${color} mb-3`}>
                <Icon className="size-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1.5">{title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-8 py-20 max-w-5xl mx-auto" id="pricing">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-center mb-4">
          Simple pricing
        </h2>
        <p className="text-zinc-400 text-center mb-12">
          Billed through Bag — your Merchant of Record. Pay by card or USDC.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(Object.entries(BAG_PLANS) as [string, (typeof BAG_PLANS)[keyof typeof BAG_PLANS]][]).map(
            ([key, plan]) => (
              <div
                key={key}
                className={`rounded-xl border p-6 flex flex-col ${
                  key === "growth"
                    ? "border-amber-500/50 bg-amber-500/5 relative"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {key === "growth" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-black">
                    Popular
                  </div>
                )}
                <div className="mb-4">
                  <p className="font-display font-semibold text-lg">{plan.name}</p>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="font-display font-bold text-3xl">${plan.priceUsd}</span>
                    <span className="text-zinc-500 text-sm mb-1">/mo</span>
                  </div>
                  <p className="text-zinc-400 text-sm mt-1">{plan.description}</p>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-amber-400 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    className="w-full"
                    variant={key === "growth" ? "default" : "outline"}
                  >
                    Get started
                  </Button>
                </Link>
              </div>
            )
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 px-8 py-8 text-center text-sm text-zinc-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="size-5 rounded bg-amber-500 flex items-center justify-center">
            <Bot className="size-3 text-black" />
          </div>
          <span className="font-display font-semibold text-zinc-400">Auto-Roll</span>
        </div>
        <p>Payments powered by <a href="https://getbags.app" className="text-amber-400 hover:underline">Bag</a> — Merchant of Record in 100+ countries.</p>
      </footer>
    </div>
  );
}
