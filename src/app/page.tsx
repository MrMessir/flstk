import Link from "next/link";
import { HomeProgram } from "@/components/course/home-program";
import { HomeStartCta } from "@/components/course/home-start-cta";
import { isPublished } from "@/lib/lessons/is-published";
import { getAllLessons, getLessonMetas } from "@/lib/lessons/load-lessons";

export default async function HomePage() {
  const [lessons, metas] = await Promise.all([
    getAllLessons(),
    getLessonMetas(),
  ]);

  const firstLessonId =
    lessons.find((lesson) => lesson.part === "tools" && isPublished(lesson))
      ?.id ??
    lessons.find((lesson) => isPublished(lesson))?.id ??
    "tools-01";

  return (
    <div>
      <section className="hero-glow relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div className="space-y-6">
            <p className="animate-rise font-mono text-sm text-signal">Fullstacker</p>
            <h1 className="animate-rise-delay-1 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
              Курс fullstack
            </h1>
            <p className="animate-rise-delay-2 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              14 модулей: HTML, CSS, JavaScript, TypeScript, React, Node.js,
              SQL, auth, тесты, деплой.
            </p>
            <div className="animate-rise-delay-2 flex flex-wrap gap-3 pt-1">
              <HomeStartCta firstLessonId={firstLessonId} />
              <Link
                href="/duel"
                className="rounded-md border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Дуэли
              </Link>
              <Link
                href="/program"
                className="rounded-md border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Программа
              </Link>
            </div>
          </div>

          <div className="animate-rise-delay-2 overflow-hidden rounded-xl border border-white/10 bg-code-bg shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-3 font-mono text-xs text-white/45">
                course.map
              </span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-7 text-[#c8d4e8] sm:text-sm">
              <code>
                <span className="text-[#7dd3c7]">{"1–3"}</span>
                {"  Основы · Git, HTML, CSS\n"}
                <span className="text-[#9db4ff]">{"4–6"}</span>
                {"  Frontend · JS, TS, React\n"}
                <span className="text-[#f0c674]">{"7–9"}</span>
                {"  Backend · Node, SQL, Auth\n"}
                <span className="text-[#c3a6ff]">{"10–12"}</span>
                {" Full-stack · тесты, деплой\n"}
                <span className="text-signal">{"13–14"}</span>
                {" Проект и карьера"}
                <span className="animate-caret ml-1 inline-block h-4 w-2 align-middle bg-signal" />
              </code>
            </pre>
          </div>
        </div>
      </section>

      <HomeProgram metas={metas} />
    </div>
  );
}
