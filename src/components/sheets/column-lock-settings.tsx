"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ColumnLockSettingsProps {
  sheetId: string;
  columns: string[];
  lockedColumns: string[];
  onUpdate: (lockedColumns: string[]) => void;
}

export function ColumnLockSettings({
  sheetId,
  columns,
  lockedColumns,
  onUpdate,
}: ColumnLockSettingsProps) {
  const [localLocked, setLocalLocked] = useState<Set<string>>(
    new Set(lockedColumns)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const hasChanges =
    localLocked.size !== lockedColumns.length ||
    [...localLocked].some((col) => !lockedColumns.includes(col));

  const toggleColumn = (col: string) => {
    setLocalLocked((prev) => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`/api/sheets/${sheetId}/locked-columns`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockedColumns: [...localLocked] }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存に失敗しました");
      }

      const data = await res.json();
      onUpdate(data.lockedColumns as string[]);
      setMessage("カラムロック設定を保存しました");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "エラーが発生しました"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-blue-800">
        カラムロック設定
      </h3>
      <p className="mb-3 text-xs text-blue-600">
        ロックされた列は行管理者を含む全ユーザーが編集できなくなります。
      </p>
      <div className="flex flex-wrap gap-2">
        {columns.map((col) => (
          <button
            key={col}
            onClick={() => toggleColumn(col)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              localLocked.has(col)
                ? "border-red-300 bg-red-100 text-red-700"
                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {localLocked.has(col) ? "🔒 " : ""}
            {col}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        {hasChanges && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "ロック設定を保存"}
          </Button>
        )}
        {message && (
          <span
            className={`text-xs ${
              message.includes("エラー") || message.includes("失敗")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
