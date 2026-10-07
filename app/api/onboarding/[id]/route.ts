import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const onboarding = await db.onboarding.findFirst({
      where: {
        OR: [{ id }, { client_id: id }],
      },
      include: { client: true },
    });

    if (!onboarding) {
      return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, onboarding });
  } catch (error: any) {
    console.error("Onboarding fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch onboarding" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { checklist, status, complete_onboarding } = body;

    const onboarding = await db.onboarding.findFirst({
      where: {
        OR: [{ id }, { client_id: id }],
      },
    });

    if (!onboarding) {
      return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (checklist !== undefined) updateData.checklist = checklist;
    if (status !== undefined) updateData.status = status;

    if (complete_onboarding) {
      const currentList: any[] = Array.isArray(checklist)
        ? checklist
        : Array.isArray(onboarding.checklist)
        ? (onboarding.checklist as any[])
        : [];
      const pendingItems = currentList.filter((i) => i.status !== "done");

      if (pendingItems.length > 0 && !body.override) {
        return NextResponse.json(
          {
            error: `Cannot complete onboarding: ${pendingItems.length} checklist items are still pending. Complete all items or confirm with explicit override.`,
            pending_count: pendingItems.length,
          },
          { status: 409 }
        );
      }

      updateData.status = "Completed";
      updateData.completed_at = new Date();

      // Client stage transitions to "Active"
      await db.client.update({
        where: { id: onboarding.client_id },
        data: {
          stage: "Active",
          last_activity: new Date(),
        },
      });
    }

    const updated = await db.onboarding.update({
      where: { id: onboarding.id },
      data: updateData,
      include: { client: true },
    });

    return NextResponse.json({ success: true, onboarding: updated });
  } catch (error: any) {
    console.error("Onboarding update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update onboarding checklist" },
      { status: 500 }
    );
  }
}
