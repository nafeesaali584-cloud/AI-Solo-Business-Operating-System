import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/csv-mapping-templates?signature=... */
export async function GET(req: NextRequest) {
  try {
    const signature = req.nextUrl.searchParams.get("signature");
    if (!signature) {
      return NextResponse.json({ error: "signature query param required" }, { status: 400 });
    }
    const template = await db.csvMappingTemplate.findUnique({
      where: { header_signature: signature },
    });
    return NextResponse.json({ template: template ?? null });
  } catch (error: any) {
    console.error("GET /api/csv-mapping-templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** POST /api/csv-mapping-templates — upsert by header_signature */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { header_signature, template_name, field_mappings } = body;

    if (!header_signature || !field_mappings) {
      return NextResponse.json(
        { error: "header_signature and field_mappings are required" },
        { status: 400 }
      );
    }

    const template = await db.csvMappingTemplate.upsert({
      where: { header_signature },
      update: {
        field_mappings,
        template_name: template_name || "Saved Mapping",
        last_used_at: new Date(),
      },
      create: {
        header_signature,
        template_name: template_name || "Saved Mapping",
        field_mappings,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("POST /api/csv-mapping-templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
