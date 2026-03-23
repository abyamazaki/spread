import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sheets - シート一覧取得
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheets = await prisma.sheet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { name: true } },
      _count: { select: { rows: true } },
    },
  });

  return NextResponse.json(sheets);
}

// POST /api/sheets - CSV データからシート作成
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, columns, rows } = body as {
    name: string;
    columns: string[];
    rows: Record<string, string>[];
  };

  if (!name || !columns?.length || !rows?.length) {
    return NextResponse.json(
      { error: "name, columns, rows are required" },
      { status: 400 }
    );
  }

  const sheet = await prisma.sheet.create({
    data: {
      name,
      columns,
      createdBy: session.user.id,
      rows: {
        createMany: {
          data: rows.map((data, index) => ({
            rowIndex: index,
            data,
          })),
        },
      },
    },
  });

  return NextResponse.json(sheet, { status: 201 });
}
