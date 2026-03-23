import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spread - データ管理システム",
  description: "CSV インポート・表データ編集・変更承認ワークフロー",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
