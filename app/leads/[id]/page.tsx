"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  MessageSquare,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  Copy,
  Check,
  FileText,
  Clock,
  Plus,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Database,
} from "lucide-react";
import { FactBadge } from "@/components/ui/FactBadge";
import { GateBadge } from "@/components/ui/GateBadge";
import { useBusinessBrain } from "@/context/BusinessBrainContext";

interface LeadDetailData {
  lead: {
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
    source_csv_row: any;
    ai_summary?: string | null;
    ai_opportunity?: string | null;
    ai_recommended_angle?: string | null;
    status: string;
    is_today_target: boolean;
    converted_client_id?: string | null;
    created_at: string;
    contacts: Array<{
      id: string;
      name: string;
      role?: string;
      phone?: string;
      email?: string;
      whatsapp?: string;
    }>;
    interactions: Array<{
      id: string;
      channel: string;
      direction: string;
      content: string;
      ai_generated: boolean;
      confirmed_sent: boolean;
      created_at: string;
    }>;
    deals: Array<{
      id: string;
      stage: string;
      value?: number;
      lost_reason?: string;
    }>;
  };
  open_tasks: Array<{
    id: string;
    title: string;
    type: string;
    ai_suggested_tactic?: string;
    due_date?: string;
  }>;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const { setActiveEntity, openCopilotWithPrompt } = useBusinessBrain();

  const [data, setData] = useState<LeadDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactChannel, setContactChannel] = useState<"WhatsApp" | "Email">("WhatsApp");
  const [draftResult, setDraftResult] = useState<{ subject: string; body: string } | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [createdInteractionId, setCreatedInteractionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  // Book Call Modal
  const [isBookCallModalOpen, setIsBookCallModalOpen] = useState(false);
  const [callNotes, setCallNotes] = useState("");

  // Mark Lost Modal
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");

  // AI inline suggestion
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggested_tactic: string;
    due_in_days: number;
    reasoning: string;
  } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setActiveEntity({
          type: "lead",
          id: json.lead.id,
          name: json.lead.business_name,
          data: json.lead,
        });
      }
    } catch (err) {
      console.error("Failed to load lead details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchLead();
  }, [leadId]);

  // Generate AI Outreach Draft (GATE 1 Prep)
  const handleOpenContactModal = async () => {
    setIsContactModalOpen(true);
    setDraftResult(null);
    setDrafting(true);
    try {
      const res = await fetch("/api/ai/draft-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          channel: contactChannel,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setDraftResult(json.draft);
        setCreatedInteractionId(json.interaction_id);
      }
    } catch (err) {
      console.error("Draft generation failed", err);
    } finally {
      setDrafting(false);
    }
  };

  // GATE 1: Manual Confirm Sent
  const handleConfirmSentGate1 = async () => {
    if (!createdInteractionId) return;
    try {
      const res = await fetch("/api/gates/gate1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interaction_id: createdInteractionId }),
      });
      if (res.ok) {
        setIsContactModalOpen(false);
        fetchLead();
      }
    } catch (err) {
      console.error("Gate 1 confirmation failed", err);
    }
  };

  // Ask inline AI: "What should I do next?"
  const handleAskNextAction = async () => {
    setLoadingSuggestion(true);
    try {
      const res = await fetch("/api/ai/suggest-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiSuggestion(json.suggestion);
      }
    } catch (err) {
      console.error("Failed to get suggestion", err);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  // Book Call
  const handleBookCall = async () => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Booking" }),
      });
      setIsBookCallModalOpen(false);
      fetchLead();
    } catch (err) {
      console.error("Failed to book call", err);
    }
  };

  // Mark Lost
  const handleMarkLost = async () => {
    if (!lostReason.trim()) return;
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Lost" }),
      });
      setIsLostModalOpen(false);
      fetchLead();
    } catch (err) {
      console.error("Failed to mark lost", err);
    }
  };

  // Move to Proposal -> Converts Lead to Client & opens S7
  const handleMoveToProposal = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ convert_to_client: true }),
      });
      if (res.ok) {
        const json = await res.json();
        router.push(`/proposals/builder?client_id=${json.client.id}&lead_id=${leadId}`);
      }
    } catch (err) {
      console.error("Failed to convert lead to proposal", err);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-muted)]">Loading intelligent Lead Card...</p>
      </div>
    );
  }

  const { lead, open_tasks } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">{lead.business_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                {lead.status}
              </span>
              {lead.is_today_target && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
                  Target Today (1/3)
                </span>
              )}
            </div>

            {/* Verified Facts Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
              <div className="flex items-center gap-1.5">
                <FactBadge type="fact" label="Fact" />
                <span>
                  Industry:{" "}
                  {lead.niche_industry ||
                    lead.key_services ||
                    (lead as any).source_csv_row?.Specialization ||
                    (lead as any).source_csv_row?.specialization ||
                    (lead as any).source_csv_row?.Niche ||
                    (lead as any).source_csv_row?.niche ||
                    "Not available"}
                </span>
              </div>
              {lead.rating && (
                <div className="flex items-center gap-1 font-semibold text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent-border)] px-2 py-0.5 rounded text-xs">
                  <span>⭐ {lead.rating}</span>
                  {lead.review_count && (
                    <span className="text-[11px] text-[var(--accent)]/80 font-normal">({lead.review_count} reviews)</span>
                  )}
                </div>
              )}
              {lead.key_services && lead.niche_industry && (
                <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                  <span className="text-[var(--text-dim)] font-medium">Services:</span>
                  <span className="text-[var(--text-primary)]">{lead.key_services}</span>
                </div>
              )}
              {lead.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <span>{lead.address}</span>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline"
                  >
                    {lead.website}
                  </a>
                </div>
              )}
              {lead.city_country && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <span>{lead.city_country}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <span>{lead.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Core Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenContactModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact (Gate 1)</span>
            </button>
            <button
              onClick={() => setIsBookCallModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-hover)] transition-colors"
            >
              Book Call
            </button>
            <button
              onClick={handleMoveToProposal}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[color-mix(in_srgb,#8b5cf6_12%,transparent)] hover:bg-[color-mix(in_srgb,#8b5cf6_20%,transparent)] text-[#a78bfa] text-xs font-medium border border-[color-mix(in_srgb,#8b5cf6_30%,transparent)] transition-colors"
            >
              <span>Move to Proposal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsLostModalOpen(true)}
              className="px-2.5 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--danger-soft)] text-[var(--text-dim)] hover:text-[var(--danger)] text-xs font-medium border border-[var(--border)] transition-colors"
            >
              Mark Lost
            </button>
          </div>
        </div>
      </div>

      {/* Grid: AI Business Snapshot + What to do next */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Business Snapshot (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)]">AI Business Snapshot</h2>
            </div>
            <span className="text-[11px] text-[var(--text-dim)]">
              Grounded in verified facts • No fabrication
            </span>
          </div>

          {/* Section: What we know (Fact) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <FactBadge type="fact" label="What we know (Fact)" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-1">
              {lead.ai_summary ||
                `Imported business operating in ${lead.niche_industry || "service industry"} located in ${lead.city_country || "Not available"}. Contact details: ${lead.phone || lead.email || "Not available"}.`}
            </p>
          </div>

          {/* Section: Potential opportunity (Inference) */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-2">
              <FactBadge type="inference" label="Potential Opportunity (Inference)" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-1">
              {lead.ai_opportunity ||
                "Based on service niche, likely needs automated client intake, fast booking confirmation, and streamlined follow-up pipelines."}
            </p>
          </div>

          {/* Section: Recommended angle */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider">
                🎯 Recommended Angle &amp; Contact Strategy
              </span>
            </div>
            <p className="text-xs text-[var(--accent)] leading-relaxed bg-[var(--accent-soft)] p-3 rounded-lg border border-[var(--accent-border)]">
              {lead.ai_recommended_angle ||
                "Pitch a lean, done-for-you automation system that prevents lost inquiries and accelerates project signoffs."}
            </p>
          </div>
        </div>

        {/* Inline AI: What should I do next? */}
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)] flex items-center gap-2">
                <span>Next Best Action</span>
              </h2>
              <button
                onClick={handleAskNextAction}
                disabled={loadingSuggestion}
                className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium inline-flex items-center gap-1 disabled:opacity-50 transition-colors"
              >
                {loadingSuggestion && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Refresh Advice</span>
              </button>
            </div>

            {aiSuggestion ? (
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-[var(--info-soft)] border border-[var(--info-border)] space-y-1">
                  <div className="text-xs font-semibold text-[var(--info)]">
                    {aiSuggestion.suggested_tactic}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {aiSuggestion.reasoning}
                  </div>
                </div>
                <div className="text-[11px] text-[var(--text-dim)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Target execution within {aiSuggestion.due_in_days} day(s)</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-[var(--text-muted)]">
                  Analyze this lead&apos;s history and stage to get instant tactical advice.
                </p>
                <button
                  onClick={handleAskNextAction}
                  disabled={loadingSuggestion}
                  className="px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--accent)] text-xs font-medium border border-[var(--border-hover)] transition-colors"
                >
                  {loadingSuggestion ? "Analyzing..." : "Ask: What should I do next?"}
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-dim)]">
            Advisory layer only — you click the buttons to commit actions.
          </div>
        </div>
      </div>

      {/* Interaction History Feed */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)]">Interaction History</h2>
          </div>
          <span className="text-xs text-[var(--text-dim)]">
            {lead.interactions.length} recorded touchpoint(s)
          </span>
        </div>

        {lead.interactions.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-dim)] text-xs">
            No interactions recorded yet. Click &quot;Contact&quot; above to draft your first outreach.
          </div>
        ) : (
          <div className="space-y-3">
            {lead.interactions.map((int) => (
              <div
                key={int.id}
                className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {int.direction} {int.channel}
                    </span>
                    {int.confirmed_sent ? (
                      <GateBadge gateNumber={1} isUnlocked={true} label="GATE 1: SENT" />
                    ) : (
                      <GateBadge gateNumber={1} isUnlocked={false} label="GATE 1: DRAFT (NOT SENT)" />
                    )}
                    <span className="text-[11px] text-[var(--text-dim)]">
                      {new Date(int.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">{int.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Imported Data (Raw CSV Record) */}
      {lead.source_csv_row && Object.keys(lead.source_csv_row).length > 0 && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setShowRawData((p) => !p)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-hover)] transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[var(--text-dim)]" />
              <span className="text-sm font-semibold text-[var(--text-secondary)]">Full Imported Data</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                Raw CSV Record — {Object.keys(lead.source_csv_row).length} columns
              </span>
            </div>
            {showRawData ? (
              <ChevronDown className="w-4 h-4 text-[var(--text-dim)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--text-dim)]" />
            )}
          </button>

          {showRawData && (
            <div className="px-6 pb-6 space-y-2">
              <p className="text-[11px] text-[var(--text-dim)] pb-2 border-b border-[var(--border)]">
                Every column from the original CSV is preserved here, including unmapped fields. This is the immutable source of truth for this lead.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(lead.source_csv_row as Record<string, unknown>).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex gap-2 p-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)]"
                  >
                    <span className="text-[11px] font-medium text-[var(--text-muted)] shrink-0 min-w-[100px] max-w-[140px] truncate">
                      {key}
                    </span>
                    <span className="text-[11px] text-[var(--text-primary)] break-words min-w-0">
                      {value !== null && value !== undefined && String(value) !== ""
                        ? String(value)
                        : <span className="text-[var(--text-dim)] italic">empty</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Gate 1 Contact Outreach Drafter */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <GateBadge gateNumber={1} isUnlocked={false} label="HARD APPROVAL GATE 1" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Outreach Message Review</h3>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[var(--text-muted)]">
              <p>
                <strong>Rule:</strong> AI drafts the text, but will <strong>NEVER</strong> send it automatically.
                Copy the text below, send it via your WhatsApp or Email client, and then click <strong>&quot;Mark as Sent&quot;</strong> to clear Gate 1.
              </p>
            </div>

            {/* Channel Selector */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[var(--text-muted)]">Channel:</span>
              <button
                onClick={() => setContactChannel("WhatsApp")}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  contactChannel === "WhatsApp"
                    ? "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)] font-semibold"
                    : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]"
                }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setContactChannel("Email")}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  contactChannel === "Email"
                    ? "bg-[var(--info-soft)] text-[var(--info)] border-[var(--info-border)] font-semibold"
                    : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]"
                }`}
              >
                Email
              </button>
            </div>

            {/* Draft Area */}
            {drafting ? (
              <div className="p-8 text-center text-xs text-[var(--accent)] space-y-2 bg-[var(--surface-hover)] rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                <span>Synthesizing tailored outreach via Google Gemini...</span>
              </div>
            ) : draftResult ? (
              <div className="space-y-3">
                {draftResult.subject && (
                  <div className="text-xs text-[var(--text-secondary)] font-medium">
                    <span className="text-[var(--text-dim)]">Subject: </span>
                    {draftResult.subject}
                  </div>
                )}
                <div className="p-3.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-primary)] whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
                  {draftResult.body}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  if (draftResult?.body) {
                    navigator.clipboard.writeText(draftResult.body);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                disabled={!draftResult}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-medium disabled:opacity-50 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Text"}</span>
              </button>

              <button
                onClick={handleConfirmSentGate1}
                disabled={!createdInteractionId}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Sent (Unlock Gate 1)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Book Call */}
      {isBookCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Book Discovery / Intro Call</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Sets stage to <strong>Booking</strong>.
            </p>
            <textarea
              rows={3}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Call agenda, agreed time or meeting link..."
              className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBookCallModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBookCall}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors"
              >
                Confirm Call Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mark Lost */}
      {isLostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Mark Lead as Lost</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Mandatory reason required to update system records and archived stats.
            </p>
            <textarea
              rows={3}
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Reason for loss (e.g. Budget constraints, no response after 3 follow-ups, chose competitor)..."
              className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--danger)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsLostModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkLost}
                disabled={!lostReason.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--danger)] hover:opacity-90 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
