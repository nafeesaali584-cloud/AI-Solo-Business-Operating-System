import { jsPDF } from "jspdf";
import { COLOR_TOKENS } from "./tokens";
import { BRAND } from "./config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PdfTemplate = "A" | "B" | "C"; // "B" = Dark (Screen), "A" = Light (Print), "C" = Corporate Classic

export interface ProposalData {
  clientName:      string;
  date:            string;
  status:          string;
  services:        Array<{ name: string; description: string; price: number }>;
  totalInvestment: number;
  scope?:          string;
  deliverables?:   string;
  timeline?:       string;
  terms?:          string;
  proposalNumber?: string;
  headline?:       string;
  currency?:       string;
}

export interface InvoiceData {
  clientName:          string;
  invoiceNumber:       string;
  date:                string;
  dueDate:             string;
  lineItems:           Array<{ description: string; subDescription?: string; quantity: number; unit_price: number; total: number }>;
  totalAmount:         number;
  subtotal?:           number;
  depositPaid?:        number;
  paymentInstructions: string;
  notes?:              string;
  currency?:           string;
  clientAddress?:      string;
  clientPhone?:        string;
  relatedProposalNumber?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

// ─── Shared Footer ────────────────────────────────────────────────────────────

function drawFooter(doc: jsPDF, mode: "dark" | "light", pageNum: number) {
  const t = COLOR_TOKENS[mode];
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const y = pageH - 12;

  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.3);
  doc.line(16, y - 5, pageW - 16, y - 5);

  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("nafeesaali.com   ·   Connect on LinkedIn", 16, y);
  doc.text("Nafeesa Ali · AI, Web & Automation", pageW - 16, y, { align: "right" });
}

// ─── Proposal PDF Generator (Dark & Light) ────────────────────────────────────

function buildProposal(doc: jsPDF, d: ProposalData, mode: "dark" | "light", profileDataUrl?: string) {
  const t = COLOR_TOKENS[mode];
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const currency = d.currency || "AED";

  // Document background
  doc.setFillColor(...hexToRgb(t.bg));
  doc.rect(0, 0, pageW, pageH, "F");

  // Outer border frame
  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.4);
  doc.roundedRect(8, 8, pageW - 16, pageH - 16, 4, 4, "S");

  let y = 20;

  // 1. Header Row
  if (profileDataUrl) {
    try {
      doc.addImage(profileDataUrl, "JPEG", 16, y - 4, 11, 11);
    } catch (_) {}
  }

  const nameX = profileDataUrl ? 30 : 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text(BRAND.ownerName, nameX, y + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...hexToRgb(t.textExtraMuted));
  doc.text("AI · WEB · AUTOMATION", nameX, y + 5.5);

  // Right Header Meta
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text(`Proposal ${d.proposalNumber || "#PRP-0042"}`, pageW - 16, y - 1, { align: "right" });
  doc.text(d.date || "18 September 2026", pageW - 16, y + 3, { align: "right" });
  doc.setTextColor(...hexToRgb(t.textExtraMuted));
  doc.setFontSize(7);
  doc.text("Valid until 2 October 2026", pageW - 16, y + 7, { align: "right" });

  y += 18;

  // 2. Large Headline
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  const headline = d.headline || "A website that works while you sleep.";
  const wrappedHeadline = doc.splitTextToSize(headline, pageW - 32);
  doc.text(wrappedHeadline, 16, y);
  y += wrappedHeadline.length * 7 + 2;

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(t.textMuted));
  const subtitle = `Prepared for ${d.clientName} — a redesigned booking site with WhatsApp automation, built to turn visitors into confirmed appointments.`;
  const wrappedSubtitle = doc.splitTextToSize(subtitle, pageW - 32);
  doc.text(wrappedSubtitle, 16, y);
  y += wrappedSubtitle.length * 4.2 + 8;

  // 3. Section: What we found
  doc.setFillColor(...hexToRgb(t.accent));
  doc.rect(16, y - 3, 1.2, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text("What we found", 19.5, y + 1);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(t.textBody));
  const foundText = d.scope || "Your current site has no online booking and no way to capture a visitor before they leave. Most inquiries currently come through Instagram DMs, which are easy to miss during busy salon hours.";
  const wrappedFound = doc.splitTextToSize(foundText, pageW - 34);
  doc.text(wrappedFound, 17, y);
  y += wrappedFound.length * 3.8 + 4;

  // Finding pill tags
  const tags = ["No booking system", "Mobile load: 6.2s", "Instagram-only contact"];
  let tagX = 17;
  tags.forEach((tag) => {
    const w = tag.length * 1.8 + 6;
    doc.setFillColor(...hexToRgb(t.cardBg));
    doc.setDrawColor(...hexToRgb(t.border));
    doc.setLineWidth(0.2);
    doc.roundedRect(tagX, y - 3, w, 5, 1.2, 1.2, "FD");
    doc.setTextColor(...hexToRgb(t.textMuted));
    doc.setFontSize(6.5);
    doc.text(tag, tagX + 3, y + 0.5);
    tagX += w + 3;
  });
  y += 9;

  // 4. Section: Scope of work
  doc.setFillColor(...hexToRgb(t.accent));
  doc.rect(16, y - 3, 1.2, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text("Scope of work", 19.5, y + 1);
  y += 6;

  d.services.forEach((s) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(t.textPrimary));
    doc.text(s.name, 17, y);
    doc.text(`${currency} ${Number(s.price).toLocaleString()}`, pageW - 17, y, { align: "right" });
    y += 4;

    if (s.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...hexToRgb(t.textMuted));
      const wrappedDesc = doc.splitTextToSize(s.description, pageW - 48);
      doc.text(wrappedDesc, 17, y);
      y += wrappedDesc.length * 3.5 + 2;
    }

    doc.setDrawColor(...hexToRgb(t.border));
    doc.setLineWidth(0.2);
    doc.line(17, y, pageW - 17, y);
    y += 4;
  });

  y += 4;

  // 5. Section: Timeline
  doc.setFillColor(...hexToRgb(t.accent));
  doc.rect(16, y - 3, 1.2, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text("Timeline", 19.5, y + 1);
  y += 7;

  const steps = [
    { num: "1", title: "Discovery", desc: "Days 1–2 — content & brand" },
    { num: "2", title: "Design", desc: "Days 3–6 — visual direction" },
    { num: "3", title: "Build", desc: "Days 7–11 — development" },
    { num: "4", title: "Launch", desc: "Day 12 — go live & handover" },
  ];
  const stepColW = (pageW - 34) / 4;
  steps.forEach((st, idx) => {
    const sx = 17 + idx * stepColW;
    doc.setFillColor(...hexToRgb(t.cardBg));
    doc.setDrawColor(...hexToRgb(t.accent));
    doc.setLineWidth(0.3);
    doc.circle(sx + 3, y, 3, "FD");
    doc.setTextColor(...hexToRgb(t.accent));
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text(st.num, sx + 2.2, y + 1);

    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(t.textPrimary));
    doc.text(st.title, sx + 8, y + 1);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...hexToRgb(t.textMuted));
    doc.text(st.desc, sx, y + 6);
  });
  y += 14;

  // 6. Section: Investment Box
  doc.setFillColor(...hexToRgb(t.accent));
  doc.rect(16, y - 3, 1.2, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text("Investment", 19.5, y + 1);
  y += 6;

  // Investment card box
  const boxH = d.services.length * 6 + 14;
  doc.setFillColor(...hexToRgb(t.cardBg));
  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.3);
  doc.roundedRect(17, y, pageW - 34, boxH, 2, 2, "FD");

  let iy = y + 5;
  d.services.forEach((s) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(t.textBody));
    doc.text(s.name, 21, iy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hexToRgb(t.textPrimary));
    doc.text(`${currency} ${Number(s.price).toLocaleString()}`, pageW - 21, iy, { align: "right" });
    iy += 6;
  });

  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.2);
  doc.line(21, iy, pageW - 21, iy);
  iy += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text("Total investment", 21, iy);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(t.accent));
  doc.text(`${currency} ${d.totalInvestment.toLocaleString()}`, pageW - 21, iy + 0.5, { align: "right" });

  y += boxH + 6;

  // 7. Signed By Block
  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.3);
  doc.line(16, y, pageW - 16, y);
  y += 6;

  if (profileDataUrl) {
    try {
      doc.addImage(profileDataUrl, "JPEG", 17, y - 2, 10, 10);
    } catch (_) {}
  }
  const sigX = profileDataUrl ? 30 : 17;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text(BRAND.ownerName, sigX, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text("Founder — AI, Web & Automation", sigX, y + 6);

  drawFooter(doc, mode, 1);
}

// ─── Invoice PDF Generator (Dark & Light) ─────────────────────────────────────

function buildInvoice(doc: jsPDF, d: InvoiceData, mode: "dark" | "light", profileDataUrl?: string) {
  const t = COLOR_TOKENS[mode];
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const currency = d.currency || "AED";

  // Document background
  doc.setFillColor(...hexToRgb(t.bg));
  doc.rect(0, 0, pageW, pageH, "F");

  // Outer border frame
  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.4);
  doc.roundedRect(8, 8, pageW - 16, pageH - 16, 4, 4, "S");

  let y = 20;

  // 1. Header Row
  if (profileDataUrl) {
    try {
      doc.addImage(profileDataUrl, "JPEG", 16, y - 4, 11, 11);
    } catch (_) {}
  }
  const nameX = profileDataUrl ? 30 : 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text(BRAND.ownerName, nameX, y + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...hexToRgb(t.textExtraMuted));
  doc.text("AI · WEB · AUTOMATION", nameX, y + 5.5);

  // Right Header Meta
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text("nafeesaali.com", pageW - 16, y + 1, { align: "right" });
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(t.textExtraMuted));
  doc.text("Ajman, UAE", pageW - 16, y + 5.5, { align: "right" });

  y += 18;

  // 2. Title Row + Status Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text("Invoice", 16, y + 2);

  // Status badge
  const badgeText = "Awaiting payment";
  const bw = badgeText.length * 2.2 + 8;
  doc.setFillColor(...hexToRgb(t.cardBg));
  doc.setDrawColor(...hexToRgb(t.accent));
  doc.setLineWidth(0.3);
  doc.roundedRect(pageW - 16 - bw, y - 4, bw, 6, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(t.accent));
  doc.text(badgeText, pageW - 16 - bw / 2, y + 0.3, { align: "center" });

  y += 14;

  // 3. Two-Column Metadata Row (BILLED TO & INVOICE)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...hexToRgb(t.textExtraMuted));
  doc.text("BILLED TO", 16, y);
  doc.text("INVOICE", pageW - 16, y, { align: "right" });

  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text(d.clientName, 16, y);
  doc.text(d.invoiceNumber, pageW - 16, y, { align: "right" });

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text(d.clientAddress || "Ajman, UAE", 16, y);
  doc.text(`Related to Proposal ${d.relatedProposalNumber || "#PRP-0042"}`, pageW - 16, y, { align: "right" });

  y += 4;
  doc.text(d.clientPhone || "+971 50 xxx xxxx", 16, y);

  y += 10;

  // 4. Dates Row (ISSUED & DUE)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...hexToRgb(t.textExtraMuted));
  doc.text("ISSUED", 16, y);
  doc.text("DUE", 55, y);

  y += 4.5;
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text(d.date || "18 Sep 2026", 16, y);
  doc.text(d.dueDate || "25 Sep 2026", 55, y);

  y += 10;

  // 5. Line Items Table
  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.3);
  doc.line(16, y, pageW - 16, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(t.textExtraMuted));
  doc.text("Item", 16, y);
  doc.text("Qty", 115, y, { align: "center" });
  doc.text("Rate", 145, y, { align: "right" });
  doc.text("Amount", pageW - 16, y, { align: "right" });

  y += 3;
  doc.line(16, y, pageW - 16, y);
  y += 6;

  d.lineItems.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb(t.textPrimary));
    doc.text(item.description, 16, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(t.textSecondaryBody));
    doc.text(String(item.quantity), 115, y, { align: "center" });
    doc.text(`${currency} ${Number(item.unit_price).toLocaleString()}`, 145, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hexToRgb(t.textPrimary));
    doc.text(`${currency} ${Number(item.total).toLocaleString()}`, pageW - 16, y, { align: "right" });

    y += 4;
    if (item.subDescription) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...hexToRgb(t.textMuted));
      doc.text(item.subDescription, 16, y);
      y += 3;
    }

    doc.setDrawColor(...hexToRgb(t.border));
    doc.setLineWidth(0.2);
    doc.line(16, y + 1, pageW - 16, y + 1);
    y += 6;
  });

  y += 2;

  // 6. Totals Block (Right-Aligned)
  const subtotal = d.subtotal ?? d.lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const deposit = d.depositPaid ?? 2550;
  const due = d.totalAmount ?? (subtotal - deposit);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text("Subtotal", 130, y);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text(`${currency} ${subtotal.toLocaleString()}`, pageW - 16, y, { align: "right" });

  y += 5.5;
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text("Deposit paid", 130, y);
  doc.setTextColor(...hexToRgb(t.textPrimary));
  doc.text(`– ${currency} ${deposit.toLocaleString()}`, pageW - 16, y, { align: "right" });

  y += 5;
  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.3);
  doc.line(130, y, pageW - 16, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text("Amount due", 130, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...hexToRgb(t.accent));
  doc.text(`${currency} ${due.toLocaleString()}`, pageW - 16, y + 0.5, { align: "right" });

  y += 14;

  // 7. Payment Details Box
  doc.setFillColor(...hexToRgb(t.cardBg));
  doc.setDrawColor(...hexToRgb(t.border));
  doc.setLineWidth(0.3);
  doc.roundedRect(16, y, pageW - 32, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...hexToRgb(t.textExtraMuted));
  doc.text("PAYMENT DETAILS", 20, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(t.textBody));
  doc.text("Bank transfer — Emirates NBD · IBAN: AE00 0000 0000 0000 0000 000", 20, y + 10);
  doc.setTextColor(...hexToRgb(t.textMuted));
  doc.text(`Reference: ${d.invoiceNumber.replace("#", "")}`, 20, y + 14.5);

  drawFooter(doc, mode, 1);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateProposalPdf(template: PdfTemplate, data: ProposalData, profileDataUrl?: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const mode: "dark" | "light" = template === "B" ? "dark" : "light";
  buildProposal(doc, data, mode, profileDataUrl);
  return doc;
}

export function generateInvoicePdf(template: PdfTemplate, data: InvoiceData, profileDataUrl?: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const mode: "dark" | "light" = template === "B" ? "dark" : "light";
  buildInvoice(doc, data, mode, profileDataUrl);
  return doc;
}

/** Load profile photo as base64 data URL (client-side only) */
export async function loadProfileImageDataUrl(): Promise<string | undefined> {
  try {
    const res = await fetch(BRAND.profileImage);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
