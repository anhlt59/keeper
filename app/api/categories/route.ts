import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCategorySchema } from "@/lib/validators/category";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { isDeleted: false },
    include: { parent: true, children: true, _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, parentId } = parsed.data;

  // Check name uniqueness
  const existing = await prisma.category.findFirst({
    where: { name, isDeleted: false },
  });
  if (existing) {
    return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
  }

  // Validate parent exists if provided
  if (parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: parentId, isDeleted: false },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent category not found" }, { status: 400 });
    }
  }

  const category = await prisma.category.create({
    data: { name, description, parentId: parentId ?? null },
    include: { parent: true, children: true },
  });

  return NextResponse.json(category, { status: 201 });
}
