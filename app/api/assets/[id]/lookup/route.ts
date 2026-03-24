import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Simple in-memory rate limiter: 30 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const WINDOW_MS = 60 * 1000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { id } = await params;
  const asset = await prisma.asset.findFirst({
    where: { id, isDeleted: false },
    select: {
      id: true, name: true, code: true, status: true,
      assignedTo: true,
      category: { select: { name: true } },
    },
  });

  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  return NextResponse.json({
    id: asset.id,
    name: asset.name,
    code: asset.code,
    status: asset.status,
    category: asset.category.name,
    assignedTo: asset.assignedTo,
  });
}
