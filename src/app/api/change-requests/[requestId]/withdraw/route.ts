import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/change-requests/[requestId]/withdraw - 申請者による取り下げ
export async function POST(
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
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 申請者本人のみ取り下げ可能
  if (request.requesterId !== session.user.id) {
    return NextResponse.json(
      { error: "申請者のみが取り下げできます" },
      { status: 403 }
    );
  }

  if (request.status !== "PENDING") {
    return NextResponse.json(
      { error: "申請中のリクエストのみ取り下げできます" },
      { status: 400 }
    );
  }

  await prisma.changeRequest.update({
    where: { id: requestId },
    data: { status: "WITHDRAWN" },
  });

  return NextResponse.json({ success: true });
}
