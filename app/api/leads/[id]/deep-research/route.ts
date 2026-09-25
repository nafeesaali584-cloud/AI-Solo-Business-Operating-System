import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeLeadDeepResearch } from "@/lib/ai/research";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { force_refresh = false } = body;

    const lead = await db.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Cost-Control Mechanism: Return cached research if already conducted and not forced to refresh
    if (!force_refresh && lead.research_data) {
      return NextResponse.json({
        success: true,
        cached: true,
        message: "Loaded from cached research_data (no new billable search queries executed).",
        research: lead.research_data,
        lead,
      });
    }

    // Execute multi-query deep research pass with Google Search grounding
    let researchResult;
    try {
      researchResult = await executeLeadDeepResearch({
        id: lead.id,
        business_name: lead.business_name,
        website: lead.website,
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        city_country: lead.city_country,
        niche_industry: lead.niche_industry,
        rating: lead.rating,
        review_count: lead.review_count,
        source_csv_row: lead.source_csv_row,
      });
    } catch (researchErr: any) {
      const errMsg = researchErr?.message || "";
      const isQuota =
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("rate limit") ||
        researchErr?.status === 429 ||
        researchErr?.code === 429;

      // ANTI-FABRICATION RULE:
      // When search hits quota or fails, NEVER synthesize fake data or domains.
      // Return explicit error to user and do NOT mutate the database.
      if (isQuota) {
        return NextResponse.json(
          {
            error: "Research could not be completed — search quota limit reached, try again later",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: researchErr.message || "Failed to execute deep research",
        },
        { status: 500 }
      );
    }

    // Only genuine results from executeLeadDeepResearch reach here
    const genuineSources = Array.isArray(researchResult.sources) ? researchResult.sources : [];

    // Only update website if lead did not have one AND a genuine domain was verified from research
    const updateData: any = {
      research_data: researchResult as any,
      competitor_pricing: researchResult.competitor_pricing as any,
      qualification_tier: researchResult.qualification_tier,
      qualification_signals: researchResult.qualification_signals as any,
      primary_observation: researchResult.primary_observation,
      primary_offer: researchResult.primary_offer,
      ai_summary: `${researchResult.reputation?.summary || ""} ${researchResult.site_health?.indexed_pages_note || ""}`.trim(),
      ai_opportunity: `Single prioritized observation: ${researchResult.primary_observation}`,
      ai_recommended_angle: `Focus 100% on offering "${researchResult.primary_offer}". Do not cross-pitch secondary services in initial outreach.`,
    };

    // If genuine research verified an official domain, attach it
    if (!lead.website && researchResult.domain) {
      updateData.website = `https://${researchResult.domain}`;
    }

    // Persist enriched research directly to the Lead record in PostgreSQL
    const updatedLead = await db.lead.update({
      where: { id: lead.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      cached: false,
      research: researchResult,
      lead: updatedLead,
      sources_count: genuineSources.length,
    });
  } catch (error: any) {
    console.error("Deep research error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute deep research" },
      { status: 500 }
    );
  }
}
