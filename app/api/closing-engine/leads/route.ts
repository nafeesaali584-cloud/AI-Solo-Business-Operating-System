import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const leads = await db.lead.findMany({
      include: {
        interactions: {
          orderBy: { created_at: "desc" },
          take: 10
        }
      },
      orderBy: { updated_at: "desc" }
    });

    const formatted = leads.map(l => {
      let extra = {};
      try {
        if (l.source_csv_row) extra = JSON.parse(l.source_csv_row);
      } catch (e) {}

      return {
        id: l.id,
        businessName: l.business_name,
        ownerName: (extra as any).ownerName || 'Managing Director',
        phone: l.phone || '',
        email: l.email || '',
        location: l.city_country || l.address || 'Dubai, UAE',
        currentWebsite: l.website || '',
        demoLink: l.demo_link || (extra as any).demoLink || '',
        pitchType: l.pitch_type || (extra as any).pitchType || (l.website ? 'redesign' : 'fresh_website'),
        stage: l.pipeline_stage || (extra as any).stage || 1,
        status: l.status || 'Target Today',
        priority: l.priority || 'Warm',
        notes: l.primary_observation || (extra as any).notes || '',
        interactions: l.interactions || [],
        createdAt: l.created_at,
        updatedAt: l.updated_at
      };
    });

    return NextResponse.json({ success: true, count: formatted.length, leads: formatted });
  } catch (error: any) {
    console.error("Closing engine leads GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch leads" }, { status: 500 });
  }
}
