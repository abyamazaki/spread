import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/change-requests/[requestId]/reject - 却下
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const body = await req.json();
  const { comment } = body as { comment?: string };

  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
    include: { sheet: { select: { createdBy: true } } },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // シート管理者のみ却下可能
  if (request.sheet.createdBy !== session.user.id) {
    return NextResponse.json(
      { error: "シート管理者のみが却下できます" },
      { status: 403 }
    );
  }

  if (request.status !== "PENDING") {
    return NextResponse.json(
      { error: "This request is already processed" },
      { status: 400 }
    );
  }

  await prisma.changeRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewerId: session.user.id,
      reviewComment: comment,
    },
  });

  return NextResponse.json({ success: true });
}
