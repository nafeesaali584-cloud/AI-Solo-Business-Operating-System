import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Settings (daily target quota)
    const settings = (await db.settings.findUnique({ where: { id: "default" } })) || {
      daily_target_quota: 3,
    };

    // 2. New Targets (is_today_target = true)
    const targets = await db.lead.findMany({
      where: { is_today_target: true },
      select: {
        id: true,
        business_name: true,
        niche_industry: true,
        city_country: true,
        status: true,
        updated_at: true,
      },
    });

    // 3. Follow-ups Due (Tasks where bucket = Follow-up and status = Open)
    const followUps = await db.task.findMany({
      where: {
        bucket: "Follow-up",
        status: "Open",
      },
      orderBy: { due_date: "asc" },
      take: 10,
    });

    // 4. Waiting for You (Proposals awaiting approval, Invoices awaiting send/payment confirmation)
    const pendingProposals = await db.proposal.findMany({
      where: { status: "Draft" },
      include: { client: true, lead: true },
      orderBy: { created_at: "desc" },
    });

    const pendingInvoices = await db.invoice.findMany({
      where: { status: { in: ["Draft", "Sent", "Pending"] } },
      include: { client: true },
      orderBy: { created_at: "desc" },
    });

    // 5. Overdue Tasks
    const now = new Date();
    const overdueTasks = await db.task.findMany({
      where: {
        status: "Open",
        due_date: { lt: now },
      },
      orderBy: { due_date: "asc" },
    });

    // 6. Onboarding Pending items
    const activeOnboardings = await db.onboarding.findMany({
      where: { status: "In Progress" },
      include: { client: true },
    });

    let pendingChecklistCount = 0;
    activeOnboardings.forEach((onb) => {
      const list = onb.checklist as Array<{ item: string; status: string }>;
      if (Array.isArray(list)) {
        pendingChecklistCount += list.filter((i) => i.status === "pending").length;
      }
    });

    return NextResponse.json({
      success: true,
      quota: {
        current: targets.length,
        max: settings.daily_target_quota,
        targets,
      },
      follow_ups: followUps,
      waiting_for_you: {
        proposals: pendingProposals,
        invoices: pendingInvoices,
        total: pendingProposals.length + pendingInvoices.length,
      },
      overdue_tasks: overdueTasks,
      onboarding: {
        active_count: activeOnboardings.length,
        pending_checklist_items: pendingChecklistCount,
        records: activeOnboardings,
      },
    });
  } catch (error: any) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
