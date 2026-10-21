import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStageScript, getObjectionScript, getAllObjections, getAllStages } from "@/lib/closing-engine/templateEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, stageNum, objectionId, pitchType, leadData } = body;

    let lead = leadData;
    if (leadId) {
      const dbLead = await db.lead.findUnique({ where: { id: leadId } });
      if (dbLead) {
        let extra = {};
        try {
          if (dbLead.source_csv_row) extra = JSON.parse(dbLead.source_csv_row);
        } catch (e) {}

        lead = {
          id: dbLead.id,
          businessName: dbLead.business_name,
          ownerName: (extra as any).ownerName || 'Managing Director',
          phone: dbLead.phone || '',
          email: dbLead.email || '',
          location: dbLead.city_country || 'Dubai, UAE',
          currentWebsite: dbLead.website || '',
          demoLink: dbLead.demo_link || (extra as any).demoLink || '',
          pitchType: pitchType || dbLead.pitch_type || (extra as any).pitchType || (dbLead.website ? 'redesign' : 'fresh_website'),
          stage: stageNum !== undefined ? stageNum : (dbLead.pipeline_stage || 1),
          status: dbLead.status
        };
      }
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead context required" }, { status: 400 });
    }

    if (objectionId) {
      const objection = getObjectionScript(objectionId, lead);
      if (!objection) {
        return NextResponse.json({ error: "Objection script not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, script: objection });
    }

    const script = getStageScript(lead, stageNum);
    return NextResponse.json({
      success: true,
      script,
      availableStages: getAllStages(lead.pitchType),
      availableObjections: getAllObjections()
    });
  } catch (error: any) {
    console.error("Closing engine generate error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate script" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    redesignStages: getAllStages('redesign'),
    freshStages: getAllStages('fresh_website'),
    objections: getAllObjections()
  });
}
