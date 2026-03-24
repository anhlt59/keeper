import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { updateAttributeDefinitionSchema } from "@/lib/validators/dynamic-attrs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const definition = await prisma.attributeDefinition.findFirst({
    where: { id, isDeleted: false },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!definition) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(definition);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateAttributeDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const existing = await prisma.attributeDefinition.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check uniqueness
  const catId = data.categoryId ?? existing.categoryId;
  if (data.name) {
    const conflict = await prisma.attributeDefinition.findFirst({
      where: {
        name: data.name,
        categoryId: catId ?? null,
        isDeleted: false,
        id: { not: id },
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "Name already used in this category" }, { status: 409 });
    }
  }

  const updated = await prisma.attributeDefinition.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      fieldType: data.fieldType,
      categoryId: data.categoryId,
      required: data.required,
      options: data.options,
      validation: data.validation as Prisma.InputJsonValue | undefined,
      order: data.order,
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const definition = await prisma.attributeDefinition.findFirst({
    where: { id, isDeleted: false },
  });
  if (!definition) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.attributeDefinition.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
