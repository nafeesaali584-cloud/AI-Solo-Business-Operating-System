import { NextRequest, NextResponse } from "next/server";
import { draftProposalContent } from "@/lib/ai/prompts";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id, client_id, services } = body;

    let business_name = "Prospective Client";
    let niche_industry = null;

    if (lead_id) {
      const lead = await db.lead.findUnique({ where: { id: lead_id } });
      if (lead) {
        business_name = lead.business_name;
        niche_industry = lead.niche_industry;
      }
    } else if (client_id) {
      const client = await db.client.findUnique({ where: { id: client_id } });
      if (client) {
        business_name = client.business_name;
      }
    }

    const draft = await draftProposalContent({
      business_name,
      niche_industry,
      services: services || [],
    });

    return NextResponse.json({
      success: true,
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
