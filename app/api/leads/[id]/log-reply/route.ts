import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      action = "save", // "classify" | "save"
      reply_text = "",
      channel = "WhatsApp",
      behavior,
      reply_status,
      stage,
      custom_objection,
    } = body;

    const lead = await db.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Heuristic assistant (NO AI / No Gemini API call)
    if (action === "classify") {
      const lower = reply_text.toLowerCase().trim();
      let suggestedBehavior = "not_now";
      let suggestedStage = 3;
      let reasoning = "Manual review recommended.";

      if (
        lower.includes("interested") ||
        lower.includes("price") ||
        lower.includes("cost") ||
        lower.includes("call") ||
        lower.includes("yes") ||
        lower.includes("send details")
      ) {
        suggestedBehavior = "interested";
        suggestedStage = lead.follow_up_count || 1;
        reasoning = "Prospect indicated interest or requested pricing/meeting.";
      } else if (
        lower.includes("not interested") ||
        lower.includes("stop") ||
        lower.includes("unsubscribe") ||
        lower.includes("remove")
      ) {
        suggestedBehavior = "not_interested";
        suggestedStage = 4;
        reasoning = "Prospect declined further outreach.";
      } else if (
        lower.includes("busy") ||
        lower.includes("later") ||
        lower.includes("next month") ||
        lower.includes("have someone")
      ) {
        suggestedBehavior = "not_now";
        suggestedStage = 3;
        reasoning = "Prospect indicated timing or provider constraint.";
      } else {
        suggestedBehavior = "no_reply";
        suggestedStage = 2;
        reasoning = "Neutral acknowledgment or ambiguous response.";
      }

      return NextResponse.json({
        success: true,
        classification: {
          behavior: suggestedBehavior,
          recommended_stage: suggestedStage,
          confidence: "Manual",
          detected_objection: null,
          reasoning,
          recommended_next_step: "Select appropriate reply status and save.",
        },
      });
    }

    // ACTION: Save customer reply and advance stage
    if (action === "save") {
      let rawStatus = reply_status || behavior || "not_now";
      // Normalize legacy tokens if passed
      if (rawStatus === "warm_interested") rawStatus = "interested";
      else if (rawStatus === "seen_no_reply" || rawStatus === "no_reply_not_seen") rawStatus = "no_reply";
      else if (rawStatus === "replied_hesitant") rawStatus = "not_now";
      else if (rawStatus === "final_follow_up") rawStatus = "not_interested";

      // Determine new lead status
      let newStatus = lead.status;
      if (rawStatus === "interested") {
        newStatus = "Booking";
      } else if (
        lead.status === "Imported" ||
        lead.status === "Qualified" ||
        lead.status === "Target Today" ||
        lead.status === "Contacted"
      ) {
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
            `Customer reply logged: ${rawStatus.replace(/_/g, " ")}${
              custom_objection ? ` (Notes: ${custom_objection})` : ""
            }`,
          confirmed_sent: false,
        },
      });

      // Update lead record with reply_status and status, plus optional next_follow_up_at
      const rawNextFollowUp = body.next_follow_up_at ?? body.nextFollowUpAt;
      const leadUpdateData: any = {
        reply_status: rawStatus,
        status: newStatus,
      };
      if (rawNextFollowUp !== undefined) {
        leadUpdateData.next_follow_up_at = rawNextFollowUp ? new Date(rawNextFollowUp) : null;
      }

      const updatedLead = await db.lead.update({
        where: { id: lead.id },
        data: leadUpdateData,
      });

      return NextResponse.json({
        success: true,
        message: `Customer reply logged. Status updated to ${rawStatus.replace(/_/g, " ")}.`,
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
