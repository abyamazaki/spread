import { Header } from "@/components/layout/header";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  );
}
