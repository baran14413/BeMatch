import UsersTable from '@/components/admin/users-table';
import { getAllUsers } from '@/actions/user-actions';
import type { UserProfile } from '@/lib/data';

export default async function AdminUsersPage() {
  const users: UserProfile[] = await getAllUsers();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kullanıcı Yönetimi</h1>
      <UsersTable users={users} />
    </div>
  );
}
