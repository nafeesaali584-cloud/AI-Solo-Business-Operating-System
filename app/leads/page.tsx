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
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
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

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Form data for Add / Edit
  const [formData, setFormData] = useState({
    business_name: "",
    niche_industry: "",
    city_country: "",
    phone: "",
    email: "",
    website: "",
    status: "Imported",
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (targetsOnly) params.append("targets_only", "true");
      if (noReplyFilter) params.append("no_reply_days", noReplyFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const loadedLeads: LeadItem[] = json.leads || [];
        setLeads(loadedLeads);
        const currentTargets = loadedLeads.filter((l) => l.is_today_target).length;
        setQuotaCount(currentTargets);
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

  const handleOpenAdd = () => {
    setFormData({
      business_name: "",
      niche_industry: "",
      city_country: "",
      phone: "",
      email: "",
      website: "",
      status: "Imported",
    });
    setFormError("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (lead: LeadItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLead(lead);
    setFormData({
      business_name: lead.business_name,
      niche_industry: lead.niche_industry || "",
      city_country: lead.city_country || "",
      phone: lead.phone || "",
      email: lead.email || "",
      website: lead.website || "",
      status: lead.status,
    });
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (lead: LeadItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLead(lead);
    setIsDeleteModalOpen(true);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name.trim()) {
      setFormError("Business Name is required.");
      return;
    }
    setActionLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create lead.");
        return;
      }
      setIsAddModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || "Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (!formData.business_name.trim()) {
      setFormError("Business Name is required.");
      return;
    }
    setActionLoading(true);
    setFormError("");
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update lead.");
        return;
      }
      setIsEditModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || "Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedLead(null);
        fetchLeads();
      }
    } catch (err) {
      console.error("Failed to delete lead", err);
    } finally {
      setActionLoading(false);
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Target Quota Meter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--accent-border)] text-xs">
            <Target className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[var(--text-muted)]">Daily Target Quota:</span>
            <span className="font-bold text-[var(--accent)]">{quotaCount} / 3 Active</span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)] transition-colors"
          >
            <Plus className="w-4 h-4 text-[var(--accent)]" />
            <span>Add Single Lead</span>
          </button>

          <Link
            href="/import"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors"
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
              placeholder="Search leads, niche, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] w-56 transition-colors"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s}
              </option>
            ))}
          </select>

          {/* Follow-up Cadence Filter */}
          <select
            value={noReplyFilter}
            onChange={(e) => setNoReplyFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            <option value="">Any Timing</option>
            <option value="3">No reply in 3+ days</option>
            <option value="7">No reply in 7+ days</option>
          </select>

          {/* Targets Only Toggle */}
          <button
            onClick={() => setTargetsOnly(!targetsOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              targetsOnly
                ? "bg-[var(--accent)] text-white border-[var(--accent-border)] font-semibold"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Today&apos;s Targets only</span>
          </button>
        </div>

        <div className="text-xs text-[var(--text-muted)]">
          Showing <span className="font-semibold text-[var(--text-primary)]">{filteredLeads.length}</span> leads
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
            <span className="text-xs text-[var(--text-muted)]">Loading leads directory...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-[var(--text-dim)] mx-auto opacity-60" />
            <p className="text-sm font-medium text-[var(--text-primary)]">No leads found</p>
            <p className="text-xs text-[var(--text-muted)]">
              Try adjusting your filters or click &quot;Add Single Lead&quot; above to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] text-[var(--text-muted)] border-b border-[var(--border)] uppercase tracking-wider font-semibold text-[10px]">
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleOpenEdit(lead, e)}
                            title="Edit Lead"
                            className="p-1.5 rounded bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenDelete(lead, e)}
                            title="Delete Lead"
                            className="p-1.5 rounded bg-[var(--surface-hover)] hover:bg-[var(--danger-soft)] text-[var(--text-muted)] hover:text-[var(--danger)] border border-[var(--border)] hover:border-[var(--danger-border)] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="px-2 py-1 rounded bg-[var(--surface-hover)] hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border)] transition-colors inline-flex items-center gap-1"
                          >
                            <span>Card</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD LEAD MODAL ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Add Single Lead</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] text-xs text-[var(--danger)]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elegance Salon & Spa"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Niche / Industry</label>
                  <input
                    type="text"
                    placeholder="e.g. Hair Salon"
                    value={formData.niche_industry}
                    onChange={(e) => setFormData({ ...formData, niche_industry: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">City / Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Dubai, UAE"
                    value={formData.city_country}
                    onChange={(e) => setFormData({ ...formData, city_country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+971 50 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    type="email"
                    placeholder="info@elegance.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Website</label>
                <input
                  type="text"
                  placeholder="https://elegance.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT LEAD MODAL ─── */}
      {isEditModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Edit Lead</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedLead(null);
                }}
                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] text-xs text-[var(--danger)]">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateLead} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Niche / Industry</label>
                  <input
                    type="text"
                    value={formData.niche_industry}
                    onChange={(e) => setFormData({ ...formData, niche_industry: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">City / Location</label>
                  <input
                    type="text"
                    value={formData.city_country}
                    onChange={(e) => setFormData({ ...formData, city_country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  {statuses.filter((s) => s !== "ALL").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedLead(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE LEAD MODAL ─── */}
      {isDeleteModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--danger-border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-[var(--danger-soft)] text-[var(--danger)]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">Delete Lead?</h2>
                <p className="text-xs text-[var(--text-dim)]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to delete <strong className="text-[var(--text-primary)]">{selectedLead.business_name}</strong>?
              This will permanently remove the lead and all associated contacts, deals, tasks, and interaction records.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedLead(null);
                }}
                className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLead}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-[var(--danger)] hover:opacity-90 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
