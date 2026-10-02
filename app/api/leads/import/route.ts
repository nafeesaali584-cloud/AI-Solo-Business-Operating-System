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
    const seenInBatch = new Set<string>();

    const normalizeField = (val: any): string | null => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim();
      if (!s || s === "null" || s === "undefined" || s.toLowerCase() === "n/a" || s === "-" || s === "–" || s === "—") {
        return null;
      }
      return s;
    };

    for (const row of rows) {
      const rawBusinessName = row.business_name || row.BusinessName || row.Company || row.name || "Untitled Lead";
      const business_name = normalizeField(rawBusinessName) || "Untitled Lead";
      const website = normalizeField(row.website || row.Website);
      const phone = normalizeField(row.phone || row.Phone);
      const email = normalizeField(row.email || row.Email);
      const city_country = normalizeField(row.city || row.City || row.location || row.city_country);
      const niche_industry = normalizeField(
        row.niche ||
        row.industry ||
        row.Niche ||
        row.Industry ||
        row.specialization ||
        row.Specialization ||
        row.key_services ||
        row.services
      );

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

      const key_services = normalizeField(row.key_services || row.services);
      const address = normalizeField(row.address || row.Address || row.street);

      // FIX 12: In-batch duplicate check
      const batchKey = (website || phone || email || business_name).toLowerCase();
      if (seenInBatch.has(batchKey)) {
        duplicates.push({
          business_name,
          existing_id: "in_batch_duplicate",
          reason: "Duplicate row found within the same imported batch.",
        });
        continue;
      }
      seenInBatch.add(batchKey);

      // FIX 12: Database duplicate check by website, phone, email, OR business_name
      const orConditions: any[] = [];
      if (website) orConditions.push({ website: { equals: website, mode: "insensitive" } });
      if (phone) orConditions.push({ phone: { equals: phone } });
      if (email) orConditions.push({ email: { equals: email, mode: "insensitive" } });
      if (business_name && business_name !== "Untitled Lead") {
        orConditions.push({ business_name: { equals: business_name, mode: "insensitive" } });
      }

      let existing = null;
      if (orConditions.length > 0) {
        existing = await db.lead.findFirst({
          where: { OR: orConditions },
        });
      }

      if (existing) {
        duplicates.push({
          business_name,
          existing_id: existing.id,
          reason: website || phone || email
            ? "Matching website, phone, or email already exists."
            : "Exact business name already exists in database.",
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
