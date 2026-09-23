"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Target,
  Clock,
  Hourglass,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Loader2,
  Briefcase,
  Users,
  Inbox,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface DashboardData {
  quota: {
    current: number;
    max: number;
    targets: Array<{
      id: string;
      business_name: string;
      niche_industry?: string;
      city_country?: string;
      status: string;
    }>;
  };
  follow_ups: Array<{
    id: string;
    related_id: string;
    related_type: string;
    title: string;
    type: string;
    ai_suggested_tactic?: string;
    due_date?: string;
  }>;
  waiting_for_you: {
    proposals: Array<{
      id: string;
      total_investment: number;
      status: string;
      client?: { id: string; business_name: string };
      lead?: { id: string; business_name: string };
    }>;
    invoices: Array<{
      id: string;
      invoice_number: string;
      amount: number;
      status: string;
      client: { id: string; business_name: string };
    }>;
    total: number;
  };
  overdue_tasks: Array<{
    id: string;
    related_id: string;
    title: string;
    due_date: string;
  }>;
  onboarding: {
    active_count: number;
    pending_checklist_items: number;
    records: Array<{
      id: string;
      client: { id: string; business_name: string };
      checklist: Array<{ item: string; status: string }>;
    }>;
  };
}

// ─── Empty state component ───────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  message,
  cta,
  ctaHref,
}: {
  icon: React.ElementType;
  message: string;
  cta?: string;
  ctaHref?: string;
}) {
  return (
    <div className="p-5 rounded-lg bg-[var(--bg)] border border-dashed border-[var(--border)] text-center space-y-2">
      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--text-dim)]" />
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)]">{message}</p>
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
        >
          {cta}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Stat badge (dominant number) ────────────────────────────────────────────

function StatBadge({
  value,
  label,
  variant = "accent",
}: {
  value: string | number;
  label?: string;
  variant?: "accent" | "danger" | "success" | "info" | "neutral";
}) {
  const variantMap = {
    accent: "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-border)]",
    success: "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]",
    info: "bg-[var(--info-soft)] text-[var(--info)] border-[var(--info-border)]",
    neutral: "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${variantMap[variant]}`}>
      {value}
      {label ? ` ${label}` : ""}
    </span>
  );
}

// ─── Dashboard card wrapper ──────────────────────────────────────────────────

function DashCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 flex flex-col justify-between
        hover:border-[var(--accent-border)] transition-colors ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Card header ─────────────────────────────────────────────────────────────

function CardHeader({
  icon: Icon,
  title,
  iconColor,
  rightSlot,
}: {
  icon: React.ElementType;
  title: string;
  iconColor: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div
          className="p-2 rounded-lg border"
          style={{
            backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${iconColor} 25%, transparent)`,
            color: iconColor,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="font-heading text-base text-[var(--text-primary)]">{title}</h2>
      </div>
      {rightSlot}
    </div>
  );
}

// ─── Card footer ─────────────────────────────────────────────────────────────

function CardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4 mt-4 border-t border-[var(--border)] text-xs text-[var(--text-dim)]">
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const router = useRouter();
  const { setActiveEntity, openCopilotWithPrompt } = useBusinessBrain();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    setActiveEntity({
      type: "dashboard",
      name: "Daily Work Command",
      data: { view: "dashboard" },
    });
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading daily priorities and tasks...</p>
      </div>
    );
  }

  const quota = data?.quota || { current: 0, max: 3, targets: [] };
  const followUps = data?.follow_ups || [];
  const waiting = data?.waiting_for_you || { proposals: [], invoices: [], total: 0 };
  const overdue = data?.overdue_tasks || [];
  const onboarding = data?.onboarding || {
    active_count: 0,
    pending_checklist_items: 0,
    records: [],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Top Welcome Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <h1 className="font-heading text-2xl tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
            Daily &quot;MY WORK&quot; Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Focus strictly on today&apos;s actionable priorities. No rigid hourly scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            title="Refresh dashboard data"
            aria-label="Refresh dashboard data"
            className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openCopilotWithPrompt("What should I do next?")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold shadow-lg shadow-[var(--accent)]/20 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Copilot: &quot;What should I do next?&quot;</span>
          </button>
        </div>
      </div>

      {/* ── Grid of Focus Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: New Targets Today */}
        <DashCard>
          <div>
            <CardHeader
              icon={Target}
              title="New Targets"
              iconColor="var(--accent)"
              rightSlot={
                <StatBadge
                  value={`${quota.current} / ${quota.max}`}
                  label="today"
                  variant="accent"
                />
              }
            />

            <p className="text-xs text-[var(--text-muted)] mb-4">
              Your daily outreach quota. Focus on high-value prospects.
            </p>

            {quota.targets.length === 0 ? (
              <EmptyState
                icon={Target}
                message="No targets selected yet for today."
                cta="Pick 3 targets from Lead Engine"
                ctaHref="/leads"
              />
            ) : (
              <div className="space-y-2">
                {quota.targets.map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[170px]">
                        {target.business_name}
                      </div>
                      <div className="text-[11px] text-[var(--text-dim)]">
                        {target.niche_industry || "Lead"}
                      </div>
                    </div>
                    <Link
                      href={`/leads/${target.id}`}
                      className="px-2 py-1 rounded bg-[var(--accent-soft)] hover:bg-[var(--accent-border)] text-[var(--accent)] text-xs font-medium border border-[var(--accent-border)] flex items-center gap-1 transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CardFooter>
            <div className="flex items-center justify-between">
              <span>Max {quota.max} active</span>
              <Link href="/leads" className="text-[var(--accent)] hover:underline">
                Browse all leads &rarr;
              </Link>
            </div>
          </CardFooter>
        </DashCard>

        {/* CARD 2: Follow-ups Due */}
        <DashCard>
          <div>
            <CardHeader
              icon={Clock}
              title="Follow-ups Due"
              iconColor="var(--info)"
              rightSlot={
                <StatBadge
                  value={followUps.length}
                  label="pending"
                  variant={followUps.length > 0 ? "info" : "neutral"}
                />
              }
            />

            <p className="text-xs text-[var(--text-muted)] mb-4">
              Scheduled check-ins and outreach touchpoints.
            </p>

            {followUps.length === 0 ? (
              <EmptyState
                icon={Check}
                message="All follow-ups are up to date. Great work!"
              />
            ) : (
              <div className="space-y-2">
                {followUps.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
                        {task.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-border)]">
                        {task.type}
                      </span>
                    </div>
                    {task.ai_suggested_tactic && (
                      <p className="text-[11px] text-[var(--accent)] italic line-clamp-1">
                        AI Tactic: {task.ai_suggested_tactic}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <CardFooter>
            Cadence rule: 4 days without reply flags follow-up
          </CardFooter>
        </DashCard>

        {/* CARD 3: Waiting for You */}
        <DashCard>
          <div>
            <CardHeader
              icon={Hourglass}
              title="Waiting for You"
              iconColor="var(--danger)"
              rightSlot={
                <StatBadge
                  value={waiting.total}
                  label="action items"
                  variant={waiting.total > 0 ? "danger" : "neutral"}
                />
              }
            />

            <p className="text-xs text-[var(--text-muted)] mb-4">
              Hard Approval Gates requiring your explicit confirmation.
            </p>

            <div className="space-y-2">
              {waiting.proposals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] hover:bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      Proposal: {p.client?.business_name || p.lead?.business_name || "Prospect"}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Needs Gate 2 Approval</div>
                  </div>
                  <Link
                    href={`/proposals/builder?id=${p.id}`}
                    className="px-2 py-1 rounded bg-[var(--danger-soft)] hover:bg-[var(--danger-border)] text-[var(--danger)] text-xs font-medium border border-[var(--danger-border)]"
                  >
                    Review
                  </Link>
                </div>
              ))}

              {waiting.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      Invoice {inv.invoice_number} ({inv.client.business_name})
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Status: {inv.status}</div>
                  </div>
                  <Link
                    href={`/invoices/builder?id=${inv.id}`}
                    className="px-2 py-1 rounded bg-[var(--accent-soft)] hover:bg-[var(--accent-border)] text-[var(--accent)] text-xs font-medium border border-[var(--accent-border)]"
                  >
                    Open
                  </Link>
                </div>
              ))}

              {waiting.total === 0 && (
                <EmptyState
                  icon={CheckCircle2}
                  message="No approval gates currently waiting."
                />
              )}
            </div>
          </div>

          <CardFooter>
            Rule: AI never approves or marks sent automatically
          </CardFooter>
        </DashCard>

        {/* CARD 4: Overdue Tasks */}
        <DashCard>
          <div>
            <CardHeader
              icon={AlertTriangle}
              title="Overdue Tasks"
              iconColor="var(--warning)"
              rightSlot={
                <StatBadge
                  value={overdue.length}
                  label="items"
                  variant={overdue.length > 0 ? "danger" : "neutral"}
                />
              }
            />

            <p className="text-xs text-[var(--text-muted)] mb-4">
              Tasks past due date requiring immediate attention.
            </p>

            {overdue.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                message="Zero overdue tasks. You are on track!"
              />
            ) : (
              <div className="space-y-2">
                {overdue.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-[var(--warning-soft)] border border-[var(--warning-border)] hover:bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] transition-colors"
                  >
                    <div className="text-xs font-semibold text-[var(--text-primary)]">{item.title}</div>
                    <div className="text-[11px] text-[var(--warning)]">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CardFooter>
            Day-level scheduling avoiding micro-management
          </CardFooter>
        </DashCard>

        {/* CARD 5: Onboarding Pending */}
        <DashCard>
          <div>
            <CardHeader
              icon={CheckCircle2}
              title="Onboarding Pending"
              iconColor="var(--success)"
              rightSlot={
                <StatBadge
                  value={onboarding.pending_checklist_items}
                  label="open tasks"
                  variant={onboarding.pending_checklist_items > 0 ? "success" : "neutral"}
                />
              }
            />

            <p className="text-xs text-[var(--text-muted)] mb-4">
              Post-payment delivery checklists auto-created from Gate 5.
            </p>

            {onboarding.records.length === 0 ? (
              <EmptyState
                icon={Inbox}
                message="No active onboardings in progress."
              />
            ) : (
              <div className="space-y-2">
                {onboarding.records.map((onb) => {
                  const pendingCount = (onb.checklist || []).filter((i) => i.status === "pending").length;
                  return (
                    <div
                      key={onb.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--success-soft)] border border-[var(--success-border)] hover:bg-[color-mix(in_srgb,var(--success)_8%,transparent)] transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-primary)]">
                          {onb.client?.business_name}
                        </div>
                        <div className="text-[11px] text-[var(--success)]">
                          {pendingCount} checklist items left
                        </div>
                      </div>
                      <Link
                        href={`/onboarding/${onb.id}`}
                        className="px-2 py-1 rounded bg-[var(--success-soft)] hover:bg-[var(--success-border)] text-[var(--success)] text-xs font-medium border border-[var(--success-border)]"
                      >
                        Checklist
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <CardFooter>
            <div className="flex items-center justify-between">
              <span>{onboarding.active_count} clients in onboarding</span>
              <Link href="/clients" className="text-[var(--success)] hover:underline">
                Clients &rarr;
              </Link>
            </div>
          </CardFooter>
        </DashCard>

        {/* CARD 6: Quick Shortcuts */}
        <DashCard>
          <div>
            <CardHeader
              icon={Briefcase}
              title="Quick Shortcuts"
              iconColor="var(--accent)"
            />
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Direct access to engine pipelines.
            </p>

            <div className="space-y-2 text-sm">
              {[
                { emoji: "📥", label: "Import new CSV leads", href: "/import" },
                { emoji: "🔍", label: "Open Lead Engine", href: "/leads" },
                { emoji: "📝", label: "Create new Proposal", href: "/proposals/builder" },
              ].map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors group"
                >
                  <span>
                    {shortcut.emoji} {shortcut.label}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--accent)] transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <CardFooter>
            Central database synchronized across both workspaces
          </CardFooter>
        </DashCard>
      </div>
    </div>
  );
}
