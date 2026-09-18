import { NextRequest, NextResponse } from "next/server";
import { generateLeadSnapshot } from "@/lib/ai/prompts";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id } = body;

    if (!lead_id) {
      return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
    }

    const lead = await db.lead.findUnique({
      where: { id: lead_id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const snapshot = await generateLeadSnapshot(lead);

    const updatedLead = await db.lead.update({
      where: { id: lead_id },
      data: {
        ai_summary: snapshot.ai_summary,
        ai_opportunity: snapshot.ai_opportunity,
        ai_recommended_angle: snapshot.ai_recommended_angle,
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      snapshot,
    });
  } catch (error: any) {
    console.error("Error generating lead snapshot:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI snapshot" },
      { status: 500 }
    );
  }
}
