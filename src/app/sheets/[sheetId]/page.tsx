import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { findRowManagerColumns } from "@/lib/permissions";
import { SpreadsheetEditor } from "@/components/sheets/spreadsheet-editor";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SheetPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;

  const [sheet, session] = await Promise.all([
    prisma.sheet.findUnique({
      where: { id: sheetId },
      include: {
        creator: { select: { name: true } },
        _count: { select: { rows: true, changeRequests: true } },
      },
    }),
    auth(),
  ]);

  if (!sheet) notFound();
  if (!session) notFound();

  const columns = sheet.columns as string[];
  const lockedColumns = (sheet.lockedColumns ?? []) as string[];
  const isSheetManager = sheet.createdBy === session.user.id;
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
        currentUserEmail={session.user.email}
        currentUserId={session.user.id}
        isSheetManager={isSheetManager}
        rowManagerColumns={rowManagerColumns}
      />
    </div>
  );
}
