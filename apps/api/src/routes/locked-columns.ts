import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const lockedColumns = new Hono();

// 認証を適用
lockedColumns.use("/api/v1/sheets/:sheetId/locked-columns", authMiddleware);

// PATCH /api/v1/sheets/:sheetId/locked-columns - ロック列の更新
lockedColumns.patch("/api/v1/sheets/:sheetId/locked-columns", async (c) => {
  const user = c.get("user");
  const sheetId = c.req.param("sheetId");

  // シート管理者チェック
  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    select: { createdBy: true, columns: true },
  });

  if (!sheet) {
    return c.json({ error: "Sheet not found" }, 404);
  }

  if (sheet.createdBy !== user.id) {
    return c.json(
      { error: "シート管理者のみがカラムをロックできます" },
      403
    );
  }

  const body = await c.req.json();
  const { lockedColumns: lockedCols } = body as { lockedColumns: string[] };

  if (!Array.isArray(lockedCols)) {
    return c.json({ error: "lockedColumns must be an array" }, 400);
  }

  // 存在するカラム名のみ許可
  const validColumns = sheet.columns as string[];
  const filtered = lockedCols.filter((col) => validColumns.includes(col));

  const updated = await prisma.sheet.update({
    where: { id: sheetId },
    data: { lockedColumns: filtered },
  });

  return c.json({ lockedColumns: updated.lockedColumns });
});

export default lockedColumns;
