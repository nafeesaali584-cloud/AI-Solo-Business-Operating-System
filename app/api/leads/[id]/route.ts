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

    // Get documents associated with this lead
    const documents = await db.document.findMany({
      where: {
        OR: [
          { related_id: lead.id },
          ...(lead.converted_client_id ? [{ related_id: lead.converted_client_id }] : []),
        ],
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      lead,
      open_tasks: openTasks,
      documents,
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
      reactivate_lead,
      reactivate_reason,
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
      follow_up_count,
      customer_behavior,
    } = body;

    // Check quota if is_today_target is being enabled
    if (is_today_target === true) {
      const activeTargetsCount = await db.lead.count({
        where: { is_today_target: true, id: { not: params.id } },
      });
      const settings = (await db.settings.findUnique({ where: { id: "default" } })) || {
        daily_target_quota: 3,
      };
      const effectiveQuota = Math.max(1, settings.daily_target_quota || 3);

      if (activeTargetsCount >= effectiveQuota) {
        return NextResponse.json(
          {
            error: `Daily target cap reached (${effectiveQuota}). Remove another target first.`,
            current: activeTargetsCount,
            max: effectiveQuota,
          },
          { status: 409 }
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

    // Handle Reactivate Lost Lead action
    if (reactivate_lead === true) {
      const reason = String(reactivate_reason || "").trim();
      if (!reason) {
        return NextResponse.json(
          { error: "A mandatory reactivation reason is required to reactivate a lost lead." },
          { status: 400 }
        );
      }

      // Reset lead status to Qualified, follow_up_count to 0, customer_behavior to null
      updateData.status = "Qualified";
      updateData.follow_up_count = 0;
      updateData.customer_behavior = null;

      // Add a timeline marker interaction (preserving all past interactions and research)
      await db.interaction.create({
        data: {
          lead_id: params.id,
          channel: "Reactivation",
          direction: "Internal",
          content: `Reactivated on ${new Date().toLocaleDateString()} — Reason: ${reason}`,
          confirmed_sent: true,
          ai_generated: false,
        },
      });
    } else if (status !== undefined) {
      // FIX 7: Validate status transitions server-side
      const currentLead = await db.lead.findUnique({
        where: { id: params.id },
        include: {
          interactions: true,
          deals: true,
          proposals: true,
        },
      });

      if (!currentLead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      const linkedClient = currentLead.converted_client_id
        ? await db.client.findUnique({
            where: { id: currentLead.converted_client_id },
            include: { proposals: true, invoices: true },
          })
        : null;

      if (status !== currentLead.status) {
        if (currentLead.status === "Lost") {
          return NextResponse.json(
            { error: "Invalid status transition: Lead is in 'Lost' status. Reactivate the lead with a mandatory reason to change status." },
            { status: 409 }
          );
        }

        if (status === "Qualified") {
          if (!["Imported", "Target Today"].includes(currentLead.status)) {
            return NextResponse.json(
              { error: `Invalid status transition: Cannot transition from '${currentLead.status}' to 'Qualified'.` },
              { status: 409 }
            );
          }
        } else if (status === "Target Today") {
          if (currentLead.status !== "Qualified") {
            return NextResponse.json(
              { error: `Invalid status transition: Only 'Qualified' leads can transition to 'Target Today'.` },
              { status: 409 }
            );
          }
        } else if (status === "Contacted") {
          const hasSent = currentLead.interactions.some((i) => i.confirmed_sent);
          if (!hasSent) {
            return NextResponse.json(
              { error: "Invalid status transition: Transition to 'Contacted' requires a confirmed sent interaction (Gate 1)." },
              { status: 409 }
            );
          }
        } else if (status === "Replied") {
          if (!["Contacted", "Target Today", "Qualified"].includes(currentLead.status)) {
            return NextResponse.json(
              { error: `Invalid status transition: Cannot transition from '${currentLead.status}' to 'Replied'.` },
              { status: 409 }
            );
          }
          const hasIncoming = currentLead.interactions.some((i) => i.direction === "Incoming");
          if (!hasIncoming) {
            return NextResponse.json(
              { error: "Invalid status transition: Transition to 'Replied' requires an incoming prospect interaction." },
              { status: 409 }
            );
          }
        } else if (status === "Booking") {
          if (!["Replied", "Contacted"].includes(currentLead.status)) {
            return NextResponse.json(
              { error: `Invalid status transition: Cannot transition from '${currentLead.status}' to 'Booking'.` },
              { status: 409 }
            );
          }
          const hasBooking =
            currentLead.deals.some((d) => d.stage === "Booking") ||
            currentLead.interactions.some((i) => i.channel === "Call" || i.content.toLowerCase().includes("call"));
          if (!hasBooking) {
            return NextResponse.json(
              { error: "Invalid status transition: Transition to 'Booking' requires a scheduled call or booking record." },
              { status: 409 }
            );
          }
        } else if (status === "Proposal") {
          if (!["Booking", "Replied", "Contacted"].includes(currentLead.status)) {
            return NextResponse.json(
              { error: `Invalid status transition: Cannot transition from '${currentLead.status}' to 'Proposal'.` },
              { status: 409 }
            );
          }
          const hasProposal =
            currentLead.proposals.length > 0 || (linkedClient && linkedClient.proposals.length > 0);
          if (!hasProposal) {
            return NextResponse.json(
              { error: "Invalid status transition: Transition to 'Proposal' requires an active proposal record." },
              { status: 409 }
            );
          }
        } else if (status === "Won") {
          if (currentLead.status !== "Proposal") {
            return NextResponse.json(
              { error: `Invalid status transition: Cannot transition directly from '${currentLead.status}' to 'Won'.` },
              { status: 409 }
            );
          }
          const hasPaidInvoice =
            linkedClient &&
            linkedClient.invoices.some((inv) => inv.status === "Paid" || inv.paid_confirmed_at !== null);
          if (!hasPaidInvoice) {
            return NextResponse.json(
              { error: "Invalid status transition: Transition to 'Won' requires a paid invoice (Gate 5 cleared)." },
              { status: 409 }
            );
          }
        } else if (status !== "Lost") {
          return NextResponse.json(
            { error: `Invalid status transition: Unknown status '${status}'.` },
            { status: 409 }
          );
        }
      }

      updateData.status = status;
    }
    if (is_today_target !== undefined) updateData.is_today_target = is_today_target;
    // Track intentionally cleared fields to distinguish "never set" from "explicitly removed by user"
    const existingLead = await db.lead.findUnique({
      where: { id: params.id },
      select: { cleared_fields: true },
    });

    let clearedFields: string[] = Array.isArray(existingLead?.cleared_fields)
      ? [...(existingLead!.cleared_fields as string[])]
      : [];

    if (business_name !== undefined) updateData.business_name = business_name;
    if (niche_industry !== undefined) updateData.niche_industry = niche_industry;
    if (city_country !== undefined) updateData.city_country = city_country;
    
    if (phone !== undefined) {
      const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
      if (trimmedPhone === "") {
        if (!clearedFields.includes("phone")) clearedFields.push("phone");
        updateData.phone = null;
      } else {
        clearedFields = clearedFields.filter((f) => f !== "phone");
        updateData.phone = trimmedPhone;
      }
    }

    if (email !== undefined) {
      const trimmedEmail = typeof email === "string" ? email.trim() : "";
      if (trimmedEmail === "") {
        if (!clearedFields.includes("email")) clearedFields.push("email");
        updateData.email = null;
      } else {
        clearedFields = clearedFields.filter((f) => f !== "email");
        updateData.email = trimmedEmail;
      }
    }

    updateData.cleared_fields = clearedFields;

    if (website !== undefined) updateData.website = website;
    if (rating !== undefined) updateData.rating = rating;
    if (review_count !== undefined) updateData.review_count = review_count;
    if (key_services !== undefined) updateData.key_services = key_services;
    if (follow_up_count !== undefined) updateData.follow_up_count = Number(follow_up_count);
    if (customer_behavior !== undefined) updateData.customer_behavior = customer_behavior;

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
