import UsersTable from '@/components/admin/users-table';
// import { getAllUsers } from '@/actions/user-actions';

export default async function AdminUsersPage() {
  // const users = await getAllUsers();
  const users: any[] = [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kullanıcı Yönetimi</h1>
      <UsersTable users={users} />
    </div>
  );
}
