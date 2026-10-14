import { AdminChallenges } from "@/components/admin/admin-challenges";

export const metadata = { title: "Админ · задания" };

export default function AdminChallengesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Задания дуэлей</h2>
      <AdminChallenges />
    </div>
  );
}
