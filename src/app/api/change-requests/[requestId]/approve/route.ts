import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/change-requests/[requestId]/approve - 承認してデータ反映
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const body = await req.json().catch(() => ({}));
  const { comment } = body as { comment?: string };

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.changeRequest.findUnique({
        where: { id: requestId },
        include: { cells: true, sheet: { select: { createdBy: true } } },
      });

      if (!request) throw new Error("Not found");

      // シート管理者のみ承認可能
      if (request.sheet.createdBy !== session.user.id) {
        throw new Error("シート管理者のみが承認できます");
      }
      if (request.status !== "PENDING") {
        throw new Error("This request is already processed");
      }

      // 行ごとにセルの変更をグループ化
      const cellsByRow = new Map<
        string,
        { columnKey: string; oldValue: string | null; newValue: string | null }[]
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
          reviewerId: session.user.id,
          reviewComment: comment || undefined,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "承認処理に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
