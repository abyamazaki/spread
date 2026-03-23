import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/sheets/[sheetId]/locked-columns - ロック列の更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sheetId } = await params;

  // シート管理者チェック
  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    select: { createdBy: true, columns: true },
  });

  if (!sheet) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
  }

  if (sheet.createdBy !== session.user.id) {
    return NextResponse.json(
      { error: "シート管理者のみがカラムをロックできます" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { lockedColumns } = body as { lockedColumns: string[] };

  if (!Array.isArray(lockedColumns)) {
    return NextResponse.json(
      { error: "lockedColumns must be an array" },
      { status: 400 }
    );
  }

  // 存在するカラム名のみ許可
  const validColumns = sheet.columns as string[];
  const filtered = lockedColumns.filter((col) => validColumns.includes(col));

  const updated = await prisma.sheet.update({
    where: { id: sheetId },
    data: { lockedColumns: filtered },
  });

  return NextResponse.json({ lockedColumns: updated.lockedColumns });
}
