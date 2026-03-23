import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SpreadsheetEditor } from "@/components/sheets/spreadsheet-editor";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SheetPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;

  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    include: {
      creator: { select: { name: true } },
      _count: { select: { rows: true, changeRequests: true } },
    },
  });

  if (!sheet) notFound();

  const columns = sheet.columns as string[];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{sheet.name}</h1>
          <p className="text-sm text-gray-500">
            {columns.length} カラム / {sheet._count.rows} 行 / 作成者:{" "}
            {sheet.creator.name}
          </p>
        </div>
        <Link href={`/sheets/${sheetId}/requests`}>
          <Button variant="outline">
            変更リクエスト ({sheet._count.changeRequests})
          </Button>
        </Link>
      </div>

      <SpreadsheetEditor sheetId={sheetId} columns={columns} />
    </div>
  );
}
