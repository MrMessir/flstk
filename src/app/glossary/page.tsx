import { Suspense } from "react";
import { GlossaryView } from "@/components/glossary/glossary-view";
import { getAllLessons } from "@/lib/lessons/load-lessons";

export const metadata = {
  title: "Словарь",
};

type GlossaryPageProps = {
  searchParams: Promise<{ lesson?: string }>;
};

async function GlossaryContent({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const lessons = await getAllLessons();
  const params = await searchParams;

  return (
    <GlossaryView lessons={lessons} focusLessonId={params.lesson} />
  );
}

export default function GlossaryPage({ searchParams }: GlossaryPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10 text-muted">
          Загрузка словаря…
        </div>
      }
    >
      <GlossaryContent searchParams={searchParams} />
    </Suspense>
  );
}
