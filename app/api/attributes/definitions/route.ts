import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { createAttributeDefinitionSchema } from "@/lib/validators/dynamic-attrs";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;

  const definitions = await prisma.attributeDefinition.findMany({
    where: {
      isDeleted: false,
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(definitions);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createAttributeDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Check uniqueness: name + categoryId must be unique (allow global if categoryId is null)
  if (data.categoryId) {
    const existing = await prisma.attributeDefinition.findFirst({
      where: { name: data.name, categoryId: data.categoryId, isDeleted: false },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An attribute with this name already exists in this category" },
        { status: 409 }
      );
    }
  } else {
    const existing = await prisma.attributeDefinition.findFirst({
      where: { name: data.name, categoryId: null, isDeleted: false },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A global attribute with this name already exists" },
        { status: 409 }
      );
    }
  }

  const definition = await prisma.attributeDefinition.create({
    data: {
      name: data.name,
      description: data.description,
      fieldType: data.fieldType,
      categoryId: data.categoryId ?? null,
      required: data.required,
      options: data.options,
      validation: data.validation as Prisma.InputJsonValue | undefined,
      order: data.order,
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(definition, { status: 201 });
}
