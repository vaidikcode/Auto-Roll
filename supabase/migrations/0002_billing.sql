ALTER TABLE payroll_runs
  ADD COLUMN IF NOT EXISTS company_id text NOT NULL DEFAULT 'demo_company';

CREATE INDEX IF NOT EXISTS payroll_runs_company_id_idx
  ON payroll_runs(company_id);

