import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { executeLeadDeepResearch } from "@/lib/ai/research";

/** Demo research result returned when Google Search quota is exceeded */
function buildDemoResearch(lead: { business_name: string; city_country?: string | null; niche_industry?: string | null; website?: string | null }) {
  const city = lead.city_country || "Dubai, UAE";
  const niche = lead.niche_industry || "Service Business";
  return {
    business_name: lead.business_name,
    domain: lead.website ? lead.website.replace(/https?:\/\/(www\.)?/, "") : null,
    site_health: {
      has_website: !!lead.website,
      is_biolink_only: false,
      indexed_pages_note: lead.website
        ? `Website is indexed with limited SEO visibility in ${city} regional search.`
        : `No standalone website found — business relies on social media and directory listings.`,
      is_weak_seo: true,
      tech_debt_flag: lead.website ? "Existing site lacks mobile-first design and fast intake flow." : "No dedicated branded website.",
    },
    reputation: {
      summary: `${lead.business_name} has a local presence in ${city} with customer footfall. Online reputation management is minimal.`,
      pain_points: [
        "No online booking or WhatsApp auto-response for customer inquiries.",
        "Limited visibility in local Google search results.",
      ],
      positive_notes: [
        "Established local business with repeat clientele.",
        `Active in the ${niche} niche in ${city}.`,
      ],
    },
    recent_news: null,
    social_presence: [],
    competitor_pricing: [
      {
        competitor_name: `${city} Regional Market Benchmark`,
        price_range: "AED 2,500 – 6,500",
        source_url: `https://www.google.com/search?q=${encodeURIComponent(niche + " pricing " + city)}`,
        notes: `Standard regional rate for professional ${niche} digital services.`,
      },
    ],
    qualification_signals: [
      {
        type: "no_chatbot",
        label: "No Automated Intake",
        detail: "No online booking or chat automation detected on website or social profiles.",
        confidence: "High",
      },
      {
        type: "tech_debt",
        label: "Weak Digital Presence",
        detail: "Limited indexed pages and low local SEO footprint.",
        confidence: "Medium",
      },
    ],
    qualification_tier: "Warm",
    qualification_score: 55,
    qualification_reasoning: [
      "Established local business with existing revenue (baseline score).",
      "No automated intake creates immediate pitch leverage.",
      "Anchored against 1 regional competitor pricing benchmark.",
    ],
    primary_observation: lead.website
      ? "Website lacks a streamlined customer conversion funnel and WhatsApp automation for instant lead capture."
      : `No dedicated website exists. Strong local footprint in ${city} with no digital customer intake system.`,
    primary_offer: lead.website ? "WhatsApp Automation" : "Website Build",
    sources: [],
    executed_queries: [`"${lead.business_name}" ${city} (demo mode — quota limit reached)`],
    validation_audit: [],
    researched_at: new Date().toISOString(),
    _demo_mode: true,
  };
}

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
      });
    }

    // Execute multi-query deep research pass with Google Search grounding
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

    // Cache results directly on the Lead record to protect against redundant search costs
    const updatedLead = await db.lead.update({
      where: { id: lead.id },
      data: {
        research_data: researchResult as any,
        competitor_pricing: researchResult.competitor_pricing as any,
        qualification_tier: researchResult.qualification_tier,
        qualification_signals: researchResult.qualification_signals as any,
        primary_observation: researchResult.primary_observation,
        primary_offer: researchResult.primary_offer,
        // Update ai summary / opportunity / angle with live research
        ai_summary: `${researchResult.reputation.summary} ${researchResult.site_health.indexed_pages_note}`,
        ai_opportunity: `Single prioritized observation: ${researchResult.primary_observation}`,
        ai_recommended_angle: `Focus 100% on offering "${researchResult.primary_offer}". Do not cross-pitch secondary services in initial outreach.`,
      },
    });

    return NextResponse.json({
      success: true,
      cached: false,
      research: researchResult,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error("Deep research error:", error);
    const isQuota =
      error?.message?.toLowerCase().includes("quota") ||
      error?.message?.toLowerCase().includes("rate limit") ||
      error?.status === 429 ||
      error?.code === 429;

    if (isQuota) {
      // Quota exceeded — return a pre-built demo research result so the UI stays functional
      const leadRecord = await db.lead.findUnique({ where: { id: params.id } }).catch(() => null);
      const demoResult = buildDemoResearch(
        leadRecord || { business_name: "Business", city_country: null, niche_industry: null, website: null }
      );

      return NextResponse.json({
        success: true,
        cached: false,
        demo_mode: true,
        message: "Search quota limit reached — showing pre-built research profile. Real data will load when quota resets.",
        research: demoResult,
      });
    }

    return NextResponse.json(
      { error: error.message || "Failed to execute deep research" },
      { status: 500 }
    );
  }
}
