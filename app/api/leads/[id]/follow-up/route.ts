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
      content,
      draft_message,
      behavior,
      reply_status,
      channel = "WhatsApp",
    } = body;

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        contacts: true,
        interactions: {
          orderBy: { created_at: "desc" },
          take: 3,
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Enforce 4-touchpoint follow-up cap server-side
    if ((lead.follow_up_count || 0) >= 4) {
      return NextResponse.json(
        {
          error: "Follow-up cap of 4 touchpoints reached for this lead.",
          max_reached: true,
        },
        { status: 429 }
      );
    }

    const messageText = (content || draft_message || "").trim();

    // Map behavior to reply_status if legacy values passed
    let effectiveReplyStatus = reply_status || behavior || null;
    if (effectiveReplyStatus === "warm_interested") effectiveReplyStatus = "interested";
    else if (effectiveReplyStatus === "seen_no_reply" || effectiveReplyStatus === "no_reply_not_seen") effectiveReplyStatus = "no_reply";
    else if (effectiveReplyStatus === "replied_hesitant") effectiveReplyStatus = "not_now";
    else if (effectiveReplyStatus === "final_follow_up") effectiveReplyStatus = "not_interested";

    // Create draft interaction record with confirmed_sent = false (GATE 1)
    let interactionId = null;
    if (messageText) {
      const interaction = await db.interaction.create({
        data: {
          lead_id: lead.id,
          channel,
          direction: "Outgoing",
          content: messageText,
          confirmed_sent: false,
        },
      });
      interactionId = interaction.id;
    }

    // Update reply_status and status
    const updateData: any = {};
    if (effectiveReplyStatus) {
      updateData.reply_status = effectiveReplyStatus;
      if (effectiveReplyStatus === "interested") {
        updateData.status = "Booking";
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.lead.update({
        where: { id: lead.id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      interaction_id: interactionId,
      follow_up_count: lead.follow_up_count,
      follow_up: {
        draft: {
          subject: `Follow-up: ${lead.business_name}`,
          body: messageText,
        },
        tactic: {
          name: "Manual Outreach",
          framework: "Direct human follow-up",
          goal: "Reconnect with prospect",
        },
      },
    });
  } catch (error: any) {
    console.error("Follow-up error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process follow-up" },
      { status: 500 }
    );
  }
}
