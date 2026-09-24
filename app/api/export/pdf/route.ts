import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateProposalPdf, generateInvoicePdf } from "@/lib/brand/pdf-templates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "proposal"; // proposal | invoice
    const id = searchParams.get("id");
    const template = (searchParams.get("template") || "B") as "A" | "B" | "C";

    if (type === "proposal") {
      let proposal: any = null;
      if (id) {
        proposal = await db.proposal.findUnique({
          where: { id },
          include: { client: true, lead: true },
        });
      }
      if (!proposal) {
        // Fallback to latest or canonical
        proposal = await db.proposal.findFirst({
          include: { client: true, lead: true },
          orderBy: { created_at: "desc" },
        });
      }

      const clientName = proposal?.client?.business_name || proposal?.lead?.business_name || "Miss Al Reem Beauty Centre";
      const doc = generateProposalPdf(template, {
        clientName,
        date: new Date().toLocaleDateString(),
        status: proposal?.status || "Approved",
        services: (proposal?.services as any[]) || [
          { name: "Website Architecture & UX Redesign", description: "Conversion-optimized booking platform", price: 1500 },
          { name: "Automated Lead Intake & CRM Pipeline", description: "Instant notification and follow-up setup", price: 800 },
        ],
        totalInvestment: Number(proposal?.total_investment || 2300),
        scope: proposal?.scope || "Booking platform with WhatsApp automation",
        deliverables: proposal?.deliverables || "Responsive website and instant lead capture workflow",
        timeline: proposal?.timeline || "Estimated delivery: 3 weeks",
        terms: proposal?.terms || "50% deposit, 50% on final launch",
        proposalNumber: proposal ? `PROP-${proposal.id.slice(0, 8).toUpperCase()}` : "PROP-0042",
      });

      const arrayBuffer = doc.output("arraybuffer");
      const filename = `Proposal_${clientName.replace(/\s+/g, "_")}_Template_${template}.pdf`;

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } else {
      // Invoice
      let invoice: any = null;
      if (id) {
        invoice = await db.invoice.findUnique({
          where: { id },
          include: { client: true },
        });
      }
      if (!invoice) {
        invoice = await db.invoice.findFirst({
          where: { invoice_number: "INV-2026-0001" },
          include: { client: true },
        });
      }
      if (!invoice) {
        invoice = await db.invoice.findFirst({
          include: { client: true },
          orderBy: { created_at: "desc" },
        });
      }

      const clientName = invoice?.client?.business_name || "Miss Al Reem Beauty Centre";
      const invoiceNumber = invoice?.invoice_number || "INV-2026-0001";
      const doc = generateInvoicePdf(template, {
        clientName,
        invoiceNumber,
        date: new Date().toLocaleDateString(),
        dueDate: invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : "In 14 days",
        lineItems: (invoice?.line_items as any[]) || [
          { description: "Project Deposit (50% Milestone)", quantity: 1, unit_price: 1150, total: 1150 },
        ],
        totalAmount: Number(invoice?.amount || 1150),
        paymentInstructions: invoice?.payment_instructions || "Direct SadaPay / Wire Transfer",
        notes: invoice?.notes || "Thank you for partnering with us.",
      });

      const arrayBuffer = doc.output("arraybuffer");
      const filename = `${invoiceNumber}_${clientName.replace(/\s+/g, "_")}_Template_${template}.pdf`;

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (error: any) {
    console.error("PDF generation endpoint error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 });
  }
}
