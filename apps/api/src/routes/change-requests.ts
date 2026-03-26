import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { findRowManagerColumns, isRowManager } from "../lib/permissions";

const changeRequests = new Hono();

// すべての変更リクエストルートに認証を適用
changeRequests.use("/api/v1/change-requests/*", authMiddleware);
changeRequests.use("/api/v1/change-requests", authMiddleware);

// GET /api/v1/change-requests?sheetId=xxx - 変更リクエスト一覧
changeRequests.get("/api/v1/change-requests", async (c) => {
  const sheetId = c.req.query("sheetId");
  const where = sheetId ? { sheetId } : {};

  const requests = await prisma.changeRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true } },
      reviewer: { select: { name: true } },
      sheet: { select: { name: true } },
      _count: { select: { cells: true } },
    },
  });

  return c.json(requests);
});

// POST /api/v1/change-requests - 変更リクエスト作成
changeRequests.post("/api/v1/change-requests", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { sheetId, cells, comment } = body as {
    sheetId: string;
    cells: {
      rowId: string;
      columnKey: string;
      oldValue: string | null;
      newValue: string | null;
    }[];
    comment?: string;
  };

  if (!sheetId || !cells?.length) {
    return c.json({ error: "sheetId and cells are required" }, 400);
  }

  // シート情報を取得して権限チェック
  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    select: { columns: true, lockedColumns: true },
  });

  if (!sheet) {
    return c.json({ error: "Sheet not found" }, 404);
  }

  const lockedColumns = (sheet.lockedColumns ?? []) as string[];
  const rowManagerColumns = findRowManagerColumns(sheet.columns as string[]);

  // ロック列への変更チェック
  const lockedCells = cells.filter((cell) =>
    lockedColumns.includes(cell.columnKey)
  );
  if (lockedCells.length > 0) {
    return c.json(
      {
        error: `ロックされた列は編集できません: ${lockedCells.map((cell) => cell.columnKey).join(", ")}`,
      },
      403
    );
  }

  // 行管理者チェック: 変更対象の行を取得
  const rowIds = [...new Set(cells.map((cell) => cell.rowId))];
  const rows = await prisma.row.findMany({
    where: { id: { in: rowIds } },
    select: { id: true, data: true, rowManagerId: true },
  });

  const rowMap = new Map(rows.map((r) => [r.id, r]));

  for (const rowId of rowIds) {
    const row = rowMap.get(rowId);
    if (!row) continue;

    const hasPermission = isRowManager({
      rowData: row.data as Record<string, string>,
      rowManagerId: row.rowManagerId,
      userEmail: user.email,
      userId: user.id,
      rowManagerColumns,
    });

    if (!hasPermission) {
      return c.json({ error: "行管理者でない行は編集できません" }, 403);
    }
  }

  const changeRequest = await prisma.changeRequest.create({
    data: {
      sheetId,
      requesterId: user.id,
      comment,
      cells: {
        createMany: {
          data: cells.map((cell) => ({
            rowId: cell.rowId,
            columnKey: cell.columnKey,
            oldValue: cell.oldValue,
            newValue: cell.newValue,
          })),
        },
      },
    },
    include: { _count: { select: { cells: true } } },
  });

  return c.json(changeRequest, 201);
});

// GET /api/v1/change-requests/:requestId - 変更リクエスト詳細
changeRequests.get("/api/v1/change-requests/:requestId", async (c) => {
  const requestId = c.req.param("requestId");

  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: { select: { name: true, email: true } },
      reviewer: { select: { name: true, email: true } },
      sheet: {
        select: { name: true, id: true, createdBy: true, columns: true },
      },
      cells: {
        include: {
          row: { select: { rowIndex: true, data: true } },
        },
        orderBy: [{ rowId: "asc" }, { columnKey: "asc" }],
      },
    },
  });

  if (!request) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(request);
});

// POST /api/v1/change-requests/:requestId/approve - 承認してデータ反映
changeRequests.post(
  "/api/v1/change-requests/:requestId/approve",
  async (c) => {
    const user = c.get("user");
    const requestId = c.req.param("requestId");
    const body = await c.req.json().catch(() => ({}));
    const { comment } = body as { comment?: string };

    try {
      await prisma.$transaction(async (tx) => {
        const request = await tx.changeRequest.findUnique({
          where: { id: requestId },
          include: { cells: true, sheet: { select: { createdBy: true } } },
        });

        if (!request) throw new Error("Not found");

        // シート管理者のみ承認可能
        if (request.sheet.createdBy !== user.id) {
          throw new Error("シート管理者のみが承認できます");
        }
        if (request.status !== "PENDING") {
          throw new Error("This request is already processed");
        }

        // 行ごとにセルの変更をグループ化
        const cellsByRow = new Map<
          string,
          {
            columnKey: string;
            oldValue: string | null;
            newValue: string | null;
          }[]
        >();
        for (const cell of request.cells) {
          const group = cellsByRow.get(cell.rowId) ?? [];
          group.push({
            columnKey: cell.columnKey,
            oldValue: cell.oldValue,
            newValue: cell.newValue,
          });
          cellsByRow.set(cell.rowId, group);
        }

        // 各行に変更を適用
        for (const [rowId, cells] of cellsByRow) {
          const row = await tx.row.findUnique({ where: { id: rowId } });
          if (!row) throw new Error(`Row ${rowId} not found`);

          const data = row.data as Record<string, string>;

          // 競合チェック: oldValue が現在値と一致するか
          for (const cell of cells) {
            const currentValue = data[cell.columnKey] ?? null;
            if (currentValue !== cell.oldValue) {
              throw new Error(
                `競合が検出されました: 行 ${row.rowIndex + 1} の "${cell.columnKey}" は既に別の変更で更新されています`
              );
            }
          }

          // 変更適用
          const updatedData = { ...data };
          for (const cell of cells) {
            if (cell.newValue === null) {
              delete updatedData[cell.columnKey];
            } else {
              updatedData[cell.columnKey] = cell.newValue;
            }
          }

          await tx.row.update({
            where: { id: rowId },
            data: { data: updatedData },
          });
        }

        // リクエストのステータスを更新
        await tx.changeRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewerId: user.id,
            reviewComment: comment || undefined,
          },
        });
      });

      return c.json({ success: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "承認処理に失敗しました";
      return c.json({ error: message }, 400);
    }
  }
);

// POST /api/v1/change-requests/:requestId/reject - 却下
changeRequests.post(
  "/api/v1/change-requests/:requestId/reject",
  async (c) => {
    const user = c.get("user");
    const requestId = c.req.param("requestId");
    const body = await c.req.json();
    const { comment } = body as { comment?: string };

    const request = await prisma.changeRequest.findUnique({
      where: { id: requestId },
      include: { sheet: { select: { createdBy: true } } },
    });

    if (!request) {
      return c.json({ error: "Not found" }, 404);
    }

    // シート管理者のみ却下可能
    if (request.sheet.createdBy !== user.id) {
      return c.json(
        { error: "シート管理者のみが却下できます" },
        403
      );
    }

    if (request.status !== "PENDING") {
      return c.json(
        { error: "This request is already processed" },
        400
      );
    }

    await prisma.changeRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewerId: user.id,
        reviewComment: comment,
      },
    });

    return c.json({ success: true });
  }
);

// POST /api/v1/change-requests/:requestId/withdraw - 申請者による取り下げ
changeRequests.post(
  "/api/v1/change-requests/:requestId/withdraw",
  async (c) => {
    const user = c.get("user");
    const requestId = c.req.param("requestId");

    const request = await prisma.changeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return c.json({ error: "Not found" }, 404);
    }

    // 申請者本人のみ取り下げ可能
    if (request.requesterId !== user.id) {
      return c.json(
        { error: "申請者のみが取り下げできます" },
        403
      );
    }

    if (request.status !== "PENDING") {
      return c.json(
        { error: "申請中のリクエストのみ取り下げできます" },
        400
      );
    }

    await prisma.changeRequest.update({
      where: { id: requestId },
      data: { status: "WITHDRAWN" },
    });

    return c.json({ success: true });
  }
);

export default changeRequests;
