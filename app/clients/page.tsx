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
  CheckCircle2,
  Clock,
  Search,
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

        <div className="flex items-center gap-2">
          <Link
            href="/proposals/builder"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Proposal</span>
          </Link>
          <Link
            href="/invoices/builder"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-hover)] transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter clients by name, contact, stage..."
            className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <span className="text-xs text-[var(--text-muted)]">{filtered.length} total client(s)</span>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)] space-y-2">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mx-auto" />
            <p className="text-xs">Loading client portfolio...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-dim)] space-y-3">
            <Briefcase className="w-10 h-10 mx-auto text-[var(--text-dim)]" />
            <p className="text-sm">No clients in conversion pipeline yet.</p>
            <p className="text-xs text-[var(--text-dim)]">
              When a lead in Workspace A reaches agreement, click &quot;Move to Proposal&quot; on their Lead Card.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="p-3.5">Business Name</th>
                  <th className="p-3.5">Primary Contact</th>
                  <th className="p-3.5">Conversion Stage</th>
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
                      <Link
                        href={`/clients/${client.id}`}
                        className="px-2.5 py-1 rounded bg-[var(--surface-raised)] hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent-border)] transition-colors inline-flex items-center gap-1"
                      >
                        <span>Timeline</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
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
