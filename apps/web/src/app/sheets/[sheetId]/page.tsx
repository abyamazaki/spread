"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { findRowManagerColumns } from "@/lib/permissions";
import { SpreadsheetEditor } from "@/components/sheets/spreadsheet-editor";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";

interface Sheet {
  id: string;
  name: string;
  columns: string[];
  lockedColumns: string[] | null;
  createdBy: string;
  creator: { name: string };
  _count: { rows: number; changeRequests: number };
}

export default function SheetPage() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const { user } = useAuth();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .get<Sheet>(`/api/v1/sheets/${sheetId}`)
      .then((sheetData) => {
        setSheet(sheetData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [sheetId]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">読み込み中...</div>;
  }

  if (error || !sheet || !user) {
    notFound();
  }

  const columns = sheet.columns as string[];
  const lockedColumns = (sheet.lockedColumns ?? []) as string[];
  const isSheetManager = sheet.createdBy === user.id;
  const rowManagerColumns = findRowManagerColumns(columns);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{sheet.name}</h1>
          <p className="text-sm text-gray-500">
            {columns.length} カラム / {sheet._count.rows} 行 / 作成者:{" "}
            {sheet.creator.name}
            {isSheetManager && (
              <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                シート管理者
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/sheets/${sheetId}/requests`}>
            <Button variant="outline">
              変更リクエスト ({sheet._count.changeRequests})
            </Button>
          </Link>
        </div>
      </div>

      <SpreadsheetEditor
        sheetId={sheetId}
        columns={columns}
        lockedColumns={lockedColumns}
        currentUserEmail={user.email}
        currentUserId={user.id}
        isSheetManager={isSheetManager}
        rowManagerColumns={rowManagerColumns}
      />
    </div>
  );
}
