import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Вход",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Suspense
        fallback={
          <div className="rounded-xl border border-line bg-paper-elevated p-6 text-muted">
            Загрузка…
          </div>
        }
      >
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
