import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminNav />
      <main className="flex-1">{children}</main>
    </>
  );
}
