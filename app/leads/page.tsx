"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UploadCloud,
  Target,
  Filter,
  Search,
  ArrowUpDown,
  ExternalLink,
  Calendar,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface LeadItem {
  id: string;
  business_name: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  city_country?: string | null;
  niche_industry?: string | null;
  key_services?: string | null;
  rating?: number | null;
  review_count?: number | null;
  address?: string | null;
  source_csv_row?: any;
  status: string;
  is_today_target: boolean;
  created_at: string;
  updated_at: string;
  interactions?: Array<{
    created_at: string;
    channel: string;
    confirmed_sent: boolean;
  }>;
}

export default function LeadListPage() {
  const router = useRouter();
  const { setActiveEntity } = useBusinessBrain();

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [targetsOnly, setTargetsOnly] = useState(false);
  const [noReplyFilter, setNoReplyFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [quotaCount, setQuotaCount] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (targetsOnly) params.append("targets_only", "true");
      if (noReplyFilter) params.append("no_reply_days", noReplyFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads || []);
        const activeTargets = (json.leads || []).filter((l: LeadItem) => l.is_today_target).length;
        setQuotaCount(activeTargets);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    setActiveEntity({
      type: "lead",
      name: "Lead Intelligence List",
      data: { count: leads.length },
    });
  }, [statusFilter, targetsOnly, noReplyFilter]);

  const toggleTarget = async (leadId: string, currentTargetState: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionMessage(null);

    const newState = !currentTargetState;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_today_target: newState }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage(`⚠️ ${data.error}`);
        setTimeout(() => setActionMessage(null), 4000);
        return;
      }

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, is_today_target: newState } : l))
      );
      setQuotaCount((prev) => (newState ? prev + 1 : prev - 1));
    } catch (err) {
      console.error("Failed to toggle target status", err);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.business_name.toLowerCase().includes(q) ||
      (l.niche_industry && l.niche_industry.toLowerCase().includes(q)) ||
      (l.city_country && l.city_country.toLowerCase().includes(q))
    );
  });

  const statuses = [
    "ALL",
    "Imported",
    "Qualified",
    "Target Today",
    "Contacted",
    "Replied",
    "Booking",
    "Proposal",
    "Won",
    "Lost",
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span>S3 — Lead List (Workspace A)</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Browse, filter, and assign leads to your daily 3-target focus quota.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Target Quota Meter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--accent-border)] text-xs">
            <Target className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[var(--text-muted)]">Daily Target Quota:</span>
            <span className="font-bold text-[var(--accent)]">{quotaCount} / 3 Active</span>
          </div>

          <Link
            href="/import"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import CSV</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none focus:border-[var(--accent)] w-48 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>
          </div>

          {/* No Reply in X days Filter */}
          <select
            value={noReplyFilter}
            onChange={(e) => setNoReplyFilter(e.target.value)}
            className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
          >
            <option value="">All Follow-up Windows</option>
            <option value="2">No reply in 2+ days</option>
            <option value="4">No reply in 4+ days (Default Cadence)</option>
            <option value="7">No reply in 7+ days (Stalled)</option>
          </select>
        </div>

        {/* Targets Only Toggle */}
        <button
          onClick={() => setTargetsOnly(!targetsOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            targetsOnly
              ? "bg-[var(--accent)] text-white border-[var(--accent-border)]"
              : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border)]"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Today&apos;s Targets Only</span>
        </button>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)] space-y-2">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mx-auto" />
            <p className="text-xs">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-dim)] space-y-3">
            <Users className="w-10 h-10 mx-auto text-[var(--text-dim)]" />
            <p className="text-sm">No leads match your current search and filters.</p>
            <Link
              href="/import"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import leads from CSV</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="p-3.5">Business Name</th>
                  <th className="p-3.5">Niche / Industry</th>
                  <th className="p-3.5">City / Location</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Last Contact</th>
                  <th className="p-3.5 text-center">Today&apos;s Target</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredLeads.map((lead) => {
                  const lastInteraction = lead.interactions?.[0];
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group"
                    >
                      <td className="p-3.5 font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{lead.business_name}</span>
                          {lead.rating && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
                              ⭐ {lead.rating} {lead.review_count ? `(${lead.review_count})` : ""}
                            </span>
                          )}
                        </div>
                        {lead.website && (
                          <div className="text-[11px] text-[var(--text-dim)]">{lead.website}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-[var(--text-secondary)]">
                        {lead.niche_industry ||
                          lead.key_services ||
                          (lead as any).source_csv_row?.Specialization ||
                          (lead as any).source_csv_row?.specialization ||
                          (lead as any).source_csv_row?.Niche ||
                          (lead as any).source_csv_row?.niche || (
                            <span className="text-[var(--text-dim)]">—</span>
                          )}
                      </td>
                      <td className="p-3.5 text-[var(--text-muted)]">
                        {lead.city_country || <span className="text-[var(--text-dim)]">—</span>}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            lead.status === "Won"
                              ? "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]"
                              : lead.status === "Contacted"
                              ? "bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-border)]"
                              : lead.status === "Booking" || lead.status === "Proposal"
                              ? "bg-[color-mix(in_srgb,#8b5cf6_12%,transparent)] text-[#a78bfa] border border-[color-mix(in_srgb,#8b5cf6_30%,transparent)]"
                              : lead.status === "Lost"
                              ? "bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border-hover)]"
                              : "bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[var(--text-muted)]">
                        {lastInteraction ? (
                          <span title={lastInteraction.channel}>
                            {new Date(lastInteraction.created_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[var(--text-dim)]">Never</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleTarget(lead.id, lead.is_today_target, e)}
                          title={lead.is_today_target ? "Unmark target" : "Mark as Today's Target (Max 3)"}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            lead.is_today_target
                              ? "bg-[var(--accent)] text-white border-[var(--accent-border)] font-bold"
                              : "bg-[var(--surface-hover)] text-[var(--text-dim)] hover:text-[var(--text-secondary)] border-[var(--border)]"
                          }`}
                        >
                          <Target className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="px-2.5 py-1 rounded bg-[var(--surface-hover)] hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border)] transition-colors inline-flex items-center gap-1"
                        >
                          <span>Lead Card</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
