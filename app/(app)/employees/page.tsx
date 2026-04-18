import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Plus, Upload, Bot } from "lucide-react";
import Link from "next/link";
import type { Employee } from "@/lib/supabase/types";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .order("full_name");

  return (
    <div>
      <Topbar
        title="Employees"
        subtitle={`${employees?.length ?? 0} total`}
      />
      <div className="p-6">
        {/* Header actions */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/employees/add">
            <Button size="sm">
              <Plus className="size-4" />
              Add employee
            </Button>
          </Link>
          <Link href="/employees/import">
            <Button variant="outline" size="sm">
              <Upload className="size-4" />
              Import CSV
            </Button>
          </Link>
          <Link href="/chat?agent=onboarding">
            <Button variant="ghost" size="sm" className="gap-2">
              <Bot className="size-4 text-amber-400" />
              Onboarding agent
            </Button>
          </Link>
        </div>

        {/* Employee table */}
        {!employees || employees.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <div className="size-12 rounded-xl bg-[var(--secondary)] flex items-center justify-center">
                <Bot className="size-6 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="font-display font-semibold text-lg mb-1">No employees yet</p>
                <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
                  Add your first employee manually or use the Onboarding Agent to import a CSV roster.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/employees/add">
                  <Button size="sm">Add employee</Button>
                </Link>
                <Link href="/chat?agent=onboarding">
                  <Button variant="outline" size="sm">
                    <Bot className="size-4" />
                    Use agent
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Annual salary
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(employees as Employee[]).map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-amber-400">
                          {getInitials(emp.full_name)}
                        </div>
                        <div>
                          <p className="font-medium">{emp.full_name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      <div>
                        <p>{emp.job_title ?? "—"}</p>
                        {emp.department && (
                          <p className="text-xs opacity-70">{emp.department}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.classification === "employee" ? "info" : "secondary"}>
                        {emp.classification}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {formatCurrency(emp.base_salary_annual)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {emp.jurisdiction_state
                        ? `${emp.jurisdiction_state}, ${emp.jurisdiction_country}`
                        : emp.jurisdiction_country}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.active ? "success" : "secondary"}>
                        {emp.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
