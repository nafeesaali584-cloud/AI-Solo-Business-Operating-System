import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeLeadDeepResearch } from "@/lib/ai/research";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_ids, estimate_only = false, force_refresh = false } = body;

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: "lead_ids array is required" }, { status: 400 });
    }

    const leads = await db.lead.findMany({
      where: { id: { in: lead_ids } },
    });

    const unresearchedCount = leads.filter((l) => !l.research_data || force_refresh).length;
    const cachedCount = leads.length - unresearchedCount;

    // Estimated Google Search grounded queries (approx 2 search passes per new lead)
    const estimatedGroundedQueries = unresearchedCount * 2;

    // SAFEGUARD ESTIMATE: Return estimate metrics for user confirmation modal
    if (estimate_only) {
      return NextResponse.json({
        success: true,
        estimate: {
          total_selected: leads.length,
          unresearched_leads: unresearchedCount,
          cached_leads: cachedCount,
          estimated_grounded_queries: estimatedGroundedQueries,
          force_refresh,
          warning:
            unresearchedCount > 0
              ? `You are about to run live Google Search grounding across ${unresearchedCount} lead(s) (~${estimatedGroundedQueries} grounded queries). Caching is active for ${cachedCount} previously researched lead(s).`
              : `All ${cachedCount} selected leads already have saved research data. No new billable searches will run unless you force refresh.`,
        },
      });
    }

    // Process leads sequentially with slight pacing to maintain API RPM compliance
    const results: any[] = [];
    for (const lead of leads) {
      if (!force_refresh && lead.research_data) {
        results.push({
          id: lead.id,
          business_name: lead.business_name,
          cached: true,
          research: lead.research_data,
        });
        continue;
      }

      try {
        const researchResult = await executeLeadDeepResearch({
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

        await db.lead.update({
          where: { id: lead.id },
          data: {
            research_data: researchResult as any,
            competitor_pricing: researchResult.competitor_pricing as any,
            qualification_tier: researchResult.qualification_tier,
            qualification_signals: researchResult.qualification_signals as any,
            primary_observation: researchResult.primary_observation,
            primary_offer: researchResult.primary_offer,
            ai_summary: `${researchResult.reputation.summary} ${researchResult.site_health.indexed_pages_note}`,
            ai_opportunity: `Single prioritized observation: ${researchResult.primary_observation}`,
            ai_recommended_angle: `Focus 100% on offering "${researchResult.primary_offer}". Do not cross-pitch secondary services in initial outreach.`,
          },
        });

        results.push({
          id: lead.id,
          business_name: lead.business_name,
          cached: false,
          research: researchResult,
        });

        // 1000ms delay between leads to respect free tier & avoid burst 429 errors
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err: any) {
        results.push({
          id: lead.id,
          business_name: lead.business_name,
          error: err.message || "Failed to research lead",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Bulk research error:", error);
    return NextResponse.json(
      { error: error.message || "Bulk research failed" },
      { status: 500 }
    );
  }
}
