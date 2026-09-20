"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ExternalLink,
  Loader2,
  Receipt,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  X,
} from "lucide-react";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface ClientItem {
  id: string;
  business_name: string;
  primary_contact?: string | null;
  email?: string | null;
  phone?: string | null;
  stage: string;
  payment_status: string;
  last_activity: string;
  created_at: string;
  proposals?: Array<{ id: string; status: string; total_investment: number }>;
  invoices?: Array<{ id: string; status: string; amount: number }>;
}

export default function ClientListPage() {
  const router = useRouter();
  const { setActiveEntity } = useBusinessBrain();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    business_name: "",
    primary_contact: "",
    email: "",
    phone: "",
    stage: "Proposal",
    payment_status: "Pending",
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const json = await res.json();
        setClients(json.clients || []);
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    setActiveEntity({
      type: "client",
      name: "Client Conversion & Delivery",
      data: { view: "client_list" },
    });
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      business_name: "",
      primary_contact: "",
      email: "",
      phone: "",
      stage: "Proposal",
      payment_status: "Pending",
    });
    setFormError("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (client: ClientItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(client);
    setFormData({
      business_name: client.business_name,
      primary_contact: client.primary_contact || "",
      email: client.email || "",
      phone: client.phone || "",
      stage: client.stage,
      payment_status: client.payment_status,
    });
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (client: ClientItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name.trim()) {
      setFormError("Business Name is required.");
      return;
    }
    setActionLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create client.");
        return;
      }
      setIsAddModalOpen(false);
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || "Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!formData.business_name.trim()) {
      setFormError("Business Name is required.");
      return;
    }
    setActionLoading(true);
    setFormError("");
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to update client.");
        return;
      }
      setIsEditModalOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || "Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        setSelectedClient(null);
        fetchClients();
      }
    } catch (err) {
      console.error("Failed to delete client", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.business_name.toLowerCase().includes(q) ||
      (c.primary_contact && c.primary_contact.toLowerCase().includes(q)) ||
      c.stage.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span>S5 — Client List (Workspace B)</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Client Conversion &amp; Delivery Engine. Tracking won deals from proposal through delivery and active status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
          <Link
            href="/proposals/builder"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border)] transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>New Proposal</span>
          </Link>
          <Link
            href="/invoices/builder"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border)] transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search clients by name, contact, or stage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          Total: <strong className="text-[var(--text-primary)]">{filtered.length}</strong> clients
        </div>
      </div>

      {/* Client Table Card */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
            <span className="text-xs text-[var(--text-muted)]">Loading client directory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Briefcase className="w-8 h-8 text-[var(--text-dim)] mx-auto opacity-60" />
            <p className="text-sm font-medium text-[var(--text-primary)]">No clients found</p>
            <p className="text-xs text-[var(--text-muted)]">
              Convert a lead from Workspace A or click &quot;Add Client&quot; above to create one manually.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] text-[var(--text-muted)] border-b border-[var(--border)] uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5">Business Name</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Stage</th>
                  <th className="p-3.5">Payment Status</th>
                  <th className="p-3.5">Last Activity</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className="hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group"
                  >
                    <td className="p-3.5 font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      <div>{client.business_name}</div>
                      {client.email && <div className="text-[11px] text-[var(--text-dim)]">{client.email}</div>}
                    </td>
                    <td className="p-3.5 text-[var(--text-secondary)]">
                      {client.primary_contact || <span className="text-[var(--text-dim)]">—</span>}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          client.stage === "Active"
                            ? "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]"
                            : client.stage === "Onboarding"
                            ? "bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info-border)]"
                            : client.stage === "Paid"
                            ? "bg-[color-mix(in_srgb,#14b8a6_12%,transparent)] text-[#2dd4bf] border border-[color-mix(in_srgb,#14b8a6_30%,transparent)]"
                            : client.stage === "Invoice"
                            ? "bg-[color-mix(in_srgb,#8b5cf6_12%,transparent)] text-[#a78bfa] border border-[color-mix(in_srgb,#8b5cf6_30%,transparent)]"
                            : "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]"
                        }`}
                      >
                        {client.stage}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          client.payment_status === "Paid"
                            ? "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]"
                            : client.payment_status === "Overdue"
                            ? "bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)]"
                            : "bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border-hover)]"
                        }`}
                      >
                        {client.payment_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[var(--text-muted)]">
                      {new Date(client.last_activity).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleOpenEdit(client, e)}
                          title="Edit Client"
                          className="p-1.5 rounded bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenDelete(client, e)}
                          title="Delete Client"
                          className="p-1.5 rounded bg-[var(--surface-hover)] hover:bg-[var(--danger-soft)] text-[var(--text-muted)] hover:text-[var(--danger)] border border-[var(--border)] hover:border-[var(--danger-border)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/clients/${client.id}`}
                          className="px-2 py-1 rounded bg-[var(--surface-raised)] hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent-border)] transition-colors inline-flex items-center gap-1"
                        >
                          <span>Timeline</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD CLIENT MODAL ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Add New Client</h2>
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

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Health Clinic"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Primary Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Jenkins"
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
                    placeholder="contact@apex.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
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
                  <span>Save Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT CLIENT MODAL ─── */}
      {isEditModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Edit Client</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedClient(null);
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
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedClient(null);
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
                  <span>Update Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CLIENT CONFIRMATION MODAL ─── */}
      {isDeleteModalOpen && selectedClient && (
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
              Are you sure you want to delete <strong className="text-[var(--text-primary)]">{selectedClient.business_name}</strong>?
              This will permanently remove the client and all associated proposals, invoices, and onboarding data.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedClient(null);
                }}
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
