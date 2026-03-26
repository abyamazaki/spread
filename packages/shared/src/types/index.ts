// Framework-agnostic types shared across apps
// NOTE: NextAuth type augmentation stays in apps/web/src/types/index.ts

export type SheetColumn = string;

export type RowData = Record<string, string>;

export interface CellChange {
  rowId: string;
  columnKey: string;
  oldValue: string | null;
  newValue: string | null;
}
