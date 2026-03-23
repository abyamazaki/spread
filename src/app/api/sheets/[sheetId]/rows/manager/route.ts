import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findRowManagerColumns } from "@/lib/permissions";

// PATCH /api/sheets/[sheetId]/rows/manager - 行管理者の一括割り当て
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
      { error: "シート管理者のみが行管理者を割り当てできます" },
      { status: 403 }
    );
  }

  // 「行管理者」カラムがあるシートでは手動割り当て不可
  const rowManagerColumns = findRowManagerColumns(sheet.columns as string[]);
  if (rowManagerColumns.length > 0) {
    return NextResponse.json(
      {
        error:
          "「行管理者」カラムが存在するため、手動割り当てはできません",
      },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { assignments } = body as {
    assignments: { rowId: string; userId: string | null }[];
  };

  if (!Array.isArray(assignments)) {
    return NextResponse.json(
      { error: "assignments must be an array" },
      { status: 400 }
    );
  }

  // 一括更新
  await prisma.$transaction(
    assignments.map((a) =>
      prisma.row.update({
        where: { id: a.rowId },
        data: { rowManagerId: a.userId },
      })
    )
  );

  return NextResponse.json({ success: true });
}
