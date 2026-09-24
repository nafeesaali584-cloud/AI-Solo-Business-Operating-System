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
Analyze this actual incoming customer reply to a B2B service outreach and classify it into sales behavior categories:

CUSTOMER REPLY TEXT:
"${reply_text}"

TARGET BUSINESS: "${lead.business_name}"
OFFER: "${lead.primary_offer || "Digital services"}"

Classify into EXACTLY one of these behavior categories:
1. "warm_interested": Customer wants more details, pricing, agreed to chat/call, or showed genuine interest.
2. "replied_hesitant": Customer responded with hesitation or objection (e.g. price/budget concern, too busy, timing bad, already has provider, skeptical).
3. "seen_no_reply": Customer acknowledged casually, sent a reaction/ok/emoji without commitment, or read without answering.
4. "no_reply_not_seen": Customer requested to check back next quarter or deferred indefinitely.
5. "final_follow_up": Customer said "no thank you", "not interested", "remove me", or clearly declined.

Return ONLY a valid JSON object matching this schema:
{
  "behavior": "warm_interested | replied_hesitant | seen_no_reply | no_reply_not_seen | final_follow_up",
  "recommended_stage": 1,
  "confidence": "High | Medium | Low",
  "detected_objection": "Extracted objection or hesitation in 1 concise phrase, or null if none",
  "reasoning": "1 sentence explanation of why this category was selected",
  "recommended_next_step": "1 sentence recommendation on what to do next"
}
`;

      const raw = await generateGeminiContent(
        prompt,
        "You are an expert sales psychologist and conversation classifier. Return only valid JSON."
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
            confidence: "Medium",
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
          confirmed_sent: true,
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
