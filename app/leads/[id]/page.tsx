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
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  TrendingUp,
  Flame,
  RefreshCw,
  Target,
  DollarSign,
  Layers,
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
    research_data?: any | null;
    competitor_pricing?: any | null;
    qualification_tier?: "Hot" | "Warm" | "Cold" | string | null;
    qualification_signals?: any | null;
    primary_observation?: string | null;
    primary_offer?: string | null;
    follow_up_count?: number;
    customer_behavior?: string | null;
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

function getLeadPhone(leadObj?: any): string {
  if (!leadObj) return "";
  const direct = typeof leadObj.phone === "string" ? leadObj.phone.trim() : "";
  if (direct) return direct;
  const contactPhone =
    (typeof leadObj.contacts?.[0]?.phone === "string" && leadObj.contacts[0].phone.trim()) ||
    (typeof leadObj.contacts?.[0]?.whatsapp === "string" && leadObj.contacts[0].whatsapp.trim());
  if (contactPhone) return contactPhone;
  const raw = leadObj.source_csv_row;
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string" && v.trim() && /phone|mobile|tel|whatsapp/i.test(k)) {
        return v.trim();
      }
    }
  }
  return "";
}

function getLeadEmail(leadObj?: any): string {
  if (!leadObj) return "";
  const direct = typeof leadObj.email === "string" ? leadObj.email.trim() : "";
  if (direct) return direct;
  const contactEmail =
    typeof leadObj.contacts?.[0]?.email === "string" ? leadObj.contacts[0].email.trim() : "";
  if (contactEmail) return contactEmail;
  const raw = leadObj.source_csv_row;
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string" && v.trim() && /email|mail/i.test(k)) {
        return v.trim();
      }
    }
  }
  return "";
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

  // Direct WhatsApp & Email Push States
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [pushStatusMessage, setPushStatusMessage] = useState("");
  const [pushErrorMessage, setPushErrorMessage] = useState("");

  // Deep Research States
  const [researching, setResearching] = useState(false);
  const [researchNotice, setResearchNotice] = useState<string | null>(null);

  // Four-Stage Follow-Up States
  const [followUpBehavior, setFollowUpBehavior] = useState<
    "no_reply_not_seen" | "seen_no_reply" | "replied_hesitant" | "final_follow_up" | "warm_interested"
  >("no_reply_not_seen");
  const [customHesitation, setCustomHesitation] = useState("");
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  // Log Customer Reply & Stage Advance States
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyMode, setReplyMode] = useState<"ai" | "manual">("ai");
  const [replyChannel, setReplyChannel] = useState<"WhatsApp" | "Email" | "Phone Call">("WhatsApp");
  const [incomingReplyText, setIncomingReplyText] = useState("");
  const [manualReplyBehavior, setManualReplyBehavior] = useState<
    "no_reply_not_seen" | "seen_no_reply" | "replied_hesitant" | "final_follow_up" | "warm_interested"
  >("replied_hesitant");
  const [manualStageNumber, setManualStageNumber] = useState<number>(1);
  const [customReplyObjection, setCustomReplyObjection] = useState("");
  const [classifyingReply, setClassifyingReply] = useState(false);
  const [savingReply, setSavingReply] = useState(false);
  const [aiClassificationResult, setAiClassificationResult] = useState<any>(null);
  const [replyModalError, setReplyModalError] = useState<string | null>(null);

  // Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  // Book Call Modal
  const [isBookCallModalOpen, setIsBookCallModalOpen] = useState(false);
  const [callNotes, setCallNotes] = useState("");

  // Mark Lost Modal
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");

  // Edit / Delete Lead Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editActionLoading, setEditActionLoading] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const [editFormData, setEditFormData] = useState({
    business_name: "",
    niche_industry: "",
    city_country: "",
    phone: "",
    email: "",
    website: "",
    key_services: "",
  });

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
        setEditFormData({
          business_name: json.lead.business_name || "",
          niche_industry: json.lead.niche_industry || "",
          city_country: json.lead.city_country || "",
          phone: json.lead.phone || "",
          email: json.lead.email || "",
          website: json.lead.website || "",
          key_services: json.lead.key_services || "",
        });
        const extractedPhone = getLeadPhone(json.lead);
        const extractedEmail = getLeadEmail(json.lead);
        setRecipientPhone((prev) => (prev ? prev : extractedPhone));
        setRecipientEmail((prev) => (prev ? prev : extractedEmail));
        if (json.lead.customer_behavior) {
          setFollowUpBehavior(json.lead.customer_behavior as any);
          setManualReplyBehavior(json.lead.customer_behavior as any);
        }
        if (typeof json.lead.follow_up_count === "number") {
          setManualStageNumber(json.lead.follow_up_count);
        }
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

  // Pre-fill recipient phone & email whenever Contact modal opens if lead record has data
  useEffect(() => {
    if (isContactModalOpen && data?.lead) {
      const p = getLeadPhone(data.lead);
      const e = getLeadEmail(data.lead);
      if (p && !recipientPhone.trim()) setRecipientPhone(p);
      if (e && !recipientEmail.trim()) setRecipientEmail(e);
    }
  }, [isContactModalOpen, data?.lead]);

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.business_name.trim()) {
      setEditFormError("Business Name is required.");
      return;
    }
    setEditActionLoading(true);
    setEditFormError("");
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditFormError(json.error || "Failed to update lead.");
        return;
      }
      setIsEditModalOpen(false);
      fetchLead();
    } catch (err: any) {
      setEditFormError(err.message || "Network error.");
    } finally {
      setEditActionLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    setEditActionLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/leads");
      }
    } catch (err) {
      console.error("Failed to delete lead", err);
      setEditActionLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchLead();
  }, [leadId]);

  // Trigger Deep Research (Uses 2-pass Google Search Grounding with database caching)
  const handleTriggerDeepResearch = async (forceRefresh = false) => {
    setResearching(true);
    setResearchNotice(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/deep-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force_refresh: forceRefresh }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResearchNotice(`⚠️ ${json.error || "Failed to execute Deep Research."}`);
        return;
      }
      setResearchNotice(
        json.cached
          ? "Loaded existing grounded research from cache (0 new search queries used)."
          : "Completed Deep Research & Competitor Pricing via Google Search Grounding!"
      );
      setTimeout(() => setResearchNotice(null), 5000);
      await fetchLead();
    } catch (err: any) {
      setResearchNotice(`⚠️ ${err.message || "Network error while researching."}`);
    } finally {
      setResearching(false);
    }
  };

  // Generate 4-Stage Behavior Follow-up (Loads into Gate 1 modal)
  const handleGenerateBehaviorFollowUp = async (overrideBehavior?: any) => {
    const activeBehavior = overrideBehavior || followUpBehavior;
    setGeneratingFollowUp(true);
    setFollowUpError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          behavior: activeBehavior,
          channel: contactChannel,
          custom_hesitation_notes: activeBehavior === "replied_hesitant" ? customHesitation : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFollowUpError(json.error || "Failed to generate follow-up draft.");
        return;
      }
      const followUp = json.follow_up;
      if (followUp?.draft) {
        setDraftResult(followUp.draft);
        setDraftSubject(followUp.draft.subject || "");
        setDraftBody(followUp.draft.body || "");
        setCreatedInteractionId(json.interaction_id);
        const p = getLeadPhone(data?.lead);
        const e = getLeadEmail(data?.lead);
        if (p) setRecipientPhone(p);
        if (e) setRecipientEmail(e);
        setIsContactModalOpen(true);
      }
      await fetchLead();
    } catch (err: any) {
      setFollowUpError(err.message || "Failed to generate follow-up draft.");
    } finally {
      setGeneratingFollowUp(false);
    }
  };

  // Generate AI Outreach Draft (GATE 1 Prep)
  const handleOpenContactModal = async (channelOverride?: "WhatsApp" | "Email" | unknown) => {
    const channel: "WhatsApp" | "Email" =
      channelOverride === "WhatsApp" || channelOverride === "Email"
        ? channelOverride
        : contactChannel;
    setIsContactModalOpen(true);
    setDraftResult(null);
    setDraftSubject("");
    setDraftBody("");
    setPushStatusMessage("");
    setPushErrorMessage("");
    setDrafting(true);

    const initialPhone = getLeadPhone(data?.lead);
    const initialEmail = getLeadEmail(data?.lead);
    setRecipientPhone(initialPhone);
    setRecipientEmail(initialEmail);

    try {
      const res = await fetch("/api/ai/draft-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          channel: channel,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setDraftResult(json.draft);
        setDraftSubject(json.draft?.subject || "");
        setDraftBody(json.draft?.body || "");
        setCreatedInteractionId(json.interaction_id);
      }
    } catch (err) {
      console.error("Draft generation failed", err);
    } finally {
      setDrafting(false);
    }
  };

  // Open Log Customer Reply modal
  const handleOpenReplyModal = () => {
    setReplyModalError(null);
    setAiClassificationResult(null);
    setIncomingReplyText("");
    setCustomReplyObjection(customHesitation || "");
    if (data?.lead) {
      setManualStageNumber(data.lead.follow_up_count || 1);
      if (data.lead.customer_behavior) {
        setManualReplyBehavior(data.lead.customer_behavior as any);
      }
    }
    setIsReplyModalOpen(true);
  };

  // Classify reply with AI
  const handleClassifyReply = async () => {
    if (!incomingReplyText.trim()) {
      setReplyModalError("Please enter or paste the customer's reply first.");
      return;
    }
    setClassifyingReply(true);
    setReplyModalError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/log-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "classify",
          reply_text: incomingReplyText,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setReplyModalError(json.error || "Failed to classify customer reply.");
        return;
      }
      if (json.classification) {
        setAiClassificationResult(json.classification);
        setManualReplyBehavior(json.classification.behavior);
        setManualStageNumber(json.classification.recommended_stage);
        if (json.classification.detected_objection) {
          setCustomReplyObjection(json.classification.detected_objection);
        }
      }
    } catch (err: any) {
      setReplyModalError(err.message || "Failed to classify reply.");
    } finally {
      setClassifyingReply(false);
    }
  };

  // Save reply and advance follow-up engine
  const handleSaveCustomerReply = async () => {
    setSavingReply(true);
    setReplyModalError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/log-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          channel: replyChannel,
          reply_text: incomingReplyText,
          behavior: manualReplyBehavior,
          stage: manualStageNumber,
          custom_objection: customReplyObjection,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setReplyModalError(json.error || "Failed to save customer reply.");
        return;
      }
      // Sync local engine behavior
      setFollowUpBehavior(manualReplyBehavior);
      if (customReplyObjection) {
        setCustomHesitation(customReplyObjection);
      }
      setIsReplyModalOpen(false);
      await fetchLead();
    } catch (err: any) {
      setReplyModalError(err.message || "Failed to save reply.");
    } finally {
      setSavingReply(false);
    }
  };

  const handleSwitchChannel = async (newChannel: "WhatsApp" | "Email") => {
    if (newChannel === contactChannel && draftResult) return;
    setContactChannel(newChannel);
    setPushStatusMessage("");
    setPushErrorMessage("");
    setDrafting(true);
    try {
      const res = await fetch("/api/ai/draft-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          channel: newChannel,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setDraftResult(json.draft);
        setDraftSubject(json.draft?.subject || "");
        setDraftBody(json.draft?.body || "");
        setCreatedInteractionId(json.interaction_id);
      }
    } catch (err) {
      console.error("Draft regeneration failed", err);
    } finally {
      setDrafting(false);
    }
  };

  const handlePushToWhatsApp = async () => {
    setPushStatusMessage("");
    setPushErrorMessage("");

    const phoneTrimmed = recipientPhone.trim();
    if (!phoneTrimmed) {
      setPushErrorMessage("Please provide a valid WhatsApp phone number with country code above.");
      return;
    }

    const cleanDigits = phoneTrimmed.replace(/[^0-9]/g, "");
    if (cleanDigits.length < 7) {
      setPushErrorMessage("Invalid phone number. Please include your country code (e.g. +971 50 123 4567 or +92 318 427 4017).");
      return;
    }

    if (!draftBody.trim()) {
      setPushErrorMessage("Message body cannot be empty.");
      return;
    }

    // IMMUTABILITY RULE: Never overwrite lead.phone or source_csv_row.
    // If the recipient phone is different from the primary imported phone, record it as a linked Contact record.
    if (phoneTrimmed && phoneTrimmed !== (data?.lead.phone || "")) {
      try {
        await fetch(`/api/leads/${leadId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Direct Contact",
            role: "WhatsApp Outreach Recipient",
            phone: phoneTrimmed,
            whatsapp: phoneTrimmed,
          }),
        });
      } catch (e) {
        // non-blocking
      }
    }

    const waUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(draftBody)}`;
    window.open(waUrl, "_blank");

    setPushStatusMessage("WhatsApp chat opened with your draft pre-filled! Review and update in WhatsApp, send it on your behalf, then click 'Mark as Sent' to unlock Gate 1.");
  };

  const handlePushToEmail = async () => {
    setPushStatusMessage("");
    setPushErrorMessage("");

    const emailTrimmed = recipientEmail.trim();
    if (!emailTrimmed) {
      setPushErrorMessage("Please provide a recipient email address above.");
      return;
    }

    if (!draftBody.trim()) {
      setPushErrorMessage("Message body cannot be empty.");
      return;
    }

    // IMMUTABILITY RULE: Never overwrite lead.email or source_csv_row.
    // If the recipient email is different from the primary imported email, record it as a linked Contact record.
    if (emailTrimmed && emailTrimmed !== (data?.lead.email || "")) {
      try {
        await fetch(`/api/leads/${leadId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Direct Contact",
            role: "Email Outreach Recipient",
            email: emailTrimmed,
          }),
        });
      } catch (e) {
        // non-blocking
      }
    }

    const mailtoUrl = `mailto:${encodeURIComponent(emailTrimmed)}?subject=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`;
    window.open(mailtoUrl, "_blank");

    setPushStatusMessage("Email client launched with draft pre-filled! Review and send in your email client, then click 'Mark as Sent' to unlock Gate 1.");
  };

  // GATE 1: Manual Confirm Sent
  const handleConfirmSentGate1 = async () => {
    if (!createdInteractionId) return;
    try {
      const res = await fetch("/api/gates/gate1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interaction_id: createdInteractionId,
          updated_content: draftBody,
        }),
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
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">{lead.business_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                {lead.status}
              </span>
              {lead.is_today_target && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
                  Target Today (1/3)
                </span>
              )}
              {lead.qualification_tier && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                    lead.qualification_tier === "Hot"
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      : lead.qualification_tier === "Warm"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                  }`}
                >
                  {lead.qualification_tier === "Hot" && <Flame className="w-3 h-3 text-rose-400" />}
                  {lead.qualification_tier === "Warm" && <TrendingUp className="w-3 h-3 text-amber-400" />}
                  <span>{lead.qualification_tier} Tier</span>
                </span>
              )}
              {lead.primary_offer && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>Offer: {lead.primary_offer}</span>
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
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-500 hover:underline flex items-center gap-1 transition-colors"
                    title="Direct WhatsApp Chat"
                  >
                    <span>{lead.phone}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[var(--text-dim)]" />
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <a
                    href={`mailto:${lead.email}`}
                    className="hover:text-[var(--accent)] hover:underline flex items-center gap-1 transition-colors"
                    title="Send direct email"
                  >
                    <span>{lead.email}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[var(--text-dim)]" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Core Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Deep Research Grounding Button */}
            {lead.research_data ? (
              <button
                type="button"
                onClick={() => handleTriggerDeepResearch(true)}
                disabled={researching}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--accent)] text-xs font-semibold border border-[var(--accent-border)] transition-colors disabled:opacity-50"
                title="Re-run Google Search Grounding to update fresh web data (billable query)"
              >
                {researching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)]" />
                )}
                <span>{researching ? "Researching..." : "Re-run Deep Research"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleTriggerDeepResearch(false)}
                disabled={researching}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent-hover)] text-[var(--accent)] hover:text-white text-xs font-bold border border-[var(--accent-border)] shadow-sm transition-colors disabled:opacity-50"
                title="Run multi-query search pass via Gemini Google Search Grounding"
              >
                {researching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{researching ? "Researching Web..." : "Search this business online"}</span>
              </button>
            )}

            <button
              onClick={() => handleOpenContactModal()}
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
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border)] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--danger-soft)] text-[var(--text-dim)] hover:text-[var(--danger)] text-xs font-medium border border-[var(--border)] hover:border-[var(--danger-border)] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Research Notice Banner */}
      {researchNotice && (
        <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--accent-border)] text-xs text-[var(--text-primary)] flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>{researchNotice}</span>
          </div>
          <button
            onClick={() => setResearchNotice(null)}
            className="text-[var(--text-dim)] hover:text-[var(--text-primary)] text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── DYNAMIC SINGLE-OFFER BANNER ─── */}
      {lead.primary_offer && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--accent-border)] p-5 space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <Target className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                  Dynamic Single-Offer Strategy
                </h3>
                <p className="text-[11px] text-[var(--text-dim)]">
                  Strict Single-Offer Rule: Exactly 1 primary observation and 1 focused offer pitched.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--accent)] text-white shadow-sm">
                Pitch: {lead.primary_offer}
              </span>
              {lead.qualification_tier && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    lead.qualification_tier === "Hot"
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      : lead.qualification_tier === "Warm"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                  }`}
                >
                  {lead.qualification_tier} Tier
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Primary Observation:
              </span>
              <p className="text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-hover)] p-3 rounded-lg border border-[var(--border)]">
                {lead.primary_observation || "Business analyzed for optimal service alignment."}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Qualification Signals:
              </span>
              <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] min-h-[58px] flex flex-wrap items-center gap-2">
                {lead.qualification_signals && Object.keys(lead.qualification_signals).length > 0 ? (
                  Object.entries(lead.qualification_signals).map(([key, val]) =>
                    val ? (
                      <span
                        key={key}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-[var(--accent)]" />
                        <span className="capitalize">{key.replace(/_/g, " ")}</span>
                      </span>
                    ) : null
                  )
                ) : (
                  <span className="text-[11px] text-[var(--text-dim)]">No qualification signals recorded.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── COMPETITOR PRICING SNAPSHOT (LIVE WEB DATA) ─── */}
      {lead.competitor_pricing && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                Competitor Pricing Snapshot
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Web Data
              </span>
            </div>
            {lead.competitor_pricing.typical_price_range && (
              <div className="text-xs text-[var(--text-muted)]">
                Typical Range: <strong className="text-[var(--text-primary)]">{lead.competitor_pricing.typical_price_range}</strong>
              </div>
            )}
          </div>

          {lead.competitor_pricing.pricing_summary && (
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-hover)] p-3 rounded-lg border border-[var(--border)]">
              {lead.competitor_pricing.pricing_summary}
            </p>
          )}

          {/* Competitor Table */}
          {(() => {
            const competitorRows = Array.isArray(lead.competitor_pricing)
              ? lead.competitor_pricing
              : Array.isArray(lead.competitor_pricing?.competitors)
              ? lead.competitor_pricing.competitors
              : [];

            return competitorRows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-hover)] text-[var(--text-muted)] uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="p-3">Competitor Business</th>
                      <th className="p-3">Price Range / Typical Package</th>
                      <th className="p-3 text-right">Live Source Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {competitorRows.map((comp: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="p-3 font-semibold text-[var(--text-primary)]">
                          {comp.competitor_name || "Regional Benchmark"}
                        </td>
                        <td className="p-3 text-[var(--text-secondary)]">
                          {comp.price_range || "Quote upon request"}
                        </td>
                        <td className="p-3 text-right">
                          {comp.source_url ? (
                            <a
                              href={comp.source_url.startsWith("http") ? comp.source_url : `https://${comp.source_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline text-[11px]"
                            >
                              <span>Visit Pricing Page</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[var(--text-dim)] text-[11px]">Indexed via web</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-dim)] italic">No explicit competitor pricing rows detected.</p>
            );
          })()}
        </div>
      )}

      {/* ─── DEEP RESEARCH ENGINE AUDIT & MATCH VALIDATION LOG ─── */}
      {lead.research_data && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                Deep Research Intelligence &amp; Match Validation
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
                Audit Trail
              </span>
            </div>
            {lead.research_data.researched_at && (
              <div className="text-[11px] text-[var(--text-dim)]">
                Researched: {new Date(lead.research_data.researched_at).toLocaleString()}
              </div>
            )}
          </div>

          {/* 1. Exact Search Queries Executed */}
          {Array.isArray(lead.research_data.executed_queries) && lead.research_data.executed_queries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Exact Queries Generated from Stored Lead Data:
                </span>
                <span className="text-[11px] text-[var(--text-dim)]">
                  {lead.research_data.executed_queries.length} exact template(s)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {lead.research_data.executed_queries.map((q: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] break-all flex items-start gap-2"
                  >
                    <span className="text-[var(--accent)] font-bold shrink-0">{idx + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Match Validation Audit (Passed vs Discarded) */}
          {Array.isArray(lead.research_data.validation_audit) && lead.research_data.validation_audit.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Result Match-Validation Audit (Discarding Irrelevant Entities):
                </span>
                <span className="text-[11px] text-[var(--text-dim)]">
                  Strict lead identifier verification
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {lead.research_data.validation_audit.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      item.matched
                        ? "bg-emerald-500/10 border-emerald-500/30 text-[var(--text-primary)]"
                        : "bg-rose-500/10 border-rose-500/20 text-[var(--text-muted)]"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          item.matched
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}>
                          {item.matched ? "VERIFIED MATCH" : "DISCARDED"}
                        </span>
                        <span className="font-semibold text-xs truncate">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-dim)]">{item.reason}</p>
                    </div>
                    {item.url && (
                      <a
                        href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[var(--accent)] hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Site Health & Reputation Summary */}
          {lead.research_data.site_health && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                  Site Health &amp; Digital Presence:
                </span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {lead.research_data.site_health.indexed_pages_note || "Site audit completed."}
                </p>
                {lead.research_data.site_health.tech_debt_flag && (
                  <div className="text-[11px] text-amber-400 flex items-center gap-1 pt-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Tech Debt: {lead.research_data.site_health.tech_debt_flag}</span>
                  </div>
                )}
              </div>

              {lead.research_data.reputation && (
                <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] space-y-1">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                    Public Reputation &amp; Sentiment:
                  </span>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {lead.research_data.reputation.summary || "Reputation verified via regional directory index."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

      {/* ─── FOUR-STAGE FOLLOW-UP ENGINE ─── */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                Behavior-Based Follow-Up Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]">
                Stage {lead.follow_up_count || 0} / 4
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Tailored outreach based on customer interaction behavior. Follows strict sales psychology principles with a 4-touchpoint cap.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Manual Reply Logging & Simulation Trigger */}
            <button
              type="button"
              onClick={handleOpenReplyModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent-hover)] text-[var(--accent)] hover:text-white text-xs font-bold border border-[var(--accent-border)] transition-colors shadow-sm"
              title="Log customer reply via WhatsApp/Email to advance stages, or manually select stage for testing"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Log Customer Reply</span>
            </button>

            {/* Warm Lead Fast-Path Trigger */}
            <button
              type="button"
              onClick={() => handleGenerateBehaviorFollowUp("warm_interested")}
              disabled={generatingFollowUp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-colors shrink-0"
              title="Lead replied with interest: Prompt immediately to book a call on WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Interested? Book Call</span>
            </button>
          </div>
        </div>

        {/* Current State & Progression Indicator Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] font-medium">Logged Customer Behavior:</span>
            <span className="font-bold text-[var(--text-primary)] capitalize px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              {lead.customer_behavior ? lead.customer_behavior.replace(/_/g, " ") : "No reply recorded yet"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-dim)]">
            <span className="font-medium">Active Stage Progress:</span>
            <div className="flex items-center gap-1.5">
              {[
                { stg: 1, name: "Value Nudge" },
                { stg: 2, name: "Social Proof" },
                { stg: 3, name: "Objection Handle" },
                { stg: 4, name: "Graceful Exit" },
              ].map(({ stg, name }) => {
                const count = lead.follow_up_count || 0;
                const isPassed = count >= stg;
                const isCurrent = count + 1 === stg || (stg === 4 && count >= 4);
                return (
                  <span
                    key={stg}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
                      isPassed
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : isCurrent
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] font-bold ring-1 ring-[var(--accent)]"
                        : "bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]"
                    }`}
                    title={`Stage ${stg}: ${name}`}
                  >
                    {isPassed ? "✓" : stg} {name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {followUpError && (
          <div className="p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] text-xs text-[var(--danger)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{followUpError}</span>
          </div>
        )}

        {/* Behavior Selector Grid (Visual Stages with Tactic Selection) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Behavior 1 */}
          <button
            type="button"
            onClick={() => setFollowUpBehavior("no_reply_not_seen")}
            className={`p-3 rounded-lg text-left border transition-all ${
              followUpBehavior === "no_reply_not_seen"
                ? "bg-[var(--accent-soft)] border-[var(--accent-border)] ring-1 ring-[var(--accent)]"
                : "bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--border-hover)]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Stage 1: Value-Add Nudge
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                (lead.follow_up_count || 0) >= 1
                  ? "text-emerald-400 bg-emerald-500/10"
                  : (lead.follow_up_count || 0) === 0
                  ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                  : "text-[var(--text-dim)]"
              }`}>
                {(lead.follow_up_count || 0) >= 1 ? "✓ Sent" : (lead.follow_up_count || 0) === 0 ? "● Active Stage" : "Upcoming"}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              No reply &amp; haven&apos;t opened. Offers quick insight/audit with zero pressure.
            </div>
          </button>

          {/* Behavior 2 */}
          <button
            type="button"
            onClick={() => setFollowUpBehavior("seen_no_reply")}
            className={`p-3 rounded-lg text-left border transition-all ${
              followUpBehavior === "seen_no_reply"
                ? "bg-[var(--accent-soft)] border-[var(--accent-border)] ring-1 ring-[var(--accent)]"
                : "bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--border-hover)]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Stage 2: Social Proof
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                (lead.follow_up_count || 0) >= 2
                  ? "text-emerald-400 bg-emerald-500/10"
                  : (lead.follow_up_count || 0) === 1
                  ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                  : "text-[var(--text-dim)]"
              }`}>
                {(lead.follow_up_count || 0) >= 2 ? "✓ Sent" : (lead.follow_up_count || 0) === 1 ? "● Active Stage" : "Upcoming"}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Opened/seen, but ghosted. Shares peer benchmark, competitor data, or case story.
            </div>
          </button>

          {/* Behavior 3 */}
          <button
            type="button"
            onClick={() => setFollowUpBehavior("replied_hesitant")}
            className={`p-3 rounded-lg text-left border transition-all ${
              followUpBehavior === "replied_hesitant"
                ? "bg-[var(--accent-soft)] border-[var(--accent-border)] ring-1 ring-[var(--accent)]"
                : "bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--border-hover)]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Stage 3: Objection Handle
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                (lead.follow_up_count || 0) >= 3
                  ? "text-emerald-400 bg-emerald-500/10"
                  : (lead.follow_up_count || 0) === 2
                  ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                  : "text-[var(--text-dim)]"
              }`}>
                {(lead.follow_up_count || 0) >= 3 ? "✓ Sent" : (lead.follow_up_count || 0) === 2 ? "● Active Stage" : "Upcoming"}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Replied hesitant (&quot;busy&quot;, &quot;price&quot;). Validates &amp; lowers commitment.
            </div>
          </button>

          {/* Behavior 4 */}
          <button
            type="button"
            onClick={() => setFollowUpBehavior("final_follow_up")}
            className={`p-3 rounded-lg text-left border transition-all ${
              followUpBehavior === "final_follow_up"
                ? "bg-[var(--accent-soft)] border-[var(--accent-border)] ring-1 ring-[var(--accent)]"
                : "bg-[var(--surface-hover)] border-[var(--border)] hover:border-[var(--border-hover)]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Stage 4: Graceful Exit
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                (lead.follow_up_count || 0) >= 4
                  ? "text-emerald-400 bg-emerald-500/10"
                  : (lead.follow_up_count || 0) === 3
                  ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                  : "text-[var(--text-dim)]"
              }`}>
                {(lead.follow_up_count || 0) >= 4 ? "✓ Sent" : (lead.follow_up_count || 0) === 3 ? "● Active Stage" : "Upcoming"}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Final touchpoint. Closes the loop cleanly, preserves brand equity, leaves door open.
            </div>
          </button>
        </div>

        {/* Custom Objection Input if Stage 3 */}
        {followUpBehavior === "replied_hesitant" && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Specific Customer Hesitation / Objection:
            </label>
            <input
              type="text"
              value={customHesitation}
              onChange={(e) => setCustomHesitation(e.target.value)}
              placeholder="e.g. 'We are swamped right now' or 'Sounds expensive' or 'Already have an agency'"
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-[var(--text-dim)]">
            {(lead.follow_up_count || 0) >= 4 ? (
              <span className="text-amber-400 font-medium">
                ⚠️ Maximum 4 follow-ups reached for this lead. Respect client boundaries.
              </span>
            ) : (
              <span>
                Gate 1 applies: Generated draft opens in review modal before being sent. Click <strong>&quot;Log Customer Reply&quot;</strong> above to record incoming replies or advance stages.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleGenerateBehaviorFollowUp()}
            disabled={generatingFollowUp || (lead.follow_up_count || 0) >= 4}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
          >
            {generatingFollowUp ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate Stage Follow-up (Gate 1)</span>
          </button>
        </div>
      </div>

      {/* Interaction History Feed */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)]">Interaction History</h2>
            <span className="text-xs text-[var(--text-dim)]">
              ({lead.interactions.length} touchpoints)
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenReplyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)] transition-colors self-start sm:self-auto"
            title="Log an incoming response or customer communication"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Log Customer Reply</span>
          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <GateBadge gateNumber={1} isUnlocked={false} label="HARD APPROVAL GATE 1" />
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading">Outreach Message Review</h3>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[var(--text-muted)] leading-relaxed">
              <p>
                <strong>Rule:</strong> AI drafts the text, but will <strong>NEVER</strong> send it automatically.
                Click <strong>Push to WhatsApp</strong> or <strong>Email</strong> to open as an unsent draft in your client, review or update the text, send it on your own behalf, and then click <strong>&quot;Mark as Sent&quot;</strong> to clear Gate 1.
              </p>
            </div>

            {/* Channel Selector */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[var(--text-muted)] font-medium">Channel:</span>
                <button
                  type="button"
                  onClick={() => handleSwitchChannel("WhatsApp")}
                  className={`px-3 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    contactChannel === "WhatsApp"
                      ? "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)] font-semibold"
                      : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchChannel("Email")}
                  className={`px-3 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    contactChannel === "Email"
                      ? "bg-[var(--info-soft)] text-[var(--info)] border-[var(--info-border)] font-semibold"
                      : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
              </div>

              {draftResult && (
                <button
                  type="button"
                  onClick={() => handleSwitchChannel(contactChannel)}
                  disabled={drafting}
                  className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 disabled:opacity-50"
                  title="Regenerate draft with Gemini"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>

            {/* Recipient Input (Phone / Email) */}
            <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] space-y-1.5">
              {contactChannel === "WhatsApp" ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Recipient WhatsApp / Phone Number:</span>
                    </label>
                    {data?.lead && getLeadPhone(data.lead) ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Auto-filled from lead record</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-medium">
                        ⚠️ No phone on file — enter recipient number
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder={
                      data?.lead && getLeadPhone(data.lead)
                        ? "e.g. +971 50 123 4567 or +92 318 427 4017"
                        : "No phone on file — enter recipient WhatsApp number"
                    }
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent)]"
                  />
                  <p className="text-[10px] text-[var(--text-dim)]">
                    Must include country code. Fully editable in case you need to override for a specific contact person.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Recipient Email Address:</span>
                    </label>
                    {data?.lead && getLeadEmail(data.lead) ? (
                      <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-blue-400" />
                        <span>Auto-filled from lead record</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-medium">
                        ⚠️ No email on file — enter recipient email
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder={
                      data?.lead && getLeadEmail(data.lead)
                        ? "e.g. contact@business.com"
                        : "No email on file — enter recipient email address"
                    }
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent)]"
                  />
                  <p className="text-[10px] text-[var(--text-dim)]">
                    Fully editable in case you need to override for a specific contact person.
                  </p>
                </div>
              )}
            </div>

            {/* Status Banners */}
            {pushStatusMessage && (
              <div className="p-3 rounded-lg bg-[var(--success-soft)] border border-[var(--success-border)] text-[var(--success)] text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{pushStatusMessage}</span>
              </div>
            )}

            {pushErrorMessage && (
              <div className="p-3 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{pushErrorMessage}</span>
              </div>
            )}

            {/* Draft Area */}
            {drafting ? (
              <div className="p-8 text-center text-xs text-[var(--accent)] space-y-2 bg-[var(--surface-hover)] rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                <span>Synthesizing tailored outreach via Google Gemini...</span>
              </div>
            ) : draftResult ? (
              <div className="space-y-3">
                {contactChannel === "Email" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[var(--text-muted)]">Subject Line:</label>
                    <input
                      type="text"
                      value={draftSubject}
                      onChange={(e) => setDraftSubject(e.target.value)}
                      placeholder="Email subject line..."
                      className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] font-medium outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span className="font-medium">Message Body (Editable Draft):</span>
                    <span>{draftBody.length} characters</span>
                  </div>
                  <textarea
                    rows={6}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    placeholder="Outreach message body..."
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed outline-none focus:border-[var(--accent)] resize-y font-sans"
                  />
                </div>
              </div>
            ) : null}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  if (draftBody) {
                    navigator.clipboard.writeText(draftBody);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                disabled={!draftBody}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-medium disabled:opacity-50 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Text"}</span>
              </button>

              <div className="flex items-center justify-end gap-2">
                {contactChannel === "WhatsApp" ? (
                  <button
                    type="button"
                    onClick={handlePushToWhatsApp}
                    disabled={!draftBody || drafting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow transition-colors disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Push to WhatsApp</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-90" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePushToEmail}
                    disabled={!draftBody || drafting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open in Email Client</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-90" />
                  </button>
                )}

                <button
                  type="button"
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

      {/* ─── EDIT LEAD MODAL ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Edit Lead</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="p-2.5 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] text-xs text-[var(--danger)]">
                {editFormError}
              </div>
            )}

            <form onSubmit={handleUpdateLead} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Business Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.business_name}
                  onChange={(e) => setEditFormData({ ...editFormData, business_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Niche / Industry</label>
                  <input
                    type="text"
                    value={editFormData.niche_industry}
                    onChange={(e) => setEditFormData({ ...editFormData, niche_industry: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">City / Location</label>
                  <input
                    type="text"
                    value={editFormData.city_country}
                    onChange={(e) => setEditFormData({ ...editFormData, city_country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Website</label>
                <input
                  type="text"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[var(--text-secondary)]">Key Services</label>
                <input
                  type="text"
                  value={editFormData.key_services}
                  onChange={(e) => setEditFormData({ ...editFormData, key_services: e.target.value })}
                  placeholder="e.g. Haircuts, Beard Trim, Facial"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
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
                  disabled={editActionLoading}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LOG CUSTOMER REPLY & ADVANCE STAGE MODAL ─── */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading">
                  Log Customer Reply &amp; Advance Stage
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReplyModalOpen(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Record a response received outside SoloDeskOS (via WhatsApp, Email, or Phone). SoloDeskOS will classify the behavior, log the incoming touchpoint, advance the follow-up stage (1–4), and prepare the matching response strategy.
            </p>

            {/* Mode Switcher: AI Classification vs Direct Manual Selection */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)] text-xs">
              <button
                type="button"
                onClick={() => setReplyMode("ai")}
                className={`py-1.5 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  replyMode === "ai"
                    ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Paste Reply (AI Classify)</span>
              </button>
              <button
                type="button"
                onClick={() => setReplyMode("manual")}
                className={`py-1.5 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  replyMode === "manual"
                    ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>Direct Stage / QA Test</span>
              </button>
            </div>

            {/* Channel Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Reply Channel:</label>
              <div className="flex items-center gap-2 text-xs">
                {(["WhatsApp", "Email", "Phone Call"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setReplyChannel(ch)}
                    className={`px-3 py-1 rounded-lg border transition-colors ${
                      replyChannel === ch
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-border)] font-semibold"
                        : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Text Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                {replyMode === "ai"
                  ? "Paste Customer's Incoming Message:"
                  : "Interaction Note / Customer Words (Optional):"}
              </label>
              <textarea
                rows={3}
                value={incomingReplyText}
                onChange={(e) => setIncomingReplyText(e.target.value)}
                placeholder={
                  replyMode === "ai"
                    ? "e.g. 'Can you send pricing details?' or 'We are currently working with another agency, thanks' or 'Sounds interesting, call me tomorrow'"
                    : "e.g. 'Customer replied on WhatsApp: too busy right now, asked to follow up next month.'"
                }
                className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none font-sans"
              />
            </div>

            {/* If AI Mode: Button to Analyze */}
            {replyMode === "ai" && (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleClassifyReply}
                  disabled={classifyingReply || !incomingReplyText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {classifyingReply ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Analyze Sentiment with AI</span>
                </button>
                {aiClassificationResult && (
                  <span className="text-[11px] text-emerald-400 font-medium">
                    ✓ Classified as {aiClassificationResult.behavior.replace(/_/g, " ")} ({aiClassificationResult.confidence} confidence)
                  </span>
                )}
              </div>
            )}

            {/* AI Classification Insights Card */}
            {aiClassificationResult && (
              <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--accent-border)] space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
                  <span>Recommended Category:</span>
                  <span className="capitalize text-[var(--accent)]">
                    {aiClassificationResult.behavior.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  <strong>Reasoning:</strong> {aiClassificationResult.reasoning}
                </p>
                {aiClassificationResult.detected_objection && (
                  <p className="text-[11px] text-amber-400">
                    <strong>Extracted Objection:</strong> {aiClassificationResult.detected_objection}
                  </p>
                )}
                <p className="text-[11px] text-emerald-400">
                  <strong>Next Action:</strong> {aiClassificationResult.recommended_next_step}
                </p>
              </div>
            )}

            {/* Behavior & Stage Selection (Visible in Manual mode or as editable confirmation after AI classify) */}
            <div className="space-y-2 pt-1 border-t border-[var(--border)]">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Target Behavior &amp; Stage to Set:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "warm_interested", label: "🟢 Warm / Interested", stage: lead.follow_up_count || 1 },
                  { id: "replied_hesitant", label: "🟡 Replied Hesitant (Stage 3)", stage: 3 },
                  { id: "seen_no_reply", label: "🔵 Seen / Ghosted (Stage 2)", stage: 2 },
                  { id: "no_reply_not_seen", label: "⚪ No Reply / Unread (Stage 1)", stage: 1 },
                  { id: "final_follow_up", label: "🔴 Declined / Final (Stage 4)", stage: 4 },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setManualReplyBehavior(item.id as any);
                      setManualStageNumber(item.stage);
                    }}
                    className={`p-2 rounded-lg text-left border transition-all ${
                      manualReplyBehavior === item.id
                        ? "bg-[var(--accent-soft)] border-[var(--accent-border)] ring-1 ring-[var(--accent)] font-semibold text-[var(--text-primary)]"
                        : "bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Manual Stage Override */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Stage Override (QA Test):</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((stg) => (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => setManualStageNumber(stg)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${
                        manualStageNumber === stg
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>

              {manualReplyBehavior === "replied_hesitant" && (
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    Customer Objection / Reason:
                  </label>
                  <input
                    type="text"
                    value={customReplyObjection}
                    onChange={(e) => setCustomReplyObjection(e.target.value)}
                    placeholder="e.g. 'Too expensive' or 'Busy until next month'"
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              )}
            </div>

            {replyModalError && (
              <div className="p-2.5 rounded-lg bg-[var(--danger-soft)] border border-[var(--danger-border)] text-xs text-[var(--danger)] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{replyModalError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsReplyModalOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomerReply}
                disabled={savingReply}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-colors shadow disabled:opacity-50"
              >
                {savingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save &amp; Advance Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE LEAD MODAL ─── */}
      {isDeleteModalOpen && (
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
              Are you sure you want to delete <strong className="text-[var(--text-primary)]">{lead.business_name}</strong>?
              This will permanently remove the lead and all associated contacts, deals, tasks, and interaction records.
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
                onClick={handleDeleteLead}
                disabled={editActionLoading}
                className="px-4 py-2 rounded-lg bg-[var(--danger)] hover:opacity-90 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {editActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
