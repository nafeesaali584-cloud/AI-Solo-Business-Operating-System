import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { confirmation, mode = "purge_data" } = body;

    // Strict safety check: confirmation must be exactly "RESET"
    if (confirmation !== "RESET") {
      return NextResponse.json(
        {
          error:
            'Confirmation keyword mismatch. You must explicitly pass confirmation: "RESET" to purge data.',
        },
        { status: 400 }
      );
    }

    // Sequentially purge data respecting foreign key relationships
    await db.onboarding.deleteMany({});
    await db.task.deleteMany({});
    await db.interaction.deleteMany({});
    await db.invoice.deleteMany({});
    await db.proposal.deleteMany({});
    await db.deal.deleteMany({});
    await db.contact.deleteMany({});
    await db.document.deleteMany({});
    await db.client.deleteMany({});
    await db.lead.deleteMany({});
    await db.csvMappingTemplate.deleteMany({});

    // If factory reset, also restore default system settings
    if (mode === "factory_reset") {
      await db.settings.upsert({
        where: { id: "default" },
        update: {
          daily_target_quota: 3,
          follow_up_cadence_days: 4,
          tone_preference: "Professional, concise, and value-oriented",
          theme_preference: "dark",
        },
        create: {
          id: "default",
          daily_target_quota: 3,
          follow_up_cadence_days: 4,
          tone_preference: "Professional, concise, and value-oriented",
          theme_preference: "dark",
        },
      });
    }

    return NextResponse.json({
      success: true,
      mode,
      message:
        mode === "factory_reset"
          ? "FACTORY RESET COMPLETE: All data purged and system settings restored to default."
          : "SYSTEM PURGE COMPLETE: All leads, clients, and operational pipeline records wiped successfully.",
    });
  } catch (error: any) {
    console.error("System reset error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute system reset" },
      { status: 500 }
    );
  }
}
