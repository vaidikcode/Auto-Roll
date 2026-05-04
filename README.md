# Auto-Roll — AI Payroll Agent

Auto-Roll is an innovative AI-powered payroll agent designed to streamline and automate the entire payroll process for a company. It operates through a user-friendly chat interface where an HR professional can initiate and manage payroll with simple commands. The AI agent is designed to be autonomous, handling everything from data collection to payment, with a crucial human approval step built in for control and verification.

## Features

- **Conversational Interface:** Manage payroll through a simple, intuitive chat interface.
- **Autonomous Operation:** The AI agent can handle the entire payroll process from start to finish.
- **Tool-Based Architecture:** The AI uses a set of "tools" to perform specific tasks like collecting employee data, calculating payroll, and creating payment links.
- **Human-in-the-Loop:** A crucial approval step ensures that you have the final say before payments are processed.
- **Domestic & International Payroll:** The agent can handle both domestic and international payroll, including currency conversion and compliance checks.
- **Extensible:** The tool-based architecture makes it easy to add new capabilities to the agent.

## Technical Workflow

The application's workflow is designed to be a seamless, conversational experience for the user, while the underlying technical implementation is a well-orchestrated sequence of events.

```mermaid
graph TD
    subgraph "User Interface (Next.js Frontend)"
        A[User visits /chat] --> B{Chat Interface};
        B --> C[User sends message: "Run payroll"];
        C --> D[useChat hook sends message to backend];
        D --> E[Displays AI & tool responses];
    end

    subgraph "Backend (Next.js API Route)"
        F[POST /api/chat] --> G{AI Model with System Prompt};
        G --> H[Orchestrates payroll flow];
    end

    subgraph "AI Tools (lib/ai/tools)"
        H --> I(collect_employees);
        I --> J(calculate_domestic_payroll);
        I --> K(fetch_fx_rate);
        K --> L(check_cross_border_compliance);
        L --> M(calculate_international_payroll);
        J & M --> N(request_human_approval);
        N --> O{Waits for user approval};
        O -- Approved --> P(create_payment_link);
    end

    subgraph "Database (Supabase)"
        I --> Q[Inserts into 'employees' table];
        J --> R[Updates 'employees' table];
        M --> R;
        P --> S[Updates 'payroll_runs' status];
    end

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js
- npm
- A Supabase account
- An OpenAI API key

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/vaidikcode/Auto-Roll.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Set up your environment variables by creating a `.env.local` file in the root of the project and adding the following:
    ```
    OPENAI_API_KEY='Your OpenAI API Key'
    SUPABASE_URL='Your Supabase Project URL'
    SUPABASE_ANON_KEY='Your Supabase Anon Key'
    ```
4.  Run the database migrations in your Supabase SQL editor from the `supabase/migrations/0001_init.sql` file.

### Usage

1.  Start the development server
    ```sh
    npm run dev
    ```
2.  Open [http://localhost:3000/chat](http://localhost:3000/chat) with your browser to see the result.
3.  Type "Run payroll" to start the payroll process.

## Project Structure

```
/app
  /api
    /chat
      route.ts      # Backend API for the chat interface
  /chat
    page.tsx        # Frontend for the chat interface
/components
  /chat
    message.tsx     # Renders a single chat message
    tool-cards      # Components for displaying tool outputs
/lib
  /ai
    /tools          # AI tools for payroll tasks
  /db
    client.ts       # Supabase client
/supabase
  /migrations
    0001_init.sql   # Database schema
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.


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
| `BAG_API_KEY` | [Bag dashboard](https://getbags.app/dashboard/developer) → Create API Key |
| `BAG_WEBHOOK_SECRET` | [Bag dashboard → Webhooks](https://getbags.app/dashboard/webhooks) → add endpoint → copy secret |
| `BAG_NETWORK` | Network slug, e.g. `base_sepolia` (default) or `base` for production |
| `BAG_USE_REAL` | Set to `1` to call the real Bag API; omit for demo mode (no API call) |
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
- Bag: by default demo checkout sessions are generated locally (no API call). Set `BAG_USE_REAL=1` + `BAG_API_KEY` + `BAG_WEBHOOK_SECRET` to use the live Bag v1 checkout API. Default network is `base_sepolia`; override with `BAG_NETWORK`.
- Cross-border compliance uses Tavily when `TAVILY_API_KEY` is set (required for international checks).

curl -X POST https://getbags.app/api/v1/checkout \
  -H "Authorization: Bearer $BAG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Payment","amount":9.99,"network":"base_sepolia"}'