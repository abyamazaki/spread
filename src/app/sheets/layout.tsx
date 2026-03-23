import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";

export default function SheetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </Providers>
  );
}
