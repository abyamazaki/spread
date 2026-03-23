import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/users/[userId] - ユーザー更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json();
  const { name, role: newRole, password } = body as {
    name?: string;
    role?: string;
    password?: string;
  };

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (newRole) updateData.role = newRole;
  if (password) updateData.hashedPassword = await hash(password, 12);

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json(user);
}

// DELETE /api/admin/users/[userId] - ユーザー削除
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "自分自身は削除できません" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
