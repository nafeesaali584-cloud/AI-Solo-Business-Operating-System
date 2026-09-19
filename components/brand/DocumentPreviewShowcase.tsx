"use client";

import React, { useState } from "react";
import { ThemeMode } from "@/lib/brand/tokens";
import { ProposalDocument, ProposalDocumentProps } from "./ProposalDocument";
import { InvoiceDocument, InvoiceDocumentProps } from "./InvoiceDocument";
import { Download, Loader2 } from "lucide-react";
import { generateProposalPdf, generateInvoicePdf, loadProfileImageDataUrl } from "@/lib/brand/pdf-templates";

export interface DocumentPreviewShowcaseProps {
  initialDocument?: "proposal" | "invoice";
  initialTheme?: ThemeMode;
  proposalData?: Partial<ProposalDocumentProps>;
  invoiceData?: Partial<InvoiceDocumentProps>;
}

export function DocumentPreviewShowcase({
  initialDocument = "proposal",
  initialTheme = "dark",
  proposalData,
  invoiceData,
}: DocumentPreviewShowcaseProps) {
  const [activeDoc, setActiveDoc] = useState<"proposal" | "invoice">(initialDocument);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const [downloading, setDownloading] = useState(false);

  // Export PDF according to current active view & theme
  const handleExportPdf = async () => {
    setDownloading(true);
    try {
      const profileDataUrl = await loadProfileImageDataUrl();
      const pdfTemplate = themeMode === "dark" ? "B" : "A";

      if (activeDoc === "proposal") {
        const doc = generateProposalPdf(
          pdfTemplate,
          {
            clientName: proposalData?.clientName || "Miss Al Reem Beauty Centre",
            date: proposalData?.date || "18 September 2026",
            status: "Approved",
            services: proposalData?.services || [
              { name: "Website redesign", description: "5-page responsive site — Home, Services, Gallery, Reviews, Contact — built for mobile-first browsing.", price: 2800 },
              { name: "WhatsApp booking automation", description: "Every enquiry is captured, qualified and handed to you on WhatsApp within minutes — no missed messages.", price: 1400 },
              { name: "Local SEO setup", description: 'Google Business optimization and on-page SEO so you rank for "salon near me" searches in Ajman.', price: 900 },
            ],
            totalInvestment: proposalData?.totalInvestment || 5100,
            scope: proposalData?.whatWeFound || "Website redesign, WhatsApp booking automation, and Local SEO setup.",
            deliverables: "5-page responsive website, WhatsApp instant lead capture workflow, Google Business optimization.",
            timeline: "Days 1–12 end-to-end delivery.",
            terms: "50% deposit to begin, 50% due on launch. Two rounds of design revisions included.",
            proposalNumber: proposalData?.proposalNumber || "#PRP-0042",
          },
          profileDataUrl
        );
        doc.save(`Proposal_Miss_Al_Reem_${themeMode.toUpperCase()}.pdf`);
      } else {
        const doc = generateInvoicePdf(
          pdfTemplate,
          {
            clientName: invoiceData?.clientName || "Miss Al Reem Beauty Centre",
            invoiceNumber: invoiceData?.invoiceNumber || "#INV-0118",
            date: invoiceData?.issueDate || "18 Sep 2026",
            dueDate: invoiceData?.dueDate || "25 Sep 2026",
            lineItems: invoiceData?.lineItems || [
              { description: "Website redesign", quantity: 1, unit_price: 2800, total: 2800 },
              { description: "WhatsApp booking automation", quantity: 1, unit_price: 1400, total: 1400 },
              { description: "Local SEO setup", quantity: 1, unit_price: 900, total: 900 },
            ],
            totalAmount: invoiceData?.amountDue || 2550,
            paymentInstructions: invoiceData?.bankDetails || "Bank transfer — Emirates NBD · IBAN: AE00 0000 0000 0000 0000 000\nReference: INV-0118",
            notes: "Thank you for your business.",
          },
          profileDataUrl
        );
        doc.save(`Invoice_INV-0118_${themeMode.toUpperCase()}.pdf`);
      }
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text-primary)] py-8 px-3 sm:px-6 flex flex-col items-center select-none font-sans">
      {/* ── Top Navigation Bar: Document Switcher ── */}
      <div className="w-full max-w-[840px] flex flex-col items-center gap-4 mb-6">
        {/* Document Tab Toggle */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] w-full max-w-md shadow-lg">
          <button
            type="button"
            onClick={() => setActiveDoc("proposal")}
            className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors duration-200 ${
              activeDoc === "proposal"
                ? "bg-[var(--accent-soft)] text-white border border-[var(--accent)] shadow-md shadow-[var(--accent)]/10"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Proposal Design
          </button>
          <button
            type="button"
            onClick={() => setActiveDoc("invoice")}
            className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors duration-200 ${
              activeDoc === "invoice"
                ? "bg-[var(--accent-soft)] text-white border border-[var(--accent)] shadow-md shadow-[var(--accent)]/10"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Invoice Design
          </button>
        </div>

        {/* Sub-bar: Theme Selector & Export Button */}
        <div className="flex flex-wrap items-center justify-between w-full gap-3 pt-1">
          {/* Left: Preview Mode Toggles */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="text-[11px] font-medium text-[var(--text-dim)]">Preview:</span>
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  themeMode === "dark"
                    ? "bg-[var(--surface-hover)] text-[var(--text-primary)] font-semibold shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Screen (dark)
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  themeMode === "light"
                    ? "bg-[#f6f4ef] text-zinc-900 font-semibold shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Print (light)
              </button>
            </div>
          </div>

          {/* Right: PDF Export Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent-soft)] border border-[var(--accent-border)] transition-colors active:scale-95 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              Export {themeMode === "dark" ? "Dark (Screen)" : "Light (Print)"} PDF
            </span>
          </button>
        </div>
      </div>

      {/* ── Document Shell Container ── */}
      <div className="w-full flex justify-center pb-8">
        {activeDoc === "proposal" ? (
          <ProposalDocument mode={themeMode} {...proposalData} />
        ) : (
          <InvoiceDocument mode={themeMode} {...invoiceData} />
        )}
      </div>

      {/* ── Bottom Caption matching screenshot ── */}
      <p className="text-[11px] text-[var(--text-dim)] text-center max-w-xl pb-10">
        Brand-matched design using your real photo, brand colors (#DA4D01), Space Grotesk + Inter.
        Toggle &ldquo;Print (light)&rdquo; for a paper-friendly version of each document.
      </p>
    </div>
  );
}
