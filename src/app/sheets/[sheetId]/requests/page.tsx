import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const statusConfig = {
  PENDING: { label: "申請中", variant: "warning" as const },
  APPROVED: { label: "承認済み", variant: "success" as const },
  REJECTED: { label: "却下", variant: "destructive" as const },
};

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;

  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    select: { name: true },
  });

  if (!sheet) notFound();

  const requests = await prisma.changeRequest.findMany({
    where: { sheetId },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true } },
      reviewer: { select: { name: true } },
      _count: { select: { cells: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">変更リクエスト</h1>
          <p className="text-sm text-gray-500">{sheet.name}</p>
        </div>
        <Link href={`/sheets/${sheetId}`}>
          <Button variant="outline">シートに戻る</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          変更リクエストはまだありません
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  変更セル数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  申請者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  レビュー者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  申請日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((req) => {
                const config = statusConfig[req.status];
                return (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req._count.cells} 件
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.requester.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.reviewer?.name ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.createdAt.toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/sheets/${sheetId}/requests/${req.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          詳細
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
