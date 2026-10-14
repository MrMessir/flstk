import type { Metadata } from "next";
import { Suspense } from "react";
import { DuelLobby } from "@/components/duel/duel-lobby";

export const instant = false;

export const metadata: Metadata = {
  title: "Дуэли",
  description: "Два игрока, одно задание, тесты и таймер.",
};

export default function DuelPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-10 text-muted">
          Загрузка лобби…
        </div>
      }
    >
      <DuelLobby />
    </Suspense>
  );
}
