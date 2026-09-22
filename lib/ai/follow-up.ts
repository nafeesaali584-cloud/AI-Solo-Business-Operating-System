import { generateGeminiContent } from "./gemini";

export type CustomerBehaviorType =
  | "no_reply_not_seen"
  | "seen_no_reply"
  | "replied_hesitant"
  | "final_follow_up"
  | "warm_interested";

export interface FollowUpTacticConfig {
  behavior: CustomerBehaviorType;
  tactic_name: string;
  psychology_goal: string;
  default_instructions: string;
}

export const FOLLOW_UP_TACTIC_FRAMEWORK: Record<CustomerBehaviorType, FollowUpTacticConfig> = {
  no_reply_not_seen: {
    behavior: "no_reply_not_seen",
    tactic_name: "Value-add Nudge",
    psychology_goal: "Zero pressure, offering a fresh tangible piece of insight or asset.",
    default_instructions: "Share a quick, concrete insight or mini-observation about their market or competitors. Keep it light, casual, and helpful without asking for a big commitment.",
  },
  seen_no_reply: {
    behavior: "seen_no_reply",
    tactic_name: "Social Proof / Specificity",
    psychology_goal: "Gentle FOMO using a concise, relevant client result or localized benchmark.",
    default_instructions: "Reference a recent, relatable outcome for a similar business in their region or niche. Be specific with timeline or result metrics, creating natural curiosity without being pushy.",
  },
  replied_hesitant: {
    behavior: "replied_hesitant",
    tactic_name: "Objection Handling & Micro-Concession",
    psychology_goal: "De-risk their commitment by acknowledging budget/timing and offering a smaller starter step.",
    default_instructions: "Directly validate their hesitation. Offer a low-friction micro-step (e.g. a free 5-minute video teardown, a mini-audit, or a scaled-down phase-1 starter package) to remove risk.",
  },
  final_follow_up: {
    behavior: "final_follow_up",
    tactic_name: "Scarcity & Graceful Exit",
    psychology_goal: "Closure with dignity, polite scarcity, leaving the door permanently open.",
    default_instructions: "Politely state you are finalizing project slots for the upcoming weeks. Acknowledge this might not be top priority right now, and let them know where to reach you whenever the timing is right. Zero guilt, complete respect.",
  },
  warm_interested: {
    behavior: "warm_interested",
    tactic_name: "Direct WhatsApp Call Booking",
    psychology_goal: "Strike while iron is hot — immediate direct bridge to a quick discovery call.",
    default_instructions: "Suggest moving to a brief 10-minute discovery chat on WhatsApp or a Google Meet at a specific day/time.",
  },
};

export interface FollowUpGenerationResult {
  is_warm_call_to_action: boolean;
  stage_number: number;
  tactic_name: string;
  psychology_goal: string;
  suggested_action: string;
  draft: {
    subject: string;
    body: string;
  };
}

/**
 * Generate behavior-based follow-up draft adhering to sales psychology and max 4 follow-up guardrail
 */
export async function generateBehaviorFollowUp(params: {
  business_name: string;
  contact_name?: string | null;
  channel: "WhatsApp" | "Email";
  behavior: CustomerBehaviorType;
  current_follow_up_count: number;
  primary_offer?: string | null;
  last_message_summary?: string | null;
  custom_hesitation_notes?: string | null;
}): Promise<FollowUpGenerationResult> {
  const currentCount = params.current_follow_up_count || 0;
  const nextStageNumber = Math.min(currentCount + 1, 4);

  // If customer is Warm/Interested, bypass follow-up stages immediately
  if (params.behavior === "warm_interested") {
    const prompt = `
Draft a brief, professional call booking response for a warm lead who expressed interest.
- Target Business: ${params.business_name}
- Contact Person: ${params.contact_name || "Business Owner"}
- Channel: ${params.channel}
- Primary Offer: ${params.primary_offer || "Website Redesign"}

Goal: Propose a quick, casual 10-15 minute intro chat. Give two specific options (e.g. "tomorrow at 2 PM or Thursday morning"). Keep friction virtually zero.
Return ONLY valid JSON:
{
  "subject": "Quick intro chat regarding ${params.business_name}",
  "body": "Exact text"
}
`;
    const raw = await generateGeminiContent(prompt);
    try {
      const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
      return {
        is_warm_call_to_action: true,
        stage_number: nextStageNumber,
        tactic_name: "Direct WhatsApp Call Booking",
        psychology_goal: "Fast-path to scheduled discovery call",
        suggested_action: "Suggest: Ask to book a call on WhatsApp",
        draft: parsed,
      };
    } catch {
      return {
        is_warm_call_to_action: true,
        stage_number: nextStageNumber,
        tactic_name: "Direct WhatsApp Call Booking",
        psychology_goal: "Fast-path to scheduled discovery call",
        suggested_action: "Suggest: Ask to book a call on WhatsApp",
        draft: {
          subject: `Brief chat for ${params.business_name}`,
          body: `Great to hear from you! Would you be open to a quick 10-minute intro chat on WhatsApp this week? I have time tomorrow at 2 PM or Thursday morning if either works for you.`,
        },
      };
    }
  }

  // Follow-up behavior configuration
  const tacticConfig = FOLLOW_UP_TACTIC_FRAMEWORK[params.behavior] || FOLLOW_UP_TACTIC_FRAMEWORK.no_reply_not_seen;

  const prompt = `
Draft a sales-psychology grounded follow-up message.
- Target Business: ${params.business_name}
- Contact Person: ${params.contact_name || "Business Owner"}
- Channel: ${params.channel}
- Follow-up Sequence Number: ${nextStageNumber} of 4 (MAX 4 allowed)
- Customer Observed Behavior: "${params.behavior}"
- TACTIC TO USE: "${tacticConfig.tactic_name}"
- Psychology Objective: "${tacticConfig.psychology_goal}"
- Guidelines: ${tacticConfig.default_instructions}
${params.primary_offer ? `- Single Service Offered: "${params.primary_offer}"` : ""}
${params.custom_hesitation_notes ? `- Customer's Stated Hesitation: "${params.custom_hesitation_notes}"` : ""}
${params.last_message_summary ? `- Prior Outreach Summary: "${params.last_message_summary}"` : ""}

CRITICAL RULES:
1. Stay 100% true to the assigned tactic and psychology objective.
2. If WhatsApp: 3 to 4 sentences maximum, friendly, easy to read on mobile.
3. If Email: Clear subject line referencing prior touchpoint, brief body.
4. If this is Stage 4 (final follow-up), ensure graceful exit with zero guilt and polite scarcity.

Return ONLY valid JSON:
{
  "subject": "Follow-up subject line",
  "body": "Exact follow-up message text"
}
`;

  const raw = await generateGeminiContent(prompt);
  try {
    const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    return {
      is_warm_call_to_action: false,
      stage_number: nextStageNumber,
      tactic_name: tacticConfig.tactic_name,
      psychology_goal: tacticConfig.psychology_goal,
      suggested_action: `Send Follow-up ${nextStageNumber}/4 (${tacticConfig.tactic_name})`,
      draft: parsed,
    };
  } catch {
    return {
      is_warm_call_to_action: false,
      stage_number: nextStageNumber,
      tactic_name: tacticConfig.tactic_name,
      psychology_goal: tacticConfig.psychology_goal,
      suggested_action: `Send Follow-up ${nextStageNumber}/4 (${tacticConfig.tactic_name})`,
      draft: {
        subject: `Follow-up regarding ${params.business_name}`,
        body: raw.trim(),
      },
    };
  }
}
