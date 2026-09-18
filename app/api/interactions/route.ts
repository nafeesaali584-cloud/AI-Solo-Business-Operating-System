import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id, client_id, content, channel = "Note" } = body;

    if (!lead_id && !client_id) {
      return NextResponse.json(
        { error: "lead_id or client_id must be provided" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
    }

    // Manual save action by the user
    const interaction = await db.interaction.create({
      data: {
        lead_id: lead_id || null,
        client_id: client_id || null,
        channel,
        direction: "Incoming",
        content,
        ai_generated: false,
        confirmed_sent: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Note saved to record timeline successfully.",
      interaction,
    });
  } catch (error: any) {
    console.error("Save note error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save note" },
      { status: 500 }
    );
  }
}
