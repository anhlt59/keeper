import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateCategorySchema } from "@/lib/validators/category";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const category = await prisma.category.findFirst({
    where: { id, isDeleted: false },
    include: { parent: true, children: true, _count: { select: { assets: true } } },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(category);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, parentId } = parsed.data;

  // Validate name uniqueness if changing
  if (name) {
    const existing = await prisma.category.findFirst({
      where: { name, isDeleted: false, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }
  }

  // Prevent circular parent reference
  if (parentId === id) {
    return NextResponse.json({ error: "Category cannot be its own parent" }, { status: 400 });
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

  const category = await prisma.category.update({
    where: { id },
    data: { name, description, parentId: parentId ?? null },
    include: { parent: true, children: true },
  });

  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Check category exists
  const category = await prisma.category.findFirst({
    where: { id, isDeleted: false },
    include: { _count: { select: { assets: true, children: true } } },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cannot delete if has assets or children
  if (category._count.assets > 0) {
    return NextResponse.json(
      { error: "Cannot delete category with assets. Reassign assets first." },
      { status: 409 }
    );
  }
  if (category._count.children > 0) {
    return NextResponse.json(
      { error: "Cannot delete category with subcategories. Delete children first." },
      { status: 409 }
    );
  }

  await prisma.category.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
