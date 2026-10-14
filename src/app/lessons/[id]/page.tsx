import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { LessonView } from "@/components/lessons/lesson-view";
import { getAllLessons, getLessonById, getLessonMetas } from "@/lib/lessons/load-lessons";
import { getLessonNeighbors } from "@/lib/lessons/neighbors";
import {
  getServerProgressState,
  isLessonUnlockedForState,
  redactLockedLesson,
} from "@/lib/progress/server";

type LessonPageProps = PageProps<"/lessons/[id]">;

export async function generateStaticParams() {
  const lessons = await getAllLessons();
  return lessons.map((lesson) => ({ id: lesson.id }));
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { id } = await params;
  const lesson = await getLessonById(id);

  if (!lesson) {
    return { title: "Урок не найден" };
  }

  return {
    title: lesson.title,
    description: lesson.goal,
  };
}

async function LessonContent({ params }: Pick<LessonPageProps, "params">) {
  // Progress/unlock depends on the signed-in user — never bake full content at build.
  await connection();
  const { id } = await params;
  const [lesson, metas, progress] = await Promise.all([
    getLessonById(id),
    getLessonMetas(),
    getServerProgressState(),
  ]);

  if (!lesson) {
    notFound();
  }

  const serverUnlocked = isLessonUnlockedForState(lesson.id, metas, progress);
  const visibleLesson = serverUnlocked ? lesson : redactLockedLesson(lesson);
  const { prev, next } = getLessonNeighbors(metas, lesson.id);

  return (
    <LessonView
      lesson={visibleLesson}
      prev={prev}
      next={next}
      metas={metas}
      serverUnlocked={serverUnlocked}
    />
  );
}

export default function LessonPage({ params }: LessonPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-muted">
          Загрузка урока…
        </div>
      }
    >
      <LessonContent params={params} />
    </Suspense>
  );
}
