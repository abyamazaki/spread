"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useChangeTracking } from "@/hooks/use-change-tracking";
import { Button } from "@/components/ui/button";

interface RowData {
  id: string;
  rowIndex: number;
  data: Record<string, string>;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface SpreadsheetEditorProps {
  sheetId: string;
  columns: string[];
}

function EditableCell({
  value,
  rowId,
  columnKey,
  isChanged,
  onEdit,
}: {
  value: string;
  rowId: string;
  columnKey: string;
  isChanged: boolean;
  onEdit: (
    rowId: string,
    columnKey: string,
    oldValue: string,
    newValue: string
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (editing) {
    return (
      <input
        className="w-full border-none bg-blue-50 px-1 py-0.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (editValue !== value) {
            onEdit(rowId, columnKey, value, editValue);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (editValue !== value) {
              onEdit(rowId, columnKey, value, editValue);
            }
          }
          if (e.key === "Escape") {
            setEditing(false);
            setEditValue(value);
          }
        }}
        autoFocus
      />
    );
  }

  return (
    <div
      className={`cursor-pointer px-1 py-0.5 text-sm ${
        isChanged ? "bg-yellow-100" : ""
      }`}
      onDoubleClick={() => setEditing(true)}
      title="ダブルクリックで編集"
    >
      {value || "\u00A0"}
    </div>
  );
}

export function SpreadsheetEditor({
  sheetId,
  columns: sheetColumns,
}: SpreadsheetEditorProps) {
  const [rows, setRows] = useState<RowData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const { changeCount, changeList, trackChange, clearChanges, isChanged } =
    useChangeTracking();

  const fetchRows = useCallback(
    async (page: number) => {
      setLoading(true);
      const res = await fetch(
        `/api/sheets/${sheetId}/rows?page=${page}&pageSize=50`
      );
      const data = await res.json();
      setRows(data.rows);
      setPagination(data.pagination);
      setLoading(false);
    },
    [sheetId]
  );

  useEffect(() => {
    fetchRows(1);
  }, [fetchRows]);

  const handleEdit = useCallback(
    (rowId: string, columnKey: string, oldValue: string, newValue: string) => {
      trackChange(rowId, columnKey, oldValue, newValue);
      // ローカルの行データも更新
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? { ...row, data: { ...row.data, [columnKey]: newValue } }
            : row
        )
      );
    },
    [trackChange]
  );

  const handleSubmit = async () => {
    if (changeCount === 0) return;
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId,
          cells: changeList,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "申請に失敗しました");
      }

      clearChanges();
      setMessage("変更申請を送信しました");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "エラーが発生しました"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const tableColumns: ColumnDef<RowData>[] = [
    {
      id: "rowIndex",
      header: "#",
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">
          {row.original.rowIndex + 1}
        </span>
      ),
      size: 50,
    },
    ...sheetColumns.map(
      (col, idx): ColumnDef<RowData> => ({
        id: col || `_col_${idx}`,
        header: col || "(名称なし)",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.data[col] ?? ""}
            rowId={row.original.id}
            columnKey={col}
            isChanged={isChanged(row.original.id, col)}
            onEdit={handleEdit}
          />
        ),
      })
    ),
  ];

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      {/* ツールバー */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {changeCount > 0 && (
            <span className="text-sm text-yellow-700">
              {changeCount} 件の変更あり
            </span>
          )}
          {message && (
            <span
              className={`text-sm ${
                message.includes("エラー") || message.includes("失敗")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {changeCount > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={clearChanges}>
                変更を破棄
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "送信中..." : "承認申請"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-gray-500">
            読み込み中...
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {pagination.total} 行中 {(pagination.page - 1) * pagination.pageSize + 1}-
            {Math.min(
              pagination.page * pagination.pageSize,
              pagination.total
            )}{" "}
            を表示
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchRows(pagination.page - 1)}
            >
              前へ
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchRows(pagination.page + 1)}
            >
              次へ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
