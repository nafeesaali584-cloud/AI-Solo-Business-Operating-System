import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCanonicalSeed } from "@/lib/canonical-seed";

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
    // Auto-seed canonical records if not yet present
    await ensureCanonicalSeed();

    const uuidQ = q.replace(/^(prop|prp|inv)[-_#]?/i, "").trim();

    // 1. Leads
    const leads = await db.lead.findMany({
      where: {
        OR: [
          { business_name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { niche_industry: { contains: q, mode: "insensitive" } },
          { city_country: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
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
      take: 6,
    });

    // 3. Proposals
    const proposalOrClauses: any[] = [
      { client: { business_name: { contains: q, mode: "insensitive" } } },
      { lead: { business_name: { contains: q, mode: "insensitive" } } },
      { scope: { contains: q, mode: "insensitive" } },
      { deliverables: { contains: q, mode: "insensitive" } },
    ];
    if (uuidQ && uuidQ.length >= 2) {
      proposalOrClauses.push({ id: { contains: uuidQ, mode: "insensitive" } });
    }

    const proposals = await db.proposal.findMany({
      where: {
        OR: proposalOrClauses,
      },
      include: { client: true, lead: true },
      take: 6,
    });

    // 4. Invoices
    const invoiceOrClauses: any[] = [
      { invoice_number: { contains: q, mode: "insensitive" } },
      { client: { business_name: { contains: q, mode: "insensitive" } } },
    ];
    if (uuidQ && uuidQ.length >= 2) {
      invoiceOrClauses.push({ id: { contains: uuidQ, mode: "insensitive" } });
    }

    const invoices = await db.invoice.findMany({
      where: {
        OR: invoiceOrClauses,
      },
      include: { client: true },
      take: 6,
    });

    // 5. Interactions
    const interactions = await db.interaction.findMany({
      where: {
        content: { contains: q, mode: "insensitive" },
      },
      include: { client: true, lead: true },
      take: 6,
    });

    return NextResponse.json({
      leads: leads.map((l) => ({
        id: l.id,
        business_name: l.business_name,
        status: l.status,
        city_country: l.city_country,
        url: `/leads/${l.id}`,
      })),
      clients: clients.map((c) => ({
        id: c.id,
        business_name: c.business_name,
        stage: c.stage,
        payment_status: c.payment_status,
        url: `/clients/${c.id}`,
      })),
      proposals: proposals.map((p) => {
        const clientName = p.client?.business_name || p.lead?.business_name || "Prospect";
        const propNum = `PROP-${p.id.slice(0, 8).toUpperCase()}`;
        return {
          id: p.id,
          proposal_number: propNum,
          client_name: clientName,
          title: `Proposal for ${clientName}`,
          status: p.status,
          total_investment: Number(p.total_investment),
          url: `/proposals/builder?id=${p.id}`,
        };
      }),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: inv.client?.business_name || "Client",
        title: `${inv.invoice_number} — ${inv.client?.business_name || "Client"}`,
        amount: Number(inv.amount),
        status: inv.status,
        url: `/invoices/builder?id=${inv.id}`,
      })),
      interactions: interactions.map((i) => ({
        id: i.id,
        channel: i.channel,
        content: i.content,
        target_name: i.client?.business_name || i.lead?.business_name || "Contact",
        created_at: i.created_at,
        url: i.client_id ? `/clients/${i.client_id}` : i.lead_id ? `/leads/${i.lead_id}` : "#",
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

