import { NextRequest, NextResponse } from "next/server";
import { draftProposalContent } from "@/lib/ai/prompts";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id, client_id, services } = body;

    let business_name = "Prospective Client";
    let niche_industry = null;
    let city_country = null;
    let website = null;
    let primary_observation = null;
    let primary_offer = null;
    let source_csv_row = null;
    let research_data = null;

    if (lead_id) {
      const lead = await db.lead.findUnique({ where: { id: lead_id } });
      if (lead) {
        business_name = lead.business_name;
        niche_industry = lead.niche_industry;
        city_country = lead.city_country;
        website = lead.website;
        primary_observation = lead.primary_observation;
        primary_offer = lead.primary_offer;
        source_csv_row = lead.source_csv_row;
        research_data = lead.research_data;
      }
    } else if (client_id) {
      const client = await db.client.findUnique({
        where: { id: client_id },
      });
      if (client) {
        business_name = client.business_name;
        if (client.lead_id) {
          const linkedLead = await db.lead.findUnique({ where: { id: client.lead_id } });
          if (linkedLead) {
            niche_industry = linkedLead.niche_industry;
            city_country = linkedLead.city_country;
            website = linkedLead.website;
            primary_observation = linkedLead.primary_observation;
            primary_offer = linkedLead.primary_offer;
            source_csv_row = linkedLead.source_csv_row;
            research_data = linkedLead.research_data;
          }
        }
      }
    }

    const draft = await draftProposalContent({
      business_name,
      niche_industry,
      city_country,
      website,
      primary_observation,
      primary_offer,
      source_csv_row,
      research_data,
      services: services || [],
    });

    return NextResponse.json({
      success: true,
      currency: draft.currency,
      draft,
    });
  } catch (error: any) {
    console.error("Error drafting proposal content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to draft proposal" },
      { status: 500 }
    );
  }
}
