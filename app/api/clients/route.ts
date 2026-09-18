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
