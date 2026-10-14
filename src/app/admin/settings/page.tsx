import { AdminSettings } from "@/components/admin/admin-settings";

export const metadata = { title: "Админ · настройки" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Настройки</h2>
      <AdminSettings />
    </div>
  );
}
