import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SheetsPage() {
  const sheets = await prisma.sheet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { name: true } },
      _count: { select: { rows: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">シート一覧</h1>
        <Link href="/sheets/new">
          <Button>CSV インポート</Button>
        </Link>
      </div>

      {sheets.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">シートがまだありません</p>
          <Link href="/sheets/new">
            <Button variant="outline" className="mt-4">
              最初の CSV をインポート
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  シート名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  カラム数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  行数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  作成者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  作成日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sheets.map((sheet) => (
                <tr key={sheet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/sheets/${sheet.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {sheet.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(sheet.columns as string[]).length}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sheet._count.rows}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sheet.creator.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sheet.createdAt.toLocaleDateString("ja-JP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
