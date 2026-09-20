import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clients = await db.client.findMany({
      include: {
        proposals: { orderBy: { created_at: "desc" }, take: 1 },
        invoices: { orderBy: { created_at: "desc" }, take: 1 },
        onboarding: true,
      },
      orderBy: { last_activity: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (error: any) {
    console.error("Clients list fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_name, primary_contact, email, phone, stage, payment_status } = body;

    if (!business_name) {
      return NextResponse.json({ error: "business_name is required" }, { status: 400 });
    }

    const client = await db.client.create({
      data: {
        business_name,
        primary_contact: primary_contact || null,
        email: email || null,
        phone: phone || null,
        stage: stage || "Proposal",
        payment_status: payment_status || "Pending",
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error("Client creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create client" },
      { status: 500 }
    );
  }
}

