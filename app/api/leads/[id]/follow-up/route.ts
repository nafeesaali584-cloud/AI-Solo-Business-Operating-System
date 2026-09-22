import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateBehaviorFollowUp, CustomerBehaviorType } from "@/lib/ai/follow-up";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      behavior,
      channel = "WhatsApp",
      custom_hesitation_notes,
    } = body;

    if (!behavior) {
      return NextResponse.json({ error: "Customer behavior is required" }, { status: 400 });
    }

    const lead = await db.lead.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        interactions: {
          orderBy: { created_at: "desc" },
          take: 3,
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Guardrail: Max 4 follow-ups unless customer is warm/interested
    if (behavior !== "warm_interested" && lead.follow_up_count >= 4) {
      return NextResponse.json(
        {
          error: "Maximum 4 follow-ups already completed for this lead. Graceful exit policy active to respect customer boundaries.",
          max_reached: true,
        },
        { status: 400 }
      );
    }

    const lastInteraction = lead.interactions[0];
    const contactName = lead.contacts[0]?.name || null;

    const followUpResult = await generateBehaviorFollowUp({
      business_name: lead.business_name,
      contact_name: contactName,
      channel,
      behavior: behavior as CustomerBehaviorType,
      current_follow_up_count: lead.follow_up_count,
      primary_offer: lead.primary_offer,
      last_message_summary: lastInteraction ? lastInteraction.content.slice(0, 150) : null,
      custom_hesitation_notes,
    });

    // Create draft interaction record with confirmed_sent = false (GATE 1)
    const interaction = await db.interaction.create({
      data: {
        lead_id: lead.id,
        channel,
        direction: "Outgoing",
        content: followUpResult.draft.body,
        ai_generated: true,
        confirmed_sent: false,
      },
    });

    // Update lead record with incremented follow-up count & active behavior
    const updatedCount =
      behavior === "warm_interested"
        ? lead.follow_up_count
        : Math.min(lead.follow_up_count + 1, 4);

    await db.lead.update({
      where: { id: lead.id },
      data: {
        customer_behavior: behavior,
        follow_up_count: updatedCount,
        status: behavior === "warm_interested" ? "Booking" : lead.status,
      },
    });

    return NextResponse.json({
      success: true,
      follow_up: followUpResult,
      interaction_id: interaction.id,
      follow_up_count: updatedCount,
    });
  } catch (error: any) {
    console.error("Follow-up error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate follow-up" },
      { status: 500 }
    );
  }
}
