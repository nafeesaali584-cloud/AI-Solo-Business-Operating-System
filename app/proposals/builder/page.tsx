"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Palette,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { GateBadge } from "@/components/ui/GateBadge";
import { useBusinessBrain } from "@/context/BusinessBrainContext";
import { BRAND } from "@/lib/brand/config";
import {
  generateProposalPdf,
  loadProfileImageDataUrl,
  PdfTemplate,
} from "@/lib/brand/pdf-templates";
import { ProposalDocument } from "@/components/brand/ProposalDocument";
import { ThemeMode } from "@/lib/brand/tokens";

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
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate>("B");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeView, setActiveView] = useState<"preview" | "editor">("preview");
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>("dark");

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
        } else {
          // If no specific parameters, load existing canonical proposal
          const res = await fetch(`/api/proposals`);
          if (res.ok) {
            const json = await res.json();
            if (json.proposals && json.proposals.length > 0) {
              const p = json.proposals[0];
              setId(p.id);
              setClientId(p.client_id);
              setLeadId(p.lead_id);
              setClientName(p.client?.business_name || p.lead?.business_name || "Miss Al Reem Beauty Centre");
              if (p.services) setServices(p.services);
              setScope(p.scope || "");
              setDeliverables(p.deliverables || "");
              setTimeline(p.timeline || "");
              setTerms(p.terms || "");
              setStatus(p.status);
              setApprovedAt(p.approved_at);
              setSentConfirmedAt(p.sent_confirmed_at);
            }
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

  // Download PDF using Brand Kit & Selected Template
  const handleDownloadPdf = async (templateOverride?: PdfTemplate) => {
    const tmpl = templateOverride || selectedTemplate;
    setDownloadingPdf(true);
    try {
      const profileDataUrl = await loadProfileImageDataUrl();
      const doc = generateProposalPdf(
        tmpl,
        {
          clientName: clientName || "Miss Al Reem Beauty Centre",
          date: new Date().toLocaleDateString(),
          status,
          services,
          totalInvestment,
          scope,
          deliverables,
          timeline,
          terms,
          proposalNumber: id ? `PROP-${id.slice(0, 8).toUpperCase()}` : undefined,
        },
        profileDataUrl
      );
      const filename = `Proposal_${(clientName || "Proposal").replace(/\s+/g, "_")}_Template_${tmpl}.pdf`;
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setActionMessage({
        text: `Proposal PDF exported successfully: ${filename} (Download ready)`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Failed to generate PDF:", err);
      setActionMessage({ text: "Failed to generate branded PDF: " + (err.message || ""), type: "error" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-muted)]">Loading Proposal Builder...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span>S7 — Proposal Builder (Workspace B)</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
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
              ? "bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]"
              : "bg-[var(--danger-soft)] border-[var(--danger-border)] text-[var(--danger)]"
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

      {/* View Switcher: Document Preview vs Form Editor */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView("preview")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeView === "preview"
                ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Document Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("editor")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeView === "editor"
                ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                : "bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Edit Proposal Fields</span>
          </button>
        </div>

        {activeView === "preview" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] text-[var(--text-dim)] font-medium">Theme:</span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setPreviewTheme("dark");
                  setSelectedTemplate("B");
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  previewTheme === "dark"
                    ? "bg-[var(--surface-raised)] text-white font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Screen (dark)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewTheme("light");
                  setSelectedTemplate("A");
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  previewTheme === "light"
                    ? "bg-[#f6f4ef] text-zinc-900 font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Print (light)
              </button>
            </div>
          </div>
        )}

        <Link
          href="/documents/preview"
          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium ml-auto transition-colors"
        >
          <span>Fullscreen Showcase</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {activeView === "preview" ? (
        <div className="py-2">
          <ProposalDocument
            mode={previewTheme}
            clientName={clientName || "Miss Al Reem Beauty Centre"}
            proposalNumber={id ? `#PRP-${id.slice(0, 4).toUpperCase()}` : "#PRP-0042"}
            date={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            validUntil={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            headline="A website that works while you sleep."
            subtitle={`Prepared for ${clientName || "Miss Al Reem Beauty Centre"} — a redesigned booking site with WhatsApp automation, built to turn visitors into confirmed appointments.`}
            whatWeFound={scope || "Your current site has no online booking and no way to capture a visitor before they leave. Most inquiries currently come through Instagram DMs, which are easy to miss during busy salon hours."}
            services={services}
            totalInvestment={totalInvestment}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Target Client Bar */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
        <div>
          <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold">Client Prospect</span>
          <div className="text-lg font-bold text-[var(--text-primary)]">{clientName || "Direct Proposal Draft"}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAiDraft}
            disabled={generatingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent-border)] text-[var(--accent)] text-xs font-semibold border border-[var(--accent-border)] transition-colors disabled:opacity-50"
          >
            {generatingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Generate Draft (AI)</span>
          </button>
        </div>
      </div>

      {/* Brand Kit & PDF Template Selector */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND.profileImage}
                alt={BRAND.ownerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-[var(--accent)] shadow-md shadow-[var(--accent)]/20"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)] font-heading">{BRAND.ownerName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
                  Brand Kit Active
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {BRAND.contact.website.replace("https://", "")} • WhatsApp: {BRAND.contact.waDisplay} • LinkedIn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[11px]">Primary Accent:</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--text-primary)] bg-[var(--surface-hover)] px-2 py-0.5 rounded border border-[var(--border)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              #DA4D01
            </span>
          </div>
        </div>

        {/* 3 Template Selection Options */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">
            Select Proposal PDF Direction (All 3 use your verified brand colors &amp; typography):
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Template B - Bold Creative (Default) */}
            <button
              type="button"
              onClick={() => setSelectedTemplate("B")}
              className={`p-3.5 rounded-lg border text-left transition-colors relative ${
                selectedTemplate === "B"
                  ? "bg-[var(--surface-hover)] border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)] font-heading">
                  Template B: Bold Creative
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-white">
                  Brand Default
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-2">
                Matches <strong className="text-[var(--text-secondary)]">nafeesaali.com</strong> directly: dark obsidian (#09090b), bold orange (#DA4D01) header, Space Grotesk headline, and pill-style service badges.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Dark Theme</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]">Site Match</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Pill Badges</span>
              </div>
            </button>

            {/* Template A - Minimal Modern */}
            <button
              type="button"
              onClick={() => setSelectedTemplate("A")}
              className={`p-3.5 rounded-lg border text-left transition-colors ${
                selectedTemplate === "A"
                  ? "bg-[var(--surface-hover)] border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)] font-heading">
                  Template A: Minimal Modern
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                  Light
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-2">
                Crisp white background with a signature #DA4D01 orange sidebar accent. Ideal for clients who prefer printing on paper.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Print Friendly</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Clean Accent</span>
              </div>
            </button>

            {/* Template C - Corporate Classic */}
            <button
              type="button"
              onClick={() => setSelectedTemplate("C")}
              className={`p-3.5 rounded-lg border text-left transition-colors ${
                selectedTemplate === "C"
                  ? "bg-[var(--surface-hover)] border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)] font-heading">
                  Template C: Corporate Classic
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">
                  Light
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-2">
                Formal two-column letterhead with orange divider rules, alternating table rows, and structured payment breakdown.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Corporate</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Tabular</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Services Line Items */}
      <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <h2 className="font-heading text-sm font-semibold text-[var(--text-primary)]">Services &amp; Pricing Breakdown</h2>
          <button
            onClick={addServiceItem}
            className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        </div>

        <div className="space-y-3">
          {services.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] space-y-2 relative group"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateServiceItem(index, "name", e.target.value)}
                    placeholder="Service name (e.g. Workflow Automation)"
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-hover)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-xs text-[var(--text-dim)]">$</span>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateServiceItem(index, "price", parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-hover)] rounded pl-6 pr-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <textarea
                rows={1}
                value={item.description}
                onChange={(e) => updateServiceItem(index, "description", e.target.value)}
                placeholder="Scope details and deliverables for this item..."
                className="w-full bg-[var(--surface-raised)] border border-[var(--border-hover)] rounded px-2.5 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
              />
              {services.length > 1 && (
                <button
                  onClick={() => removeServiceItem(index)}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-[var(--surface-raised)] text-[var(--text-muted)] hover:text-[var(--danger)] border border-[var(--border-hover)] opacity-0 group-hover:opacity-100 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-sm font-semibold">
          <span className="text-[var(--text-muted)]">Total Investment (Auto-summed):</span>
          <span className="text-lg text-[var(--accent)] font-bold">${totalInvestment.toLocaleString()}</span>
        </div>
      </div>

      {/* Scope & Deliverables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Project Scope</label>
          <textarea
            rows={5}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Comprehensive description of the engagement..."
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] leading-relaxed"
          />
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Tangible Deliverables</label>
          <textarea
            rows={5}
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            placeholder="Itemized deliverables..."
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] leading-relaxed"
          />
        </div>
      </div>

      {/* Timeline & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Timeline &amp; Milestones</label>
          <input
            type="text"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Payment Terms</label>
          <input
            type="text"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>
    </div>
  )}

      {/* Action Toolbar & Approval Gates (Gates 2 & 3) */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveProposal}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-hover)] transition-colors"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => handleDownloadPdf("B")}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-hover)] transition-colors disabled:opacity-50"
          >
            {downloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
            )}
            <span>Export Branded PDF</span>
          </button>
          <button
            onClick={() => handleDownloadPdf("A")}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-hover)] transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span>Export Light (Print) PDF</span>
          </button>
        </div>

        {/* Gate Actions */}
        <div className="flex items-center gap-2">
          {/* Gate 2: Approve Proposal */}
          <button
            onClick={handleApproveGate2}
            disabled={status === "Approved" || status === "Sent" || status === "Accepted"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Proposal (Gate 2)</span>
          </button>

          {/* Gate 3: Mark Proposal as Sent (strictly disabled until Approved) */}
          <button
            onClick={handleMarkSentGate3}
            disabled={!approvedAt || status === "Sent" || status === "Accepted"}
            title={!approvedAt ? "Locked until Gate 2 (Approve) is cleared" : "Confirm manual dispatch"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mark as Sent (Gate 3)</span>
          </button>

          {/* Client Decision buttons */}
          {status === "Sent" && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--border-hover)]">
              <button
                onClick={() => handleStatusChange("Accepted")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--success-soft)] text-[var(--success)] hover:bg-[var(--success-border)] border border-[var(--success-border)] text-xs font-medium transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Mark Accepted</span>
              </button>
              <button
                onClick={() => handleStatusChange("Rejected")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger-border)] border border-[var(--danger-border)] text-xs font-medium transition-colors"
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
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">Loading Proposal Builder...</p>
        </div>
      }
    >
      <ProposalBuilderContent />
    </Suspense>
  );
}
