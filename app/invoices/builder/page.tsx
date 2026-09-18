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
  DollarSign,
  AlertCircle,
  Palette,
} from "lucide-react";
import { GateBadge } from "@/components/ui/GateBadge";
import { useBusinessBrain } from "@/context/BusinessBrainContext";
import { BRAND } from "@/lib/brand/config";
import {
  generateInvoicePdf,
  loadProfileImageDataUrl,
  PdfTemplate,
} from "@/lib/brand/pdf-templates";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

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
    "Direct Bank Wire / ACH Transfer:\nBank: Solopreneur Business Bank\nIBAN / Account: US89 3704 0044 0532 0130 00\nSWIFT: BIZUS33\nReference: Please include Invoice Number in transfer memo."
  );
  const [notes, setNotes] = useState("Thank you for partnering with us. We look forward to executing this milestone.");
  const [status, setStatus] = useState<"Draft" | "Sent" | "Paid" | "Pending" | "Overdue">("Draft");
  const [sentConfirmedAt, setSentConfirmedAt] = useState<string | null>(null);
  const [paidConfirmedAt, setPaidConfirmedAt] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate>("B");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
        const res = await fetch("/api/invoices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            line_items: lineItems,
            amount: totalAmount,
            due_date: dueDate,
            payment_instructions: paymentInstructions,
            notes,
          }),
        });
        if (res.ok) {
          setActionMessage({ text: "Invoice draft saved successfully.", type: "success" });
        }
      } else {
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
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-zinc-400">Loading Invoice Builder...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202026]">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>S8 — Invoice Builder (Workspace B)</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
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

      {/* Invoice Meta Bar */}
      <div className="p-4 rounded-xl bg-[#141417] border border-[#26262e] grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Client</span>
          <div className="text-base font-bold text-zinc-100">{clientName || "Direct Client Invoice"}</div>
        </div>
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Invoice Number</span>
          <div className="text-base font-mono font-bold text-amber-400">{invoiceNumber}</div>
        </div>
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Due Date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-[#1b1b22] border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-amber-500 mt-1"
          />
        </div>
      </div>

      {/* Brand Kit & PDF Template Selector */}
      <div className="p-5 rounded-xl bg-[#141417] border border-[#26262e] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND.profileImage}
                alt={BRAND.ownerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#DA4D01] shadow-md shadow-[#DA4D01]/20"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-100 font-['Space_Grotesk']">{BRAND.ownerName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DA4D01]/20 text-[#DA4D01] border border-[#DA4D01]/40">
                  Brand Kit Active
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {BRAND.contact.website.replace("https://", "")} • WhatsApp: {BRAND.contact.waDisplay} • LinkedIn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Palette className="w-3.5 h-3.5 text-[#DA4D01]" />
            <span className="text-[11px]">Primary Accent:</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-200 bg-[#1c1c24] px-2 py-0.5 rounded border border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DA4D01]" />
              #DA4D01
            </span>
          </div>
        </div>

        {/* 3 Template Selection Options */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-2">
            Select Invoice PDF Direction (All 3 use your verified brand colors &amp; typography):
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Template B - Bold Creative (Default) */}
            <button
              type="button"
              onClick={() => setSelectedTemplate("B")}
              className={`p-3.5 rounded-lg border text-left transition relative ${
                selectedTemplate === "B"
                  ? "bg-[#181822] border-[#DA4D01] shadow-lg shadow-[#DA4D01]/10"
                  : "bg-[#16161c] border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-100 font-['Space_Grotesk']">
                  Template B: Bold Creative
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DA4D01] text-white">
                  Brand Default
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                Matches <strong className="text-zinc-300">nafeesaali.com</strong> directly: dark background (#09090b), bold solid orange (#DA4D01) header, Space Grotesk headline, and dark item rows.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Dark Theme</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#DA4D01]/20 text-[#DA4D01]">Site Match</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Bold Accent</span>
              </div>
            </button>

            {/* Template A - Minimal Modern */}
            <button
              type="button"
              onClick={() => setSelectedTemplate("A")}
              className={`p-3.5 rounded-lg border text-left transition ${
                selectedTemplate === "A"
                  ? "bg-[#181822] border-[#DA4D01] shadow-lg shadow-[#DA4D01]/10"
                  : "bg-[#16161c] border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-100 font-['Space_Grotesk']">
                  Template A: Minimal Modern
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Light
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                Clean light background with an orange sidebar accent line. High readability and easy to print for accounting records.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Print Friendly</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Clean Accent</span>
              </div>
            </button>

            {/* Template C - Corporate Classic */}
            <button
              type="button"
              onClick={() => setSelectedTemplate("C")}
              className={`p-3.5 rounded-lg border text-left transition ${
                selectedTemplate === "C"
                  ? "bg-[#181822] border-[#DA4D01] shadow-lg shadow-[#DA4D01]/10"
                  : "bg-[#16161c] border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-100 font-['Space_Grotesk']">
                  Template C: Corporate Classic
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Light
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                Formal corporate invoice with orange horizontal divider, alternating striped table rows, and clean payment memo box.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Corporate</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Tabular</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="p-6 rounded-xl bg-[#141417] border border-[#26262e] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Invoice Items</h2>
          <button
            onClick={addLineItem}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-[#181820] border border-zinc-800/80 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
            >
              <div className="md:col-span-6">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, "description", e.target.value)}
                  placeholder="Item description"
                  className="w-full bg-[#1e1e26] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                  className="w-full bg-[#1e1e26] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                  placeholder="Unit Price"
                  className="w-full bg-[#1e1e26] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between pl-2">
                <span className="text-xs font-semibold text-zinc-200">${item.total.toLocaleString()}</span>
                {lineItems.length > 1 && (
                  <button
                    onClick={() => removeLineItem(index)}
                    className="p-1 rounded text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-sm font-semibold">
          <span className="text-zinc-400">Total Amount Due:</span>
          <span className="text-xl text-amber-400 font-bold">${totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment Instructions & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[#141417] border border-[#26262e] space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Payment Instructions</label>
          <textarea
            rows={4}
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            className="w-full bg-[#181820] border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-amber-500 font-mono text-[11px]"
          />
        </div>

        <div className="p-5 rounded-xl bg-[#141417] border border-[#26262e] space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Invoice Notes</label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#181820] border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Action Toolbar & Hard Gates (Gates 4 & 5) */}
      <div className="p-5 rounded-xl bg-[#16161c] border border-[#26262e] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveInvoice}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#202028] hover:bg-[#2a2a36] text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            {saving ? "Saving..." : "Save Invoice"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#202028] hover:bg-[#2a2a36] text-zinc-200 text-xs font-medium border border-zinc-700 transition disabled:opacity-50"
          >
            {downloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 text-[#DA4D01] animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#DA4D01]" />
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mark Invoice as Sent (Gate 4)</span>
          </button>

          {/* Gate 5: Confirm Payment Received (The ONLY way status becomes Paid; triggers auto-onboarding) */}
          <button
            onClick={handleConfirmPaymentGate5}
            disabled={status === "Paid"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm Payment Received (Gate 5)</span>
          </button>

          {status !== "Paid" && (
            <button
              onClick={handleMarkOverdue}
              className="px-3 py-2 rounded-lg bg-[#1a1414] hover:bg-red-950 text-red-400 text-xs border border-red-900/40"
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
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-zinc-400">Loading Invoice Builder...</p>
        </div>
      }
    >
      <InvoiceBuilderContent />
    </Suspense>
  );
}
