import { NextRequest, NextResponse } from "next/server";
import { suggestNextAction } from "@/lib/ai/prompts";
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
      include: {
        interactions: { orderBy: { created_at: "desc" }, take: 1 },
        deals: { take: 1 },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lastInteraction = lead.interactions[0];
    const lastDate = lastInteraction ? new Date(lastInteraction.created_at) : new Date(lead.created_at);
    const diffDays = Math.max(0, Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));

    const suggestion = await suggestNextAction({
      business_name: lead.business_name,
      status: lead.status,
      days_since_last_interaction: diffDays,
      last_interaction_content: lastInteraction ? lastInteraction.content : null,
      deal_stage: lead.deals[0]?.stage || null,
    });

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error: any) {
    console.error("Error suggesting next action:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate action suggestion" },
      { status: 500 }
    );
  }
}
