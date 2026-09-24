import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contacts = await db.contact.findMany({
      where: { lead_id: params.id },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ success: true, contacts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name = "Direct Contact", role = "Outreach Contact", phone, email, whatsapp } = body;

    const lead = await db.lead.findUnique({
      where: { id: params.id },
      include: { contacts: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Check if an existing contact with this phone or email already exists to prevent duplicates
    const cleanPhone = phone ? phone.trim().replace(/[^0-9]/g, "") : null;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    const existing = lead.contacts.find((c) => {
      const cPhone = c.phone ? c.phone.replace(/[^0-9]/g, "") : null;
      const cWa = c.whatsapp ? c.whatsapp.replace(/[^0-9]/g, "") : null;
      const cEmail = c.email ? c.email.toLowerCase() : null;

      if (cleanPhone && (cPhone === cleanPhone || cWa === cleanPhone)) return true;
      if (cleanEmail && cEmail === cleanEmail) return true;
      return false;
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Contact already recorded on file.",
        contact: existing,
      });
    }

    // Create a new separate contact linked to this lead, NEVER touching lead.phone, lead.email, or source_csv_row
    const newContact = await db.contact.create({
      data: {
        lead_id: lead.id,
        name,
        role,
        phone: phone ? phone.trim() : null,
        whatsapp: whatsapp ? whatsapp.trim() : (phone ? phone.trim() : null),
        email: email ? email.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "New contact person linked to lead without modifying immutable imported facts.",
      contact: newContact,
    });
  } catch (error: any) {
    console.error("Create contact error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record contact" },
      { status: 500 }
    );
  }
}
