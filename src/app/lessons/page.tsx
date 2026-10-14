import { LessonsList } from "@/components/lessons/lessons-list";
import { isPublished } from "@/lib/lessons/is-published";
import { getAllLessons, getLessonMetas } from "@/lib/lessons/load-lessons";

export const metadata = {
  title: "Уроки",
};

export default async function LessonsPage() {
  const [metas, all] = await Promise.all([getLessonMetas(), getAllLessons()]);
  const publishedIds = all.filter(isPublished).map((lesson) => lesson.id);

  return <LessonsList lessons={metas} publishedIds={publishedIds} />;
}
