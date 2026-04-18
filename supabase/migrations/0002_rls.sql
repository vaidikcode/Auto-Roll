-- Row Level Security policies for all tables

-- Tenants: members can see their own tenant
alter table tenants enable row level security;
create policy "tenant_members_can_read_tenant"
  on tenants for select
  using (
    id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );

create policy "tenant_owners_can_update_tenant"
  on tenants for update
  using (
    id in (
      select tenant_id from tenant_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Tenant members
alter table tenant_members enable row level security;
create policy "members_can_read_own_tenant_members"
  on tenant_members for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );

-- Employees
alter table employees enable row level security;
create policy "members_can_read_employees"
  on employees for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );
create policy "admins_can_write_employees"
  on employees for all
  using (
    tenant_id in (
      select tenant_id from tenant_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Payroll runs
alter table payroll_runs enable row level security;
create policy "members_can_read_payroll_runs"
  on payroll_runs for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );
create policy "admins_can_write_payroll_runs"
  on payroll_runs for all
  using (
    tenant_id in (
      select tenant_id from tenant_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Payroll line items
alter table payroll_line_items enable row level security;
create policy "members_can_read_line_items"
  on payroll_line_items for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );

-- Approvals
alter table approvals enable row level security;
create policy "members_can_read_approvals"
  on approvals for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );
create policy "admins_can_update_approvals"
  on approvals for update
  using (
    tenant_id in (
      select tenant_id from tenant_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Agent runs
alter table agent_runs enable row level security;
create policy "members_can_read_agent_runs"
  on agent_runs for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );

-- Subscriptions
alter table subscriptions enable row level security;
create policy "members_can_read_subscriptions"
  on subscriptions for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );

-- Invoices
alter table invoices enable row level security;
create policy "members_can_read_invoices"
  on invoices for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );

-- Pay stubs (employees can read their own)
alter table pay_stubs enable row level security;
create policy "members_can_read_pay_stubs"
  on pay_stubs for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );

-- Documents
alter table documents enable row level security;
create policy "members_can_read_documents"
  on documents for select
  using (
    tenant_id in (
      select tenant_id from tenant_members where user_id = auth.uid()
    )
  );

-- Webhook events (admin only via service role)
alter table webhook_events enable row level security;
-- Webhook events only accessible via service role (no user-facing policy)
