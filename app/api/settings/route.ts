import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await db.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await db.settings.create({
        data: {
          id: "default",
          daily_target_quota: 3,
          follow_up_cadence_days: 4,
          tone_preference: "Professional, concise, and value-oriented",
          message_templates: {
            whatsapp: "Hi {{name}}, noticed your work in {{industry}}. We help businesses streamline operations and convert more leads. Would you be open to a quick 5-min intro?",
            email: "Subject: Quick question regarding {{business_name}}\n\nHi {{name}},\n\nI was looking at {{business_name}} and noticed an opportunity to improve lead conversion. Are you available for a brief chat this week?",
          },
          proposal_templates: {
            default_terms: "50% advance upon invoice issuance. 50% upon final delivery. Standard 2 rounds of review included.",
          },
          invoice_branding: {
            currency: "USD",
            tax_rate: 0,
            payment_terms: "Due upon receipt",
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
      hard_gates_audit: [
        { gate: 1, name: "Message Dispatch Confirmation", status: "ENFORCED", configurable: false },
        { gate: 2, name: "Proposal Explicit Approval", status: "ENFORCED", configurable: false },
        { gate: 3, name: "Proposal Sent Confirmation", status: "ENFORCED", configurable: false },
        { gate: 4, name: "Invoice Sent Confirmation", status: "ENFORCED", configurable: false },
        { gate: 5, name: "Payment Received Confirmation", status: "ENFORCED", configurable: false },
      ],
    });
  } catch (error: any) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      daily_target_quota,
      follow_up_cadence_days,
      tone_preference,
      theme_preference,
      message_templates,
      proposal_templates,
      invoice_branding,
    } = body;

    const updated = await db.settings.upsert({
      where: { id: "default" },
      update: {
        daily_target_quota: daily_target_quota !== undefined ? Number(daily_target_quota) : undefined,
        follow_up_cadence_days:
          follow_up_cadence_days !== undefined ? Number(follow_up_cadence_days) : undefined,
        tone_preference: tone_preference !== undefined ? tone_preference : undefined,
        theme_preference: theme_preference !== undefined ? theme_preference : undefined,
        message_templates: message_templates !== undefined ? message_templates : undefined,
        proposal_templates: proposal_templates !== undefined ? proposal_templates : undefined,
        invoice_branding: invoice_branding !== undefined ? invoice_branding : undefined,
      },
      create: {
        id: "default",
        daily_target_quota: Number(daily_target_quota) || 3,
        follow_up_cadence_days: Number(follow_up_cadence_days) || 4,
        tone_preference: tone_preference || "Professional, concise, and value-oriented",
        theme_preference: theme_preference || "dark",
        message_templates,
        proposal_templates,
        invoice_branding,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
