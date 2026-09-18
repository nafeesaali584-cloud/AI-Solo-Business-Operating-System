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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202026]">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>S3 — Lead List (Workspace A)</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Browse, filter, and assign leads to your daily 3-target focus quota.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Target Quota Meter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#15151c] border border-amber-500/30 text-xs">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">Daily Target Quota:</span>
            <span className="font-bold text-amber-300">{quotaCount} / 3 Active</span>
          </div>

          <Link
            href="/import"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import CSV</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#141417] border border-[#26262e]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="bg-[#1b1b22] border border-[#2d2d38] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-500 w-48 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1b1b22] border border-[#2d2d38] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-500"
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
            className="bg-[#1b1b22] border border-[#2d2d38] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-500"
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            targetsOnly
              ? "bg-amber-500 text-zinc-950 border-amber-400"
              : "bg-[#1b1b22] text-zinc-400 hover:text-zinc-200 border-[#2d2d38]"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Today&apos;s Targets Only</span>
        </button>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl bg-[#141417] border border-[#26262e] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-3">
            <Users className="w-10 h-10 mx-auto text-zinc-600" />
            <p className="text-sm">No leads match your current search and filters.</p>
            <Link
              href="/import"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import leads from CSV</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181f] text-zinc-400 border-b border-[#26262e]">
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
              <tbody className="divide-y divide-zinc-800/60">
                {filteredLeads.map((lead) => {
                  const lastInteraction = lead.interactions?.[0];
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="hover:bg-[#1a1a21] cursor-pointer transition group"
                    >
                      <td className="p-3.5 font-medium text-zinc-100 group-hover:text-amber-400 transition">
                        <div>{lead.business_name}</div>
                        {lead.website && (
                          <div className="text-[11px] text-zinc-500">{lead.website}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-zinc-400">
                        {lead.niche_industry || <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="p-3.5 text-zinc-400">
                        {lead.city_country || <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            lead.status === "Won"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : lead.status === "Contacted"
                              ? "bg-blue-950 text-blue-300 border border-blue-800"
                              : lead.status === "Booking" || lead.status === "Proposal"
                              ? "bg-purple-950 text-purple-300 border border-purple-800"
                              : lead.status === "Lost"
                              ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              : "bg-zinc-800/80 text-zinc-300"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-400">
                        {lastInteraction ? (
                          <span title={lastInteraction.channel}>
                            {new Date(lastInteraction.created_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-zinc-600">Never</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleTarget(lead.id, lead.is_today_target, e)}
                          title={lead.is_today_target ? "Unmark target" : "Mark as Today's Target (Max 3)"}
                          className={`p-1.5 rounded-lg border transition ${
                            lead.is_today_target
                              ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                              : "bg-[#1d1d24] text-zinc-500 hover:text-zinc-300 border-zinc-700/60"
                          }`}
                        >
                          <Target className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="px-2.5 py-1 rounded bg-[#1e1e26] hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-700/60 transition inline-flex items-center gap-1"
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
