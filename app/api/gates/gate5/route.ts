import { NextRequest, NextResponse } from "next/server";
import { executeGate5ConfirmPaymentReceived } from "@/lib/gates";

export async function POST(req: NextRequest) {
  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
    }

    const { invoice, onboarding } = await executeGate5ConfirmPaymentReceived(invoice_id);

    return NextResponse.json({
      success: true,
      gate: 5,
      message:
        "GATE 5 CLEARED: Payment confirmed received. Onboarding checklist automatically created.",
      invoice,
      onboarding,
    });
  } catch (error: any) {
    console.error("Gate 5 error:", error);
    const status = error.statusCode || (error.message?.includes("Invalid state transition") ? 409 : 400);
    return NextResponse.json({ error: error.message || "Gate 5 execution failed" }, { status });
  }
}
