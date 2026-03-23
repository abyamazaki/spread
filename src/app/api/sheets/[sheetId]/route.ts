import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sheets/[sheetId] - シート詳細取得
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sheetId } = await params;

  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    include: {
      creator: { select: { name: true } },
      _count: { select: { rows: true } },
    },
  });

  if (!sheet) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
  }

  return NextResponse.json(sheet);
}

// DELETE /api/sheets/[sheetId] - シート削除（ADMIN のみ）
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sheetId } = await params;

  await prisma.sheet.delete({ where: { id: sheetId } });
  return NextResponse.json({ success: true });
}
