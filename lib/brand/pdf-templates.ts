import { jsPDF } from "jspdf";
import { BRAND } from "./config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PdfTemplate = "A" | "B" | "C";

export interface ProposalData {
  clientName:      string;
  date:            string;
  status:          string;
  services:        Array<{ name: string; description: string; price: number }>;
  totalInvestment: number;
  scope:           string;
  deliverables:    string;
  timeline:        string;
  terms:           string;
  proposalNumber?: string;
}

export interface InvoiceData {
  clientName:          string;
  invoiceNumber:       string;
  date:                string;
  dueDate:             string;
  lineItems:           Array<{ description: string; quantity: number; unit_price: number; total: number }>;
  totalAmount:         number;
  paymentInstructions: string;
  notes:               string;
}

// ─── Color helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// ─── Shared footer ─────────────────────────────────────────────────────────────

function addFooter(doc: jsPDF, template: PdfTemplate, pageNum: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const y = pageH - 16;

  if (template === "B") {
    doc.setFillColor(...hexToRgb(BRAND.colors.accent));
    doc.rect(0, pageH - 22, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(BRAND.contact.website, 14, y);
    doc.text(`LinkedIn: ${BRAND.contact.linkedin}`, 14, y + 5);
    doc.text(`WhatsApp: ${BRAND.contact.waDisplay}`, pageW / 2, y, { align: "center" });
    doc.text(`Page ${pageNum}`, pageW - 14, y, { align: "right" });
  } else {
    // A & C — light footer line
    doc.setDrawColor(...hexToRgb(BRAND.colors.lightLine));
    doc.line(14, y - 4, pageW - 14, y - 4);
    doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    doc.setFontSize(7.5);
    doc.text(BRAND.contact.website, 14, y);
    doc.text(`LinkedIn: ${BRAND.contact.linkedin}`, 14, y + 4.5);
    doc.text(`WhatsApp: ${BRAND.contact.waDisplay}`, pageW - 14, y, { align: "right" });
    doc.text(`Page ${pageNum}`, pageW - 14, y + 4.5, { align: "right" });
  }
}

// ─── Profile image helper (base64 from fetch — runs client side) ───────────────
// We embed the profile image as a data URL. The caller passes it in.

// ─── TEMPLATE A: Minimal Modern ───────────────────────────────────────────────
// White background, orange left-sidebar accent, Space Grotesk-style bold heading

function buildProposalA(doc: jsPDF, d: ProposalData, profileDataUrl?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Orange left accent bar
  doc.setFillColor(...hexToRgb(BRAND.colors.accent));
  doc.rect(0, 0, 6, 297, "F");

  // Header area
  doc.setFillColor(...hexToRgb(BRAND.colors.lightBg));
  doc.rect(0, 0, pageW, 52, "F");

  // Profile image circle (if available)
  if (profileDataUrl) {
    try { doc.addImage(profileDataUrl, "JPEG", pageW - 46, 8, 34, 34); } catch (_) {}
  }

  // Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("SERVICE PROPOSAL", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
  doc.text(`${BRAND.ownerName}  ·  ${BRAND.tagline}`, 14, 30);
  doc.text(`Prepared for: ${d.clientName}`, 14, 38);
  doc.text(`Date: ${d.date}   ·   Status: ${d.status}`, 14, 44);

  // Accent divider
  doc.setFillColor(...hexToRgb(BRAND.colors.accent));
  doc.rect(14, 52, 60, 1.2, "F");

  let y = 62;

  // Services table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("Services & Investment", 14, y);
  y += 8;

  d.services.forEach((s) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text(`• ${s.name}`, 14, y);
    doc.text(`$${Number(s.price).toLocaleString()}`, pageW - 14, y, { align: "right" });
    y += 5.5;
    if (s.description) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
      const wrapped = doc.splitTextToSize(s.description, pageW - 40);
      doc.text(wrapped, 18, y);
      y += wrapped.length * 4.5 + 2;
    }
  });

  // Total
  y += 4;
  doc.setFillColor(...hexToRgb(BRAND.colors.lightBg));
  doc.roundedRect(14, y - 4, pageW - 28, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(BRAND.colors.accent));
  doc.text(`Total Investment: $${d.totalInvestment.toLocaleString()}`, 20, y + 4);
  y += 16;

  // Scope
  if (d.scope) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text("Scope of Work", 14, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    const s = doc.splitTextToSize(d.scope, pageW - 28);
    doc.text(s, 14, y); y += s.length * 5 + 6;
  }

  // Deliverables
  if (d.deliverables) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text("Deliverables", 14, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    const dl = doc.splitTextToSize(d.deliverables, pageW - 28);
    doc.text(dl, 14, y); y += dl.length * 5 + 6;
  }

  // Timeline & Terms in 2-col
  const colW = (pageW - 36) / 2;
  if (d.timeline) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text("Timeline", 14, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    const tl = doc.splitTextToSize(d.timeline, colW);
    doc.text(tl, 14, y + 5);
  }
  if (d.terms) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text("Payment Terms", 14 + colW + 8, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    const tr = doc.splitTextToSize(d.terms, colW);
    doc.text(tr, 14 + colW + 8, y + 5);
  }

  addFooter(doc, "A", 1);
}

// ─── TEMPLATE B: Bold Creative (matches nafeesaali.com exactly) ───────────────
// Dark bg, orange accent header, Space Grotesk feel, pill-style service tags

function buildProposalB(doc: jsPDF, d: ProposalData, profileDataUrl?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Full dark background
  doc.setFillColor(...hexToRgb(BRAND.colors.bg));
  doc.rect(0, 0, pageW, 297, "F");

  // Full-width orange header band
  doc.setFillColor(...hexToRgb(BRAND.colors.accent));
  doc.rect(0, 0, pageW, 58, "F");

  // Profile photo in orange header
  if (profileDataUrl) {
    try { doc.addImage(profileDataUrl, "JPEG", pageW - 50, 5, 40, 46); } catch (_) {}
  }

  // Heading (white on orange)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text("SERVICE PROPOSAL", 14, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 220, 180);
  doc.text(`${BRAND.ownerName}  ·  ${BRAND.tagline}`, 14, 30);
  doc.text(`For: ${d.clientName}   ·   ${d.date}   ·   ${d.status}`, 14, 38);

  // Service pills
  let pillX = 14;
  let pillY = 44;
  d.services.slice(0, 4).forEach((s) => {
    const label = s.name.slice(0, 22);
    const w = label.length * 2.2 + 8;
    if (pillX + w > pageW - 60) { pillX = 14; pillY += 8; }
    doc.setFillColor(0, 0, 0);
    doc.roundedRect(pillX, pillY - 4, w, 6, 1.5, 1.5, "F");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(label, pillX + 4, pillY);
    pillX += w + 4;
  });

  let y = 70;

  // Services list
  d.services.forEach((s) => {
    // Service card background
    doc.setFillColor(25, 25, 30);
    doc.roundedRect(14, y - 4, pageW - 28, 18, 2, 2, "F");
    doc.setFillColor(...hexToRgb(BRAND.colors.accent));
    doc.rect(14, y - 4, 3, 18, "F");

    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...hexToRgb(BRAND.colors.text));
    doc.text(s.name, 22, y + 2);
    doc.text(`$${Number(s.price).toLocaleString()}`, pageW - 18, y + 2, { align: "right" });

    if (s.description) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
      doc.text(s.description.slice(0, 85), 22, y + 8);
    }
    y += 24;
  });

  // Total box — orange highlight
  y += 2;
  doc.setFillColor(...hexToRgb(BRAND.colors.accent));
  doc.roundedRect(14, y, pageW - 28, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
  doc.text(`TOTAL INVESTMENT: $${d.totalInvestment.toLocaleString()}`, pageW / 2, y + 9, { align: "center" });
  y += 20;

  // Scope & Deliverables
  const sections = [
    { label: "Scope of Work", body: d.scope },
    { label: "Deliverables", body: d.deliverables },
    { label: "Timeline", body: d.timeline },
    { label: "Payment Terms", body: d.terms },
  ].filter(s => s.body);

  sections.forEach((sec) => {
    doc.setFillColor(25, 25, 30);
    const preview = doc.splitTextToSize(sec.body, pageW - 36);
    const boxH = preview.length * 5 + 14;
    doc.roundedRect(14, y, pageW - 28, boxH, 2, 2, "F");

    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
    doc.text(sec.label.toUpperCase(), 20, y + 8);

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    doc.text(preview, 20, y + 15);
    y += boxH + 6;
  });

  addFooter(doc, "B", 1);
}

// ─── TEMPLATE C: Corporate Classic ────────────────────────────────────────────
// Clean white, two-column header, orange rule, tabular layout

function buildProposalC(doc: jsPDF, d: ProposalData, profileDataUrl?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // White bg (default)
  // Profile photo top-right
  if (profileDataUrl) {
    try { doc.addImage(profileDataUrl, "JPEG", pageW - 42, 10, 30, 30); } catch (_) {}
  }

  // Company name & meta top-left
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
  doc.text(BRAND.ownerName, 14, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
  doc.text(BRAND.tagline, 14, 27);
  doc.text(BRAND.contact.website, 14, 33);

  // Orange horizontal rule
  doc.setFillColor(...hexToRgb(BRAND.colors.accent));
  doc.rect(14, 40, pageW - 28, 2, "F");

  // Document title
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("SERVICE PROPOSAL", 14, 50);

  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
  doc.text(`Client: ${d.clientName}`, 14, 57);
  doc.text(`Date: ${d.date}`, pageW - 14, 50, { align: "right" });
  doc.text(`Status: ${d.status}`, pageW - 14, 57, { align: "right" });

  let y = 66;

  // Services table header
  doc.setFillColor(...hexToRgb(BRAND.colors.lightBg));
  doc.rect(14, y, pageW - 28, 8, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("Service", 18, y + 5.5);
  doc.text("Description", 80, y + 5.5);
  doc.text("Price", pageW - 18, y + 5.5, { align: "right" });
  y += 8;

  doc.setDrawColor(...hexToRgb(BRAND.colors.lightLine));
  d.services.forEach((s, i) => {
    if (i % 2 === 1) { doc.setFillColor(249, 250, 251); doc.rect(14, y, pageW - 28, 9, "F"); }
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text(s.name.slice(0, 30), 18, y + 6);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    doc.text(s.description.slice(0, 50), 80, y + 6);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
    doc.text(`$${Number(s.price).toLocaleString()}`, pageW - 18, y + 6, { align: "right" });
    y += 9;
  });

  doc.line(14, y, pageW - 14, y);
  y += 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("Total Investment:", 14, y);
  doc.setTextColor(...hexToRgb(BRAND.colors.accent));
  doc.text(`$${d.totalInvestment.toLocaleString()}`, pageW - 14, y, { align: "right" });
  y += 12;

  const bodySections = [
    { label: "Scope of Work", body: d.scope },
    { label: "Deliverables",  body: d.deliverables },
    { label: "Timeline",      body: d.timeline },
    { label: "Payment Terms", body: d.terms },
  ].filter(s => s.body);

  bodySections.forEach((sec) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
    doc.text(sec.label, 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    const lines = doc.splitTextToSize(sec.body, pageW - 28);
    doc.text(lines, 14, y); y += lines.length * 4.8 + 7;
  });

  addFooter(doc, "C", 1);
}

// ─── INVOICE TEMPLATES ─────────────────────────────────────────────────────────

function buildInvoiceA(doc: jsPDF, d: InvoiceData, profileDataUrl?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...hexToRgb(BRAND.colors.accent));
  doc.rect(0, 0, 6, 297, "F");

  doc.setFillColor(...hexToRgb(BRAND.colors.lightBg));
  doc.rect(0, 0, pageW, 52, "F");

  if (profileDataUrl) {
    try { doc.addImage(profileDataUrl, "JPEG", pageW - 46, 8, 34, 34); } catch (_) {}
  }

  doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("INVOICE", 14, 22);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
  doc.text(`${BRAND.ownerName}  ·  ${BRAND.tagline}`, 14, 30);
  doc.text(`Billed to: ${d.clientName}`, 14, 38);

  doc.setFontSize(9);
  doc.text(`Invoice #: ${d.invoiceNumber}`, pageW - 80, 20);
  doc.text(`Date: ${d.date}`, pageW - 80, 26);
  doc.text(`Due: ${d.dueDate}`, pageW - 80, 32);

  doc.setFillColor(...hexToRgb(BRAND.colors.accent));
  doc.rect(14, 52, 60, 1.2, "F");

  let y = 62;
  // Table header
  doc.setFillColor(...hexToRgb(BRAND.colors.lightBg)); doc.rect(14, y - 4, pageW - 28, 9, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("Description", 18, y + 1); doc.text("Qty", 130, y + 1); doc.text("Unit Price", 148, y + 1); doc.text("Total", pageW - 18, y + 1, { align: "right" });
  y += 9;

  d.lineItems.forEach((item, i) => {
    if (i % 2 === 1) { doc.setFillColor(...hexToRgb(BRAND.colors.lightBg)); doc.rect(14, y - 4, pageW - 28, 9, "F"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text(item.description.slice(0, 55), 18, y + 1);
    doc.text(String(item.quantity), 133, y + 1);
    doc.text(`$${item.unit_price.toLocaleString()}`, 151, y + 1);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
    doc.text(`$${item.total.toLocaleString()}`, pageW - 18, y + 1, { align: "right" });
    y += 9;
  });

  y += 4;
  doc.setFillColor(...hexToRgb(BRAND.colors.lightBg)); doc.roundedRect(14, y, pageW - 28, 13, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
  doc.text(`TOTAL AMOUNT DUE: $${d.totalAmount.toLocaleString()}`, pageW / 2, y + 8.5, { align: "center" });
  y += 18;

  if (d.paymentInstructions) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text("Payment Details", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    const pi = doc.splitTextToSize(d.paymentInstructions, pageW - 28);
    doc.text(pi, 14, y); y += pi.length * 4.8 + 6;
  }

  if (d.notes) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    doc.text(d.notes, 14, y);
  }

  addFooter(doc, "A", 1);
}

function buildInvoiceB(doc: jsPDF, d: InvoiceData, profileDataUrl?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Dark bg
  doc.setFillColor(...hexToRgb(BRAND.colors.bg)); doc.rect(0, 0, pageW, 297, "F");

  // Orange header
  doc.setFillColor(...hexToRgb(BRAND.colors.accent)); doc.rect(0, 0, pageW, 52, "F");

  if (profileDataUrl) {
    try { doc.addImage(profileDataUrl, "JPEG", pageW - 50, 5, 42, 42); } catch (_) {}
  }

  doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", 14, 22);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(255, 220, 180);
  doc.text(`${BRAND.ownerName}  ·  ${BRAND.tagline}`, 14, 30);
  doc.text(`For: ${d.clientName}   ·   ${d.invoiceNumber}   ·   Due: ${d.dueDate}`, 14, 38);

  let y = 62;

  // Table header — dark card
  doc.setFillColor(25, 25, 30); doc.rect(14, y - 4, pageW - 28, 9, "F");
  doc.setFillColor(...hexToRgb(BRAND.colors.accent)); doc.rect(14, y - 4, 3, 9, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
  doc.text("DESCRIPTION", 22, y + 1); doc.text("QTY", 130, y + 1); doc.text("PRICE", 148, y + 1); doc.text("TOTAL", pageW - 18, y + 1, { align: "right" });
  y += 10;

  d.lineItems.forEach((item) => {
    doc.setFillColor(25, 25, 30); doc.roundedRect(14, y - 4, pageW - 28, 9, 1, 1, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.text));
    doc.text(item.description.slice(0, 55), 20, y + 1);
    doc.text(String(item.quantity), 133, y + 1);
    doc.text(`$${item.unit_price.toLocaleString()}`, 151, y + 1);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
    doc.text(`$${item.total.toLocaleString()}`, pageW - 18, y + 1, { align: "right" });
    y += 11;
  });

  y += 4;
  doc.setFillColor(...hexToRgb(BRAND.colors.accent)); doc.roundedRect(14, y, pageW - 28, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
  doc.text(`TOTAL AMOUNT DUE: $${d.totalAmount.toLocaleString()}`, pageW / 2, y + 9.5, { align: "center" });
  y += 20;

  if (d.paymentInstructions) {
    doc.setFillColor(25, 25, 30); const piLines = doc.splitTextToSize(d.paymentInstructions, pageW - 36); const boxH = piLines.length * 5 + 14;
    doc.roundedRect(14, y, pageW - 28, boxH, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
    doc.text("PAYMENT DETAILS", 20, y + 8);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    doc.text(piLines, 20, y + 15);
    y += boxH + 6;
  }

  if (d.notes) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    doc.text(d.notes, 14, y);
  }

  addFooter(doc, "B", 1);
}

function buildInvoiceC(doc: jsPDF, d: InvoiceData, profileDataUrl?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  if (profileDataUrl) {
    try { doc.addImage(profileDataUrl, "JPEG", pageW - 42, 10, 30, 30); } catch (_) {}
  }

  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
  doc.text(BRAND.ownerName, 14, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
  doc.text(BRAND.tagline, 14, 27); doc.text(BRAND.contact.website, 14, 33);

  doc.setFillColor(...hexToRgb(BRAND.colors.accent)); doc.rect(14, 40, pageW - 28, 2, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("INVOICE", 14, 50);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
  doc.text(`Billed to: ${d.clientName}`, 14, 57);
  doc.text(`${d.invoiceNumber}  ·  Date: ${d.date}  ·  Due: ${d.dueDate}`, pageW - 14, 50, { align: "right" });

  let y = 66;
  doc.setFillColor(...hexToRgb(BRAND.colors.lightBg)); doc.rect(14, y - 4, pageW - 28, 8, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("Description", 18, y + 1); doc.text("Qty", 130, y + 1); doc.text("Unit Price", 148, y + 1); doc.text("Total", pageW - 18, y + 1, { align: "right" });
  y += 8;

  d.lineItems.forEach((item, i) => {
    if (i % 2 === 1) { doc.setFillColor(...hexToRgb(BRAND.colors.lightBg)); doc.rect(14, y - 4, pageW - 28, 9, "F"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
    doc.text(item.description.slice(0, 55), 18, y + 1);
    doc.text(String(item.quantity), 133, y + 1);
    doc.text(`$${item.unit_price.toLocaleString()}`, 151, y + 1);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
    doc.text(`$${item.total.toLocaleString()}`, pageW - 18, y + 1, { align: "right" });
    y += 9;
  });

  doc.setDrawColor(...hexToRgb(BRAND.colors.lightLine)); doc.line(14, y, pageW - 14, y); y += 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...hexToRgb(BRAND.colors.bg));
  doc.text("Total Amount Due:", 14, y);
  doc.setTextColor(...hexToRgb(BRAND.colors.accent));
  doc.text(`$${d.totalAmount.toLocaleString()}`, pageW - 14, y, { align: "right" });
  y += 12;

  if (d.paymentInstructions) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...hexToRgb(BRAND.colors.accent));
    doc.text("Payment Details", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    const pi = doc.splitTextToSize(d.paymentInstructions, pageW - 28);
    doc.text(pi, 14, y); y += pi.length * 4.8 + 6;
  }

  if (d.notes) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...hexToRgb(BRAND.colors.textDim));
    doc.text(d.notes, 14, y);
  }

  addFooter(doc, "C", 1);
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function generateProposalPdf(template: PdfTemplate, data: ProposalData, profileDataUrl?: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (template === "A") buildProposalA(doc, data, profileDataUrl);
  else if (template === "B") buildProposalB(doc, data, profileDataUrl);
  else buildProposalC(doc, data, profileDataUrl);
  return doc;
}

export function generateInvoicePdf(template: PdfTemplate, data: InvoiceData, profileDataUrl?: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (template === "A") buildInvoiceA(doc, data, profileDataUrl);
  else if (template === "B") buildInvoiceB(doc, data, profileDataUrl);
  else buildInvoiceC(doc, data, profileDataUrl);
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
