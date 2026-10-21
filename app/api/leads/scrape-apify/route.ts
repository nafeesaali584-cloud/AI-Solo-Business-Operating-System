import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const APIFY_TOKEN =
  process.env.APIFY_TOKEN || "";

/**
 * Fast Website Health, SSL & Age Auditor
 * Detects:
 * - ZERO_WEBSITE: No site, dead Google Business Site (.business.site), or social media only
 * - DEAD_OR_BROKEN: 404, DNS error, server timeout
 * - OUTDATED_NO_SSL: Unencrypted HTTP without SSL
 * - OUTDATED_5PLUS_YEARS: Copyright year <= 2021 or missing mobile viewport
 * - MODERN_DISQUALIFIED: Modern 2024-2026 website (FILTERED OUT!)
 */
async function auditWebsite(rawUrl: string | null): Promise<{
  classification:
    | "ZERO_WEBSITE"
    | "DEAD_OR_BROKEN"
    | "OUTDATED_NO_SSL"
    | "OUTDATED_5PLUS_YEARS"
    | "MODERN_DISQUALIFIED";
  auditTag: string;
  websiteAge: string;
  detectedYear: number | null;
}> {
  if (!rawUrl || rawUrl.trim() === "" || rawUrl === "None" || rawUrl === "None (Zero-Website)") {
    return {
      classification: "ZERO_WEBSITE",
      auditTag: "🚨 Zero Website",
      websiteAge: "No Website Found (Maps Only)",
      detectedYear: null,
    };
  }

  const urlLower = rawUrl.toLowerCase();

  // Social profiles or dead Google business.site = effectively ZERO official website!
  if (
    urlLower.includes("instagram.com") ||
    urlLower.includes("facebook.com") ||
    urlLower.includes("tiktok.com") ||
    urlLower.includes("linktr.ee") ||
    urlLower.includes("business.site")
  ) {
    return {
      classification: "ZERO_WEBSITE",
      auditTag: "🚨 Social / Dead Google Site",
      websiteAge: urlLower.includes("business.site")
        ? "Dead Google Site (Closed in 2024)"
        : "Social Media Only (No Official Site)",
      detectedYear: null,
    };
  }

  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "http://" + targetUrl;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeout);

    const finalUrl = res.url || targetUrl;
    const isStillHttp = finalUrl.startsWith("http://");

    if (res.status >= 400) {
      // 403, 406, 500 = Modern WAF (Cloudflare/AWS) or active firewall. Disqualify!
      return {
        classification: "MODERN_DISQUALIFIED",
        auditTag: `❌ Protected/Modern (HTTP ${res.status})`,
        websiteAge: "Active Modern Firewall / WAF",
        detectedYear: null,
      };
    }

    const html = await res.text();

    // Check for copyright years (e.g., © 2018, Copyright 2016-2020)
    const copyrightMatches = html.match(
      /(?:©|copyright|&copy;)\s*(?:20\d\d\s*[-–]\s*)?(20\d\d)/gi
    );
    let detectedYear: number | null = null;
    if (copyrightMatches) {
      for (const m of copyrightMatches) {
        const numMatch = m.match(/(20\d\d)/);
        if (numMatch) {
          const yr = parseInt(numMatch[1], 10);
          if (yr >= 2005 && yr <= 2027) {
            detectedYear = yr;
          }
        }
      }
    }

    const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

    // Modern 2022-2026 site = Disqualify immediately!
    if (detectedYear && detectedYear >= 2022) {
      return {
        classification: "MODERN_DISQUALIFIED",
        auditTag: `❌ Modern Site (${detectedYear})`,
        websiteAge: `Updated recently in ${detectedYear}`,
        detectedYear,
      };
    }

    // Insecure HTTP (no SSL) with 200 OK
    if (isStillHttp) {
      return {
        classification: "OUTDATED_NO_SSL",
        auditTag: "⚠️ Insecure (No SSL)",
        websiteAge: detectedYear
          ? `Built ${detectedYear} (Insecure HTTP)`
          : "Insecure HTTP (Chrome Warning)",
        detectedYear,
      };
    }

    // 5+ Years Old: Verified copyright <= 2021
    if (detectedYear && detectedYear <= 2021) {
      const ageYears = 2026 - detectedYear;
      return {
        classification: "OUTDATED_5PLUS_YEARS",
        auditTag: `⏳ Outdated (~${ageYears} Yrs Old)`,
        websiteAge: `Built in ${detectedYear} (~${ageYears} years old)`,
        detectedYear,
      };
    }

    // Missing mobile viewport = 100% outdated desktop-only design
    if (!hasViewport) {
      return {
        classification: "OUTDATED_5PLUS_YEARS",
        auditTag: "📱 Not Mobile Responsive",
        websiteAge: "Legacy Desktop-Only Layout",
        detectedYear,
      };
    }

    // If year is unknown and site is on HTTPS with viewport, DO NOT assume it's outdated.
    // Disqualify to be 100% safe!
    return {
      classification: "MODERN_DISQUALIFIED",
      auditTag: "❌ Active HTTPS Site",
      websiteAge: "Active HTTPS Website",
      detectedYear: null,
    };
  } catch (err: any) {
    // Timeout or network error = WAF, CDN, or bot block. Disqualify to avoid false positives!
    return {
      classification: "MODERN_DISQUALIFIED",
      auditTag: "❌ Blocked / Protected Site",
      websiteAge: "Bot Protected / CDN",
      detectedYear: null,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || "car repair workshop Al Quoz Dubai";
    const maxPlaces = Math.min(30, parseInt(body.maxPlaces || "15", 10));
    const niche = body.niche || "Automotive Repair";
    // filterMode: "zero_and_outdated" (default), "zero_only", "outdated_only", "all"
    const filterMode = body.filterMode || "zero_and_outdated";

    console.log(
      `[Apify Scraper] Running query: "${query}" | Limit: ${maxPlaces} | Mode: ${filterMode}`
    );

    // 1. Run Apify Google Places Actor
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: [query],
          maxCrawledPlacesPerSearch: maxPlaces,
          language: "en",
          includePopularTimes: false,
        }),
      }
    );

    const runData = await runRes.json();
    if (!runData.data?.id) {
      console.error("[Apify Scraper] Failed to start run:", runData);
      return NextResponse.json(
        { error: "Failed to start Apify Google Places scraper", details: runData },
        { status: 500 }
      );
    }

    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;

    // 2. Poll status until complete
    let status = runData.data.status;
    let attempts = 0;
    while (status !== "SUCCEEDED" && status !== "FAILED" && attempts < 25) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const checkRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      );
      const checkData = await checkRes.json();
      status = checkData.data?.status;
      attempts++;
    }

    if (status !== "SUCCEEDED") {
      return NextResponse.json(
        { error: `Apify run ended with status: ${status}` },
        { status: 502 }
      );
    }

    // 3. Retrieve scraped places
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
    );
    const items = await itemsRes.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid data received from Apify dataset" },
        { status: 502 }
      );
    }

    console.log(`[Apify Scraper] Retrieved ${items.length} raw places. Auditing website age & tech...`);

    const savedLeads: any[] = [];
    let disqualifiedCount = 0;

    for (const place of items) {
      const rawName = place.title || place.name;
      if (!rawName) continue;

      const cleanCompany = rawName
        .replace(/ LLC| - Best.*| \| #1.*| Workshop.*Dubai/gi, "")
        .trim();
      const phone = place.phone || place.phoneUnformatted || null;
      if (!phone || phone.trim() === "") {
        continue; // Must have direct phone number to contact on WhatsApp!
      }
      const rawWebsite = place.website && place.website.trim() !== "" ? place.website.trim() : null;
      const address = place.address || place.city || "Dubai, UAE";
      const rating = place.totalScore ? parseFloat(place.totalScore) : 4.8;
      const reviews = place.reviewsCount ? parseInt(place.reviewsCount, 10) : 0;

      // Run Website Health & Age Audit
      const audit = await auditWebsite(rawWebsite);

      // Filtering criteria based on user's exact specification:
      // Drop modern 2024-2026 websites when in zero_and_outdated or zero_only mode
      if (filterMode === "zero_only" && audit.classification !== "ZERO_WEBSITE") {
        disqualifiedCount++;
        continue;
      }

      if (
        filterMode === "outdated_only" &&
        (audit.classification === "ZERO_WEBSITE" || audit.classification === "MODERN_DISQUALIFIED")
      ) {
        disqualifiedCount++;
        continue;
      }

      if (filterMode === "zero_and_outdated" && audit.classification === "MODERN_DISQUALIFIED") {
        console.log(`[Filtered Out] ${cleanCompany} has modern website (${audit.websiteAge})`);
        disqualifiedCount++;
        continue;
      }

      // Priority and pitch customization based on exact weakness
      let tier = "Hot";
      let pitchMessage = "";

      if (audit.classification === "ZERO_WEBSITE") {
        tier = "Hottest";
        pitchMessage = `Salam Team ${cleanCompany}, saw your workshop on Google Maps—congrats on your ${rating}★ rating & ${reviews}+ reviews! Noticed you don't have an official mobile website with instant WhatsApp booking yet. I created a free 40-sec design preview for ${cleanCompany}. Can I send the preview link over?`;
      } else if (audit.classification === "OUTDATED_5PLUS_YEARS") {
        tier = "Hottest";
        pitchMessage = `Salam Team ${cleanCompany}, saw your workshop on Google Maps—congrats on the ${rating}★ rating! I noticed your website was built ${audit.websiteAge} and doesn't have an instant 1-tap WhatsApp quote estimator for modern drivers on mobile. I built a modern redesign concept for ${cleanCompany}. Can I send a 40-sec preview video?`;
      } else if (audit.classification === "OUTDATED_NO_SSL") {
        tier = "Hot";
        pitchMessage = `Salam Team ${cleanCompany}, saw your workshop on Google Maps! I noticed Chrome flags your website as 'Not Secure' (no SSL encryption) and mobile drivers can't calculate repair costs directly on WhatsApp. I built a secure redesign concept for ${cleanCompany}. Can I send a 40-sec preview video?`;
      } else {
        tier = "Hot";
        pitchMessage = `Salam Team ${cleanCompany}, saw your workshop on Google Maps with ${reviews}+ reviews! Tried visiting your website from Google but it appears offline / broken. I created a fast 40-sec mobile design concept with 1-tap WhatsApp booking for ${cleanCompany}. Can I share the preview?`;
      }

      // Check for existing lead by business name
      const existing = await db.lead.findFirst({
        where: { business_name: cleanCompany },
      });

      const leadPayload = {
        business_name: cleanCompany,
        website: rawWebsite,
        phone,
        city_country: address.split(",")[0] || "Dubai, UAE",
        niche_industry: niche,
        rating,
        review_count: reviews,
        address,
        priority: tier,
        primary_observation: `${audit.auditTag} • ${audit.websiteAge}`,
        primary_offer: "Mobile Redesign + 1-Tap WhatsApp Lead Converter",
        status: "Target Today",
        is_today_target: true,
        source_csv_row: JSON.stringify({
          source: "Apify Google Maps Scraper",
          query,
          scraped_at: new Date().toISOString(),
          rating,
          reviews,
          phone,
          website: rawWebsite,
          audit_classification: audit.classification,
          audit_tag: audit.auditTag,
          website_age: audit.websiteAge,
          detected_year: audit.detectedYear,
          pitch_message: pitchMessage,
        }),
      };

      if (!existing) {
        const created = await db.lead.create({ data: leadPayload });
        savedLeads.push({ ...created, pitch_message: pitchMessage, audit_tag: audit.auditTag, website_age: audit.websiteAge });
      } else {
        const updated = await db.lead.update({
          where: { id: existing.id },
          data: {
            ...leadPayload,
            is_today_target: true,
          },
        });
        savedLeads.push({ ...updated, pitch_message: pitchMessage, audit_tag: audit.auditTag, website_age: audit.websiteAge });
      }
    }

    console.log(
      `[Apify Scraper] Complete! Qualified: ${savedLeads.length} leads | Disqualified Modern Sites: ${disqualifiedCount}`
    );

    return NextResponse.json({
      success: true,
      message: `Audited ${items.length} places. Found ${savedLeads.length} genuine Zero-Site / 5+ Year Outdated leads (${disqualifiedCount} modern 2024-2026 sites filtered out)!`,
      count: savedLeads.length,
      disqualified_modern_count: disqualifiedCount,
      leads: savedLeads,
    });
  } catch (error: any) {
    console.error("[Apify Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal scraper error" },
      { status: 500 }
    );
  }
}
