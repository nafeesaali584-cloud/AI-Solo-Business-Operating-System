import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await db.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { call_notes = "" } = body;

    const trimmedNotes = String(call_notes || "").trim();
    const interactionContent = trimmedNotes
      ? `Scheduled Call: ${trimmedNotes}`
      : "Discovery / Intro Call Scheduled";

    // 1. Create a persistent Interaction record linked to this lead
    // confirmed_sent: true because this is an explicit human action in the Book Call modal
    const interaction = await db.interaction.create({
      data: {
        lead_id: lead.id,
        channel: "Call",
        direction: "Outgoing",
        content: interactionContent,
        confirmed_sent: true,
        ai_generated: false,
      },
    });

    // 2. Update lead status to Booking
    const updatedLead = await db.lead.update({
      where: { id: lead.id },
      data: {
        status: "Booking",
      },
      include: {
        contacts: true,
        interactions: { orderBy: { created_at: "desc" } },
        deals: true,
        proposals: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Call booked successfully. Interaction logged to history.",
      interaction,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error("Book call error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to book call" },
      { status: 500 }
    );
  }
}
