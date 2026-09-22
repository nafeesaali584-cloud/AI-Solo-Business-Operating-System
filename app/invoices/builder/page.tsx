"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Download,
  AlertTriangle,
  Loader2,
  Calendar,
  Palette,
  ExternalLink,
  AlertCircle,
  CreditCard,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { GateBadge } from "@/components/ui/GateBadge";
import { useBusinessBrain } from "@/context/BusinessBrainContext";
import { BRAND } from "@/lib/brand/config";
import {
  generateInvoicePdf,
  loadProfileImageDataUrl,
  PdfTemplate,
} from "@/lib/brand/pdf-templates";
import { InvoiceDocument } from "@/components/brand/InvoiceDocument";
import { ThemeMode } from "@/lib/brand/tokens";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const PAYMENT_METHODS = [
  {
    id: "sadapay",
    title: "SadaPay (SadaBiz) Payment Link",
    badge: "Primary Recommended (0% Fee)",
    isDefault: true,
    note: "0% receiving fee, works well for international card payments from UAE/GCC clients.",
    instructions:
      "SadaPay (SadaBiz) International Card Link:\nPayment Link: https://sadabiz.me/pay/nafeesaali\nSupports international Visa/Mastercard from UAE, GCC, and worldwide with 0% extra receiving fee.",
  },
  {
    id: "bank_transfer",
    title: "Direct Bank Transfer (UBL / Meezan)",
    badge: "Secondary Wire Option",
    isDefault: false,
    note: "Alternative for clients who prefer wire transfer, note it may involve additional bank forex margin/fees.",
    instructions:
      "Direct Bank Wire Transfer:\nBank: Meezan Bank / United Bank Limited (UBL)\nAccount Title: Nafeesa Ali\nIBAN: PK64MEZN0001020304050607\nNote: Bank wire transfers may incur standard intermediary routing and forex fees.",
  },
  {
    id: "payoneer",
    title: "Payoneer Direct Payment",
    badge: "Marketplace Sourced Only",
    isDefault: false,
    note: "Higher fee structure for direct clients (recommended primarily for Upwork/Fiverr marketplace-sourced clients).",
    instructions:
      "Payoneer Billing Request:\nPayoneer Account Email: payments@nafeesaali.com\nPay via credit card or local bank receiving account.",
  },
];

function InvoiceBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id");
  const clientIdParam = searchParams.get("client_id");
  const proposalIdParam = searchParams.get("proposal_id");
  const { setActiveEntity } = useBusinessBrain();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Invoice state
  const [id, setId] = useState<string | null>(invoiceId);
  const [clientId, setClientId] = useState<string | null>(clientIdParam);
  const [proposalId, setProposalId] = useState<string | null>(proposalIdParam);
  const [clientName, setClientName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-0001");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "Project Deposit (50% Milestone)", quantity: 1, unit_price: 1150, total: 1150 },
  ]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    PAYMENT_METHODS[0].instructions
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("sadapay");
  const [notes, setNotes] = useState("Thank you for partnering with us. We look forward to executing this milestone.");
  const [status, setStatus] = useState<"Draft" | "Sent" | "Paid" | "Pending" | "Overdue">("Draft");
  const [sentConfirmedAt, setSentConfirmedAt] = useState<string | null>(null);
  const [paidConfirmedAt, setPaidConfirmedAt] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate>("B");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeView, setActiveView] = useState<"preview" | "editor">("preview");
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (invoiceId) {
          const res = await fetch(`/api/invoices?id=${invoiceId}`);
          if (res.ok) {
            const json = await res.json();
            const inv = json.invoice;
            setId(inv.id);
            setClientId(inv.client_id);
            setProposalId(inv.proposal_id);
            setClientName(inv.client?.business_name || "Client");
            setInvoiceNumber(inv.invoice_number);
            if (inv.line_items) setLineItems(inv.line_items);
            if (inv.due_date) setDueDate(new Date(inv.due_date).toISOString().split("T")[0]);
            setPaymentInstructions(inv.payment_instructions || "");
            if (inv.payment_method) setPaymentMethod(inv.payment_method);
            setNotes(inv.notes || "");
            setStatus(inv.status);
            setSentConfirmedAt(inv.sent_confirmed_at);
            setPaidConfirmedAt(inv.paid_confirmed_at);

            setActiveEntity({
              type: "invoice",
              id: inv.id,
              name: `Invoice ${inv.invoice_number} for ${inv.client?.business_name}`,
              data: inv,
            });
          }
        } else if (proposalIdParam) {
          const res = await fetch(`/api/proposals?id=${proposalIdParam}`);
          if (res.ok) {
            const json = await res.json();
            const p = json.proposal;
            setClientName(p.client?.business_name || p.lead?.business_name || "Client");
            setClientId(p.client_id);
            if (p.services && Array.isArray(p.services)) {
              setLineItems(
                p.services.map((s: any) => ({
                  description: s.name,
                  quantity: 1,
                  unit_price: Number(s.price) || 0,
                  total: Number(s.price) || 0,
                }))
              );
            }
          }
        } else if (clientIdParam) {
          const res = await fetch(`/api/clients/${clientIdParam}`);
          if (res.ok) {
            const json = await res.json();
            setClientName(json.client.business_name);
            setClientId(json.client.id);
          }
        }
      } catch (err) {
        console.error("Failed to load invoice data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [invoiceId, clientIdParam, proposalIdParam]);

  const totalAmount = lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    const current = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      const q = field === "quantity" ? Number(value) : current.quantity;
      const u = field === "unit_price" ? Number(value) : current.unit_price;
      current.total = q * u;
    }
    updated[index] = current;
    setLineItems(updated);
  };

  // Save invoice draft
  const handleSaveInvoice = async () => {
    setSaving(true);
    setActionMessage(null);
    try {
      if (id) {
        const selectedMethodConfig = PAYMENT_METHODS.find((m) => m.id === paymentMethod);
        const res = await fetch("/api/invoices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            line_items: lineItems,
            amount: totalAmount,
            due_date: dueDate,
            payment_instructions: paymentInstructions,
            payment_method: paymentMethod,
            payment_method_note: selectedMethodConfig?.note || null,
            notes,
          }),
        });
        if (res.ok) {
          setActionMessage({ text: "Invoice draft saved successfully.", type: "success" });
        }
      } else {
        const selectedMethodConfig = PAYMENT_METHODS.find((m) => m.id === paymentMethod);
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            proposal_id: proposalId,
            line_items: lineItems,
            amount: totalAmount,
            due_date: dueDate,
            payment_instructions: paymentInstructions,
            payment_method: paymentMethod,
            payment_method_note: selectedMethodConfig?.note || null,
            notes,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setId(json.invoice.id);
          setInvoiceNumber(json.invoice.invoice_number);
          router.replace(`/invoices/builder?id=${json.invoice.id}`);
          setActionMessage({ text: "Invoice generated.", type: "success" });
        }
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Save failed.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // GATE 4: Mark Invoice as Sent
  const handleMarkSentGate4 = async () => {
    if (!id) await handleSaveInvoice();
    if (!id) return;
    try {
      const res = await fetch("/api/gates/gate4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: id }),
      });
      if (res.ok) {
        setStatus("Sent");
        setSentConfirmedAt(new Date().toISOString());
        setActionMessage({
          text: "GATE 4 CLEARED: Invoice manually confirmed as sent to client.",
          type: "success",
        });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Gate 4 failed", type: "error" });
    }
  };

  // GATE 5: Confirm Payment Received
  const handleConfirmPaymentGate5 = async () => {
    if (!id) return;
    try {
      const res = await fetch("/api/gates/gate5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: id }),
      });
      if (res.ok) {
        const json = await res.json();
        setStatus("Paid");
        setPaidConfirmedAt(new Date().toISOString());
        setActionMessage({
          text: "GATE 5 CLEARED: Payment confirmed! Onboarding checklist auto-created.",
          type: "success",
        });
        // Direct to onboarding if returned
        if (json.onboarding?.id) {
          setTimeout(() => {
            router.push(`/onboarding/${json.onboarding.id}`);
          }, 1500);
        }
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Gate 5 failed", type: "error" });
    }
  };

  // Mark Overdue
  const handleMarkOverdue = async () => {
    if (!id) return;
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Overdue" }),
      });
      if (res.ok) {
        setStatus("Overdue");
        setActionMessage({ text: "Invoice marked as Overdue.", type: "success" });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || "Update failed", type: "error" });
    }
  };

  // Download PDF using Brand Kit & Selected Template
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const profileDataUrl = await loadProfileImageDataUrl();
      const doc = generateInvoicePdf(
        selectedTemplate,
        {
          clientName: clientName || "Client",
          invoiceNumber,
          date: new Date().toLocaleDateString(),
          dueDate,
          lineItems,
          totalAmount,
          paymentInstructions,
          notes,
        },
        profileDataUrl
      );
      doc.save(`${invoiceNumber}_${(clientName || "Client").replace(/\s+/g, "_")}_Template_${selectedTemplate}.pdf`);
    } catch (err: any) {
      console.error("Failed to generate invoice PDF:", err);
      setActionMessage({ text: "Failed to generate branded invoice PDF: " + (err.message || ""), type: "error" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-muted)]">Loading Invoice Builder...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span>S8 — Invoice Builder (Workspace B)</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Strict human approval gates for sending and payment settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sentConfirmedAt ? (
            <GateBadge gateNumber={4} isUnlocked={true} label="GATE 4: SENT" />
          ) : (
            <GateBadge gateNumber={4} isUnlocked={false} label="GATE 4: DRAFT" />
          )}
          {paidConfirmedAt ? (
            <GateBadge gateNumber={5} isUnlocked={true} label="GATE 5: PAID" />
          ) : (
            <GateBadge gateNumber={5} isUnlocked={false} label="GATE 5: UNPAID" />
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
            <span>Edit Invoice Fields</span>
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
          <InvoiceDocument
            mode={previewTheme}
            clientName={clientName || "Miss Al Reem Beauty Centre"}
            clientAddress="Ajman, UAE"
            clientPhone="+971 50 xxx xxxx"
            invoiceNumber={invoiceNumber || "#INV-0118"}
            relatedProposalNumber={proposalId ? `#PRP-${proposalId.slice(0, 4).toUpperCase()}` : "#PRP-0042"}
            issueDate={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            dueDate={dueDate ? new Date(dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "25 Sep 2026"}
            status={status === "Paid" ? "Paid" : "Awaiting payment"}
            lineItems={lineItems}
            subtotal={totalAmount}
            depositPaid={totalAmount > 2000 ? Math.round(totalAmount * 0.5) : 0}
            amountDue={totalAmount > 2000 ? Math.round(totalAmount * 0.5) : totalAmount}
            currency="AED"
            bankDetails={paymentInstructions}
            referenceNumber={invoiceNumber.replace("#", "")}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Invoice Meta Bar */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold">Client</span>
          <div className="text-base font-bold text-[var(--text-primary)]">{clientName || "Direct Client Invoice"}</div>
        </div>
        <div>
          <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold">Invoice Number</span>
          <div className="text-base font-mono font-bold text-[var(--accent)]">{invoiceNumber}</div>
        </div>
        <div>
          <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold">Due Date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] mt-1"
          />
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
            Select Invoice PDF Direction (All 3 use your verified brand colors &amp; typography):
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
                Matches <strong className="text-[var(--text-secondary)]">nafeesaali.com</strong> directly: dark background (#09090b), bold solid orange (#DA4D01) header, Space Grotesk headline, and dark item rows.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Dark Theme</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]">Site Match</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Bold Accent</span>
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
                Clean light background with an orange sidebar accent line. High readability and easy to print for accounting records.
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
                Formal corporate invoice with orange horizontal divider, alternating striped table rows, and clean payment memo box.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Corporate</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]">Tabular</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <h2 className="font-heading text-sm font-semibold text-[var(--text-primary)]">Invoice Items</h2>
          <button
            onClick={addLineItem}
            className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
            >
              <div className="md:col-span-6">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, "description", e.target.value)}
                  placeholder="Item description"
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border-hover)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border-hover)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                  placeholder="Unit Price"
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border-hover)] rounded px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between pl-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">${item.total.toLocaleString()}</span>
                {lineItems.length > 1 && (
                  <button
                    onClick={() => removeLineItem(index)}
                    className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--danger)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-sm font-semibold">
          <span className="text-[var(--text-muted)]">Total Amount Due:</span>
          <span className="text-xl text-[var(--accent)] font-bold">${totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Method Module */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="font-heading text-sm font-semibold text-[var(--text-primary)]">
              Payment Method &amp; Settlement Route
            </h2>
          </div>
          <span className="text-[11px] text-[var(--text-dim)]">
            Smart defaults based on transaction fees &amp; geography
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(method.id);
                  setPaymentInstructions(method.instructions);
                }}
                className={`p-3.5 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? "bg-[var(--surface-hover)] border-[var(--accent)] shadow-md shadow-[var(--accent)]/10"
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--text-primary)] font-heading">
                    {method.title}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      method.isDefault
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface-raised)] text-[var(--text-dim)] border border-[var(--border)]"
                    }`}
                  >
                    {method.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {method.note}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Instructions & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Payment Instructions</label>
          <textarea
            rows={4}
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-mono text-[11px]"
          />
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">Invoice Notes</label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-hover)] rounded-lg p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>
    </div>
  )}

      {/* Action Toolbar & Hard Gates (Gates 4 & 5) */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveInvoice}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-hover)] transition-colors"
          >
            {saving ? "Saving..." : "Save Invoice"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-hover)] transition-colors disabled:opacity-50"
          >
            {downloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
            )}
            <span>Export Branded PDF ({selectedTemplate})</span>
          </button>
        </div>

        {/* Gate Actions */}
        <div className="flex items-center gap-2">
          {/* Gate 4: Mark Invoice as Sent */}
          <button
            onClick={handleMarkSentGate4}
            disabled={status === "Sent" || status === "Paid"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mark Invoice as Sent (Gate 4)</span>
          </button>

          {/* Gate 5: Confirm Payment Received (The ONLY way status becomes Paid; triggers auto-onboarding) */}
          <button
            onClick={handleConfirmPaymentGate5}
            disabled={status === "Paid"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm Payment Received (Gate 5)</span>
          </button>

          {status !== "Paid" && (
            <button
              onClick={handleMarkOverdue}
              className="px-3 py-2 rounded-lg bg-[var(--danger-soft)] hover:bg-[var(--danger-border)] text-[var(--danger)] text-xs border border-[var(--danger-border)] transition-colors"
            >
              Mark Overdue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvoiceBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">Loading Invoice Builder...</p>
        </div>
      }
    >
      <InvoiceBuilderContent />
    </Suspense>
  );
}
