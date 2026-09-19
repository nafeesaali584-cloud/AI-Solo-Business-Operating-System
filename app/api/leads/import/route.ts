import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateLeadSnapshot } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rows, generate_ai_snapshots = true } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided for import" }, { status: 400 });
    }

    const createdLeads = [];
    const duplicates = [];

    for (const row of rows) {
      const business_name = row.business_name || row.BusinessName || row.Company || row.name || "Untitled Lead";
      const website = row.website || row.Website || null;
      const phone = row.phone || row.Phone || null;
      const email = row.email || row.Email || null;
      const city_country = row.city || row.City || row.location || row.city_country || null;
      const niche_industry =
        row.niche ||
        row.industry ||
        row.Niche ||
        row.Industry ||
        row.specialization ||
        row.Specialization ||
        row.key_services ||
        row.services ||
        null;

      // Extract rating, review count, key services, address
      let rating: number | null = null;
      if (row.rating !== undefined && row.rating !== null && row.rating !== "") {
        const parsed = parseFloat(String(row.rating).replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) rating = parsed;
      }

      let review_count: number | null = null;
      if (row.review_count !== undefined && row.review_count !== null && row.review_count !== "") {
        const parsed = parseInt(String(row.review_count).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed)) review_count = parsed;
      }

      const key_services = row.key_services || row.services || null;
      const address = row.address || row.Address || row.street || null;

      // Duplicate Check: check if lead already exists by website, phone, or email
      let existing = null;
      if (website || phone || email) {
        existing = await db.lead.findFirst({
          where: {
            OR: [
              website ? { website: { equals: website, mode: "insensitive" } } : {},
              phone ? { phone: { equals: phone } } : {},
              email ? { email: { equals: email, mode: "insensitive" } } : {},
            ],
          },
        });
      }

      if (existing) {
        duplicates.push({
          business_name,
          existing_id: existing.id,
          reason: "Matching website, phone, or email already exists.",
        });
        continue;
      }

      // Create new Lead record
      const lead = await db.lead.create({
        data: {
          business_name,
          website,
          phone,
          email,
          city_country,
          niche_industry,
          rating,
          review_count,
          key_services,
          address,
          source_csv_row: row.source_csv_row || row, // Immutable raw data
          status: "Imported",
          is_today_target: false,
        },
      });

      createdLeads.push(lead);
    }

    // Trigger background AI snapshot generation asynchronously (non-blocking for fast import)
    if (generate_ai_snapshots && createdLeads.length > 0) {
      (async () => {
        for (const lead of createdLeads) {
          try {
            const snapshot = await generateLeadSnapshot(lead);
            await db.lead.update({
              where: { id: lead.id },
              data: {
                ai_summary: snapshot.ai_summary,
                ai_opportunity: snapshot.ai_opportunity,
                ai_recommended_angle: snapshot.ai_recommended_angle,
              },
            });
          } catch (aiErr) {
            console.warn(`Background snapshot skipped for lead ${lead.id}:`, aiErr);
          }
        }
      })().catch(() => {});
    }

    return NextResponse.json({
      success: true,
      imported_count: createdLeads.length,
      duplicate_count: duplicates.length,
      duplicates,
      leads: createdLeads,
    });
  } catch (error: any) {
    console.error("CSV Import API error:", error);
    return NextResponse.json(
      { error: error.message || "CSV Import failed" },
      { status: 500 }
    );
  }
}
