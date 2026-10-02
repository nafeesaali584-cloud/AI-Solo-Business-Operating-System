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

    // FIX 3: 4-touchpoint follow-up cap enforced server-side
    if ((lead.follow_up_count || 0) >= 4) {
      return NextResponse.json(
        {
          error: "Follow-up cap of 4 touchpoints reached for this lead.",
          max_reached: true,
        },
        { status: 429 }
      );
    }

    const lastInteraction = lead.interactions[0];
    const contactName = lead.contacts[0]?.name || null;

    // Extract full non-empty CSV context for deep grounding
    let source_csv_context: string | null = null;
    if (lead.source_csv_row && typeof lead.source_csv_row === "object") {
      const entries: string[] = [];
      const ignoredKeys = new Set(["id", "created_at", "updated_at", "manual"]);
      for (const [k, v] of Object.entries(lead.source_csv_row)) {
        if (ignoredKeys.has(k)) continue;
        if (v === null || v === undefined || v === "" || v === "null" || v === "undefined" || v === "N/A") continue;
        const strVal = typeof v === "object" ? JSON.stringify(v) : String(v).trim();
        if (strVal && strVal !== "{}" && strVal !== "[]") {
          entries.push(`- ${k}: ${strVal}`);
        }
      }
      if (entries.length > 0) {
        source_csv_context = entries.join("\n");
      }
    }

    const followUpResult = await generateBehaviorFollowUp({
      business_name: lead.business_name,
      contact_name: contactName,
      channel,
      behavior: behavior as CustomerBehaviorType,
      current_follow_up_count: lead.follow_up_count,
      primary_offer: lead.primary_offer,
      last_message_summary: lastInteraction ? lastInteraction.content.slice(0, 150) : null,
      custom_hesitation_notes,
      niche_industry: lead.niche_industry,
      city_country: lead.city_country,
      source_csv_context,
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

    // FIX 4: Update customer_behavior and booking status ONLY.
    // follow_up_count increments ONLY when Gate 1 is cleared for an outgoing follow-up.
    await db.lead.update({
      where: { id: lead.id },
      data: {
        customer_behavior: behavior,
        status: behavior === "warm_interested" ? "Booking" : lead.status,
      },
    });

    return NextResponse.json({
      success: true,
      follow_up: followUpResult,
      interaction_id: interaction.id,
      follow_up_count: lead.follow_up_count,
    });
  } catch (error: any) {
    console.error("Follow-up error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate follow-up" },
      { status: 500 }
    );
  }
}
