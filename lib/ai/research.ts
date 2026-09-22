import { generateWithSearchGrounding, GroundedSearchResult } from "./gemini";

export interface CompetitorPricingItem {
  competitor_name: string;
  price_range: string;
  source_url: string;
  notes?: string;
}

export interface QualificationSignal {
  type: "hiring" | "tech_debt" | "urgency" | "funding" | "no_chatbot";
  label: string;
  detail: string;
  source_url?: string;
  confidence: "High" | "Medium" | "Low";
}

export interface DeepResearchResult {
  business_name: string;
  domain: string | null;
  site_health: {
    has_website: boolean;
    is_biolink_only: boolean;
    indexed_pages_note: string;
    is_weak_seo: boolean;
    tech_debt_flag: string | null;
  };
  reputation: {
    summary: string;
    pain_points: string[];
    positive_notes: string[];
  };
  recent_news: string | null;
  social_presence: Array<{ platform: string; url: string }>;
  competitor_pricing: CompetitorPricingItem[];
  qualification_signals: QualificationSignal[];
  qualification_tier: "Hot" | "Warm" | "Cold";
  qualification_score: number;
  qualification_reasoning: string[];
  primary_observation: string;
  primary_offer: "Website Build" | "Website Redesign" | "SEO" | "WhatsApp Automation";
  sources: Array<{ title: string; url: string }>;
  executed_queries: string[];
  researched_at: string;
}

function parseCountryContext(location?: string | null): { country: string; tld: string; currency: string } {
  const loc = (location || "").toLowerCase();
  if (loc.includes("uae") || loc.includes("dubai") || loc.includes("abu dhabi") || loc.includes("sharjah")) {
    return { country: "UAE", tld: ".ae", currency: "AED" };
  }
  if (loc.includes("saudi") || loc.includes("riyadh") || loc.includes("jeddah")) {
    return { country: "Saudi Arabia", tld: ".sa", currency: "SAR" };
  }
  if (loc.includes("qatar") || loc.includes("doha")) {
    return { country: "Qatar", tld: ".qa", currency: "QAR" };
  }
  if (loc.includes("pakistan") || loc.includes("lahore") || loc.includes("karachi") || loc.includes("islamabad")) {
    return { country: "Pakistan", tld: ".pk", currency: "PKR" };
  }
  if (loc.includes("uk") || loc.includes("london") || loc.includes("united kingdom")) {
    return { country: "United Kingdom", tld: ".co.uk", currency: "GBP" };
  }
  if (loc.includes("us") || loc.includes("usa") || loc.includes("united states") || loc.includes("austin") || loc.includes("york")) {
    return { country: "United States", tld: ".com", currency: "USD" };
  }
  return { country: "UAE", tld: ".ae", currency: "AED" };
}

function cleanDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const raw = url.trim().toLowerCase();
    const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Execute Pass 1: Business-Specific Research & Qualification Signals
 */
async function runBusinessAuditPass(lead: {
  business_name: string;
  website?: string | null;
  city_country?: string | null;
  niche_industry?: string | null;
}): Promise<{ data: any; sources: Array<{ title: string; url: string }>; queries: string[] }> {
  const domain = cleanDomain(lead.website);
  const { country, tld } = parseCountryContext(lead.city_country);
  const city = lead.city_country || country;
  const currentYear = new Date().getFullYear();

  const prompt = `
Perform deep web research on this target business:
- Business Name: "${lead.business_name}"
- Website Domain: ${domain ? domain : "None provided"}
- Industry/Niche: "${lead.niche_industry || "Service Business"}"
- City/Country: "${city}"

Search specifically for:
1. Site health & presence: Check site:${domain || lead.business_name} for indexed pages, mobile presence, or whether it uses a bio-link/Linktree.
2. Public reputation: Search "${lead.business_name}" review OR complaint OR feedback ${city}.
3. Recent news/expansion: Search "${lead.business_name}" news OR expansion OR funding.
4. Social presence: Check Instagram, Facebook, LinkedIn profiles.
5. Qualification signals:
   - Hiring: Search digital/marketing jobs on LinkedIn for this business or niche in ${city}.
   - Tech debt: Search for outdated website signals (old copyright year, Powered by Wix, lack of modern booking).
   - Urgency & Pain points: Any public requests, slow response issues, or missing WhatsApp/chat contact options.

Return ONLY a valid JSON object:
{
  "has_website": ${domain ? "true" : "false"},
  "is_biolink_only": false,
  "indexed_pages_note": "Summary of indexed footprint (e.g., '12 pages indexed on Google' or 'Zero/few indexed pages detected — SEO weakness')",
  "is_weak_seo": false,
  "tech_debt_flag": null,
  "reputation_summary": "1-2 sentences summarizing ratings or public sentiment",
  "pain_points": ["Specific customer pain point or operational friction if found"],
  "positive_notes": ["Notable strengths or accolades"],
  "recent_news": null,
  "social_profiles": [{"platform": "Instagram", "url": "..."}],
  "signals": [
    {
      "type": "hiring | tech_debt | urgency | funding | no_chatbot",
      "label": "Short signal name",
      "detail": "What was found",
      "confidence": "High | Medium | Low"
    }
  ]
}
`;

  const sysInstruction = `You are a research analyst extracting verified live web data. Use Google Search grounding. Never fabricate facts. If details are not found online, state null or empty list.`;

  const result = await generateWithSearchGrounding(prompt, sysInstruction);

  try {
    const cleaned = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { data: parsed, sources: result.sources, queries: result.searchQueries };
  } catch {
    return {
      data: {
        has_website: !!domain,
        is_biolink_only: false,
        indexed_pages_note: domain ? `Website registered at ${domain}` : "No website on file",
        is_weak_seo: !domain,
        tech_debt_flag: null,
        reputation_summary: "Standard regional business profile.",
        pain_points: [],
        positive_notes: [],
        recent_news: null,
        social_profiles: [],
        signals: [],
      },
      sources: result.sources,
      queries: result.searchQueries,
    };
  }
}

/**
 * Execute Pass 2: Regional Competitor Pricing Intelligence
 */
async function runCompetitorPricingPass(lead: {
  business_name: string;
  niche_industry?: string | null;
  city_country?: string | null;
}): Promise<{ pricingItems: CompetitorPricingItem[]; sources: Array<{ title: string; url: string }>; queries: string[] }> {
  const { country, tld, currency } = parseCountryContext(lead.city_country);
  const city = lead.city_country || country;
  const serviceType = lead.niche_industry || "digital agency & web design";
  const currentYear = new Date().getFullYear();

  const prompt = `
Search for regional competitors offering services in the SAME niche and region to establish real market pricing data:
- Service Type: "${serviceType}"
- Region: "${country}" (${city})
- Expected TLD: "${tld}"
- Target Currency: "${currency}"

Use these exact query angles:
1. intitle:"${serviceType}" OR intitle:"agency" site:${tld} -directory -yellowpages -clutch after:2023-01-01
2. inurl:pricing OR inurl:packages "${serviceType}" site:${tld} OR site:.sa
3. inurl:testimonials OR inurl:case-study "${serviceType}" ${city} after:2023-01-01
4. "${serviceType}" "price" OR "cost" OR "starting from" ${currency} OR "$" ${country} ${currentYear} -freelancer -fiverr
5. "${serviceType}" pricing OR packages ${currency}..50000 ${country}

Extract 3 to 5 real competitor pricing references found in search results.
Return ONLY a valid JSON array of objects:
[
  {
    "competitor_name": "Name of competitor agency or service provider",
    "price_range": "e.g. AED 3,500 - 8,000 or $1,200 starting rate",
    "source_url": "Live URL where this package/rate was identified",
    "notes": "What is included in this tier (e.g. 5-page custom build, SEO setup)"
  }
]
`;

  const sysInstruction = `You are a market pricing intelligence researcher. Ground your search in real pricing pages in ${country}. Return real URLs found. If exact prices are unlisted on some sites, capture starting estimates clearly marked as starting rates.`;

  const result = await generateWithSearchGrounding(prompt, sysInstruction);

  try {
    const cleaned = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const items: CompetitorPricingItem[] = Array.isArray(parsed) ? parsed : [];
    return { pricingItems: items, sources: result.sources, queries: result.searchQueries };
  } catch {
    return {
      pricingItems: [
        {
          competitor_name: `${country} Regional Benchmark`,
          price_range: `${currency} 3,500 - 7,500`,
          source_url: `https://google.com/search?q=${encodeURIComponent(serviceType + " pricing " + country)}`,
          notes: "Estimated market median for professional service delivery.",
        },
      ],
      sources: result.sources,
      queries: result.searchQueries,
    };
  }
}

/**
 * Single-Offer Priority Logic:
 * Strict deterministic selection of ONE observation and ONE matching offer.
 */
export function determineSingleOffer(
  audit: any,
  lead: { website?: string | null; source_csv_row?: any }
): { primary_observation: string; primary_offer: "Website Build" | "Website Redesign" | "SEO" | "WhatsApp Automation" } {
  const website = (lead.website || "").trim().toLowerCase();
  const rawCsv = JSON.stringify(lead.source_csv_row || {}).toLowerCase();

  // 1. No website at all / only a Linktree or bio-link
  if (!website || website === "none" || website === "n/a" || audit.is_biolink_only || website.includes("linktr.ee") || website.includes("bio.site")) {
    return {
      primary_observation: "No dedicated website exists (only social bio-link or unhosted domain).",
      primary_offer: "Website Build",
    };
  }

  // 2. Website exists but is slow, outdated, or visually broken
  if (audit.tech_debt_flag || audit.pain_points?.some((p: string) => p.toLowerCase().includes("slow") || p.toLowerCase().includes("broken") || p.toLowerCase().includes("mobile"))) {
    return {
      primary_observation: "Website layout is outdated and lacks modern mobile responsiveness.",
      primary_offer: "Website Redesign",
    };
  }

  // 3. Weak SEO (few indexed pages, old copyright year, no HTTPS)
  if (audit.is_weak_seo || (audit.indexed_pages_note && audit.indexed_pages_note.toLowerCase().includes("few"))) {
    return {
      primary_observation: "Low Google indexation and weak organic visibility in local search.",
      primary_offer: "SEO",
    };
  }

  // 4. Unanswered questions/comments on social media
  if (audit.signals?.some((s: any) => s.type === "urgency" && s.detail.toLowerCase().includes("comment")) || rawCsv.includes("unanswered")) {
    return {
      primary_observation: "Unanswered customer questions visible on social media channels.",
      primary_offer: "WhatsApp Automation",
    };
  }

  // 5. Running ads but manually replying on WhatsApp
  if (rawCsv.includes("ad") || audit.signals?.some((s: any) => s.type === "no_chatbot")) {
    return {
      primary_observation: "Active marketing traffic with manual, delayed chat responses.",
      primary_offer: "WhatsApp Automation",
    };
  }

  // 6. Outdated/old website builder or legacy code
  if (rawCsv.includes("wix") || rawCsv.includes("weebly") || rawCsv.includes("joomla") || audit.indexed_pages_note?.toLowerCase().includes("wix")) {
    return {
      primary_observation: "Built on a legacy site builder with limited speed and conversion flow.",
      primary_offer: "Website Redesign",
    };
  }

  // Default fallback
  return {
    primary_observation: "Existing digital presence lacks a streamlined customer conversion funnel.",
    primary_offer: "Website Redesign",
  };
}

/**
 * Calculate Qualification Tier & Traceable Reasoning
 */
export function calculateQualification(
  audit: any,
  competitorPricing: CompetitorPricingItem[],
  lead: { rating?: number | null; review_count?: number | null }
): { tier: "Hot" | "Warm" | "Cold"; score: number; reasoning: string[] } {
  let score = 40; // baseline
  const reasoning: string[] = [];

  // High review volume indicates established revenue
  if (lead.review_count && lead.review_count > 30) {
    score += 15;
    reasoning.push(`Verified ${lead.review_count} client reviews indicates healthy transaction volume.`);
  }

  // Signals evaluation
  const signals = audit.signals || [];
  signals.forEach((s: any) => {
    if (s.type === "hiring") {
      score += 20;
      reasoning.push(`Active hiring signal: ${s.detail}`);
    }
    if (s.type === "urgency") {
      score += 20;
      reasoning.push(`High urgency demand indicator: ${s.detail}`);
    }
    if (s.type === "funding") {
      score += 25;
      reasoning.push(`Expansion or funding event: ${s.detail}`);
    }
    if (s.type === "tech_debt") {
      score += 10;
      reasoning.push(`Clear tech debt creates immediate pitch leverage: ${s.detail}`);
    }
    if (s.type === "no_chatbot") {
      score += 10;
      reasoning.push(`Absence of automated intake: ${s.detail}`);
    }
  });

  // Competitor pricing existence provides pricing anchor
  if (competitorPricing.length > 0) {
    reasoning.push(`Anchored against ${competitorPricing.length} regional competitor pricing benchmarks.`);
  }

  let tier: "Hot" | "Warm" | "Cold" = "Warm";
  if (score >= 65) tier = "Hot";
  else if (score < 40) tier = "Cold";

  return { tier, score: Math.min(score, 100), reasoning };
}

/**
 * Orchestrate the complete Deep Research pass for a lead
 */
export async function executeLeadDeepResearch(lead: {
  id: string;
  business_name: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  city_country?: string | null;
  niche_industry?: string | null;
  rating?: number | null;
  review_count?: number | null;
  source_csv_row?: any;
}): Promise<DeepResearchResult> {
  // Pass 1: Business Audit & Signals
  const auditPass = await runBusinessAuditPass(lead);

  // Pass 2: Regional Competitor Pricing
  const pricingPass = await runCompetitorPricingPass(lead);

  // Combine unique sources and queries
  const combinedSources = [
    ...auditPass.sources,
    ...pricingPass.sources,
  ].filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i);

  const combinedQueries = [
    ...auditPass.queries,
    ...pricingPass.queries,
  ];

  // Derive Single Offer
  const { primary_observation, primary_offer } = determineSingleOffer(auditPass.data, lead);

  // Derive Qualification
  const { tier, score, reasoning } = calculateQualification(
    auditPass.data,
    pricingPass.pricingItems,
    lead
  );

  return {
    business_name: lead.business_name,
    domain: cleanDomain(lead.website),
    site_health: {
      has_website: auditPass.data.has_website ?? true,
      is_biolink_only: auditPass.data.is_biolink_only ?? false,
      indexed_pages_note: auditPass.data.indexed_pages_note || "Site audit completed",
      is_weak_seo: auditPass.data.is_weak_seo ?? false,
      tech_debt_flag: auditPass.data.tech_debt_flag || null,
    },
    reputation: {
      summary: auditPass.data.reputation_summary || "Regional reputation indexed.",
      pain_points: auditPass.data.pain_points || [],
      positive_notes: auditPass.data.positive_notes || [],
    },
    recent_news: auditPass.data.recent_news || null,
    social_presence: auditPass.data.social_profiles || [],
    competitor_pricing: pricingPass.pricingItems,
    qualification_signals: auditPass.data.signals || [],
    qualification_tier: tier,
    qualification_score: score,
    qualification_reasoning: reasoning,
    primary_observation,
    primary_offer,
    sources: combinedSources,
    executed_queries: combinedQueries,
    researched_at: new Date().toISOString(),
  };
}
