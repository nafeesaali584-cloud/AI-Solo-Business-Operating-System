import { NextRequest, NextResponse } from "next/server";
import { executeGate4MarkInvoiceSent } from "@/lib/gates";

export async function POST(req: NextRequest) {
  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
    }

    const updated = await executeGate4MarkInvoiceSent(invoice_id);

    return NextResponse.json({
      success: true,
      gate: 4,
      message: "GATE 4 CLEARED: Invoice manually confirmed as sent to client.",
      invoice: updated,
    });
  } catch (error: any) {
    console.error("Gate 4 error:", error);
    return NextResponse.json({ error: error.message || "Gate 4 execution failed" }, { status: 400 });
  }
}
