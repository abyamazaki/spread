/**
 * シート・行レベル権限判定ユーティリティ
 */

/** カラム名に「行管理者」を含む列をすべて検出する */
export function findRowManagerColumns(columns: string[]): string[] {
  return columns.filter((col) => col.includes("行管理者"));
}

/** メールアドレスの @ より前の部分を取得 */
export function getEmailPrefix(email: string): string {
  return email.split("@")[0];
}

/** 指定ユーザーがその行の行管理者かを判定 */
export function isRowManager(params: {
  rowData: Record<string, string>;
  rowManagerId: string | null | undefined;
  userEmail: string;
  userId: string;
  rowManagerColumns: string[];
}): boolean {
  const { rowData, rowManagerId, userEmail, userId, rowManagerColumns } = params;

  if (rowManagerColumns.length > 0) {
    // 「行管理者」カラムがある場合: いずれかのカラムの値とメール prefix が一致すれば行管理者
    const prefix = getEmailPrefix(userEmail);
    return rowManagerColumns.some((col) => {
      const value = (rowData[col] ?? "").trim();
      return value !== "" && value === prefix;
    });
  }

  // 手動割り当ての場合: rowManagerId と userId を比較
  if (rowManagerId) {
    return rowManagerId === userId;
  }

  // 行管理者が未設定
  return false;
}

/** セルの編集可否を判定 */
export function canEditCell(params: {
  rowData: Record<string, string>;
  rowManagerId: string | null | undefined;
  column: string;
  userEmail: string;
  userId: string;
  isSheetManager: boolean;
  lockedColumns: string[];
  rowManagerColumns: string[];
}): { editable: boolean; reason?: string } {
  const { column, lockedColumns, rowManagerColumns } = params;

  // ロックされた列は誰も編集できない
  if (lockedColumns.includes(column)) {
    return { editable: false, reason: "locked" };
  }

  // 行管理者カラム自体は編集不可（自動検出モード時）
  if (rowManagerColumns.includes(column)) {
    return { editable: false, reason: "row_manager_column" };
  }

  // 行管理者チェック
  const isManager = isRowManager({
    rowData: params.rowData,
    rowManagerId: params.rowManagerId,
    userEmail: params.userEmail,
    userId: params.userId,
    rowManagerColumns,
  });

  if (!isManager) {
    return { editable: false, reason: "not_row_manager" };
  }

  return { editable: true };
}
