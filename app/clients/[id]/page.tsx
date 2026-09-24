"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  FileText,
  Receipt,
  ArrowRight,
  Clock,
  Download,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { GateBadge } from "@/components/ui/GateBadge";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  category: "lead" | "message" | "proposal" | "invoice" | "payment" | "onboarding";
  badge?: string;
}

interface ClientDetail {
  client: {
    id: string;
    business_name: string;
    primary_contact?: string | null;
    email?: string | null;
    phone?: string | null;
    stage: string;
    payment_status: string;
    created_at: string;
    proposals: Array<{
      id: string;
      status: string;
      total_investment: number;
      approved_at?: string;
      sent_confirmed_at?: string;
    }>;
    invoices: Array<{
      id: string;
      invoice_number: string;
      amount: number;
      status: string;
      sent_confirmed_at?: string;
      paid_confirmed_at?: string;
    }>;
    onboarding?: {
      id: string;
      status: string;
      checklist: Array<{ item: string; status: string }>;
    } | null;
  };
  timeline: TimelineEvent[];
  documents: Array<{
    id: string;
    type: string;
    title: string;
    file_url: string;
  }>;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { setActiveEntity } = useBusinessBrain();

  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit / Delete states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    business_name: "",
    primary_contact: "",
    email: "",
    phone: "",
    stage: "Proposal",
    payment_status: "Pending",
  });

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setFormData({
          business_name: json.client.business_name || "",
          primary_contact: json.client.primary_contact || "",
          email: json.client.email || "",
          phone: json.client.phone || "",
          stage: json.client.stage || "Proposal",
          payment_status: json.client.payment_status || "Pending",
        });
        setActiveEntity({
          type: "client",
          id: json.client.id,
          name: json.client.business_name,
          data: json.client,
        });
      }
    } catch (err) {
      console.error("Failed to load client details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name.trim()) {
      setFormError("Business Name is required.");
      return;
    }
    setActionLoading(true);
    setFormError("");
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Failed to update client.");
        return;
      }
      setIsEditModalOpen(false);
      fetchClient();
    } catch (err: any) {
      setFormError(err.message || "Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/clients");
      }
    } catch (err) {
      console.error("Failed to delete client", err);
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchClient();
  }, [clientId]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-muted)]">Loading client journey timeline...</p>
      </div>
    );
  }

  const { client, timeline, documents } = data;

  // Gate readiness checks for progressive buttons
  const latestProposal = client.proposals[0];
  const isProposalAccepted = client.proposals.some((p) => p.status === "Accepted");
  const isInvoicePaid = client.payment_status === "Paid" || client.invoices.some((i) => i.status === "Paid");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Client Header Card */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)]">{client.business_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                Stage: {client.stage}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
              {client.primary_contact && (
                <span>Contact: <strong className="text-[var(--text-secondary)]">{client.primary_contact}</strong></span>
              )}
              {client.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progressive Stage Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Create Proposal */}
            <Link
              href={`/proposals/builder?client_id=${client.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Proposal</span>
            </Link>

            {/* 2. Create Invoice (Gated: enabled once Proposal = Accepted) */}
            {isProposalAccepted ? (
              <Link
                href={`/invoices/builder?client_id=${client.id}&proposal_id=${latestProposal?.id || ""}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </Link>
            ) : (
              <button
                disabled
                title="Enabled once a proposal is marked Accepted"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] text-[var(--text-dim)] text-xs font-medium border border-[var(--border)] cursor-not-allowed"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Create Invoice (Locked)</span>
              </button>
            )}

            {/* 3. View Onboarding (Gated: enabled once Invoice = Paid or Onboarding exists) */}
            {client.onboarding || isInvoicePaid ? (
              <Link
                href={client.onboarding ? `/onboarding/${client.onboarding.id}` : `/onboarding/${client.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>View Onboarding</span>
              </Link>
            ) : (
              <button
                disabled
                title="Enabled once payment is manually confirmed (Gate 5)"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] text-[var(--text-dim)] text-xs font-medium border border-[var(--border)] cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Onboarding (Locked)</span>
              </button>
            )}

            {/* 4. Edit Client */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border)] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Edit</span>
            </button>

            {/* 5. Delete Client */}
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--danger-soft)] text-[var(--text-dim)] hover:text-[var(--danger)] text-xs font-medium border border-[var(--border)] hover:border-[var(--danger-border)] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Current Status Badge Banner */}
        <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-muted)]">Current Pipeline State:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold border border-[var(--accent-border)]">
              {client.stage} — {client.payment_status === "Paid" ? "Payment Settled" : "Awaiting Actions"}
            </span>
          </div>
          <span className="text-[var(--text-dim)] text-[11px]">
            Follows strict Human-In-The-Loop 5-gate security model
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Chronological Journey Timeline (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="font-heading text-sm font-semibold text-[var(--text-primary)]">Chronological Client Journey</h2>
            </div>
            <span className="text-xs text-[var(--text-dim)]">{timeline.length} milestones logged</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
            {timeline.map((evt, idx) => (
              <div key={evt.id || idx} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[var(--surface)] group-hover:scale-125 transition" />

                <div className="p-3.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{evt.title}</span>
                    <span className="text-[11px] text-[var(--text-dim)]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {evt.description && (
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{evt.description}</p>
                  )}
                  {evt.badge && (
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-hover)]">
                        {evt.badge}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Documents Vault (1 col) */}
        <div className="space-y-6">
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="font-heading text-sm font-semibold text-[var(--text-primary)]">Linked Documents</h2>
              </div>
            </div>

            {/* Proposals Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Proposals ({client.proposals.length})
              </h3>
              {client.proposals.length === 0 ? (
                <p className="text-xs text-[var(--text-dim)]">No proposals created yet.</p>
              ) : (
                client.proposals.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">${p.total_investment}</div>
                      <div className="text-[11px] text-[var(--text-dim)]">Status: {p.status}</div>
                    </div>
                    <Link
                      href={`/proposals/builder?id=${p.id}`}
                      className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>

            {/* Invoices Summary */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Invoices ({client.invoices.length})
              </h3>
              {client.invoices.length === 0 ? (
                <p className="text-xs text-[var(--text-dim)]">No invoices generated yet.</p>
              ) : (
                client.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{inv.invoice_number}</div>
                      <div className="text-[11px] text-[var(--text-dim)]">
                        ${inv.amount} • {inv.status}
                      </div>
                    </div>
                    <Link
                      href={`/invoices/builder?id=${inv.id}`}
                      className="text-[#a78bfa] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>

            {/* Onboarding Summary & Tasks */}
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Onboarding Checklist
                </h3>
                {client.onboarding && (
                  <Link
                    href={`/onboarding/${client.onboarding.id}`}
                    className="text-[var(--success)] hover:underline inline-flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Full Hub</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
              {client.onboarding ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[var(--success-soft)] border border-[var(--success-border)] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-[var(--success)]">
                        Status: {client.onboarding.status}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {Array.isArray(client.onboarding.checklist) ? client.onboarding.checklist.length : 0} onboarding tasks
                      </div>
                    </div>
                  </div>
                  {/* Visibly render checklist tasks directly on client page */}
                  {Array.isArray(client.onboarding.checklist) && (
                    <div className="space-y-1.5 pt-1">
                      {client.onboarding.checklist.map((item: any, idx: number) => {
                        const isDone = item.status === "done";
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              readOnly
                              className="rounded border-[var(--border)] text-emerald-500 focus:ring-0 cursor-default"
                            />
                            <span className={isDone ? "line-through text-[var(--text-dim)]" : "text-[var(--text-primary)]"}>
                              {item.item}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-dim)]">
                  Auto-created strictly when payment is confirmed (Gate 5).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── EDIT CLIENT MODAL ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Edit Client</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
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

            <form onSubmit={handleUpdateClient} className="space-y-3 text-xs">
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

              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Primary Contact Person</label>
                <input
                  type="text"
                  value={formData.primary_contact}
                  onChange={(e) => setFormData({ ...formData, primary_contact: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Pipeline Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Proposal">Proposal</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Paid">Paid</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* ─── DELETE CLIENT MODAL ─── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--danger-border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-[var(--danger-soft)] text-[var(--danger)]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-[var(--text-primary)]">Delete Client?</h2>
                <p className="text-xs text-[var(--text-dim)]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to delete <strong className="text-[var(--text-primary)]">{client.business_name}</strong>?
              This will permanently remove this client and all associated proposals, invoices, and onboarding workflows.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-[var(--danger)] hover:opacity-90 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Client</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
