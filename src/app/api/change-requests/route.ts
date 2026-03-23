import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findRowManagerColumns, isRowManager } from "@/lib/permissions";

// GET /api/change-requests?sheetId=xxx - 変更リクエスト一覧
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetId = req.nextUrl.searchParams.get("sheetId");
  const where = sheetId ? { sheetId } : {};

  const requests = await prisma.changeRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true } },
      reviewer: { select: { name: true } },
      sheet: { select: { name: true } },
      _count: { select: { cells: true } },
    },
  });

  return NextResponse.json(requests);
}

// POST /api/change-requests - 変更リクエスト作成
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sheetId, cells, comment } = body as {
    sheetId: string;
    cells: {
      rowId: string;
      columnKey: string;
      oldValue: string | null;
      newValue: string | null;
    }[];
    comment?: string;
  };

  if (!sheetId || !cells?.length) {
    return NextResponse.json(
      { error: "sheetId and cells are required" },
      { status: 400 }
    );
  }

  // シート情報を取得して権限チェック
  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    select: { columns: true, lockedColumns: true },
  });

  if (!sheet) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
  }

  const lockedColumns = (sheet.lockedColumns ?? []) as string[];
  const rowManagerColumns = findRowManagerColumns(sheet.columns as string[]);

  // ロック列への変更チェック
  const lockedCells = cells.filter((c) => lockedColumns.includes(c.columnKey));
  if (lockedCells.length > 0) {
    return NextResponse.json(
      { error: `ロックされた列は編集できません: ${lockedCells.map((c) => c.columnKey).join(", ")}` },
      { status: 403 }
    );
  }

  // 行管理者チェック: 変更対象の行を取得
  const rowIds = [...new Set(cells.map((c) => c.rowId))];
  const rows = await prisma.row.findMany({
    where: { id: { in: rowIds } },
    select: { id: true, data: true, rowManagerId: true },
  });

  const rowMap = new Map(rows.map((r) => [r.id, r]));

  for (const rowId of rowIds) {
    const row = rowMap.get(rowId);
    if (!row) continue;

    const hasPermission = isRowManager({
      rowData: row.data as Record<string, string>,
      rowManagerId: row.rowManagerId,
      userEmail: session.user.email,
      userId: session.user.id,
      rowManagerColumns,
    });

    if (!hasPermission) {
      return NextResponse.json(
        { error: "行管理者でない行は編集できません" },
        { status: 403 }
      );
    }
  }

  const changeRequest = await prisma.changeRequest.create({
    data: {
      sheetId,
      requesterId: session.user.id,
      comment,
      cells: {
        createMany: {
          data: cells.map((cell) => ({
            rowId: cell.rowId,
            columnKey: cell.columnKey,
            oldValue: cell.oldValue,
            newValue: cell.newValue,
          })),
        },
      },
    },
    include: { _count: { select: { cells: true } } },
  });

  return NextResponse.json(changeRequest, { status: 201 });
}
