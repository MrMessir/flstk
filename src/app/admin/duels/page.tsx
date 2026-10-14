import { AdminDuels } from "@/components/admin/admin-duels";

export const metadata = { title: "Админ · дуэли" };

export default function AdminDuelsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Дуэли</h2>
      <AdminDuels />
    </div>
  );
}
