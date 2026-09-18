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
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm text-zinc-400">Loading daily priorities and tasks...</p>
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
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#202026]">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <span>Daily &quot;MY WORK&quot; Dashboard</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Focus strictly on today&apos;s actionable priorities. No rigid hourly scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            title="Refresh dashboard data"
            className="p-2 rounded-lg bg-[#18181f] hover:bg-[#22222b] border border-[#272730] text-zinc-400 hover:text-zinc-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openCopilotWithPrompt("What should I do next?")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-sm font-semibold shadow-lg shadow-amber-900/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Copilot: &quot;What should I do next?&quot;</span>
          </button>
        </div>
      </div>

      {/* Grid of 5 Main Focus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: New Targets Today (Quota x/3) */}
        <div className="rounded-xl bg-[#141417] border border-[#26262e] p-5 flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Target className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-zinc-200 text-base">New Targets</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                {quota.current} / {quota.max} today
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Your daily outreach quota. Focus on high-value prospects.
            </p>

            {quota.targets.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#191920] border border-dashed border-zinc-800 text-center">
                <p className="text-xs text-zinc-400 mb-2">No targets selected yet for today.</p>
                <Link
                  href="/leads"
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
                >
                  Pick 3 targets from Lead Engine <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {quota.targets.map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] border border-zinc-800/80 hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="text-sm font-medium text-zinc-200 truncate max-w-[170px]">
                        {target.business_name}
                      </div>
                      <div className="text-[11px] text-zinc-500">{target.niche_industry || "Lead"}</div>
                    </div>
                    <Link
                      href={`/leads/${target.id}`}
                      className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 flex items-center gap-1 transition"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Max {quota.max} active</span>
            <Link href="/leads" className="text-amber-400 hover:underline">
              Browse all leads &rarr;
            </Link>
          </div>
        </div>

        {/* CARD 2: Follow-ups Due */}
        <div className="rounded-xl bg-[#141417] border border-[#26262e] p-5 flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-zinc-200 text-base">Follow-ups Due</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
                {followUps.length} pending
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Scheduled check-ins and outreach touchpoints.
            </p>

            {followUps.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#191920] border border-dashed border-zinc-800 text-center">
                <p className="text-xs text-zinc-400">All follow-ups are up to date.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {followUps.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-lg bg-[#1a1a20] border border-zinc-800/80"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-200 truncate max-w-[180px]">
                        {task.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900/50">
                        {task.type}
                      </span>
                    </div>
                    {task.ai_suggested_tactic && (
                      <p className="text-[11px] text-amber-300/90 italic line-clamp-1">
                        AI Tactic: {task.ai_suggested_tactic}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800/60 text-xs text-zinc-500">
            Cadence rule: 4 days without reply flags follow-up
          </div>
        </div>

        {/* CARD 3: Waiting for You (Approvals & Gate Confirmations) */}
        <div className="rounded-xl bg-[#141417] border border-[#26262e] p-5 flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <Hourglass className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-zinc-200 text-base">Waiting for You</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/80 text-red-300 border border-red-800/60">
                {waiting.total} action items
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Hard Approval Gates requiring your explicit confirmation.
            </p>

            <div className="space-y-2">
              {waiting.proposals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#1e1717] border border-red-900/40"
                >
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      Proposal: {p.client?.business_name || p.lead?.business_name || "Prospect"}
                    </div>
                    <div className="text-[11px] text-zinc-400">Needs Gate 2 Approval</div>
                  </div>
                  <Link
                    href={`/proposals/builder?id=${p.id}`}
                    className="px-2 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 text-xs font-medium border border-red-800/60"
                  >
                    Review
                  </Link>
                </div>
              ))}

              {waiting.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] border border-zinc-800"
                >
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      Invoice {inv.invoice_number} ({inv.client.business_name})
                    </div>
                    <div className="text-[11px] text-zinc-400">Status: {inv.status}</div>
                  </div>
                  <Link
                    href={`/invoices/builder?id=${inv.id}`}
                    className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30"
                  >
                    Open
                  </Link>
                </div>
              ))}

              {waiting.total === 0 && (
                <div className="p-4 rounded-lg bg-[#191920] border border-dashed border-zinc-800 text-center text-xs text-zinc-400">
                  No approval gates currently waiting.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800/60 text-xs text-zinc-500">
            Rule: AI never approves or marks sent automatically
          </div>
        </div>

        {/* CARD 4: Overdue Items */}
        <div className="rounded-xl bg-[#141417] border border-[#26262e] p-5 flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-zinc-200 text-base">Overdue Tasks</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
                {overdue.length} items
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Tasks past due date requiring immediate attention.
            </p>

            {overdue.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#191920] border border-dashed border-zinc-800 text-center text-xs text-zinc-400">
                Zero overdue tasks. You are on track!
              </div>
            ) : (
              <div className="space-y-2">
                {overdue.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-[#1d1614] border border-orange-900/40"
                  >
                    <div className="text-xs font-semibold text-zinc-200">{item.title}</div>
                    <div className="text-[11px] text-orange-400">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800/60 text-xs text-zinc-500">
            Day-level scheduling avoiding micro-management
          </div>
        </div>

        {/* CARD 5: Onboarding Pending */}
        <div className="rounded-xl bg-[#141417] border border-[#26262e] p-5 flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-zinc-200 text-base">Onboarding Pending</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                {onboarding.pending_checklist_items} open tasks
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Post-payment delivery checklists auto-created from Gate 5.
            </p>

            {onboarding.records.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#191920] border border-dashed border-zinc-800 text-center text-xs text-zinc-400">
                No active onboardings in progress.
              </div>
            ) : (
              <div className="space-y-2">
                {onboarding.records.map((onb) => {
                  const pendingCount = (onb.checklist || []).filter((i) => i.status === "pending").length;
                  return (
                    <div
                      key={onb.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#141d17] border border-emerald-900/40"
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          {onb.client?.business_name}
                        </div>
                        <div className="text-[11px] text-emerald-400">
                          {pendingCount} checklist items left
                        </div>
                      </div>
                      <Link
                        href={`/onboarding/${onb.id}`}
                        className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-medium border border-emerald-800/50"
                      >
                        Checklist
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
            <span className="text-zinc-500">{onboarding.active_count} clients in onboarding</span>
            <Link href="/clients" className="text-emerald-400 hover:underline">
              Clients &rarr;
            </Link>
          </div>
        </div>

        {/* CARD 6: System Quick Actions */}
        <div className="rounded-xl bg-[#141417] border border-[#26262e] p-5 flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-zinc-200 text-base">Quick Shortcuts</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Direct access to engine pipelines.
            </p>

            <div className="space-y-2 text-sm">
              <Link
                href="/import"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] hover:bg-[#22222a] border border-zinc-800 transition"
              >
                <span>📥 Import new CSV leads</span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </Link>
              <Link
                href="/leads"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] hover:bg-[#22222a] border border-zinc-800 transition"
              >
                <span>🔍 Open Lead Engine</span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </Link>
              <Link
                href="/proposals/builder"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1a20] hover:bg-[#22222a] border border-zinc-800 transition"
              >
                <span>📝 Create new Proposal</span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </Link>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800/60 text-xs text-zinc-500">
            Central database synchronized across both workspaces
          </div>
        </div>
      </div>
    </div>
  );
}
