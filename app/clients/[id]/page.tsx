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

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
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

  useEffect(() => {
    if (clientId) fetchClient();
  }, [clientId]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-zinc-400">Loading client journey timeline...</p>
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
      <div className="rounded-xl bg-[#141417] border border-[#26262e] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-zinc-100">{client.business_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                Stage: {client.stage}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
              {client.primary_contact && (
                <span>Contact: <strong className="text-zinc-300">{client.primary_contact}</strong></span>
              )}
              {client.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold shadow transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Proposal</span>
            </Link>

            {/* 2. Create Invoice (Gated: enabled once Proposal = Accepted) */}
            {isProposalAccepted ? (
              <Link
                href={`/invoices/builder?client_id=${client.id}&proposal_id=${latestProposal?.id || ""}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </Link>
            ) : (
              <button
                disabled
                title="Enabled once a proposal is marked Accepted"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#181820] text-zinc-600 text-xs font-medium border border-zinc-800 cursor-not-allowed"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Create Invoice (Locked)</span>
              </button>
            )}

            {/* 3. View Onboarding (Gated: enabled once Invoice = Paid) */}
            {isInvoicePaid && client.onboarding ? (
              <Link
                href={`/onboarding/${client.onboarding.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>View Onboarding</span>
              </Link>
            ) : (
              <button
                disabled
                title="Enabled once payment is manually confirmed (Gate 5)"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#181820] text-zinc-600 text-xs font-medium border border-zinc-800 cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Onboarding (Locked)</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Status Badge Banner */}
        <div className="p-3 rounded-lg bg-[#191922] border border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Current Pipeline State:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 font-bold border border-amber-800">
              {client.stage} — {client.payment_status === "Paid" ? "Payment Settled" : "Awaiting Actions"}
            </span>
          </div>
          <span className="text-zinc-500 text-[11px]">
            Follows strict Human-In-The-Loop 5-gate security model
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Chronological Journey Timeline (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[#141417] border border-[#26262e] p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Chronological Client Journey</h2>
            </div>
            <span className="text-xs text-zinc-500">{timeline.length} milestones logged</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
            {timeline.map((evt, idx) => (
              <div key={evt.id || idx} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-[#141417] group-hover:scale-125 transition" />

                <div className="p-3.5 rounded-lg bg-[#181820] border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-200">{evt.title}</span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {evt.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed">{evt.description}</p>
                  )}
                  {evt.badge && (
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
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
          <div className="rounded-xl bg-[#141417] border border-[#26262e] p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Linked Documents</h2>
              </div>
            </div>

            {/* Proposals Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Proposals ({client.proposals.length})
              </h3>
              {client.proposals.length === 0 ? (
                <p className="text-xs text-zinc-600">No proposals created yet.</p>
              ) : (
                client.proposals.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-[#181820] border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-zinc-200">${p.total_investment}</div>
                      <div className="text-[11px] text-zinc-500">Status: {p.status}</div>
                    </div>
                    <Link
                      href={`/proposals/builder?id=${p.id}`}
                      className="text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>

            {/* Invoices Summary */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Invoices ({client.invoices.length})
              </h3>
              {client.invoices.length === 0 ? (
                <p className="text-xs text-zinc-600">No invoices generated yet.</p>
              ) : (
                client.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-lg bg-[#181820] border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-zinc-200">{inv.invoice_number}</div>
                      <div className="text-[11px] text-zinc-500">
                        ${inv.amount} • {inv.status}
                      </div>
                    </div>
                    <Link
                      href={`/invoices/builder?id=${inv.id}`}
                      className="text-purple-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>

            {/* Onboarding Summary */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Onboarding Setup
              </h3>
              {client.onboarding ? (
                <div className="p-2.5 rounded-lg bg-[#151c16] border border-emerald-900/50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-emerald-300">
                      Status: {client.onboarding.status}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {client.onboarding.checklist.length} checklist items
                    </div>
                  </div>
                  <Link
                    href={`/onboarding/${client.onboarding.id}`}
                    className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Checklist</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  Auto-created strictly when payment is confirmed (Gate 5).
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
