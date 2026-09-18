import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clientId = searchParams.get("client_id");

    if (id) {
      const invoice = await db.invoice.findUnique({
        where: { id },
        include: { client: true, proposal: true },
      });
      return NextResponse.json({ success: true, invoice });
    }

    const whereClause: any = {};
    if (clientId) whereClause.client_id = clientId;

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: { client: true, proposal: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      client_id,
      proposal_id,
      line_items,
      amount,
      due_date,
      payment_instructions,
      notes,
    } = body;

    if (!client_id) {
      return NextResponse.json({ error: "client_id is required" }, { status: 400 });
    }

    // Generate sequential invoice number: e.g. INV-2026-0001
    const count = await db.invoice.count();
    const year = new Date().getFullYear();
    const invoice_number = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

    const invoice = await db.invoice.create({
      data: {
        client_id,
        proposal_id: proposal_id || null,
        invoice_number,
        line_items: line_items || [],
        amount: amount || 0,
        due_date: due_date ? new Date(due_date) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
        payment_instructions:
          payment_instructions ||
          "Bank Transfer / Wire or Online Payment. Payment due within specified due date.",
        notes: notes || null,
        status: "Draft",
      },
      include: { client: true },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error("Invoice create error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, line_items, amount, due_date, payment_instructions, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Invoice id is required" }, { status: 400 });
    }

    // Safety checks: Mark Sent MUST use Gate 4 endpoint
    if (status === "Sent") {
      return NextResponse.json(
        { error: "GATE 4 VIOLATION: Invoices can only be marked Sent via /api/gates/gate4" },
        { status: 403 }
      );
    }

    // Safety checks: Mark Paid MUST use Gate 5 endpoint
    if (status === "Paid") {
      return NextResponse.json(
        { error: "GATE 5 VIOLATION: Payment can ONLY be confirmed via /api/gates/gate5" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status === "Overdue") updateData.status = "Overdue";
    if (line_items !== undefined) updateData.line_items = line_items;
    if (amount !== undefined) updateData.amount = amount;
    if (due_date !== undefined) updateData.due_date = new Date(due_date);
    if (payment_instructions !== undefined) updateData.payment_instructions = payment_instructions;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    console.error("Invoice update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}
