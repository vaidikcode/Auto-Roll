-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgvector";

-- Tenants
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  api_key text unique default encode(gen_random_bytes(32), 'hex'),
  bag_customer_id text,
  bag_subscription_id text,
  subscription_status text check (subscription_status in ('active', 'past_due', 'canceled', 'paused', 'trialing')),
  plan text check (plan in ('starter', 'growth', 'enterprise')),
  auto_payroll boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tenant members
create table tenant_members (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'viewer')),
  email text not null,
  full_name text,
  created_at timestamptz default now(),
  unique(tenant_id, user_id)
);

-- Employees
create table employees (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  full_name text not null,
  email text not null,
  classification text not null check (classification in ('employee', 'contractor')),
  department text,
  job_title text,
  base_salary_annual numeric(12, 2) not null default 0,
  hourly_rate numeric(10, 2),
  jurisdiction_country text not null default 'US',
  jurisdiction_state text,
  payout_method text not null default 'ach' check (payout_method in ('ach', 'wire', 'usdc')),
  wallet_address text,
  bank_account_last4 text,
  tax_id_last4 text,
  start_date date not null,
  end_date date,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, email)
);

-- Payroll runs
create table payroll_runs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  pay_date date not null,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'paid', 'failed')),
  total_gross numeric(14, 2) not null default 0,
  total_net numeric(14, 2) not null default 0,
  total_taxes numeric(14, 2) not null default 0,
  employee_count integer not null default 0,
  notes text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payroll line items
create table payroll_line_items (
  id uuid primary key default uuid_generate_v4(),
  payroll_run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  gross_pay numeric(12, 2) not null,
  federal_tax numeric(10, 2) not null default 0,
  state_tax numeric(10, 2) not null default 0,
  social_security numeric(10, 2) not null default 0,
  medicare numeric(10, 2) not null default 0,
  other_deductions numeric(10, 2) not null default 0,
  net_pay numeric(12, 2) not null,
  hours_worked numeric(6, 2),
  bonus numeric(10, 2) not null default 0,
  reimbursements numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz default now()
);

-- Pay stubs
create table pay_stubs (
  id uuid primary key default uuid_generate_v4(),
  payroll_run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  storage_path text not null,
  period_start date not null,
  period_end date not null,
  pay_date date not null,
  gross_pay numeric(12, 2) not null,
  net_pay numeric(12, 2) not null,
  created_at timestamptz default now()
);

-- Subscriptions (mirror of Bag state)
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  bag_subscription_id text unique not null,
  bag_payment_link_id text,
  plan text not null check (plan in ('starter', 'growth', 'enterprise')),
  status text not null check (status in ('active', 'past_due', 'canceled', 'paused', 'trialing')),
  current_period_end timestamptz,
  customer_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices (mirror of Bag invoices)
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  bag_session_id text,
  bag_payment_link_id text,
  amount_usd numeric(10, 2),
  network text,
  status text default 'pending',
  description text,
  created_at timestamptz default now()
);

-- Webhook events (idempotency store)
create table webhook_events (
  id uuid primary key default uuid_generate_v4(),
  bag_event_id text unique not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean default false,
  created_at timestamptz default now()
);

-- Agent runs (audit trail)
create table agent_runs (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  agent text not null,
  input jsonb not null default '{}',
  output jsonb,
  tools_called text[] default '{}',
  cost_usd numeric(8, 4),
  status text not null check (status in ('running', 'completed', 'failed')),
  approved_by uuid references auth.users(id),
  payroll_run_id uuid references payroll_runs(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Approvals (HITL queue)
create table approvals (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  agent_run_id uuid references agent_runs(id) on delete set null,
  payroll_run_id uuid references payroll_runs(id) on delete set null,
  type text not null check (type in ('payroll_run', 'anomaly_override', 'compliance_action')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  summary text not null,
  details jsonb not null default '{}',
  requested_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Documents (for RAG)
create table documents (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  storage_path text not null,
  type text not null check (type in ('policy', 'pay_stub', 'tax_form', 'other')),
  employee_id uuid references employees(id) on delete cascade,
  embedding_status text not null default 'pending' check (embedding_status in ('pending', 'processing', 'done', 'failed')),
  created_at timestamptz default now()
);

-- Document chunks (for pgvector RAG)
create table document_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  chunk_index integer not null,
  created_at timestamptz default now()
);

-- Indexes
create index on employees(tenant_id, active);
create index on payroll_runs(tenant_id, status);
create index on payroll_runs(tenant_id, period_end desc);
create index on payroll_line_items(payroll_run_id);
create index on payroll_line_items(employee_id);
create index on approvals(tenant_id, status);
create index on agent_runs(tenant_id, agent);
create index on tenant_members(user_id);
create index on tenant_members(tenant_id);
create index on subscriptions(bag_subscription_id);
create index on document_chunks(tenant_id);
create index on document_chunks using ivfflat (embedding vector_cosine_ops);

-- Vector search function
create or replace function search_documents(
  query_text text,
  tenant_id_param uuid,
  employee_id_param uuid,
  match_count integer default 5
)
returns table (
  id uuid,
  content text,
  document_id uuid,
  similarity float
)
language plpgsql
as $$
declare
  query_embedding vector(1536);
begin
  -- In production, generate embedding via OpenAI API
  -- For now, return empty (populate via embedding pipeline)
  return query
    select dc.id, dc.content, dc.document_id, 1.0::float as similarity
    from document_chunks dc
    where dc.tenant_id = tenant_id_param
      and (employee_id_param is null or dc.employee_id = employee_id_param)
    limit match_count;
end;
$$;
