import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json({
      status: "ok",
      dbUrl: process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***@"),
      userCount,
      users,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ status: "error", message, stack }, { status: 500 });
  }
}
