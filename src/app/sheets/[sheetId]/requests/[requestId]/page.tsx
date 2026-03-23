import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "@/components/change-requests/review-actions";

export const dynamic = "force-dynamic";

const statusConfig = {
  PENDING: { label: "申請中", variant: "warning" as const },
  APPROVED: { label: "承認済み", variant: "success" as const },
  REJECTED: { label: "却下", variant: "destructive" as const },
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ sheetId: string; requestId: string }>;
}) {
  const { sheetId, requestId } = await params;
  const session = await auth();

  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: { select: { name: true } },
      reviewer: { select: { name: true } },
      sheet: { select: { name: true } },
      cells: {
        include: { row: { select: { rowIndex: true } } },
        orderBy: [{ rowId: "asc" }, { columnKey: "asc" }],
      },
    },
  });

  if (!request || request.sheetId !== sheetId) notFound();

  const config = statusConfig[request.status];
  const role = (session?.user as { role?: string })?.role;
  const canReview =
    request.status === "PENDING" &&
    (role === "APPROVER" || role === "ADMIN");

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">変更リクエスト詳細</h1>
        <p className="text-sm text-gray-500">{request.sheet.name}</p>
      </div>

      {/* メタ情報 */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">ステータス: </span>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <div>
            <span className="text-gray-500">申請者: </span>
            {request.requester.name}
          </div>
          <div>
            <span className="text-gray-500">申請日: </span>
            {request.createdAt.toLocaleString("ja-JP")}
          </div>
          <div>
            <span className="text-gray-500">レビュー者: </span>
            {request.reviewer?.name ?? "-"}
          </div>
          {request.comment && (
            <div className="col-span-2">
              <span className="text-gray-500">コメント: </span>
              {request.comment}
            </div>
          )}
          {request.reviewComment && (
            <div className="col-span-2">
              <span className="text-gray-500">レビューコメント: </span>
              {request.reviewComment}
            </div>
          )}
        </div>
      </div>

      {/* 差分テーブル */}
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        変更内容 ({request.cells.length} 件)
      </h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                行
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                カラム
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                変更前
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                変更後
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {request.cells.map((cell) => (
              <tr key={cell.id}>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {cell.row.rowIndex + 1}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-700">
                  {cell.columnKey}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className="rounded bg-red-50 px-1 text-red-700">
                    {cell.oldValue ?? "(空)"}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className="rounded bg-green-50 px-1 text-green-700">
                    {cell.newValue ?? "(空)"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 承認/却下アクション */}
      {canReview && (
        <ReviewActions requestId={requestId} sheetId={sheetId} />
      )}
    </div>
  );
}
