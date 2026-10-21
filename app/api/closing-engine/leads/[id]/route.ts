import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { stage, status, demoLink, notes, logAction, logMessage, channel } = body;

    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (stage !== undefined) updateData.pipeline_stage = parseInt(stage);
    if (status !== undefined) updateData.status = status;
    if (demoLink !== undefined) updateData.demo_link = demoLink;
    if (notes !== undefined) updateData.primary_observation = notes;

    const updated = await db.lead.update({
      where: { id },
      data: updateData
    });

    // Optionally log an interaction
    if (logAction || logMessage) {
      await db.interaction.create({
        data: {
          lead_id: id,
          channel: channel || "WhatsApp",
          direction: "outbound",
          content: logMessage || logAction,
          confirmed_sent: true,
          sent_confirmed_at: new Date()
        }
      });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error("Closing engine leads PATCH error:", error);
    return NextResponse.json({ error: error.message || "Failed to update lead" }, { status: 500 });
  }
}
