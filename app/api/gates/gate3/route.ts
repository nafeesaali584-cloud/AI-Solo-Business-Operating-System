import { NextRequest, NextResponse } from "next/server";
import { executeGate3MarkProposalSent } from "@/lib/gates";

export async function POST(req: NextRequest) {
  try {
    const { proposal_id } = await req.json();
    if (!proposal_id) {
      return NextResponse.json({ error: "proposal_id is required" }, { status: 400 });
    }

    const updated = await executeGate3MarkProposalSent(proposal_id);

    return NextResponse.json({
      success: true,
      gate: 3,
      message: "GATE 3 CLEARED: Proposal manually confirmed as sent to client.",
      proposal: updated,
    });
  } catch (error: any) {
    console.error("Gate 3 error:", error);
    return NextResponse.json({ error: error.message || "Gate 3 execution failed" }, { status: 400 });
  }
}
