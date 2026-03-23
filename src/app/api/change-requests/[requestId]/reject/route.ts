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

  const role = (session.user as { role?: string })?.role;
  if (role !== "APPROVER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { requestId } = await params;
  const body = await req.json();
  const { comment } = body as { comment?: string };

  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
