import { Header } from "@/components/layout/header";

export default function SheetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="px-4 py-6">{children}</main>
    </>
  );
}
