-- Auto-Roll Payroll Agent schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Payroll runs: top-level container for a payroll cycle
create table if not exists payroll_runs (
  id uuid primary key default uuid_generate_v4(),
  status text not null default 'collecting'
    check (status in ('collecting','calculating','awaiting_approval','approved','paying','done','rejected')),
  totals jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Employees: populated by collect_employees tool per run
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  name text not null,
  email text not null,
  country text not null,
  currency text not null,
  base_salary_usd numeric(14,2) not null,
  employment_type text not null check (employment_type in ('domestic','international')),
  tax_locale jsonb not null default '{}',
  dependents integer not null default 0,
  benefits jsonb not null default '{}',
  retirement_match_pct numeric(5,2) not null default 0,
  payout_destination jsonb not null default '{}',
  source text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Payroll items: per-employee calculated amounts
create table if not exists payroll_items (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  gross numeric(14,2) not null,
  federal_tax numeric(14,2) not null default 0,
  state_tax numeric(14,2) not null default 0,
  fica numeric(14,2) not null default 0,
  healthcare numeric(14,2) not null default 0,
  retirement numeric(14,2) not null default 0,
  other_deductions numeric(14,2) not null default 0,
  net_usd numeric(14,2) not null,
  net_local numeric(14,2),
  fx_rate numeric(14,6),
  fees numeric(14,2) not null default 0,
  breakdown jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Compliance reports: per-employee international compliance info
create table if not exists compliance_reports (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  country text not null,
  summary text not null default '',
  sources jsonb not null default '[]',
  actionable_steps jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending','clear','flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payment links: Bag payment links per employee
create table if not exists payment_links (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  bag_link_id text,
  url text,
  amount numeric(14,2) not null,
  currency text not null,
  chain text,
  status text not null default 'created' check (status in ('created','paid','expired','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tool events: audit log of every tool call for the timeline
create table if not exists tool_events (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references payroll_runs(id) on delete cascade,
  tool_name text not null,
  args jsonb not null default '{}',
  result jsonb not null default '{}',
  duration_ms integer,
  created_at timestamptz not null default now()
);

-- Indexes for hot paths
create index if not exists employees_run_id_idx on employees(run_id);
create index if not exists payroll_items_run_id_idx on payroll_items(run_id);
create index if not exists payroll_items_employee_id_idx on payroll_items(employee_id);
create index if not exists compliance_reports_run_id_idx on compliance_reports(run_id);
create index if not exists payment_links_run_id_idx on payment_links(run_id);
create index if not exists tool_events_run_id_created_idx on tool_events(run_id, created_at desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger payroll_runs_updated_at
  before update on payroll_runs
  for each row execute function update_updated_at();

create or replace trigger compliance_reports_updated_at
  before update on compliance_reports
  for each row execute function update_updated_at();

create or replace trigger payment_links_updated_at
  before update on payment_links
  for each row execute function update_updated_at();
