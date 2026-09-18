import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim() || query.length < 2) {
      return NextResponse.json({
        leads: [],
        clients: [],
        proposals: [],
        invoices: [],
        interactions: [],
      });
    }

    const q = query.trim();

    // 1. Leads
    const leads = await db.lead.findMany({
      where: {
        OR: [
          { business_name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { niche_industry: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    // 2. Clients
    const clients = await db.client.findMany({
      where: {
        OR: [
          { business_name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { primary_contact: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    // 3. Proposals
    const proposals = await db.proposal.findMany({
      where: {
        OR: [
          { client: { business_name: { contains: q, mode: "insensitive" } } },
          { lead: { business_name: { contains: q, mode: "insensitive" } } },
          { scope: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { client: true, lead: true },
      take: 5,
    });

    // 4. Invoices
    const invoices = await db.invoice.findMany({
      where: {
        OR: [
          { invoice_number: { contains: q, mode: "insensitive" } },
          { client: { business_name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { client: true },
      take: 5,
    });

    // 5. Interactions
    const interactions = await db.interaction.findMany({
      where: {
        content: { contains: q, mode: "insensitive" },
      },
      include: { client: true, lead: true },
      take: 5,
    });

    return NextResponse.json({
      leads,
      clients,
      proposals: proposals.map((p) => ({
        id: p.id,
        client_name: p.client?.business_name || p.lead?.business_name || "Prospect",
        status: p.status,
        total_investment: Number(p.total_investment),
      })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: inv.client.business_name,
        amount: Number(inv.amount),
        status: inv.status,
      })),
      interactions: interactions.map((i) => ({
        id: i.id,
        channel: i.channel,
        content: i.content,
        target_name: i.client?.business_name || i.lead?.business_name || "Contact",
        created_at: i.created_at,
      })),
    });
  } catch (error: any) {
    console.error("Global search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute search" },
      { status: 500 }
    );
  }
}
