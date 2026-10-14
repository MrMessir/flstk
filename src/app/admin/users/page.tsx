import { AdminUsers } from "@/components/admin/admin-users";

export const metadata = { title: "Админ · пользователи" };

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Пользователи</h2>
      <AdminUsers />
    </div>
  );
}
