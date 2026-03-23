import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/change-requests/[requestId] - 変更リクエスト詳細
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;

  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: { select: { name: true, email: true } },
      reviewer: { select: { name: true, email: true } },
      sheet: { select: { name: true, id: true } },
      cells: {
        include: {
          row: { select: { rowIndex: true } },
        },
        orderBy: [{ rowId: "asc" }, { columnKey: "asc" }],
      },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(request);
}
