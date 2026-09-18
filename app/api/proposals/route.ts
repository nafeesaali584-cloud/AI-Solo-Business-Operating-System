import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clientId = searchParams.get("client_id");
    const leadId = searchParams.get("lead_id");

    if (id) {
      const proposal = await db.proposal.findUnique({
        where: { id },
        include: { client: true, lead: true },
      });
      return NextResponse.json({ success: true, proposal });
    }

    const whereClause: any = {};
    if (clientId) whereClause.client_id = clientId;
    if (leadId) whereClause.lead_id = leadId;

    const proposals = await db.proposal.findMany({
      where: whereClause,
      include: { client: true, lead: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, proposals });
  } catch (error: any) {
    console.error("Proposal fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      client_id,
      lead_id,
      services,
      scope,
      deliverables,
      timeline,
      terms,
      total_investment,
    } = body;

    if (!client_id && !lead_id) {
      return NextResponse.json(
        { error: "Either client_id or lead_id must be provided" },
        { status: 400 }
      );
    }

    const proposal = await db.proposal.create({
      data: {
        client_id: client_id || null,
        lead_id: lead_id || null,
        services: services || [],
        scope: scope || null,
        deliverables: deliverables || null,
        timeline: timeline || null,
        terms: terms || null,
        total_investment: total_investment || 0,
        status: "Draft",
      },
      include: { client: true, lead: true },
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    console.error("Proposal create error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create proposal" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, services, scope, deliverables, timeline, terms, total_investment } =
      body;

    if (!id) {
      return NextResponse.json({ error: "Proposal id is required" }, { status: 400 });
    }

    // Safety checks: Mark Sent MUST be done via Gate 3 endpoint, not arbitrary status patch
    if (status === "Sent") {
      return NextResponse.json(
        { error: "GATE 3 VIOLATION: Proposal can only be marked as Sent via /api/gates/gate3" },
        { status: 403 }
      );
    }

    // Safety checks: Approve MUST be done via Gate 2 endpoint
    if (status === "Approved") {
      return NextResponse.json(
        { error: "GATE 2 VIOLATION: Proposal can only be approved via /api/gates/gate2" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status; // e.g. Accepted or Rejected
    if (services !== undefined) updateData.services = services;
    if (scope !== undefined) updateData.scope = scope;
    if (deliverables !== undefined) updateData.deliverables = deliverables;
    if (timeline !== undefined) updateData.timeline = timeline;
    if (terms !== undefined) updateData.terms = terms;
    if (total_investment !== undefined) updateData.total_investment = total_investment;

    const updated = await db.proposal.update({
      where: { id },
      data: updateData,
      include: { client: true, lead: true },
    });

    // If accepted, update client stage if tied to client
    if (status === "Accepted" && updated.client_id) {
      await db.client.update({
        where: { id: updated.client_id },
        data: { stage: "Invoice", last_activity: new Date() },
      });
    }

    return NextResponse.json({ success: true, proposal: updated });
  } catch (error: any) {
    console.error("Proposal update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update proposal" },
      { status: 500 }
    );
  }
}
