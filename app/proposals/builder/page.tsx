"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import {
  FileText,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Send,
  Download,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { GateBadge } from "@/components/ui/GateBadge";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface ServiceItem {
  name: string;
  description: string;
  price: number;
}

function ProposalBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get("id");
  const clientIdParam = searchParams.get("client_id");
  const leadIdParam = searchParams.get("lead_id");
  const { setActiveEntity } = useBusinessBrain();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Proposal state
  const [id, setId] = useState<string | null>(proposalId);
  const [clientId, setClientId] = useState<string | null>(clientIdParam);
  const [leadId, setLeadId] = useState<string | null>(leadIdParam);
  const [clientName, setClientName] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([
    { name: "Website Architecture & UX Redesign", description: "Complete responsive overhaul with conversion optimization", price: 1500 },
    { name: "Automated Lead Intake & CRM Pipeline", description: "Instant notification and follow-up sequence setup", price: 800 },
  ]);
  const [scope, setScope] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("Estimated delivery: 3 weeks from initial kickoff.");
  const [terms, setTerms] = useState("50% upfront deposit upon invoice receipt, 50% upon final delivery.");
  const [status, setStatus] = useState<"Draft" | "Approved" | "Sent" | "Accepted" | "Rejected">("Draft");
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [sentConfirmedAt, setSentConfirmedAt] = useState<string | null>(null);

  // Load existing proposal or prefill client data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (proposalId) {
          const res = await fetch(`/api/proposals?id=${proposalId}`);
          if (res.ok) {
            const json = await res.json();
            const p = json.proposal;
            setId(p.id);
            setClientId(p.client_id);
            setLeadId(p.lead_id);
            setClientName(p.client?.business_name || p.lead?.business_name || "Client");
            if (p.services) setServices(p.services);
            setScope(p.scope || "");
            setDeliverables(p.deliverables || "");
            setTimeline(p.timeline || "");
            setTerms(p.terms || "");
            setStatus(p.status);
            setApprovedAt(p.approved_at);
            setSentConfirmedAt(p.sent_confirmed_at);

            setActiveEntity({
              type: "proposal",
              id: p.id,
              name: `Proposal for ${p.client?.business_name || "Client"}`,
              data: p,
            });
          }
        } else if (clientIdParam) {
          const res = await fetch(`/api/clients/${clientIdParam}`);
          if (res.ok) {
            const json = await res.json();
            setClientName(json.client.business_name);
          }
        } else if (leadIdParam) {
          const res = await fetch(`/api/leads/${leadIdParam}`);
          if (res.ok) {
            const json = await res.json();
            setClientName(json.lead.business_name);
          }
        }
      } catch (err) {
        console.error("Failed to load proposal data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [proposalId, clientIdParam, leadIdParam]);

  const totalInvestment = services.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const addServiceItem = () => {
    setServices([...services, { name: "", description: "", price: 0 }]);
  };

  const removeServiceItem = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateServiceItem = (index: number, field: keyof ServiceItem, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  // AI Draft Generator: Scope & Deliverables
  const handleGenerateAiDraft = async () => {
    setGeneratingAi(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/ai/draft-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          lead_id: leadId,
          services,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.draft) {
          setScope(json.draft.scope || scope);
          setDeliverables(json.draft.deliverables || deliverables);
          if (json.draft.timeline) setTimeline(json.draft.timeline);
          if (json.draft.terms) setTerms(json.draft.terms);
        }
      }
    } catch (err) {
      console.error("Failed to generate AI proposal draft", err);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Save Proposal
  const handleSaveProposal = async () => {
    setSaving(true);
    setActionMessage(null);
    try {
      if (id) {
        const res = await fetch("/api/proposals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            services,
            scope,
            deliverables,
            timeline,
            terms,
            total_investment: totalInvestment,
          }),
        });
        if (res.ok) {
          setActionMessage({ text: "Proposal draft saved successfully.", type: "success" });
        }
      } else {
        const res = await fetch("/api/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            lead_id: leadId,
            services,
            scope,
            deliverables,
            timeline,
            terms,
            total_investment: totalInvestment,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setId(json.proposal.id);
          router.replace(`/proposals/builder?id=${json.proposal.id}`);
          setActionMessage({ text: "Proposal created.", type: "success" });
        }
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Save failed.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // GATE 2: Approve Proposal
  const handleApproveGate2 = async () => {
    if (!id) await handleSaveProposal();
    if (!id) return;

    try {
      const res = await fetch("/api/gates/gate2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: id }),
      });
      if (res.ok) {
        setStatus("Approved");
        setApprovedAt(new Date().toISOString());
        setActionMessage({
          text: "GATE 2 CLEARED: Proposal explicitly approved. PDF ready for client dispatch.",
          type: "success",
        });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Gate 2 failed", type: "error" });
    }
  };

  // GATE 3: Mark Proposal as Sent
  const handleMarkSentGate3 = async () => {
    if (!id) return;
    try {
      const res = await fetch("/api/gates/gate3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: id }),
      });
      if (res.ok) {
        setStatus("Sent");
        setSentConfirmedAt(new Date().toISOString());
        setActionMessage({
          text: "GATE 3 CLEARED: Proposal manually confirmed sent to client.",
          type: "success",
        });
      } else {
        const errJson = await res.json();
        setActionMessage({ text: errJson.error, type: "error" });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Gate 3 failed", type: "error" });
    }
  };

  // Client Decision: Accepted / Rejected
  const handleStatusChange = async (newStatus: "Accepted" | "Rejected") => {
    if (!id) return;
    try {
      const res = await fetch("/api/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        setActionMessage({
          text: `Proposal recorded as ${newStatus}.`,
          type: "success",
        });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Update failed", type: "error" });
    }
  };

  // Download PDF using jsPDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CLIENT SERVICE PROPOSAL", 20, 25);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Prepared for: ${clientName}`, 20, 38);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Status: ${status}`, 20, 52);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 56, 190, 56);

    let y = 66;
    doc.setFont("helvetica", "bold");
    doc.text("Services & Deliverables:", 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    services.forEach((s) => {
      doc.text(`• ${s.name} - $${s.price}`, 25, y);
      y += 6;
      if (s.description) {
        doc.setFontSize(10);
        doc.text(`  ${s.description.slice(0, 80)}`, 25, y);
        doc.setFontSize(12);
        y += 6;
      }
    });

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Investment: $${totalInvestment.toLocaleString()}`, 20, y);
    y += 12;

    if (scope) {
      doc.text("Scope of Work:", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      const splitScope = doc.splitTextToSize(scope, 165);
      doc.text(splitScope, 20, y);
      y += splitScope.length * 6 + 6;
    }

    if (terms) {
      doc.setFont("helvetica", "bold");
      doc.text("Payment Terms:", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      const splitTerms = doc.splitTextToSize(terms, 165);
      doc.text(splitTerms, 20, y);
    }

    doc.save(`Proposal_${clientName.replace(/\s+/g, "_")}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-zinc-400">Loading Proposal Builder...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202026]">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>S7 — Proposal Builder (Workspace B)</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Craft, approve, and track professional client proposals with verified hard approval gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {approvedAt ? (
            <GateBadge gateNumber={2} isUnlocked={true} label="GATE 2: APPROVED" />
          ) : (
            <GateBadge gateNumber={2} isUnlocked={false} label="GATE 2: DRAFT" />
          )}
          {sentConfirmedAt ? (
            <GateBadge gateNumber={3} isUnlocked={true} label="GATE 3: SENT" />
          ) : (
            <GateBadge gateNumber={3} isUnlocked={false} label="GATE 3: UNSENT" />
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
              : "bg-red-950/70 border-red-800 text-red-300"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Target Client Bar */}
      <div className="p-4 rounded-xl bg-[#141417] border border-[#26262e] flex items-center justify-between">
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Client Prospect</span>
          <div className="text-lg font-bold text-zinc-100">{clientName || "Direct Proposal Draft"}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAiDraft}
            disabled={generatingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition disabled:opacity-50"
          >
            {generatingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Generate Draft (AI)</span>
          </button>
        </div>
      </div>

      {/* Services Line Items */}
      <div className="p-6 rounded-xl bg-[#141417] border border-[#26262e] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Services &amp; Pricing Breakdown</h2>
          <button
            onClick={addServiceItem}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        </div>

        <div className="space-y-3">
          {services.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-[#181820] border border-zinc-800/80 space-y-2 relative group"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateServiceItem(index, "name", e.target.value)}
                    placeholder="Service name (e.g. Workflow Automation)"
                    className="w-full bg-[#1e1e26] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-xs text-zinc-500">$</span>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateServiceItem(index, "price", parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    className="w-full bg-[#1e1e26] border border-zinc-700 rounded pl-6 pr-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <textarea
                rows={1}
                value={item.description}
                onChange={(e) => updateServiceItem(index, "description", e.target.value)}
                placeholder="Scope details and deliverables for this item..."
                className="w-full bg-[#1e1e26] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-500"
              />
              {services.length > 1 && (
                <button
                  onClick={() => removeServiceItem(index)}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-700 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-sm font-semibold">
          <span className="text-zinc-400">Total Investment (Auto-summed):</span>
          <span className="text-lg text-amber-400">${totalInvestment.toLocaleString()}</span>
        </div>
      </div>

      {/* Scope & Deliverables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[#141417] border border-[#26262e] space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Project Scope</label>
          <textarea
            rows={5}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Comprehensive description of the engagement..."
            className="w-full bg-[#181820] border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-amber-500 leading-relaxed"
          />
        </div>

        <div className="p-5 rounded-xl bg-[#141417] border border-[#26262e] space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Tangible Deliverables</label>
          <textarea
            rows={5}
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            placeholder="Itemized deliverables..."
            className="w-full bg-[#181820] border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-amber-500 leading-relaxed"
          />
        </div>
      </div>

      {/* Timeline & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[#141417] border border-[#26262e] space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Timeline &amp; Milestones</label>
          <input
            type="text"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full bg-[#181820] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-500"
          />
        </div>

        <div className="p-5 rounded-xl bg-[#141417] border border-[#26262e] space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Payment Terms</label>
          <input
            type="text"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full bg-[#181820] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Action Toolbar & Approval Gates (Gates 2 & 3) */}
      <div className="p-5 rounded-xl bg-[#16161c] border border-[#26262e] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveProposal}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#202028] hover:bg-[#2a2a36] text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#202028] hover:bg-[#2a2a36] text-zinc-300 text-xs font-medium border border-zinc-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Gate Actions */}
        <div className="flex items-center gap-2">
          {/* Gate 2: Approve Proposal */}
          <button
            onClick={handleApproveGate2}
            disabled={status === "Approved" || status === "Sent" || status === "Accepted"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Proposal (Gate 2)</span>
          </button>

          {/* Gate 3: Mark Proposal as Sent (strictly disabled until Approved) */}
          <button
            onClick={handleMarkSentGate3}
            disabled={!approvedAt || status === "Sent" || status === "Accepted"}
            title={!approvedAt ? "Locked until Gate 2 (Approve) is cleared" : "Confirm manual dispatch"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mark as Sent (Gate 3)</span>
          </button>

          {/* Client Decision buttons */}
          {status === "Sent" && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-700">
              <button
                onClick={() => handleStatusChange("Accepted")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-xs font-medium transition"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Mark Accepted</span>
              </button>
              <button
                onClick={() => handleStatusChange("Rejected")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 text-xs font-medium transition"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Mark Rejected</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProposalBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-zinc-400">Loading Proposal Builder...</p>
        </div>
      }
    >
      <ProposalBuilderContent />
    </Suspense>
  );
}
