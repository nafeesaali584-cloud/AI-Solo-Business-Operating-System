import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { CustomerBehaviorType } from "@/lib/ai/follow-up";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      action = "save", // "classify" | "save"
      reply_text = "",
      channel = "WhatsApp",
      behavior,
      stage,
      custom_objection,
    } = body;

    const lead = await db.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // ACTION: Classify customer reply text using Gemini
    if (action === "classify") {
      if (!reply_text.trim()) {
        return NextResponse.json(
          { error: "Reply text is required for AI classification" },
          { status: 400 }
        );
      }

      const prompt = `
You are an expert sales psychologist and conversation classifier for ClientPulse, a B2B sales operating system.
A solo service provider sent an outreach message to a prospective business client ("${lead.business_name}") offering "${lead.primary_offer || "Digital Services"}".
The user has logged the following incoming message as the prospect's reply:

INCOMING MESSAGE TEXT:
"${reply_text}"

TARGET BUSINESS BEING CONTACTED: "${lead.business_name}"
OFFER PITCHED: "${lead.primary_offer || "Digital Services"}"

TASK:
Classify this message into EXACTLY one of these 5 sales behavior categories:

1. "warm_interested": The prospect explicitly expressed interest, asked for pricing/portfolio, requested a call/meeting, or asked how to proceed with the offer.
   - Example: "Yes, how much do you charge for this?" -> warm_interested, confidence: "High"
   - Example: "Sounds good, can you call me tomorrow at 3pm?" -> warm_interested, confidence: "High"

2. "replied_hesitant": The prospect answered with an objection, hesitation, skepticism, or delay.
   - Example: "We already have an in-house developer handling this." -> replied_hesitant, confidence: "High", objection: "Already has provider"
   - Example: "Budget is really tight right now, not sure." -> replied_hesitant, confidence: "High", objection: "Budget constraints"
   - Example: "Who are you and where did you get my number?" -> replied_hesitant, confidence: "High", objection: "Skeptical of source"

3. "seen_no_reply": Casual receipt acknowledgment, single emoji, brief neutral reaction without answering or engaging.
   - Example: "ok", "noted", "👍", "k" -> seen_no_reply, confidence: "High"

4. "no_reply_not_seen": Deferral to a distant date or automated out-of-office.
   - Example: "I'm out of office until next month" or "Ping me next quarter" -> no_reply_not_seen, confidence: "High"

5. "final_follow_up": Definite rejection or opt-out request.
   - Example: "Not interested, please remove me." or "Stop texting this number." -> final_follow_up, confidence: "High"

CRITICAL AMBIGUITY & QUALITY RULES:
1. AMBIGUOUS / GARBLED / INTERNAL NOTE DETECTION:
   If the incoming text is NOT a clear customer reply to a service pitch (for example, if it looks like an operator note, a search query, a fragmented test, or a user intention like "i just want to get this leads", "test 123", "leads list"):
   - NEVER classify it as "warm_interested"!
   - You MUST set "confidence": "Low".
   - Set "behavior": "replied_hesitant" or "seen_no_reply".
   - In "reasoning", explain explicitly: "The message appears to be an internal user note or ambiguous fragment rather than an authentic prospect reply to your outreach."
   - In "recommended_next_step", say: "Review message authenticity or manually select the appropriate behavior stage."
2. DO NOT assume interest from words like "leads", "want", "get" unless the prospect is explicitly saying they want to hire/buy the service from the sender.

Return ONLY a valid JSON object matching this schema (no markdown fences, no extra text):
{
  "behavior": "warm_interested | replied_hesitant | seen_no_reply | no_reply_not_seen | final_follow_up",
  "confidence": "High | Medium | Low",
  "detected_objection": "Extracted objection/hesitation in 1 concise phrase, or null if none",
  "reasoning": "1-2 sentence explanation of why this category and confidence were selected",
  "recommended_next_step": "1 sentence recommendation on what to do next"
}
`;

      const raw = await generateGeminiContent(
        prompt,
        "You are an expert sales psychologist and conversation classifier. Return only valid JSON without code blocks or markdown."
      );

      try {
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Map recommended stage
        let calculatedStage = 1;
        if (parsed.behavior === "seen_no_reply") calculatedStage = 2;
        else if (parsed.behavior === "replied_hesitant") calculatedStage = 3;
        else if (parsed.behavior === "final_follow_up") calculatedStage = 4;
        else if (parsed.behavior === "warm_interested") calculatedStage = lead.follow_up_count || 1;

        parsed.recommended_stage = calculatedStage;

        return NextResponse.json({
          success: true,
          classification: parsed,
        });
      } catch (parseErr) {
        return NextResponse.json({
          success: true,
          classification: {
            behavior: "replied_hesitant",
            recommended_stage: 3,
            confidence: "Low",
            detected_objection: reply_text.slice(0, 100),
            reasoning: "Classified as customer reply requiring objection handling.",
            recommended_next_step: "Address customer concern and lower friction with a micro-concession.",
          },
        });
      }
    }

    // ACTION: Save customer reply and advance stage
    if (action === "save") {
      const selectedBehavior: CustomerBehaviorType =
        (behavior as CustomerBehaviorType) || "replied_hesitant";

      // Allow explicit stage override or fallback to current/calculated
      const targetStage =
        typeof stage === "number" && stage >= 0 && stage <= 4
          ? stage
          : selectedBehavior === "warm_interested"
          ? lead.follow_up_count
          : selectedBehavior === "seen_no_reply"
          ? 2
          : selectedBehavior === "replied_hesitant"
          ? 3
          : selectedBehavior === "final_follow_up"
          ? 4
          : 1;

      // Determine new lead status
      let newStatus = lead.status;
      if (selectedBehavior === "warm_interested") {
        newStatus = "Booking";
      } else if (lead.status === "Imported" || lead.status === "Qualified" || lead.status === "Target Today") {
        newStatus = "Replied";
      }

      // Record incoming interaction in history
      const savedInteraction = await db.interaction.create({
        data: {
          lead_id: lead.id,
          channel: channel || "WhatsApp",
          direction: "Incoming",
          content:
            reply_text.trim() ||
            `Customer interaction logged: ${selectedBehavior.replace(/_/g, " ")}${
              custom_objection ? ` (Notes: ${custom_objection})` : ""
            }`,
          ai_generated: false,
          confirmed_sent: false, // Inbound customer logs are not sent outreach messages; Gate 1 applies exclusively to outgoing messages
        },
      });

      // Update lead record with customer behavior & stage
      const updatedLead = await db.lead.update({
        where: { id: lead.id },
        data: {
          customer_behavior: selectedBehavior,
          follow_up_count: targetStage,
          status: newStatus,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Customer reply logged. Follow-up engine advanced to Stage ${targetStage}/4 (${selectedBehavior}).`,
        lead: updatedLead,
        interaction: savedInteraction,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Log reply error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process customer reply" },
      { status: 500 }
    );
  }
}
