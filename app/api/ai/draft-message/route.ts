import { NextRequest, NextResponse } from "next/server";
import { draftOutreachMessage } from "@/lib/ai/prompts";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id, client_id, channel, tone, custom_instruction } = body;

    let business_name = "Prospective Client";
    let niche_industry = null;
    let contact_name = null;

    let primary_observation: string | null = null;
    let primary_offer: string | null = null;
    let competitor_pricing_context: string | null = null;

    if (lead_id) {
      const lead = await db.lead.findUnique({
        where: { id: lead_id },
        include: { contacts: true },
      });
      if (lead) {
        business_name = lead.business_name;
        niche_industry = lead.niche_industry;
        if (lead.contacts && lead.contacts.length > 0) {
          contact_name = lead.contacts[0].name;
        }
        primary_observation = lead.primary_observation || null;
        primary_offer = lead.primary_offer || null;

        // If competitor pricing is stored on lead
        if (Array.isArray(lead.competitor_pricing) && lead.competitor_pricing.length > 0) {
          competitor_pricing_context = lead.competitor_pricing
            .map((p: any) => `${p.competitor_name}: ${p.price_range}`)
            .join("; ");
        }
      }
    } else if (client_id) {
      const client = await db.client.findUnique({
        where: { id: client_id },
        include: { contacts: true },
      });
      if (client) {
        business_name = client.business_name;
        contact_name = client.primary_contact;
      }
    }

    const draft = await draftOutreachMessage({
      business_name,
      niche_industry,
      contact_name,
      channel: channel || "WhatsApp",
      tone,
      custom_instruction,
      primary_observation,
      primary_offer,
      competitor_pricing_context,
    });

    // We record the interaction with confirmed_sent = false (GATE 1)
    const interaction = await db.interaction.create({
      data: {
        lead_id: lead_id || null,
        client_id: client_id || null,
        channel: channel || "WhatsApp",
        direction: "Outgoing",
        content: draft.body,
        ai_generated: true,
        confirmed_sent: false, // HARD RULE: Always false until manual user approval
      },
    });

    return NextResponse.json({
      success: true,
      draft,
      interaction_id: interaction.id,
      note: "Draft created in database with confirmed_sent=false. Manual user action required to confirm delivery.",
    });
  } catch (error: any) {
    console.error("Error drafting outreach message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate message draft" },
      { status: 500 }
    );
  }
}
