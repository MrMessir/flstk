"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authErrorMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/security/safe-next";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalPath(searchParams.get("next"), "/lessons");
  const setupRequired = searchParams.get("setup") === "1";
  const banned = searchParams.get("banned") === "1";
  const confirmError = searchParams.get("error") === "confirm";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(
    confirmError
      ? "Не удалось подтвердить email. Запроси письмо ещё раз или войди, если уже подтвердил."
      : null,
  );
  const [loading, setLoading] = useState(false);
  const maybeClient = createClient();
  const showSetupDetails = process.env.NODE_ENV !== "production";

  if (!maybeClient || setupRequired) {
    return (
      <div className="rounded-xl border border-line bg-paper-elevated p-6">
        <h1 className="text-2xl font-bold tracking-tight">Вход временно недоступен</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Сервис авторизации не настроен. Попробуй позже или напиши администратору.
        </p>
        {showSetupDetails ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Dev: скопируй <code className="font-mono text-ink">.env.example</code> в{" "}
              <code className="font-mono text-ink">.env.local</code> и заполни ключи
              Supabase + <code className="font-mono text-ink">ADMIN_EMAIL</code>.
            </p>
            <p className="mt-3 text-sm text-muted">
              Затем примени миграции из{" "}
              <code className="font-mono">supabase/migrations</code> и перезапусти{" "}
              <code className="font-mono">npm run dev</code>.
            </p>
          </>
        ) : null}
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const client = createClient();
    if (!client) {
      setMessage("Supabase не настроен");
      return;
    }

    setLoading(true);
    setMessage(null);

    if (mode === "signup") {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = origin
        ? `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
        : undefined;
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            display_name: displayName.trim() || email.split("@")[0],
          },
        },
      });
      setLoading(false);
      if (error) {
        setMessage(authErrorMessage(error.message));
        return;
      }
      if (data.session) {
        await fetch("/api/me", { cache: "no-store" }).catch(() => null);
        router.push(nextPath);
        router.refresh();
        return;
      }
      setMessage(
        "Аккаунт создан. Проверь почту и подтверди email по ссылке — затем войди.",
      );
      return;
    }

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setMessage(authErrorMessage(error.message));
      return;
    }
    await fetch("/api/me", { cache: "no-store" }).catch(() => null);
    setLoading(false);
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-line bg-paper-elevated p-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Нужен аккаунт, чтобы сохранять прогресс.
        </p>
      </div>

      {banned ? (
        <p className="rounded-md border border-warn/30 bg-[#fff7e8] px-3 py-2 text-sm text-[#7a4a00]">
          Аккаунт заблокирован. Напиши администратору.
        </p>
      ) : null}

      {mode === "signup" ? (
        <label className="block space-y-1 text-sm">
          <span>Ник</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={40}
            placeholder="как тебя звать"
            className="w-full rounded-md border border-line bg-white px-3 py-2"
          />
        </label>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Пароль</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2"
        />
      </label>

      {message ? <p className="text-sm text-warn">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Секунду…" : mode === "login" ? "Войти" : "Создать аккаунт"}
      </button>

      <p className="text-sm text-muted">
        {mode === "login" ? (
          <>
            Нет аккаунта?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(nextPath)}`}
              className="text-accent hover:underline"
            >
              Регистрация
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="text-accent hover:underline"
            >
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
