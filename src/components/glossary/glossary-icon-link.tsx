import Link from "next/link";

type GlossaryIconLinkProps = {
  lessonId?: string;
  className?: string;
};

export function GlossaryIconLink({
  lessonId,
  className = "",
}: GlossaryIconLinkProps) {
  const href = lessonId ? `/glossary?lesson=${lessonId}` : "/glossary";

  return (
    <Link
      href={href}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-paper-elevated text-ink transition-colors hover:border-accent hover:text-accent ${className}`}
      title="Словарь"
      aria-label="Открыть словарь"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5z" />
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </svg>
    </Link>
  );
}
