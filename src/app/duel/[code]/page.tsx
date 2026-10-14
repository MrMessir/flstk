import type { Metadata } from "next";
import { Suspense } from "react";
import { DuelRoomView } from "@/components/duel/duel-room";

export const instant = false;

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Дуэль ${code}`,
    description: "Комната дуэли Fullstacker",
  };
}

async function RoomContent({ params }: Props) {
  const { code } = await params;
  return <DuelRoomView code={code.toLowerCase()} />;
}

export default function DuelRoomPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10 text-muted">
          Загрузка комнаты…
        </div>
      }
    >
      <RoomContent params={params} />
    </Suspense>
  );
}
