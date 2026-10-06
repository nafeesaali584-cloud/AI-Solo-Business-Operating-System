import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Settings (daily target quota)
    const settings = (await db.settings.findUnique({ where: { id: "default" } })) || {
      daily_target_quota: 3,
    };

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2. New Targets (is_today_target = true OR planned_for <= todayEnd and unfinished)
    const targets = await db.lead.findMany({
      where: {
        OR: [
          { is_today_target: true },
          {
            planned_for: { lte: todayEnd },
            status: { in: ["Imported", "Qualified", "Target Today"] },
          },
        ],
      },
      select: {
        id: true,
        business_name: true,
        niche_industry: true,
        city_country: true,
        status: true,
        updated_at: true,
        planned_for: true,
      },
    });

    // 3. Follow-ups Due (Plain date query: next_follow_up_at <= todayEnd)
    const dueFollowUpLeads = await db.lead.findMany({
      where: {
        next_follow_up_at: { lte: todayEnd },
        status: { notIn: ["Won", "Lost"] },
      },
      select: {
        id: true,
        business_name: true,
        next_follow_up_at: true,
        follow_up_count: true,
        reply_status: true,
        status: true,
      },
      orderBy: { next_follow_up_at: "asc" },
      take: 10,
    });

    const followUpTasks = await db.task.findMany({
      where: {
        bucket: "Follow-up",
        status: "Open",
      },
      orderBy: { due_date: "asc" },
      take: 10,
    });

    const followUps = [
      ...dueFollowUpLeads.map((l) => ({
        id: `lead-followup-${l.id}`,
        title: `Follow up with ${l.business_name} (Touchpoint ${(l.follow_up_count || 0) + 1}/4)`,
        due_date: l.next_follow_up_at,
        related_id: l.id,
        related_type: "Lead",
        status: "Open",
        bucket: "Follow-up",
        reply_status: l.reply_status,
      })),
      ...followUpTasks,
    ];

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

    const quotaMax = Math.max(1, settings.daily_target_quota || 3);
    const currentTargets = targets.length;
    const isOverQuota = currentTargets > quotaMax;
    const overCount = Math.max(0, currentTargets - quotaMax);

    return NextResponse.json({
      success: true,
      quota: {
        current: currentTargets,
        max: quotaMax,
        is_over_quota: isOverQuota,
        over_count: overCount,
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
