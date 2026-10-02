import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "documents");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// GET: Fetch all documents associated with this lead (or its converted client)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      select: { id: true, converted_client_id: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const documents = await db.document.findMany({
      where: {
        OR: [
          { related_id: leadId },
          ...(lead.converted_client_id ? [{ related_id: lead.converted_client_id }] : []),
        ],
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error("Failed to fetch lead documents:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST: Upload a file (PDF, image, mockup, audit) and associate with lead
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const lead = await db.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customTitle = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size: max 10MB
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit" },
        { status: 400 }
      );
    }

    ensureUploadsDir();

    // Sanitize filename and create unique disk name
    const timestamp = Date.now();
    const originalName = file.name || "document";
    const ext = path.extname(originalName) || ".pdf";
    const baseName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);
    const safeFilename = `${baseName}_${timestamp}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    // Save to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/documents/${safeFilename}`;

    // Determine document type
    let docType = "Document";
    const mime = file.type.toLowerCase();
    if (mime.includes("pdf")) {
      docType = "PDF";
    } else if (mime.startsWith("image/")) {
      docType = "Mockup / Image";
    }

    // Persist Document in DB
    const document = await db.document.create({
      data: {
        related_type: "Lead",
        related_id: leadId,
        type: docType,
        title: customTitle?.trim() || originalName,
        file_url: fileUrl,
      },
    });

    return NextResponse.json({
      success: true,
      document,
      message: "Document uploaded successfully",
    });
  } catch (error: any) {
    console.error("Failed to upload lead document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("document_id");

    if (!documentId) {
      return NextResponse.json(
        { error: "document_id is required" },
        { status: 400 }
      );
    }

    const doc = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Remove from DB
    await db.document.delete({
      where: { id: documentId },
    });

    // Attempt to remove physical file
    try {
      if (doc.file_url.startsWith("/uploads/documents/")) {
        const fullPath = path.join(process.cwd(), "public", doc.file_url);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (e) {
      console.warn("Could not delete physical file:", e);
    }

    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (error: any) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
