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

    // FIX 9: Pure partial update semantics — only modify fields explicitly provided in the request body
    const updateData: any = {};
    if ("daily_target_quota" in body && body.daily_target_quota !== undefined) {
      updateData.daily_target_quota = Math.max(1, Number(body.daily_target_quota) || 3);
    }
    if ("follow_up_cadence_days" in body && body.follow_up_cadence_days !== undefined) {
      updateData.follow_up_cadence_days = Number(body.follow_up_cadence_days);
    }
    if ("tone_preference" in body && body.tone_preference !== undefined) {
      updateData.tone_preference = body.tone_preference;
    }
    if ("theme_preference" in body && body.theme_preference !== undefined) {
      updateData.theme_preference = body.theme_preference;
    }
    if ("message_templates" in body && body.message_templates !== undefined) {
      updateData.message_templates = body.message_templates;
    }
    if ("proposal_templates" in body && body.proposal_templates !== undefined) {
      updateData.proposal_templates = body.proposal_templates;
    }
    if ("invoice_branding" in body && body.invoice_branding !== undefined) {
      updateData.invoice_branding = body.invoice_branding;
    }

    const updated = await db.settings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        daily_target_quota: Math.max(1, Number(body.daily_target_quota) || 3),
        follow_up_cadence_days: Number(body.follow_up_cadence_days) || 4,
        tone_preference: body.tone_preference || "Professional, concise, and value-oriented",
        theme_preference: body.theme_preference || "dark",
        message_templates: body.message_templates || null,
        proposal_templates: body.proposal_templates || null,
        invoice_branding: body.invoice_branding || null,
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
