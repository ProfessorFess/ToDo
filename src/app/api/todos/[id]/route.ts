import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data: { completed?: boolean; text?: string } = {};
    if (typeof body?.completed === "boolean") data.completed = body.completed;
    if (typeof body?.text === "string" && body.text.trim().length > 0) {
      data.text = body.text.trim();
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "no valid fields (completed:boolean or text:string)" },
        { status: 400 },
      );
    }
    const todo = await prisma.todo.update({ where: { id }, data });
    return NextResponse.json(todo);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.todo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
