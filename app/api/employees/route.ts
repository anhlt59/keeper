import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createEmployeeSchema } from "@/lib/validators/employee";

// GET /api/employees — list active employees (for dropdown)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, email: true, department: true, position: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}

// POST /api/employees — create employee
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const employee = await prisma.employee.create({ data: parsed.data });
  return NextResponse.json(employee, { status: 201 });
}
