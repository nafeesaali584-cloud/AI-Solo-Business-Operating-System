import { generateGeminiContent } from "./gemini";

const CORE_SYSTEM_INSTRUCTION = `
You are the AI Engine inside "ClientPulse", an operating system for solo service businesses.
You operate strictly under these non-negotiable rules:
1. FACT vs INFERENCE vs UNKNOWN:
   - Fact: Taken verbatim from verified data.
   - Inference: Interpretation built ONLY from facts. Never invent numbers, statistics, revenue figures, or details not present.
   - Unknown: If a detail is not in the source data, you must explicitly output "Not available" — NEVER guess or hallucinate.
2. BOUNDARY RULE:
   - You are purely assistive (researcher, analyzer, writer, suggester).
   - You NEVER execute actions, send messages, change payment statuses, or alter database records directly.
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
}): Promise<{ subject: string; body: string }> {
  const prompt = `
Draft an outreach message for a solo service provider contacting this prospect.
- Target Business: ${params.business_name}
- Industry: ${params.niche_industry || "Not available"}
- Contact Person: ${params.contact_name || "Business Owner"}
- Channel: ${params.channel} (If WhatsApp: concise, conversational, no subject line needed. If Email: clear, compelling subject line and crisp body)
- Tone: ${params.tone || "Professional, concise, and value-oriented"}
- Custom Guidance: ${params.custom_instruction || "Focus on solving operational or growth challenges."}

Remember: Never invent fake prior relationships or fabricate client statistics. If something is unknown, keep it general to their stated domain.

Return ONLY a JSON object:
{
  "subject": "Email subject or WhatsApp topic",
  "body": "The drafted message content"
}
`;

  const raw = await generateGeminiContent(prompt, CORE_SYSTEM_INSTRUCTION);
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return {
      subject: `Collaboration inquiry for ${params.business_name}`,
      body: raw.trim(),
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
}): Promise<string> {
  const prompt = `
CURRENT "BUSINESS BRAIN" CONTEXT:
${JSON.stringify(params.business_brain, null, 2)}

USER QUESTION:
"${params.user_query}"

INSTRUCTIONS:
Answer the question directly, concisely, and helpfully using ONLY the data in the Business Brain.
If asked for actions ("What should I do next?"), suggest specific prioritized actions.
Never invent metrics, financial numbers, or dates not in the context. If missing, say "Not available in current records".
Do not claim you executed any action — remind the user they can click the appropriate button on screen.
`;

  return await generateGeminiContent(prompt, CORE_SYSTEM_INSTRUCTION);
}
