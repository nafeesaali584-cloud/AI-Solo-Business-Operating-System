import { NextRequest, NextResponse } from "next/server";
import { answerCopilotQuery } from "@/lib/ai/prompts";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_query, business_brain } = body;

    if (!user_query) {
      return NextResponse.json({ error: "user_query is required" }, { status: 400 });
    }

    // Enrich business_brain with relevant real DB aggregates if needed
    let enrichedBrain = { ...business_brain };

    if (enrichedBrain.active_screen_type === "dashboard") {
      const targetCount = await db.lead.count({ where: { is_today_target: true } });
      const pendingApprovals = await db.proposal.count({ where: { status: "Draft" } });
      const unpaidInvoices = await db.invoice.count({ where: { status: { in: ["Sent", "Pending", "Overdue"] } } });
      const overdueTasks = await db.task.count({ where: { status: "Overdue" } });

      enrichedBrain.system_metrics = {
        targets_today_count: targetCount,
        pending_proposal_approvals: pendingApprovals,
        unpaid_invoices_count: unpaidInvoices,
        overdue_tasks_count: overdueTasks,
      };
    } else if (enrichedBrain.active_entity_id && enrichedBrain.active_screen_type === "lead") {
      const fullLead = await db.lead.findUnique({
        where: { id: enrichedBrain.active_entity_id },
        include: {
          contacts: true,
          interactions: { orderBy: { created_at: "desc" }, take: 5 },
          deals: true,
        },
      });
      if (fullLead) {
        enrichedBrain.lead_record = {
          name: fullLead.business_name,
          industry: fullLead.niche_industry,
          website: fullLead.website,
          phone: fullLead.phone,
          status: fullLead.status,
          is_today_target: fullLead.is_today_target,
          recent_interactions: fullLead.interactions.map((i) => ({
            date: i.created_at,
            channel: i.channel,
            direction: i.direction,
            confirmed_sent: i.confirmed_sent,
            content: i.content.slice(0, 150),
          })),
        };
      }
    }

    const reply = await answerCopilotQuery({
      business_brain: enrichedBrain,
      user_query,
    });

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("Error handling Copilot query:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process Copilot query" },
      { status: 500 }
    );
  }
}
