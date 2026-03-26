// シート関連の型
export type SheetColumn = string;

export type RowData = Record<string, string>;

export interface CellChange {
  rowId: string;
  columnKey: string;
  oldValue: string | null;
  newValue: string | null;
}
