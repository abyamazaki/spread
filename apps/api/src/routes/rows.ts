import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { findRowManagerColumns } from "../lib/permissions";

const rows = new Hono();

// すべての行ルートに認証を適用
rows.use("/api/v1/sheets/:sheetId/rows/*", authMiddleware);
rows.use("/api/v1/sheets/:sheetId/rows", authMiddleware);

// GET /api/v1/sheets/:sheetId/rows - ページネーション付き行取得
rows.get("/api/v1/sheets/:sheetId/rows", async (c) => {
  const sheetId = c.req.param("sheetId");
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(c.req.query("pageSize")) || 50)
  );

  const [rowList, total, pendingChangeCells] = await Promise.all([
    prisma.row.findMany({
      where: { sheetId },
      orderBy: { rowIndex: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        rowManager: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.row.count({ where: { sheetId } }),
    prisma.changeCell.findMany({
      where: {
        changeRequest: { sheetId, status: "PENDING" },
      },
      select: { rowId: true, columnKey: true },
    }),
  ]);

  // rowId -> columnKey[] のマップを作成
  const pendingCells: Record<string, string[]> = {};
  for (const cell of pendingChangeCells) {
    if (!pendingCells[cell.rowId]) {
      pendingCells[cell.rowId] = [];
    }
    if (!pendingCells[cell.rowId].includes(cell.columnKey)) {
      pendingCells[cell.rowId].push(cell.columnKey);
    }
  }

  return c.json({
    rows: rowList,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    pendingCells,
  });
});

// PATCH /api/v1/sheets/:sheetId/rows/manager - 行管理者の一括割り当て
rows.patch("/api/v1/sheets/:sheetId/rows/manager", async (c) => {
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
      { error: "シート管理者のみが行管理者を割り当てできます" },
      403
    );
  }

  // 「行管理者」カラムがあるシートでは手動割り当て不可
  const rowManagerColumns = findRowManagerColumns(sheet.columns as string[]);
  if (rowManagerColumns.length > 0) {
    return c.json(
      {
        error:
          "「行管理者」カラムが存在するため、手動割り当てはできません",
      },
      400
    );
  }

  const body = await c.req.json();
  const { assignments } = body as {
    assignments: { rowId: string; userId: string | null }[];
  };

  if (!Array.isArray(assignments)) {
    return c.json({ error: "assignments must be an array" }, 400);
  }

  // 一括更新
  await prisma.$transaction(
    assignments.map((a) =>
      prisma.row.update({
        where: { id: a.rowId },
        data: { rowManagerId: a.userId },
      })
    )
  );

  return c.json({ success: true });
});

export default rows;
