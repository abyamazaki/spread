import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const sheets = new Hono();

// すべてのシートルートに認証を適用
sheets.use("/api/v1/sheets/*", authMiddleware);
sheets.use("/api/v1/sheets", authMiddleware);

// GET /api/v1/sheets - シート一覧取得
sheets.get("/api/v1/sheets", async (c) => {
  const sheets = await prisma.sheet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { name: true } },
      _count: { select: { rows: true } },
    },
  });

  return c.json(sheets);
});

// POST /api/v1/sheets - CSV データからシート作成
sheets.post("/api/v1/sheets", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { name, columns, rows } = body as {
    name: string;
    columns: string[];
    rows: Record<string, string>[];
  };

  if (!name || !columns?.length || !rows?.length) {
    return c.json({ error: "name, columns, rows are required" }, 400);
  }

  const sheet = await prisma.sheet.create({
    data: {
      name,
      columns,
      createdBy: user.id,
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

  return c.json(sheet, 201);
});

// GET /api/v1/sheets/:sheetId - シート詳細取得
sheets.get("/api/v1/sheets/:sheetId", async (c) => {
  const sheetId = c.req.param("sheetId");

  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    include: {
      creator: { select: { name: true } },
      _count: { select: { rows: true, changeRequests: true } },
    },
  });

  if (!sheet) {
    return c.json({ error: "Sheet not found" }, 404);
  }

  return c.json(sheet);
});

// DELETE /api/v1/sheets/:sheetId - シート削除（ADMIN のみ）
sheets.delete("/api/v1/sheets/:sheetId", async (c) => {
  const user = c.get("user");

  if (user.role !== "ADMIN") {
    return c.json({ error: "Forbidden" }, 403);
  }

  const sheetId = c.req.param("sheetId");

  await prisma.sheet.delete({ where: { id: sheetId } });
  return c.json({ success: true });
});

export default sheets;
