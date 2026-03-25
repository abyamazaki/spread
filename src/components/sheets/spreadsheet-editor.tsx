"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useChangeTracking } from "@/hooks/use-change-tracking";
import { Button } from "@/components/ui/button";
import { ColumnLockSettings } from "@/components/sheets/column-lock-settings";

interface RowData {
  id: string;
  rowIndex: number;
  data: Record<string, string>;
  rowManagerId: string | null;
  rowManager: { id: string; name: string; email: string } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

interface SpreadsheetEditorProps {
  sheetId: string;
  columns: string[];
  lockedColumns: string[];
  currentUserEmail: string;
  currentUserId: string;
  isSheetManager: boolean;
  rowManagerColumns: string[];
}

function getEmailPrefix(email: string): string {
  return email.split("@")[0];
}

function EditableCell({
  value,
  rowId,
  columnKey,
  isChanged,
  editable,
  lockReason,
  onEdit,
}: {
  value: string;
  rowId: string;
  columnKey: string;
  isChanged: boolean;
  editable: boolean;
  lockReason?: string;
  onEdit: (
    rowId: string,
    columnKey: string,
    oldValue: string,
    newValue: string
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (editing && editable) {
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

  const bgClass = isChanged
    ? "bg-yellow-100"
    : lockReason === "locked"
      ? "bg-gray-100"
      : lockReason === "not_row_manager"
        ? "bg-gray-50"
        : "";

  return (
    <div
      className={`px-1 py-0.5 text-sm ${bgClass} ${
        editable ? "cursor-pointer" : "cursor-default text-gray-500"
      }`}
      onDoubleClick={() => {
        if (editable) setEditing(true);
      }}
      title={
        !editable
          ? lockReason === "locked"
            ? "この列はロックされています"
            : lockReason === "row_manager_column"
              ? "行管理者カラムは編集できません"
              : "この行の編集権限がありません"
          : "ダブルクリックで編集"
      }
    >
      {value || "\u00A0"}
    </div>
  );
}

function RowManagerSelect({
  rowId,
  currentManagerId,
  users,
  onAssign,
}: {
  rowId: string;
  currentManagerId: string | null;
  users: UserInfo[];
  onAssign: (rowId: string, userId: string | null) => void;
}) {
  return (
    <select
      className="w-full rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
      value={currentManagerId ?? ""}
      onChange={(e) => onAssign(rowId, e.target.value || null)}
    >
      <option value="">未割り当て</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name} ({getEmailPrefix(user.email)})
        </option>
      ))}
    </select>
  );
}

export function SpreadsheetEditor({
  sheetId,
  columns: sheetColumns,
  lockedColumns: initialLockedColumns,
  currentUserEmail,
  currentUserId,
  isSheetManager,
  rowManagerColumns,
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
  const [lockedColumns, setLockedColumns] = useState<string[]>(initialLockedColumns);
  const [showLockSettings, setShowLockSettings] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [savingManagers, setSavingManagers] = useState(false);
  const [pendingManagerAssignments, setPendingManagerAssignments] = useState<
    Map<string, string | null>
  >(new Map());

  const { changeCount, changeList, trackChange, clearChanges, isChanged } =
    useChangeTracking();

  const emailPrefix = useMemo(
    () => getEmailPrefix(currentUserEmail),
    [currentUserEmail]
  );

  const hasRowManagerColumns = rowManagerColumns.length > 0;

  // 手動割り当てモード: ユーザー一覧を取得
  useEffect(() => {
    if (isSheetManager && !hasRowManagerColumns) {
      fetch("/api/users")
        .then((res) => res.json())
        .then(setUsers)
        .catch(() => {});
    }
  }, [isSheetManager, hasRowManagerColumns]);

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

  /** この行のユーザーが行管理者かどうか */
  const checkIsRowManager = useCallback(
    (row: RowData): boolean => {
      if (hasRowManagerColumns) {
        // いずれかの行管理者カラムの値がメール prefix と一致すれば行管理者
        return rowManagerColumns.some((col) => {
          const val = (row.data[col] ?? "").trim();
          return val !== "" && val === emailPrefix;
        });
      }
      // 手動割り当て: pending assignments を優先チェック
      const pending = pendingManagerAssignments.get(row.id);
      if (pending !== undefined) {
        return pending === currentUserId;
      }
      return row.rowManagerId === currentUserId;
    },
    [hasRowManagerColumns, rowManagerColumns, emailPrefix, currentUserId, pendingManagerAssignments]
  );

  /** セルの編集可否判定 */
  const getCellEditability = useCallback(
    (
      row: RowData,
      column: string
    ): { editable: boolean; reason?: string } => {
      if (lockedColumns.includes(column)) {
        return { editable: false, reason: "locked" };
      }
      if (rowManagerColumns.includes(column)) {
        return { editable: false, reason: "row_manager_column" };
      }
      if (!checkIsRowManager(row)) {
        return { editable: false, reason: "not_row_manager" };
      }
      return { editable: true };
    },
    [lockedColumns, rowManagerColumns, checkIsRowManager]
  );

  const handleEdit = useCallback(
    (rowId: string, columnKey: string, oldValue: string, newValue: string) => {
      trackChange(rowId, columnKey, oldValue, newValue);
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

  const handleManagerAssign = useCallback(
    (rowId: string, userId: string | null) => {
      setPendingManagerAssignments((prev) => {
        const next = new Map(prev);
        next.set(rowId, userId);
        return next;
      });
      // ローカルの行データも更新
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                rowManagerId: userId,
                rowManager: userId
                  ? users.find((u) => u.id === userId) ?? null
                  : null,
              }
            : row
        )
      );
    },
    [users]
  );

  const handleSaveManagers = async () => {
    if (pendingManagerAssignments.size === 0) return;
    setSavingManagers(true);
    setMessage("");

    try {
      const assignments = Array.from(pendingManagerAssignments.entries()).map(
        ([rowId, userId]) => ({ rowId, userId })
      );

      const res = await fetch(`/api/sheets/${sheetId}/rows/manager`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存に失敗しました");
      }

      setPendingManagerAssignments(new Map());
      setMessage("行管理者を保存しました");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "エラーが発生しました"
      );
    } finally {
      setSavingManagers(false);
    }
  };

  const handleLockedColumnsUpdate = useCallback((newLockedColumns: string[]) => {
    setLockedColumns(newLockedColumns);
  }, []);

  // 手動割り当てモード: 行管理者カラムを追加
  const showManagerColumn = isSheetManager && !hasRowManagerColumns;

  const tableColumns: ColumnDef<RowData>[] = useMemo(
    () => [
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
      // 手動割り当てモード: 行管理者選択カラム
      ...(showManagerColumn
        ? [
            {
              id: "_rowManager",
              header: () => (
                <span className="text-xs font-medium text-blue-600">
                  行管理者
                </span>
              ),
              cell: ({ row }: { row: { original: RowData } }) => (
                <RowManagerSelect
                  rowId={row.original.id}
                  currentManagerId={row.original.rowManagerId}
                  users={users}
                  onAssign={handleManagerAssign}
                />
              ),
              size: 160,
            } as ColumnDef<RowData>,
          ]
        : []),
      ...sheetColumns.map(
        (col, idx): ColumnDef<RowData> => ({
          id: col || `_col_${idx}`,
          header: () => (
            <span>
              {col || "(名称なし)"}
              {lockedColumns.includes(col) && (
                <span className="ml-1 text-gray-400" title="ロック中">
                  🔒
                </span>
              )}
            </span>
          ),
          cell: ({ row }) => {
            const { editable, reason } = getCellEditability(
              row.original,
              col
            );
            return (
              <EditableCell
                value={row.original.data[col] ?? ""}
                rowId={row.original.id}
                columnKey={col}
                isChanged={isChanged(row.original.id, col)}
                editable={editable}
                lockReason={reason}
                onEdit={handleEdit}
              />
            );
          },
        })
      ),
    ],
    [
      sheetColumns,
      lockedColumns,
      showManagerColumn,
      users,
      handleManagerAssign,
      getCellEditability,
      isChanged,
      handleEdit,
    ]
  );

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
          {pendingManagerAssignments.size > 0 && (
            <span className="text-sm text-blue-700">
              {pendingManagerAssignments.size} 件の行管理者変更あり
            </span>
          )}
          {message && (
            <span
              className={`text-sm ${
                message.includes("エラー") ||
                message.includes("失敗") ||
                message.includes("できません")
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSheetManager && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLockSettings(!showLockSettings)}
            >
              {showLockSettings ? "設定を閉じる" : "カラムロック設定"}
            </Button>
          )}
          {pendingManagerAssignments.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveManagers}
              disabled={savingManagers}
            >
              {savingManagers ? "保存中..." : "行管理者を保存"}
            </Button>
          )}
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

      {/* カラムロック設定パネル */}
      {showLockSettings && isSheetManager && (
        <ColumnLockSettings
          sheetId={sheetId}
          columns={sheetColumns}
          lockedColumns={lockedColumns}
          onUpdate={handleLockedColumnsUpdate}
        />
      )}

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
                    <td key={cell.id} className="whitespace-nowrap px-3 py-1">
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
            {pagination.total} 行中{" "}
            {(pagination.page - 1) * pagination.pageSize + 1}-
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
