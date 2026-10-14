export const metadata = { title: "Условия" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Условия использования</h1>
      <p className="text-muted">
        Курс Fullstacker предоставляется «как есть». Материалы можно использовать
        для обучения. Запрещены атаки на сервис, обход лимитов дуэлей, спам и
        распространение вредоносного кода через задания.
      </p>
      <p className="text-muted">
        Бесплатный тариф ограничен по дуэлям. Pro (пока вручную) снимает дневной
        лимит. Администратор может ограничить или заблокировать аккаунт при
        злоупотреблениях.
      </p>
      <p className="text-sm text-muted">Обновлено: 2026-10-10</p>
    </article>
  );
}
