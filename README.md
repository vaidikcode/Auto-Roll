# Auto-Roll — AI Payroll Agent

A chat-first HR payroll platform. One button releases payroll: the agent collects employees, calculates domestic/international pay, checks cross-border compliance, waits for human approval, and creates Bag payment links — all displayed as rich interactive UI cards.

## Stack

- **Next.js 16** (App Router)
- **Vercel AI SDK v6** — `useChat`, `streamText`, tool calling
- **Claude Sonnet 4.5** via **Vercel AI Gateway**
- **Supabase** Postgres (DB only)
- **Bag** (getbags.app) — payment links
- **Tavily** — live compliance search
- **open.er-api.com** — free FX rates
- **shadcn/ui** + Tailwind v4 — black/white theme

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd auto-roll
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `AI_GATEWAY_API_KEY` | [Vercel AI Gateway](https://vercel.com/docs/ai/ai-gateway) |
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase project settings](https://app.supabase.com) → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → API → service_role |
| `BAG_API_KEY` | [Bag dashboard](https://docs.getbags.app/docs) → sandbox keys |
| `TAVILY_API_KEY` | [Tavily](https://tavily.com) (optional) |

### 3. Run database migrations

Open your [Supabase SQL editor](https://app.supabase.com) and run the contents of:

```
supabase/migrations/0001_init.sql
```

Or with the Supabase CLI:

```bash
npx supabase db push
```

### 4. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the chat workspace.

## Usage

1. Open the chat workspace at `/chat`
2. Click **Release Payroll** in the top bar (or the large CTA on the empty state)
3. Watch the agent:
   - Fetch 8 mock employees from Rippling, Gusto, Deel, and PDF offer letters
   - Calculate US payroll (federal/state/FICA/401k/healthcare)
   - Fetch live FX rates for international employees
   - Run cross-border compliance checks via Tavily
   - Calculate international payroll with corridor fees
4. An **Approval Card** appears — review the totals and click **Approve & Release**
5. The agent creates a Bag payment link for each employee
6. Track everything in the **Run Inspector** panel on the right

## Architecture

```
app/
  chat/page.tsx          — main workspace (useChat + RunPanel)
  api/
    chat/route.ts        — streamText agent (Claude via AI Gateway)
    runs/[id]/           — run snapshot + approval endpoints
    bag/webhook/         — Bag payment status updates

lib/
  ai/tools/              — 7 tool implementations
  payroll/               — domestic & international calculation logic
  bag/client.ts          — Bag REST client
  db/                    — Supabase client + TypeScript types

components/
  chat/
    message.tsx          — tool part dispatcher
    run-panel.tsx        — live right-panel (polling)
    tool-cards/          — 7 custom UI cards + shared shell

supabase/migrations/     — DB schema
```

## Tool Cards

Each agent tool call renders as a rich UI component, not text:

| Tool | Card | Description |
|---|---|---|
| `collect_employees` | CollectEmployeesCard | Source chips + employee roster table |
| `calculate_domestic_payroll` | DomesticPayrollCard | Itemized tax breakdown |
| `fetch_fx_rate` | FxRateCard | Ticker-style USD → local display |
| `check_cross_border_compliance` | ComplianceCard | Tavily sources + actionable steps |
| `calculate_international_payroll` | InternationalPayrollCard | Corridor + FX + fees + net local |
| `request_human_approval` | ApprovalCard | Totals grid + Approve/Reject buttons |
| `create_payment_link` | PaymentLinkCard | Link + copy + open + compliance badge |

## Notes

- No authentication — single-user demo mode
- Payroll calculations use 2026 federal brackets and simplified state flat rates (demo accuracy)
- Bag: by default demo hosted-style links are generated (no API call). Set `BAG_USE_REAL=1` and `BAG_API_KEY` to use the live Bag API.
- Cross-border compliance uses Tavily when `TAVILY_API_KEY` is set (required for international checks).
