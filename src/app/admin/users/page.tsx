'use client';

import { UserTable } from '@/components/admin/UserTable';

export default function UserManagementPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-6">Kullanıcı Yönetimi</h1>
            <UserTable />
        </div>
    );
}
