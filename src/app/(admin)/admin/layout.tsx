'use client';

import AdminSidebar from '@/components/admin/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-muted/40">
      <AdminSidebar />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
