import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureStarterSnippets } from "@/lib/snippets/engine";

// GET /api/snippets
// Lists all personal outreach snippets and available categories
export async function GET(req: NextRequest) {
  try {
    await ensureStarterSnippets();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim().toLowerCase();

    const where: any = {};
    if (category && category !== "All") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const snippets = await db.snippet.findMany({
      where,
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });

    const categoriesRaw = await db.snippet.groupBy({
      by: ["category"],
    });
    const categories = categoriesRaw.map((c) => c.category);

    return NextResponse.json({
      success: true,
      snippets,
      categories,
    });
  } catch (error: any) {
    console.error("GET snippets error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch snippets" },
      { status: 500 }
    );
  }
}

// POST /api/snippets
// Creates a new reusable outreach snippet
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, body: snippetBody } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Snippet title is required." }, { status: 400 });
    }
    if (!snippetBody || !snippetBody.trim()) {
      return NextResponse.json({ error: "Snippet body is required." }, { status: 400 });
    }

    const snippet = await db.snippet.create({
      data: {
        title: title.trim(),
        category: (category || "General").trim(),
        body: snippetBody.trim(),
      },
    });

    return NextResponse.json({ success: true, snippet }, { status: 201 });
  } catch (error: any) {
    console.error("POST snippet error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create snippet" },
      { status: 500 }
    );
  }
}
