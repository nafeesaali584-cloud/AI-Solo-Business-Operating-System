import { NextRequest, NextResponse } from "next/server";
import { executeGate1ConfirmSent } from "@/lib/gates";

export async function POST(req: NextRequest) {
  try {
    const { interaction_id, updated_content } = await req.json();
    if (!interaction_id) {
      return NextResponse.json({ error: "interaction_id is required" }, { status: 400 });
    }

    const updated = await executeGate1ConfirmSent(interaction_id, updated_content);

    return NextResponse.json({
      success: true,
      gate: 1,
      message: "GATE 1 CLEARED: Message confirmed sent manually by user.",
      interaction: updated,
    });
  } catch (error: any) {
    console.error("Gate 1 error:", error);
    return NextResponse.json({ error: error.message || "Gate 1 execution failed" }, { status: 400 });
  }
}
