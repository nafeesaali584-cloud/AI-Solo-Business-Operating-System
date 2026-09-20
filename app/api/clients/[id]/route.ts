import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await db.client.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        interactions: { orderBy: { created_at: "asc" } },
        proposals: { orderBy: { created_at: "desc" } },
        invoices: { orderBy: { created_at: "desc" } },
        onboarding: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Build complete chronological timeline events
    const timelineEvents: Array<{
      id: string;
      title: string;
      description?: string;
      timestamp: Date;
      category: "lead" | "message" | "proposal" | "invoice" | "payment" | "onboarding";
      badge?: string;
    }> = [];

    // 1. Creation event
    timelineEvents.push({
      id: `created-${client.id}`,
      title: "Client record established",
      description: `Client created in conversion engine.`,
      timestamp: client.created_at,
      category: "lead",
    });

    // 2. Interactions
    client.interactions.forEach((int) => {
      timelineEvents.push({
        id: int.id,
        title: `${int.direction} ${int.channel} interaction`,
        description: int.content,
        timestamp: int.created_at,
        category: "message",
        badge: int.confirmed_sent ? "Sent Confirmed (Gate 1)" : "Draft / Unconfirmed",
      });
    });

    // 3. Proposals
    client.proposals.forEach((p) => {
      timelineEvents.push({
        id: p.id,
        title: `Proposal ${p.status}`,
        description: `Total Investment: $${p.total_investment}`,
        timestamp: p.created_at,
        category: "proposal",
        badge: p.status,
      });
      if (p.approved_at) {
        timelineEvents.push({
          id: `appr-${p.id}`,
          title: "Proposal Approved",
          description: "Gate 2 cleared: Formal user approval registered.",
          timestamp: p.approved_at,
          category: "proposal",
          badge: "Gate 2 Cleared",
        });
      }
      if (p.sent_confirmed_at) {
        timelineEvents.push({
          id: `sent-${p.id}`,
          title: "Proposal Marked as Sent",
          description: "Gate 3 cleared: Manual delivery confirmation.",
          timestamp: p.sent_confirmed_at,
          category: "proposal",
          badge: "Gate 3 Cleared",
        });
      }
    });

    // 4. Invoices
    client.invoices.forEach((inv) => {
      timelineEvents.push({
        id: inv.id,
        title: `Invoice Generated (${inv.invoice_number})`,
        description: `Amount: $${inv.amount} | Due: ${new Date(inv.due_date).toLocaleDateString()}`,
        timestamp: inv.created_at,
        category: "invoice",
        badge: inv.status,
      });
      if (inv.sent_confirmed_at) {
        timelineEvents.push({
          id: `inv-sent-${inv.id}`,
          title: `Invoice ${inv.invoice_number} Sent`,
          description: "Gate 4 cleared: Invoice dispatch confirmed by user.",
          timestamp: inv.sent_confirmed_at,
          category: "invoice",
          badge: "Gate 4 Cleared",
        });
      }
      if (inv.paid_confirmed_at) {
        timelineEvents.push({
          id: `paid-${inv.id}`,
          title: `Payment Received for ${inv.invoice_number}`,
          description: "Gate 5 cleared: Payment received manually confirmed.",
          timestamp: inv.paid_confirmed_at,
          category: "payment",
          badge: "Gate 5 Cleared",
        });
      }
    });

    // 5. Onboarding
    if (client.onboarding) {
      timelineEvents.push({
        id: client.onboarding.id,
        title: "Onboarding Workflow Initiated",
        description: "Automated trigger from Gate 5 payment confirmation.",
        timestamp: client.onboarding.started_at,
        category: "onboarding",
        badge: client.onboarding.status,
      });
    }

    // Sort timeline chronologically
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Documents linked
    const documents = await db.document.findMany({
      where: {
        related_id: client.id,
      },
    });

    return NextResponse.json({
      success: true,
      client,
      timeline: timelineEvents,
      documents,
    });
  } catch (error: any) {
    console.error("Client detail fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch client details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { business_name, primary_contact, email, phone, stage, payment_status } = body;

    const updateData: any = {};
    if (business_name !== undefined) updateData.business_name = business_name;
    if (primary_contact !== undefined) updateData.primary_contact = primary_contact;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (stage !== undefined) updateData.stage = stage;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    updateData.last_activity = new Date();

    const client = await db.client.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error("Client update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await db.client.findUnique({
      where: { id: params.id },
      include: { onboarding: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Clean up associated tasks
    await db.task.deleteMany({
      where: {
        OR: [
          { related_id: client.id },
          ...(client.onboarding ? [{ related_id: client.onboarding.id }] : []),
        ],
      },
    });

    // Delete client (Prisma cascades to proposals, invoices, onboarding, contacts, interactions)
    await db.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Client and associated records deleted." });
  } catch (error: any) {
    console.error("Client delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete client" },
      { status: 500 }
    );
  }
}
