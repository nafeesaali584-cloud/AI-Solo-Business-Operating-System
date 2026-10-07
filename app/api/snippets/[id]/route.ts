import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/snippets/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.snippet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, category, body: snippetBody } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (snippetBody !== undefined) updateData.body = snippetBody.trim();

    const updated = await db.snippet.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, snippet: updated });
  } catch (error: any) {
    console.error("PATCH snippet error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update snippet" },
      { status: 500 }
    );
  }
}

// DELETE /api/snippets/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.snippet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    await db.snippet.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Snippet deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE snippet error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete snippet" },
      { status: 500 }
    );
  }
}
