import { generateGeminiContent, generateCopilotWithSearch, GenerateResult } from "./gemini";

const CORE_SYSTEM_INSTRUCTION = `
You are the AI Engine inside "ClientPulse", an operating system for solo service businesses.
You operate strictly under these non-negotiable rules:

1. DATA TIERS (FACT vs INFERENCE vs LIVE WEB DATA vs UNKNOWN):
   - Fact: Taken verbatim from verified internal data (CSV, CRM records).
   - AI Inference: Interpretations built strictly from verified facts. Never invent numbers, statistics, revenue figures, or details not present.
   - Live Web Data: Real-world public information retrieved online via Google Search (website details, services, business presence, reviews). When asked about public information not in our database, use your live search capabilities rather than guessing or refusing. Clearly cite findings.
   - Unknown: If an internal detail is not in the source data and not verifiable online, explicitly state "Not available" — NEVER guess or hallucinate.

2. BOUNDARY & INTEGRITY RULES:
   - You are strictly an assistive layer (researcher, analyzer, drafter, organizer).
   - You NEVER execute actions, send messages, change payment statuses, or alter database records directly.
   - Information retrieved via live search is supplementary and conversational only. You must NEVER claim you updated or altered any database record.
`;

export interface LeadSnapshotResult {
  ai_summary: string;
  ai_opportunity: string;
  ai_recommended_angle: string;
}

export async function generateLeadSnapshot(lead: {
  business_name: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  city_country?: string | null;
  niche_industry?: string | null;
  source_csv_row?: any;
}): Promise<LeadSnapshotResult> {
  const prompt = `
Analyze this lead data and produce a structured JSON object.

LEAD DATA:
- Business Name: ${lead.business_name || "Not available"}
- Website: ${lead.website || "Not available"}
- Phone: ${lead.phone || "Not available"}
- Email: ${lead.email || "Not available"}
- Location: ${lead.city_country || "Not available"}
- Niche/Industry: ${lead.niche_industry || "Not available"}
- Raw CSV Data: ${JSON.stringify(lead.source_csv_row || {})}

REQUIREMENTS:
Return ONLY a valid JSON object (no markdown fences, no code blocks) with these exact keys:
{
  "ai_summary": "1-2 concise sentences summarizing who they are based ONLY on available facts. Missing items noted as 'Not available'.",
  "ai_opportunity": "1-2 sentences identifying potential business needs based strictly on industry/service type.",
  "ai_recommended_angle": "Direct, professional recommendation on how a solo service provider should pitch or reach out to them."
}
`;

  const raw = await generateGeminiContent(prompt, CORE_SYSTEM_INSTRUCTION);
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return {
      ai_summary: raw.slice(0, 300),
      ai_opportunity: "Analysis completed from provided data.",
      ai_recommended_angle: "Reach out referencing their primary business domain.",
    };
  }
}

export async function draftOutreachMessage(params: {
  business_name: string;
  niche_industry?: string | null;
  contact_name?: string | null;
  channel: "WhatsApp" | "Email";
  tone?: string;
  custom_instruction?: string;
  primary_observation?: string | null;
  primary_offer?: "Website Build" | "Website Redesign" | "SEO" | "WhatsApp Automation" | string | null;
  competitor_pricing_context?: string | null;
}): Promise<{ subject: string; body: string; primary_offer: string }> {
  const offer = params.primary_offer || "Website Redesign";
  const observation = params.primary_observation || "Modernizing your online customer conversion flow";

  const prompt = `
Draft a high-converting initial outreach message for a solo service professional contacting this prospective business.

TARGET CONTEXT:
- Business Name: ${params.business_name}
- Industry: ${params.niche_industry || "Service Business"}
- Contact Person: ${params.contact_name || "Business Owner"}
- Channel: ${params.channel}
- Tone: ${params.tone || "Professional, concise, and value-oriented"}
- Primary Observation Identified: "${observation}"
- SINGLE ASSIGNED OFFER: "${offer}"
${params.competitor_pricing_context ? `- Regional Competitor Pricing Benchmark: ${params.competitor_pricing_context}` : ""}
${params.custom_instruction ? `- Additional Guidance: ${params.custom_instruction}` : ""}

CRITICAL NON-NEGOTIABLE CONSTRAINTS:
1. DYNAMIC SINGLE-OFFER RULE: You MUST focus 100% of this outreach on exactly ONE service offer: "${offer}". Do NOT mention, list, or cross-pitch any other services (e.g. do not bundle SEO or marketing if offering Website Redesign).
2. HOMEPAGE CONCEPT HOOK: If the offer is "Website Build" or "Website Redesign", reference a simple homepage visual concept or layout mockup idea inline (e.g. "I put together a quick idea for what your homepage could look like — happy to show you").
3. NO FABRICATIONS: Never invent prior relationships or make up fake client numbers.
4. CHANNEL FORMAT:
   - If WhatsApp: Conversational, personal, 3-5 sentences maximum. No email subject line. End with a low-friction question (e.g., "Would you be open to a quick 3-minute look?").
   - If Email: Compelling, curiosity-inducing subject line (no spammy hype). Body with 2 short paragraphs max.

Return ONLY a valid JSON object:
{
  "subject": "Email subject or WhatsApp topic",
  "body": "The exact drafted message text"
}
`;

  const raw = await generateGeminiContent(prompt, CORE_SYSTEM_INSTRUCTION);
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject || `Quick question regarding ${params.business_name}`,
      body: parsed.body || raw.trim(),
      primary_offer: offer,
    };
  } catch (err) {
    return {
      subject: `Collaboration inquiry for ${params.business_name}`,
      body: raw.trim(),
      primary_offer: offer,
    };
  }
}

export async function suggestNextAction(context: {
  business_name: string;
  status: string;
  days_since_last_interaction: number;
  last_interaction_content?: string | null;
  deal_stage?: string | null;
}): Promise<{ suggested_tactic: string; due_in_days: number; reasoning: string }> {
  const prompt = `
Given this client/lead situation, suggest the single next best action for the solo business owner:
- Business: ${context.business_name}
- Current Status: ${context.status}
- Deal Stage: ${context.deal_stage || "None"}
- Days since last interaction: ${context.days_since_last_interaction}
- Last Interaction Note: ${context.last_interaction_content || "None recorded"}

Return ONLY a JSON object:
{
  "suggested_tactic": "Short, specific tactical instruction (e.g. 'Value-based follow-up sharing a relevant quick audit', 'Send proposal review reminder', 'Confirm kickoff call schedule')",
  "due_in_days": 1,
  "reasoning": "1 sentence explanation of why this step is optimal right now."
}
`;

  const raw = await generateGeminiContent(prompt, CORE_SYSTEM_INSTRUCTION);
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return {
      suggested_tactic: "Check in with lead regarding current requirements.",
      due_in_days: 2,
      reasoning: "Standard cadence check based on current status.",
    };
  }
}

export async function draftProposalContent(params: {
  business_name: string;
  niche_industry?: string | null;
  services: Array<{ name: string; description?: string; price: number }>;
}): Promise<{ scope: string; deliverables: string; timeline: string; terms: string }> {
  const prompt = `
Draft the core sections of a formal client proposal:
- Client: ${params.business_name}
- Industry: ${params.niche_industry || "Service Business"}
- Selected Services: ${JSON.stringify(params.services)}

Return ONLY a JSON object:
{
  "scope": "Clear, professional paragraph describing the scope of work based on selected services.",
  "deliverables": "Bullet-point formatted list of exact tangible deliverables.",
  "timeline": "Estimated realistic timeline and milestone breakdown (e.g., 2-4 weeks).",
  "terms": "Standard solo-business terms (e.g. 50% upfront deposit upon invoice, balance upon completion, 2 revision rounds included)."
}
`;

  const raw = await generateGeminiContent(prompt, CORE_SYSTEM_INSTRUCTION);
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return {
      scope: `Comprehensive delivery of services for ${params.business_name}.`,
      deliverables: params.services.map((s) => `• ${s.name}`).join("\n"),
      timeline: "Standard 2 to 3 weeks turnaround.",
      terms: "Payment upon invoice receipt. Revisions within 14 days.",
    };
  }
}

export async function answerCopilotQuery(params: {
  business_brain: any;
  user_query: string;
}): Promise<GenerateResult> {
  const queryLower = params.user_query.toLowerCase();
  const requiresSearch =
    queryLower.includes("search") ||
    queryLower.includes("online") ||
    queryLower.includes("website") ||
    queryLower.includes("find out") ||
    queryLower.includes("worth") ||
    queryLower.includes("google") ||
    queryLower.includes("reviews") ||
    queryLower.includes("competitors") ||
    queryLower.includes("social");

  const prompt = `
CURRENT "BUSINESS BRAIN" CONTEXT:
${JSON.stringify(params.business_brain, null, 2)}

USER QUESTION:
"${params.user_query}"

INSTRUCTIONS:
1. If the question asks for external public information (e.g., searching online for this business, website content, market presence, reviews), utilize live search grounding to provide accurate, up-to-date public findings with citations.
2. If the question is about internal priorities ("What should I do next?", "Show unpaid invoices"), answer using the Business Brain records.
3. Be concise, structured, and helpful. Never fabricate metrics or numbers not supported by facts or live search data.
`;

  return await generateCopilotWithSearch(prompt, CORE_SYSTEM_INSTRUCTION, requiresSearch);
}
