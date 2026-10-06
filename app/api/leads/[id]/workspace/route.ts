import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectProvider, extractYouTubeId } from "@/lib/workspace/provider";
import { uploadWorkspaceFile } from "@/lib/storage/r2";
import { WorkspaceItemType } from "@prisma/client";

// GET /api/leads/[id]/workspace
// Returns all workspace items for a lead with counts and search/filter support
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await db.lead.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type");
    const search = searchParams.get("search")?.trim().toLowerCase();

    // Query all items for lead
    const whereClause: any = { leadId: params.id };
    if (typeFilter && Object.values(WorkspaceItemType).includes(typeFilter as WorkspaceItemType)) {
      whereClause.type = typeFilter as WorkspaceItemType;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await db.workspaceItem.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Calculate aggregated item counts by type
    const allCounts = await db.workspaceItem.groupBy({
      by: ["type"],
      where: { leadId: params.id },
      _count: { _all: true },
    });

    const counts = {
      total: 0,
      notes: 0,
      files: 0,
      links: 0,
      videos: 0,
    };

    allCounts.forEach((c) => {
      const count = c._count._all;
      counts.total += count;
      if (c.type === "NOTE") counts.notes = count;
      if (c.type === "FILE") counts.files = count;
      if (c.type === "LINK") counts.links = count;
      if (c.type === "VIDEO") counts.videos = count;
    });

    return NextResponse.json({
      success: true,
      items,
      counts,
    });
  } catch (error: any) {
    console.error("GET workspace error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch workspace items" },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id]/workspace
// Creates a new workspace item (JSON for Note/Link/Video, multipart/form-data for File)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await db.lead.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. Multipart Form Data (File Upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const title = (formData.get("title") as string) || (file ? file.name : "Uploaded File");
      const content = (formData.get("content") as string) || null;
      const isPinned = formData.get("isPinned") === "true";

      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadWorkspaceFile(buffer, file.name, file.type || "application/octet-stream");

      const item = await db.workspaceItem.create({
        data: {
          leadId: params.id,
          type: "FILE",
          title,
          content,
          url: uploadResult.url,
          provider: uploadResult.provider,
          fileKey: uploadResult.fileKey,
          mimeType: file.type || "application/octet-stream",
          fileSizeBytes: uploadResult.size,
          isPinned,
        },
      });

      return NextResponse.json({ success: true, item }, { status: 201 });
    }

    // 2. JSON Body (NOTE, LINK, VIDEO)
    const body = await req.json();
    const { type, title, content, url, isPinned, sortOrder } = body;

    if (!type || !["NOTE", "FILE", "LINK", "VIDEO"].includes(type)) {
      return NextResponse.json({ error: "Invalid or missing workspace item type" }, { status: 400 });
    }

    if (type === "NOTE" && !content && !title) {
      return NextResponse.json({ error: "Note must include a title or content" }, { status: 400 });
    }

    if ((type === "LINK" || type === "VIDEO") && !url) {
      return NextResponse.json({ error: "URL is required for Link and Video items" }, { status: 400 });
    }

    let finalProvider = body.provider || null;

    if (type === "VIDEO") {
      const ytId = extractYouTubeId(url);
      if (!ytId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL. Please provide a valid YouTube video or Shorts link." },
          { status: 400 }
        );
      }
      finalProvider = "YOUTUBE";
    } else if (type === "LINK") {
      finalProvider = detectProvider(url);
    }

    const item = await db.workspaceItem.create({
      data: {
        leadId: params.id,
        type: type as WorkspaceItemType,
        title: title || (type === "NOTE" ? "Untitled Note" : url),
        content: content || null,
        url: url || null,
        provider: finalProvider,
        isPinned: isPinned === true,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("POST workspace error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create workspace item" },
      { status: 500 }
    );
  }
}
