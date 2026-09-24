import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const niche = searchParams.get("niche");
    const city = searchParams.get("city");
    const targetsOnly = searchParams.get("targets_only") === "true";
    const noReplyDays = searchParams.get("no_reply_days");

    const whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    if (niche && niche !== "ALL") {
      whereClause.niche_industry = { contains: niche, mode: "insensitive" };
    }
    if (city && city !== "ALL") {
      whereClause.city_country = { contains: city, mode: "insensitive" };
    }
    if (targetsOnly) {
      whereClause.is_today_target = true;
    }
    if (noReplyDays) {
      const days = parseInt(noReplyDays, 10);
      if (!isNaN(days)) {
        const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        whereClause.status = "Contacted";
        whereClause.updated_at = { lte: threshold };
      }
    }

    const leads = await db.lead.findMany({
      where: whereClause,
      select: {
        id: true,
        business_name: true,
        website: true,
        phone: true,
        email: true,
        city_country: true,
        niche_industry: true,
        key_services: true,
        rating: true,
        review_count: true,
        address: true,
        status: true,
        is_today_target: true,
        qualification_tier: true,
        primary_offer: true,
        primary_observation: true,
        created_at: true,
        updated_at: true,
        contacts: {
          select: { id: true, name: true, phone: true, email: true },
        },
        interactions: {
          select: {
            id: true,
            created_at: true,
            channel: true,
            confirmed_sent: true,
            direction: true,
          },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error: any) {
    console.error("Leads fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      business_name,
      website,
      phone,
      email,
      city_country,
      niche_industry,
      source_csv_row,
    } = body;

    if (!business_name) {
      return NextResponse.json({ error: "business_name is required" }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        business_name,
        website: website || null,
        phone: phone || null,
        email: email || null,
        city_country: city_country || null,
        niche_industry: niche_industry || null,
        source_csv_row: source_csv_row || { manual: true },
        status: "Imported",
        is_today_target: false,
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("Lead creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}
