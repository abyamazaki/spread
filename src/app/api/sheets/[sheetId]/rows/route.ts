import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sheets/[sheetId]/rows - ページネーション付き行取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sheetId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 50)
  );

  const [rows, total] = await Promise.all([
    prisma.row.findMany({
      where: { sheetId },
      orderBy: { rowIndex: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.row.count({ where: { sheetId } }),
  ]);

  return NextResponse.json({
    rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
