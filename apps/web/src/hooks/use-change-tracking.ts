"use client";

import { useState, useCallback } from "react";
import type { CellChange } from "@/types";

type CellKey = string; // `${rowId}:${columnKey}`

function makeCellKey(rowId: string, columnKey: string): CellKey {
  return `${rowId}:${columnKey}`;
}

export function useChangeTracking() {
  const [changes, setChanges] = useState<Map<CellKey, CellChange>>(new Map());

  const trackChange = useCallback(
    (rowId: string, columnKey: string, oldValue: string | null, newValue: string | null) => {
      setChanges((prev) => {
        const next = new Map(prev);
        const key = makeCellKey(rowId, columnKey);
        const existing = next.get(key);

        // 元の値に戻った場合は変更を削除
        const originalOld = existing?.oldValue ?? oldValue;
        if (originalOld === newValue) {
          next.delete(key);
        } else {
          next.set(key, {
            rowId,
            columnKey,
            oldValue: originalOld,
            newValue,
          });
        }

        return next;
      });
    },
    []
  );

  const clearChanges = useCallback(() => {
    setChanges(new Map());
  }, []);

  const isChanged = useCallback(
    (rowId: string, columnKey: string) => {
      return changes.has(makeCellKey(rowId, columnKey));
    },
    [changes]
  );

  return {
    changes,
    changeList: Array.from(changes.values()),
    changeCount: changes.size,
    trackChange,
    clearChanges,
    isChanged,
  };
}
