import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
