import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await db.lead.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        interactions: { orderBy: { created_at: "desc" } },
        deals: true,
        proposals: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Get open tasks related to this lead
    const openTasks = await db.task.findMany({
      where: {
        related_id: lead.id,
        status: "Open",
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      lead,
      open_tasks: openTasks,
    });
  } catch (error: any) {
    console.error("Lead detail error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch lead" },
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
    const {
      status,
      is_today_target,
      notes,
      convert_to_client,
      business_name,
      niche_industry,
      city_country,
      phone,
      email,
      website,
      rating,
      review_count,
      key_services,
      call_notes,
    } = body;

    // Check quota if is_today_target is being enabled
    if (is_today_target === true) {
      const activeTargetsCount = await db.lead.count({
        where: { is_today_target: true, id: { not: params.id } },
      });
      const settings = (await db.settings.findUnique({ where: { id: "default" } })) || {
        daily_target_quota: 3,
      };

      if (activeTargetsCount >= settings.daily_target_quota) {
        return NextResponse.json(
          {
            error: `QUOTA LIMIT: You cannot have more than ${settings.daily_target_quota} active targets today. Please complete or unmark one first.`,
          },
          { status: 400 }
        );
      }
    }

    // If convert to client action requested
    if (convert_to_client) {
      const lead = await db.lead.findUnique({
        where: { id: params.id },
        include: { contacts: true },
      });

      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      // Create client record in Workspace B
      const client = await db.client.create({
        data: {
          lead_id: lead.id,
          business_name: lead.business_name,
          primary_contact: lead.contacts[0]?.name || null,
          email: lead.email || lead.contacts[0]?.email || null,
          phone: lead.phone || lead.contacts[0]?.phone || null,
          stage: "Proposal",
          payment_status: "Pending",
        },
      });

      // Update lead status to Proposal and record converted_client_id
      const updatedLead = await db.lead.update({
        where: { id: lead.id },
        data: {
          status: "Proposal",
          converted_client_id: client.id,
          is_today_target: false,
        },
      });

      return NextResponse.json({
        success: true,
        lead: updatedLead,
        client,
      });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (is_today_target !== undefined) updateData.is_today_target = is_today_target;
    if (business_name !== undefined) updateData.business_name = business_name;
    if (niche_industry !== undefined) updateData.niche_industry = niche_industry;
    if (city_country !== undefined) updateData.city_country = city_country;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (rating !== undefined) updateData.rating = rating;
    if (review_count !== undefined) updateData.review_count = review_count;
    if (key_services !== undefined) updateData.key_services = key_services;

    let createdInteraction = null;
    if (call_notes !== undefined || (status === "Booking" && !body.skip_interaction)) {
      const trimmed = String(call_notes || "").trim();
      const content = trimmed ? `Scheduled Call: ${trimmed}` : "Discovery / Intro Call Scheduled";
      createdInteraction = await db.interaction.create({
        data: {
          lead_id: params.id,
          channel: "Call",
          direction: "Outgoing",
          content,
          confirmed_sent: true,
          ai_generated: false,
        },
      });
    }

    const updatedLead = await db.lead.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      ...(createdInteraction ? { interaction: createdInteraction } : {}),
    });
  } catch (error: any) {
    console.error("Lead update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete associated tasks
    await db.task.deleteMany({
      where: { related_id: params.id },
    });

    await db.lead.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: "Lead deleted successfully." });
  } catch (error: any) {
    console.error("Lead delete error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
