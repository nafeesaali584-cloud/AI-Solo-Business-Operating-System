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
  RotateCcw,
  Paperclip,
  FileUp,
} from "lucide-react";
import { FactBadge } from "@/components/ui/FactBadge";
import { GateBadge } from "@/components/ui/GateBadge";
import UnresponsiveAdvanceWarningModal from "@/components/common/UnresponsiveAdvanceWarningModal";
import LeadWorkspace from "@/components/workspace/LeadWorkspace";
import SnippetPicker from "@/components/snippets/SnippetPicker";

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
    priority?: "Hot" | "Warm" | "Cold" | string | null;
    reply_status?: string | null;
    primary_observation?: string | null;
    primary_offer?: string | null;
    planned_for?: string | null;
    next_follow_up_at?: string | null;
    follow_up_count?: number;
    status: string;
    is_today_target: boolean;
    cleared_fields?: string[] | null;
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
      confirmed_sent: boolean;
      created_at: string;
    }>;
    deals: Array<{
      id: string;
      stage: string;
      value?: number;
      lost_reason?: string;
    }>;
    proposals: Array<{
      id: string;
      status: string;
      total_investment: number;
    }>;
  };
  open_tasks: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    due_date?: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    file_url: string;
    created_at: string;
  }>;
}

function isValidPhone(p?: string | null): boolean {
  if (!p) return false;
  const s = p.trim();
  if (!s || s === "-" || s.toLowerCase() === "n/a" || s.length < 5) return false;
  return /^[0-9+()\s-]{6,}$/.test(s);
}

function isValidEmail(e?: string | null): boolean {
  if (!e) return false;
  const s = e.trim();
  if (!s || s === "-" || s.toLowerCase() === "n/a") return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s);
}

function getLeadPhone(lead?: any): string {
  if (!lead) return "";
  const cleared = Array.isArray(lead.cleared_fields) ? lead.cleared_fields : [];
  if (cleared.includes("phone")) return "";
  if (lead.phone && isValidPhone(lead.phone)) return lead.phone;
  if (lead.contacts && lead.contacts[0]?.phone && isValidPhone(lead.contacts[0].phone)) {
    return lead.contacts[0].phone;
  }
  const raw = lead.source_csv_row || {};
  const phoneKeys = ["phone", "Phone", "contact_number", "mobile", "tel"];
  for (const k of phoneKeys) {
    if (raw[k] && isValidPhone(raw[k])) return String(raw[k]).trim();
  }
  return "";
}

function getLeadEmail(lead?: any): string {
  if (!lead) return "";
  const cleared = Array.isArray(lead.cleared_fields) ? lead.cleared_fields : [];
  if (cleared.includes("email")) return "";
  if (lead.email && isValidEmail(lead.email)) return lead.email;
  if (lead.contacts && lead.contacts[0]?.email && isValidEmail(lead.contacts[0].email)) {
    return lead.contacts[0].email;
  }
  const raw = lead.source_csv_row || {};
  const emailKeys = ["email", "Email", "contact_email", "mail"];
  for (const k of emailKeys) {
    if (raw[k] && isValidEmail(raw[k])) return String(raw[k]).trim();
  }
  return "";
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [data, setData] = useState<LeadDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactChannel, setContactChannel] = useState<"WhatsApp" | "Email">("WhatsApp");
  const [createdInteractionId, setCreatedInteractionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Direct WhatsApp & Email Push States
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [pushStatusMessage, setPushStatusMessage] = useState("");
  const [pushErrorMessage, setPushErrorMessage] = useState("");

  // Four-Stage Follow-Up & Reply Status States
  const [replyStatus, setReplyStatus] = useState<"no_reply" | "interested" | "not_now" | "not_interested">("no_reply");
  const [selectedPriority, setSelectedPriority] = useState<"Hot" | "Warm" | "Cold">("Warm");
  const [selectedOffer, setSelectedOffer] = useState("");
  const [selectedObservation, setSelectedObservation] = useState("");
  const [plannedForDate, setPlannedForDate] = useState<string>("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>("");
  const [savingStrategy, setSavingStrategy] = useState(false);
  const [strategyMessage, setStrategyMessage] = useState<string | null>(null);

  // Log Customer Reply Modal
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyChannel, setReplyChannel] = useState<"WhatsApp" | "Email" | "Phone Call">("WhatsApp");
  const [incomingReplyText, setIncomingReplyText] = useState("");
  const [manualReplyStatus, setManualReplyStatus] = useState<"no_reply" | "interested" | "not_now" | "not_interested">("interested");
  const [savingReply, setSavingReply] = useState(false);
  const [replyModalError, setReplyModalError] = useState<string | null>(null);

  // Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");

  // Book Call Modal
  const [isBookCallModalOpen, setIsBookCallModalOpen] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [bookingCall, setBookingCall] = useState(false);
  const [bookCallSuccessMessage, setBookCallSuccessMessage] = useState<string | null>(null);

  // Mark Lost Modal
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");

  // Reactivate Lost Lead Modal
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [reactivateReason, setReactivateReason] = useState("");
  const [reactivating, setReactivating] = useState(false);

  // Unresponsive Lead Safeguard Modal
  const [isUnresponsiveProposalWarningOpen, setIsUnresponsiveProposalWarningOpen] = useState(false);
  const [convertingToProposal, setConvertingToProposal] = useState(false);

  // Lead Documents & Attachments
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [docUploadSuccess, setDocUploadSuccess] = useState<string | null>(null);

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
        setRecipientPhone(extractedPhone);
        setRecipientEmail(extractedEmail);

        if (json.lead.priority) {
          setSelectedPriority(json.lead.priority as any);
        }
        if (json.lead.reply_status) {
          setReplyStatus(json.lead.reply_status as any);
        }
        setSelectedOffer(json.lead.primary_offer || "");
        setSelectedObservation(json.lead.primary_observation || "");

        if (json.lead.planned_for) {
          try {
            setPlannedForDate(new Date(json.lead.planned_for).toISOString().split("T")[0]);
          } catch {
            setPlannedForDate("");
          }
        } else {
          setPlannedForDate("");
        }

        if (json.lead.next_follow_up_at) {
          try {
            setNextFollowUpDate(new Date(json.lead.next_follow_up_at).toISOString().split("T")[0]);
          } catch {
            setNextFollowUpDate("");
          }
        } else {
          setNextFollowUpDate("");
        }
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

  // Pre-fill recipient phone & email whenever Contact modal opens
  useEffect(() => {
    if (isContactModalOpen && data?.lead) {
      const p = getLeadPhone(data.lead);
      const e = getLeadEmail(data.lead);
      setRecipientPhone(p);
      setRecipientEmail(e);
    }
  }, [isContactModalOpen, data?.lead]);

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.business_name.trim()) {
      setEditFormError("Business name is required.");
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
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update lead details");
      }
      setIsEditModalOpen(false);
      await fetchLead();
    } catch (err: any) {
      setEditFormError(err.message || "Failed to update lead");
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
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to delete lead");
      }
      router.push("/leads");
    } catch (err: any) {
      alert(err.message || "Failed to delete lead");
    } finally {
      setEditActionLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Save Priority, Strategy & Schedules (Offer / Observation / Rollover date / Follow-up date)
  const handleSaveStrategy = async () => {
    setSavingStrategy(true);
    setStrategyMessage(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: selectedPriority,
          primary_offer: selectedOffer,
          primary_observation: selectedObservation,
          reply_status: replyStatus,
          planned_for: plannedForDate ? new Date(`${plannedForDate}T12:00:00Z`).toISOString() : null,
          next_follow_up_at: nextFollowUpDate ? new Date(`${nextFollowUpDate}T12:00:00Z`).toISOString() : null,
        }),
      });
      if (res.ok) {
        setStrategyMessage("Strategy & Schedule updated successfully!");
        setTimeout(() => setStrategyMessage(null), 3000);
        await fetchLead();
      }
    } catch (err) {
      console.error("Failed to save strategy", err);
    } finally {
      setSavingStrategy(false);
    }
  };

  // Open Contact Modal (GATE 1 Prep) — Direct Manual Draft
  const handleOpenContactModal = async (channelOverride?: "WhatsApp" | "Email" | unknown) => {
    const channel: "WhatsApp" | "Email" =
      channelOverride === "WhatsApp" || channelOverride === "Email"
        ? channelOverride
        : contactChannel;
    setContactChannel(channel);

    // Check if there is an unsent draft interaction already in history
    const existingDraft = data?.lead?.interactions?.find(
      (i: any) => i.direction === "Outgoing" && !i.confirmed_sent && i.channel === channel
    );
    if (existingDraft) {
      setDraftSubject(`Partnership Inquiry: ${data?.lead.business_name}`);
      setDraftBody(existingDraft.content);
      setCreatedInteractionId(existingDraft.id);
      setIsContactModalOpen(true);
      return;
    }

    const contactName = data?.lead?.contacts?.[0]?.name || data?.lead?.business_name || "there";
    const initialPhone = getLeadPhone(data?.lead);
    const initialEmail = getLeadEmail(data?.lead);
    setRecipientPhone(initialPhone);
    setRecipientEmail(initialEmail);

    const offerText = data?.lead?.primary_offer || selectedOffer || "our specialized services";
    const defaultBody = `Hi ${contactName},\n\nI noticed ${data?.lead?.business_name} in ${data?.lead?.niche_industry || "your industry"} and wanted to reach out regarding ${offerText}.\n\nWould you be open to a quick 5-minute chat this week?`;

    setDraftSubject(`Partnership Inquiry: ${data?.lead?.business_name}`);
    setDraftBody(defaultBody);
    setCreatedInteractionId(null);
    setPushStatusMessage("");
    setPushErrorMessage("");
    setIsContactModalOpen(true);
  };

  // Push to WhatsApp
  const handlePushToWhatsApp = async () => {
    setPushStatusMessage("");
    setPushErrorMessage("");

    const phoneTrimmed = recipientPhone.trim();
    if (!phoneTrimmed || !isValidPhone(phoneTrimmed)) {
      setPushErrorMessage("Please provide a valid WhatsApp phone number with country code (e.g. +971 50 123 4567 or +92 318 427 4017).");
      return;
    }

    const cleanDigits = phoneTrimmed.replace(/[^0-9]/g, "");
    if (cleanDigits.length < 7) {
      setPushErrorMessage("Invalid phone number. Please include country code.");
      return;
    }

    if (!draftBody.trim()) {
      setPushErrorMessage("Message body cannot be empty.");
      return;
    }

    // Ensure interaction draft is saved
    try {
      if (!createdInteractionId) {
        const intRes = await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadId,
            channel: "WhatsApp",
            direction: "Outgoing",
            content: draftBody,
            confirmed_sent: false,
          }),
        });
        if (intRes.ok) {
          const intJson = await intRes.json();
          setCreatedInteractionId(intJson.interaction?.id || intJson.id);
        }
      }
    } catch (e) {
      // non-blocking
    }

    const waUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(draftBody)}`;
    window.open(waUrl, "_blank");

    setPushStatusMessage("WhatsApp chat opened with your draft pre-filled! Send it manually, then click 'Mark as Sent' to unlock Gate 1.");
  };

  // Push to Email
  const handlePushToEmail = async () => {
    setPushStatusMessage("");
    setPushErrorMessage("");

    const emailTrimmed = recipientEmail.trim();
    if (!emailTrimmed || !isValidEmail(emailTrimmed)) {
      setPushErrorMessage("Please provide a valid recipient email address (e.g. contact@business.com).");
      return;
    }

    if (!draftBody.trim()) {
      setPushErrorMessage("Message body cannot be empty.");
      return;
    }

    // Ensure interaction draft is saved
    try {
      if (!createdInteractionId) {
        const intRes = await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadId,
            channel: "Email",
            direction: "Outgoing",
            content: draftBody,
            confirmed_sent: false,
          }),
        });
        if (intRes.ok) {
          const intJson = await intRes.json();
          setCreatedInteractionId(intJson.interaction?.id || intJson.id);
        }
      }
    } catch (e) {
      // non-blocking
    }

    const mailtoUrl = `mailto:${encodeURIComponent(emailTrimmed)}?subject=${encodeURIComponent(draftSubject)}&body=${encodeURIComponent(draftBody)}`;
    const mailLink = document.createElement("a");
    mailLink.href = mailtoUrl;
    mailLink.target = "_self";
    document.body.appendChild(mailLink);
    mailLink.click();
    document.body.removeChild(mailLink);

    setPushStatusMessage("Email client launched with draft pre-filled! Send it manually, then click 'Mark as Sent' to unlock Gate 1.");
  };

  // GATE 1: Manual Confirm Sent
  const handleConfirmSentGate1 = async () => {
    let interactionIdToConfirm = createdInteractionId;
    if (!interactionIdToConfirm) {
      // Create interaction right now
      try {
        const createRes = await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadId,
            channel: contactChannel,
            direction: "Outgoing",
            content: draftBody,
            confirmed_sent: false,
          }),
        });
        if (createRes.ok) {
          const createJson = await createRes.json();
          interactionIdToConfirm = createJson.interaction?.id || createJson.id;
        }
      } catch (e) {
        console.error("Failed to create interaction before Gate 1", e);
      }
    }

    if (!interactionIdToConfirm) return;

    try {
      const res = await fetch("/api/gates/gate1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interaction_id: interactionIdToConfirm,
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

  // Open Log Customer Reply modal
  const handleOpenReplyModal = () => {
    setReplyModalError(null);
    setIncomingReplyText("");
    if (data?.lead?.reply_status) {
      setManualReplyStatus(data.lead.reply_status as any);
    }
    setIsReplyModalOpen(true);
  };

  // Save customer reply (Manual)
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
          reply_status: manualReplyStatus,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setReplyModalError(json.error || "Failed to save customer reply.");
        return;
      }
      setReplyStatus(manualReplyStatus);
      setIsReplyModalOpen(false);
      await fetchLead();
    } catch (err: any) {
      setReplyModalError(err.message || "Failed to save reply.");
    } finally {
      setSavingReply(false);
    }
  };

  // Book Call
  const handleBookCall = async () => {
    setBookingCall(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/book-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_notes: callNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to book call");
      }
      setIsBookCallModalOpen(false);
      setCallNotes("");
      setBookCallSuccessMessage("Call booked successfully! Interaction logged to history.");
      setTimeout(() => setBookCallSuccessMessage(null), 6000);
      await fetchLead();
    } catch (err: any) {
      console.error("Failed to book call", err);
      alert(err.message || "Failed to book call");
    } finally {
      setBookingCall(false);
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

  // Reactivate Lost Lead
  const handleReactivateLead = async () => {
    if (!reactivateReason.trim()) return;
    setReactivating(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reactivate_lead: true,
          reactivate_reason: reactivateReason.trim(),
        }),
      });
      if (res.ok) {
        setIsReactivateModalOpen(false);
        setReactivateReason("");
        fetchLead();
      }
    } catch (err) {
      console.error("Failed to reactivate lead", err);
    } finally {
      setReactivating(false);
    }
  };

  // Move to Proposal -> Converts Lead to Client & opens S7
  const handleMoveToProposal = async () => {
    try {
      setConvertingToProposal(true);
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ convert_to_client: true }),
      });
      if (res.ok) {
        const json = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                lead: {
                  ...prev.lead,
                  status: "Proposal",
                  converted_client_id: json.client?.id || prev.lead.converted_client_id,
                },
              }
            : null
        );
        router.push(`/proposals/builder?client_id=${json.client?.id || ""}&lead_id=${leadId}`);
      }
    } catch (err) {
      console.error("Failed to convert lead to proposal", err);
    } finally {
      setConvertingToProposal(false);
      setIsUnresponsiveProposalWarningOpen(false);
    }
  };

  const handleMoveToProposalClick = () => {
    if (lead?.reply_status !== "interested" && (lead as any)?.customer_behavior !== "warm_interested") {
      setIsUnresponsiveProposalWarningOpen(true);
    } else {
      handleMoveToProposal();
    }
  };

  // Upload Document to Lead
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setDocUploadError("File exceeds 10MB limit.");
      return;
    }
    setUploadingDoc(true);
    setDocUploadError(null);
    setDocUploadSuccess(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/leads/${leadId}/documents`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        setDocUploadSuccess(`Uploaded "${file.name}" successfully!`);
        await fetchLead();
        setTimeout(() => setDocUploadSuccess(null), 4000);
      } else {
        const err = await res.json();
        setDocUploadError(err.error || "Failed to upload document");
      }
    } catch (err: any) {
      setDocUploadError(err.message || "Upload error");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/leads/${leadId}/documents?document_id=${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchLead();
      }
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading lead intelligence profile...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-[var(--text-muted)]">Lead not found.</p>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] text-xs font-semibold text-[var(--accent)]"
        >
          Back to Leads
        </Link>
      </div>
    );
  }

  const { lead, open_tasks, documents } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── BREADCRUMBS ─── */}
      <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
        <div className="flex items-center gap-2">
          <Link href="/leads" className="hover:text-[var(--text-primary)] transition-colors">
            Leads
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--text-secondary)] font-medium truncate max-w-[200px]">
            {lead.business_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xs"
            title="Edit Lead Information"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--danger-soft)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors text-xs"
            title="Delete Lead"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* ─── LEAD HEADER CARD ─── */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {lead.business_name}
              </h1>

              {/* Status Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)]">
                {lead.status}
              </span>

              {/* Priority Manual Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                  (lead.priority || selectedPriority) === "Hot"
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    : (lead.priority || selectedPriority) === "Warm"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                }`}
              >
                {(lead.priority || selectedPriority) === "Hot" && <Flame className="w-3 h-3 text-rose-400" />}
                {(lead.priority || selectedPriority) === "Warm" && <TrendingUp className="w-3 h-3 text-amber-400" />}
                <span>{lead.priority || selectedPriority} Priority</span>
              </span>

              {/* Reply Status Badge */}
              {lead.reply_status && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 capitalize">
                  {lead.reply_status.replace(/_/g, " ")}
                </span>
              )}

              {lead.is_today_target && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>Today&apos;s Target</span>
                </span>
              )}
            </div>

            {/* Verified Facts Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
              <div className="flex items-center gap-1.5">
                <FactBadge type="fact" label="Fact" />
                <span>Industry: {lead.niche_industry || "General"}</span>
              </div>
              {lead.rating && (
                <div className="flex items-center gap-1 font-semibold text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent-border)] px-2 py-0.5 rounded text-xs">
                  <span>⭐ {lead.rating}</span>
                  {lead.review_count && (
                    <span className="text-[11px] text-[var(--accent)]/80 font-normal">({lead.review_count} reviews)</span>
                  )}
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{lead.website}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
              {lead.city_country && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <span>{lead.city_country}</span>
                </div>
              )}
              {isValidPhone(lead.phone) && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <a
                    href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-500 hover:underline flex items-center gap-1"
                  >
                    <span>{lead.phone}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[var(--text-dim)]" />
                  </a>
                </div>
              )}
              {isValidEmail(lead.email) && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <a
                    href={`mailto:${lead.email || ""}`}
                    className="hover:text-[var(--accent)] hover:underline flex items-center gap-1"
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
            <button
              onClick={() => handleOpenContactModal("WhatsApp")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Contact (Gate 1)</span>
            </button>

            <button
              onClick={() => setIsBookCallModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Book Call</span>
            </button>

            {lead.status === "Lost" ? (
              <button
                onClick={() => setIsReactivateModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reactivate Lead</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLostModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-dim)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
              >
                <span>Mark Lost</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── SUCCESS NOTICES ─── */}
      {bookCallSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{bookCallSuccessMessage}</span>
          </div>
          <button onClick={() => setBookCallSuccessMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {strategyMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{strategyMessage}</span>
          </div>
          <button onClick={() => setStrategyMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── SPLIT WORKSPACE & PIPELINE LAYOUT (Left ~65% Workspace, Right ~35% Strategy / Pipeline) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ~65% (lg:col-span-8) — Persistent Research Workspace & Source Records */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. PERSISTENT RESEARCH WORKSPACE (Notes, Files, Links, Videos) */}
          <LeadWorkspace leadId={leadId} />

          {/* 2. FULL RAW IMPORTED CSV DATA (IMMUTABLE AUDIT TRAIL) */}
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawData(!showRawData)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--text-dim)]" />
                <span className="text-sm font-semibold text-[var(--text-secondary)]">Full Raw Imported Row</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                  {lead.source_csv_row ? `${Object.keys(lead.source_csv_row).length} attributes` : "Raw Row"}
                </span>
              </div>
              {showRawData ? (
                <ChevronDown className="w-4 h-4 text-[var(--text-dim)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--text-dim)]" />
              )}
            </button>

            {showRawData && (
              <div className="px-6 pb-6 space-y-4">
                <p className="text-[11px] text-[var(--text-dim)] pb-2 border-b border-[var(--border)]">
                  Original immutable source of truth. Every raw CSV column is preserved untouched.
                </p>
                {lead.source_csv_row && typeof lead.source_csv_row === "object" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(lead.source_csv_row).map(([k, v]) => (
                      <div
                        key={k}
                        className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs space-y-0.5"
                      >
                        <span className="text-[10px] uppercase font-bold text-[var(--text-dim)] block">
                          {k}
                        </span>
                        <span className="text-[var(--text-primary)] font-medium break-words">
                          {typeof v === "object" ? JSON.stringify(v) : String(v || "-")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] italic">No raw CSV attributes found.</p>
                )}
              </div>
            )}
          </div>

          {/* 3. DOCUMENTS & ATTACHMENTS */}
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[var(--text-muted)]" />
                <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)]">
                  Documents &amp; Files
                </h2>
                <span className="text-xs text-[var(--text-dim)]">({documents.length})</span>
              </div>
              <div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold transition-colors cursor-pointer">
                  <FileUp className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{uploadingDoc ? "Uploading..." : "Upload File"}</span>
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploadingDoc}
                    onChange={handleUploadDocument}
                  />
                </label>
              </div>
            </div>

            {docUploadError && (
              <p className="text-xs text-[var(--danger)]">{docUploadError}</p>
            )}
            {docUploadSuccess && (
              <p className="text-xs text-emerald-400">{docUploadSuccess}</p>
            )}

            {documents.length === 0 ? (
              <p className="text-xs text-[var(--text-dim)] italic">No documents attached yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">{doc.title}</p>
                      <p className="text-[10px] text-[var(--text-dim)]">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-[var(--accent)] hover:underline"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--danger)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ~35% (lg:col-span-4) — Strategy, Rollover/Follow-Up Schedules, Pipeline Actions, Interactions */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. STRATEGY & SCHEDULE CONTROL CARD */}
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)]">
                  Selected Strategy &amp; Schedule
                </h2>
              </div>
              <button
                onClick={handleSaveStrategy}
                disabled={savingStrategy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {savingStrategy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>

            {/* Priority & Reply Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Priority:
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="Hot">🔥 Hot</option>
                  <option value="Warm">📈 Warm</option>
                  <option value="Cold">❄️ Cold</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Reply Status:
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value as any)}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="no_reply">No reply</option>
                  <option value="interested">Interested</option>
                  <option value="not_now">Not now</option>
                  <option value="not_interested">Not interested</option>
                </select>
              </div>
            </div>

            {/* Daily Target Rollover & Next Follow-Up Schedules */}
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              {/* Planned For (Rollover Target) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Planned For (Daily Quota):</span>
                  </label>
                  {lead.is_today_target && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                      Target Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={plannedForDate}
                    onChange={(e) => setPlannedForDate(e.target.value)}
                    className="flex-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setPlannedForDate(new Date().toISOString().split("T")[0])}
                    className="px-2 py-1.5 rounded bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] font-medium"
                    title="Set to today"
                  >
                    Today
                  </button>
                  {plannedForDate && (
                    <button
                      type="button"
                      onClick={() => setPlannedForDate("")}
                      className="p-1.5 text-[var(--text-dim)] hover:text-[var(--danger)]"
                      title="Clear planned date"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-dim)]">
                  Unfinished leads roll over automatically to Today&apos;s Targets without cron.
                </p>
              </div>

              {/* Next Follow-Up Date (Dashboard Follow-ups Due) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Next Follow-Up Date:</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="flex-1 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 2);
                      setNextFollowUpDate(d.toISOString().split("T")[0]);
                    }}
                    className="px-2 py-1.5 rounded bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] font-medium"
                    title="Set to +2 days"
                  >
                    +2d
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setNextFollowUpDate(d.toISOString().split("T")[0]);
                    }}
                    className="px-2 py-1.5 rounded bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] font-medium"
                    title="Set to +7 days"
                  >
                    +7d
                  </button>
                  {nextFollowUpDate && (
                    <button
                      type="button"
                      onClick={() => setNextFollowUpDate("")}
                      className="p-1.5 text-[var(--text-dim)] hover:text-[var(--danger)]"
                      title="Clear follow-up date"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-dim)]">
                  Queries on Dashboard &ldquo;Follow-ups Due&rdquo; when date arrives.
                </p>
              </div>
            </div>

            {/* Selected Offer */}
            <div className="space-y-1.5 pt-3 border-t border-[var(--border)]">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Selected Offer:
              </label>
              <input
                type="text"
                value={selectedOffer}
                onChange={(e) => setSelectedOffer(e.target.value)}
                placeholder="e.g. WhatsApp Booking Automation & Fast Intake System"
                className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Selected Observation */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Selected Observation:
              </label>
              <textarea
                rows={2}
                value={selectedObservation}
                onChange={(e) => setSelectedObservation(e.target.value)}
                placeholder="Specific takeaway about this lead's operation or website..."
                className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-y font-sans"
              />
            </div>
          </div>

          {/* 2. PIPELINE STAGE ACTION CARD */}
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">
              Pipeline Stage Action
            </h2>

            <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium">Outreach Touchpoints:</span>
                <span className="font-bold text-[var(--text-primary)]">{lead.follow_up_count || 0} / 4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-medium">Current Status:</span>
                <span className="font-semibold text-[var(--accent)]">{lead.status}</span>
              </div>
            </div>

            <button
              onClick={() => handleOpenContactModal("WhatsApp")}
              className="w-full py-2.5 px-3 rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent-hover)] text-[var(--accent)] hover:text-white border border-[var(--accent-border)] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Draft Outreach (Gate 1)</span>
            </button>

            <button
              onClick={handleOpenReplyModal}
              className="w-full py-2.5 px-3 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log Customer Reply</span>
            </button>

            <button
              onClick={handleMoveToProposalClick}
              disabled={convertingToProposal}
              className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {convertingToProposal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span>Convert to Client &amp; Proposal</span>
            </button>

            <div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-dim)]">
              5 Hard Approval Gates strictly enforced. All messages sent manually by you.
            </div>
          </div>

          {/* 3. INTERACTION HISTORY FEED */}
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
                <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)]">Interaction History</h2>
              </div>
              <button
                type="button"
                onClick={handleOpenReplyModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Log Reply</span>
              </button>
            </div>

            {lead.interactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-dim)] space-y-2">
                <p>No outreach interactions logged yet.</p>
                <button
                  onClick={() => handleOpenContactModal("WhatsApp")}
                  className="text-[var(--accent)] hover:underline font-semibold"
                >
                  Start Gate 1 Outreach
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {lead.interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          interaction.direction === "Outgoing"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {interaction.direction}
                        </span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {interaction.channel}
                        </span>
                        {interaction.confirmed_sent && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            Gate 1 Confirmed
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-dim)]">
                        {new Date(interaction.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed text-[11px]">
                      {interaction.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL: CONTACT (GATE 1) ─── */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                  Gate 1: Outreach Dispatch
                </h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Edit your draft below. Push to WhatsApp or Email, then confirm send.
                </p>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channel Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setContactChannel("WhatsApp")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                  contactChannel === "WhatsApp"
                    ? "bg-[#25D366]/15 text-[#25D366] border-[#25D366]/40"
                    : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setContactChannel("Email")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                  contactChannel === "Email"
                    ? "bg-blue-600/15 text-blue-400 border-blue-500/40"
                    : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>

            {/* Recipient inputs */}
            {contactChannel === "WhatsApp" ? (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Recipient Phone:</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Recipient Email:</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="contact@business.com"
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Subject:</label>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    placeholder="Subject line..."
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}

            {/* Message Body Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-dim)]">
                <label className="font-semibold text-[var(--text-secondary)]">Message Body (Manual Draft):</label>
                <div className="flex items-center gap-2">
                  <SnippetPicker
                    leadContext={{
                      business_name: lead.business_name,
                      contact_name: (lead.contacts && lead.contacts[0]?.name) || null,
                      primary_offer: selectedOffer || lead.primary_offer,
                      primary_observation: selectedObservation || lead.primary_observation,
                      city_country: lead.city_country,
                      niche_industry: lead.niche_industry,
                      phone: recipientPhone || lead.phone,
                      email: recipientEmail || lead.email,
                      website: lead.website,
                    }}
                    onSelect={(mergedText) => setDraftBody(mergedText)}
                  />
                  <span>{draftBody.length} characters</span>
                </div>
              </div>
              <textarea
                rows={6}
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder="Write your outreach message or insert a snippet..."
                className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-y font-sans leading-relaxed"
              />
            </div>

            {pushErrorMessage && (
              <p className="text-xs text-[var(--danger)] font-medium">{pushErrorMessage}</p>
            )}
            {pushStatusMessage && (
              <p className="text-xs text-emerald-400 font-medium">{pushStatusMessage}</p>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-[var(--border)]">
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
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-primary)] disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>

              <div className="flex items-center justify-end gap-2">
                {contactChannel === "WhatsApp" ? (
                  <button
                    type="button"
                    onClick={handlePushToWhatsApp}
                    disabled={!draftBody.trim()}
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
                    disabled={!draftBody.trim()}
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
                  disabled={!draftBody.trim()}
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

      {/* ─── MODAL: LOG CUSTOMER REPLY ─── */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                Log Customer Reply
              </h3>
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channel */}
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
                        : "bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Status Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Reply Status / Intent:
              </label>
              <select
                value={manualReplyStatus}
                onChange={(e) => setManualReplyStatus(e.target.value as any)}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                <option value="interested">Interested (Wants pricing / call / discussion)</option>
                <option value="not_now">Not now (Follow up later / busy)</option>
                <option value="no_reply">No reply (Delivered / seen but no answer)</option>
                <option value="not_interested">Not interested (Rejected / opt-out)</option>
              </select>
            </div>

            {/* Customer Reply Words */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Customer Message / Notes:
              </label>
              <textarea
                rows={3}
                value={incomingReplyText}
                onChange={(e) => setIncomingReplyText(e.target.value)}
                placeholder="Paste what the customer said or write a quick note..."
                className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none font-sans"
              />
            </div>

            {replyModalError && (
              <p className="text-xs text-[var(--danger)]">{replyModalError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsReplyModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomerReply}
                disabled={savingReply}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {savingReply && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Reply</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: BOOK CALL ─── */}
      {isBookCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Book Discovery / Intro Call</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Advances lead status to <strong>Booking</strong> and creates an interaction record.
            </p>
            <textarea
              rows={3}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Call agenda, agreed date/time or meeting link..."
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBookCallModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleBookCall}
                disabled={bookingCall}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {bookingCall && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Call Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: MARK LOST ─── */}
      {isLostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Mark Lead as Lost</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Mandatory reason required to update system records.
            </p>
            <textarea
              rows={3}
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Reason for loss..."
              className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--danger)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsLostModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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

      {/* ─── MODAL: REACTIVATE LOST LEAD ─── */}
      {isReactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">Reactivate Lost Lead</h3>
              </div>
              <button
                onClick={() => setIsReactivateModalOpen(false)}
                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Reset this lead back to <strong>Qualified</strong> status and reset follow-up count. All prior touchpoints and files will remain permanently in your history.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Reactivation Reason (Mandatory) *
              </label>
              <textarea
                rows={3}
                value={reactivateReason}
                onChange={(e) => setReactivateReason(e.target.value)}
                placeholder="e.g. Following up after 3 months — new decision maker..."
                className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsReactivateModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleReactivateLead}
                disabled={!reactivateReason.trim() || reactivating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow"
              >
                {reactivating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Reactivation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT LEAD ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Edit Lead Details</h3>
            <form onSubmit={handleUpdateLead} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Business Name *</label>
                <input
                  type="text"
                  value={editFormData.business_name}
                  onChange={(e) => setEditFormData({ ...editFormData, business_name: e.target.value })}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Industry / Niche</label>
                  <input
                    type="text"
                    value={editFormData.niche_industry}
                    onChange={(e) => setEditFormData({ ...editFormData, niche_industry: e.target.value })}
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">City / Country</label>
                  <input
                    type="text"
                    value={editFormData.city_country}
                    onChange={(e) => setEditFormData({ ...editFormData, city_country: e.target.value })}
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Website</label>
                <input
                  type="text"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              {editFormError && <p className="text-xs text-[var(--danger)]">{editFormError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editActionLoading}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {editActionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE LEAD ─── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--danger)]">Delete Lead</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to permanently delete <strong>{lead.business_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={editActionLoading}
                className="px-4 py-2 rounded-lg bg-[var(--danger)] hover:opacity-90 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {editActionLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: UNRESPONSIVE SAFEGUARD WARNING ─── */}
      <UnresponsiveAdvanceWarningModal
        isOpen={isUnresponsiveProposalWarningOpen}
        onClose={() => setIsUnresponsiveProposalWarningOpen(false)}
        onConfirm={handleMoveToProposal}
        actionTitle="Convert to Proposal"
        behavior={lead.reply_status || (lead as any).customer_behavior}
      />
    </div>
  );
}
