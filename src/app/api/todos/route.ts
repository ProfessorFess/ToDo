import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text;
    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "text must be a non-empty string" },
        { status: 400 },
      );
    }
    const todo = await prisma.todo.create({ data: { text: text.trim() } });
    return NextResponse.json(todo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const completed = req.nextUrl.searchParams.get("completed");
    if (completed !== "true") {
      return NextResponse.json(
        { error: "missing ?completed=true" },
        { status: 400 },
      );
    }
    const result = await prisma.todo.deleteMany({
      where: { completed: true },
    });
    return NextResponse.json({ count: result.count });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
