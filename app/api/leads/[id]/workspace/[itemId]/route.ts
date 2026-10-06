import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectProvider, extractYouTubeId } from "@/lib/workspace/provider";
import { deleteWorkspaceFile } from "@/lib/storage/r2";

// PATCH /api/leads/[id]/workspace/[itemId]
// Update title, content, isPinned, sortOrder, or url
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const existing = await db.workspaceItem.findUnique({
      where: { id: params.itemId },
    });

    if (!existing || existing.leadId !== params.id) {
      return NextResponse.json({ error: "Workspace item not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, url, isPinned, sortOrder } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isPinned !== undefined) updateData.isPinned = Boolean(isPinned);
    if (sortOrder !== undefined && typeof sortOrder === "number") updateData.sortOrder = sortOrder;

    if (url !== undefined) {
      updateData.url = url;
      if (existing.type === "VIDEO") {
        const ytId = extractYouTubeId(url);
        if (!ytId) {
          return NextResponse.json(
            { error: "Invalid YouTube URL. Please provide a valid YouTube video or Shorts link." },
            { status: 400 }
          );
        }
        updateData.provider = "YOUTUBE";
      } else if (existing.type === "LINK") {
        updateData.provider = detectProvider(url);
      }
    }

    const updated = await db.workspaceItem.update({
      where: { id: params.itemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("PATCH workspace item error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update workspace item" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id]/workspace/[itemId]
// Deletes item and removes file from R2 / local storage if type is FILE
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const existing = await db.workspaceItem.findUnique({
      where: { id: params.itemId },
    });

    if (!existing || existing.leadId !== params.id) {
      return NextResponse.json({ error: "Workspace item not found" }, { status: 404 });
    }

    // If FILE, remove from storage
    if (existing.type === "FILE" && existing.fileKey) {
      await deleteWorkspaceFile(existing.fileKey, existing.provider || undefined);
    }

    await db.workspaceItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({
      success: true,
      message: "Workspace item deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE workspace item error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete workspace item" },
      { status: 500 }
    );
  }
}
