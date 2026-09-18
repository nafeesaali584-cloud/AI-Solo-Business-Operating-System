import { NextRequest, NextResponse } from "next/server";
import { executeGate2ApproveProposal } from "@/lib/gates";

export async function POST(req: NextRequest) {
  try {
    const { proposal_id } = await req.json();
    if (!proposal_id) {
      return NextResponse.json({ error: "proposal_id is required" }, { status: 400 });
    }

    const updated = await executeGate2ApproveProposal(proposal_id);

    return NextResponse.json({
      success: true,
      gate: 2,
      message: "GATE 2 CLEARED: Proposal explicitly approved by user.",
      proposal: updated,
    });
  } catch (error: any) {
    console.error("Gate 2 error:", error);
    return NextResponse.json({ error: error.message || "Gate 2 execution failed" }, { status: 400 });
  }
}
