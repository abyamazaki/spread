"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "@/components/change-requests/review-actions";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";

const statusConfig = {
  PENDING: { label: "申請中", variant: "warning" as const },
  APPROVED: { label: "承認済み", variant: "success" as const },
  REJECTED: { label: "却下", variant: "destructive" as const },
  WITHDRAWN: { label: "取り下げ", variant: "secondary" as const },
};

interface Cell {
  id: string;
  rowId: string;
  columnKey: string;
  oldValue: string | null;
  newValue: string | null;
  row: { rowIndex: number; data: Record<string, string> };
}

interface ChangeRequestDetail {
  id: string;
  status: keyof typeof statusConfig;
  sheetId: string;
  requesterId: string;
  createdAt: string;
  comment: string | null;
  reviewComment: string | null;
  requester: { name: string };
  reviewer: { name: string } | null;
  sheet: { name: string; createdBy: string; columns: string[] };
  cells: Cell[];
}

export default function RequestDetailPage() {
  const { sheetId, requestId } = useParams<{ sheetId: string; requestId: string }>();
  const { user } = useAuth();
  const [request, setRequest] = useState<ChangeRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get<ChangeRequestDetail>(`/api/v1/change-requests/${requestId}`)
      .then((requestData) => {
        setRequest(requestData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [requestId]);

  const sortedRows = useMemo(() => {
    if (!request) return [];

    const rowGroups = new Map<
      string,
      {
        rowIndex: number;
        rowData: Record<string, string>;
        changes: { columnKey: string; oldValue: string | null; newValue: string | null }[];
      }
    >();

    for (const cell of request.cells) {
      if (!rowGroups.has(cell.rowId)) {
        rowGroups.set(cell.rowId, {
          rowIndex: cell.row.rowIndex,
          rowData: (cell.row.data ?? {}) as Record<string, string>,
          changes: [],
        });
      }
      rowGroups.get(cell.rowId)!.changes.push({
        columnKey: cell.columnKey,
        oldValue: cell.oldValue,
        newValue: cell.newValue,
      });
    }

    return Array.from(rowGroups.values()).sort(
      (a, b) => a.rowIndex - b.rowIndex
    );
  }, [request]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">読み込み中...</div>;
  }

  if (error || !request || !user) {
    notFound();
  }

  if (request.sheetId !== sheetId) {
    notFound();
  }

  const config = statusConfig[request.status];
  const canReview =
    request.status === "PENDING" &&
    user.id === request.sheet.createdBy;
  const isRequester =
    request.status === "PENDING" &&
    user.id === request.requesterId;

  const sheetColumns = (request.sheet.columns ?? []) as string[];

  return (
    <div>
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
            {new Date(request.createdAt).toLocaleString("ja-JP")}
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

      {/* 差分テーブル（セル単位） */}
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        変更内容 ({request.cells.length} 件)
      </h2>
      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
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

      {/* 行ごとの変更前・変更後 */}
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        行データの比較 ({sortedRows.length} 行)
      </h2>
      <div className="space-y-4">
        {sortedRows.map((group) => {
          const changedKeys = new Set(group.changes.map((c) => c.columnKey));
          const changeMap = new Map(
            group.changes.map((c) => [c.columnKey, c])
          );

          return (
            <div
              key={group.rowIndex}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                <span className="text-sm font-semibold text-gray-700">
                  行 {group.rowIndex + 1}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-500" />
                      {sheetColumns.map((col) => (
                        <th
                          key={col}
                          className={`whitespace-nowrap px-3 py-2 text-left text-xs font-medium ${
                            changedKeys.has(col)
                              ? "bg-yellow-50 text-yellow-800"
                              : "text-gray-500"
                          }`}
                        >
                          {col || "(名称なし)"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-red-600">
                        変更前
                      </td>
                      {sheetColumns.map((col) => {
                        const change = changeMap.get(col);
                        const value = change
                          ? (change.oldValue ?? "")
                          : (group.rowData[col] ?? "");
                        return (
                          <td
                            key={col}
                            className={`whitespace-nowrap px-3 py-1.5 text-sm ${
                              changedKeys.has(col)
                                ? "bg-red-50 text-red-700"
                                : "text-gray-600"
                            }`}
                          >
                            {value || "\u00A0"}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-green-600">
                        変更後
                      </td>
                      {sheetColumns.map((col) => {
                        const change = changeMap.get(col);
                        const value = change
                          ? (change.newValue ?? "")
                          : (group.rowData[col] ?? "");
                        return (
                          <td
                            key={col}
                            className={`whitespace-nowrap px-3 py-1.5 text-sm ${
                              changedKeys.has(col)
                                ? "bg-green-50 text-green-700"
                                : "text-gray-600"
                            }`}
                          >
                            {value || "\u00A0"}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* アクション（承認/却下/取り下げ） */}
      {(canReview || isRequester) && (
        <ReviewActions
          requestId={requestId}
          sheetId={sheetId}
          canReview={canReview}
          isRequester={isRequester}
        />
      )}
    </div>
  );
}
