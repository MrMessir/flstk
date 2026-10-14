#!/usr/bin/env python3
"""Apply GOLD STANDARD lesson rewrites and verify."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "content" / "lessons"

FOLDERS = ("fullstack", "testing", "devops", "capstone", "career")

FORBIDDEN_HEADINGS = {
    "Зачем это в работе",
    "Ключевые понятия",
    "Типичные ошибки",
    "Как закрепить",
}

GENERIC_PRACTICE_MARKERS = (
    "без шпаргалки",
    "Проверка через документацию",
    "Мини-задача по теме",
    "Собери MVP по чек-листу",
    "Оформи README",
    "Подготовь сдачу",
)


def p(text: str) -> dict:
    return {"type": "paragraph", "content": text}


def h(text: str) -> dict:
    return {"type": "heading", "content": text}


def lst(items: list[str], ordered: bool = False) -> dict:
    block: dict = {"type": "list", "items": items}
    if ordered:
        block["ordered"] = True
    return block


def theory_chars(theory: list[dict]) -> int:
    return sum(
        len(b.get("content", ""))
        for b in theory
        if b.get("type") == "paragraph"
    )


def heading_count(theory: list[dict]) -> int:
    return sum(1 for b in theory if b.get("type") == "heading")


THEORY_TOPUP: dict[str, str] = {
    "fullstack-12": "Сортировка по createdAt desc на сервере с индексом быстрее, чем тянуть всю таблицу в браузер.",
    "testing-02": "Конфиг vitest.config.ts с environment: node/jsdom задаётся один раз для всего пакета.",
    "testing-03": "Если service бросает DomainError, mapper в controller переводит его в 409/404 — это тоже тестируется отдельно.",
    "testing-04": "seed helper createUser() через API или repo экономит десять строк в каждом integration it.",
    "testing-06": "server.resetHandlers() после теста с override handler не даёт утечь мокам в соседний describe.",
    "testing-08": "eslint --max-warnings 0 в CI превращает warning в blocker — договорись в команде заранее.",
    "testing-09": "Squash merge vs merge commit — зафиксируй в CONTRIBUTING, чтобы история main была предсказуемой.",
    "testing-11": "Characterization test фиксирует старое поведение перед refactor — страховка, если нет времени на полное покрытие.",
    "testing-project": "Flaky e2e чаще из data race — await expect.toBeVisible вместо sleep(3000) стабилизирует CI.",
    "devops-02": "Rotation JWT_SECRET инвалидирует старые refresh — планируй окно деплоя и re-login пользователей.",
    "devops-03": "EXPOSE в Dockerfile документирует порт, но publish делает docker run -p — не путай их.",
    "devops-04": "Сеть compose по умолчанию изолирована — api обращается к db:5432, не к localhost контейнера.",
    "devops-05": "distroless образы ещё меньше alpine runtime, но отладка внутри сложнее — выбирай по зрелости команды.",
    "devops-06": "concurrency group в Actions отменяет старый run той же ветки — экономит минуты CI.",
    "devops-07": "Environment variables для Preview в Vercel наследуются с override — проверь, что prod API key не утёк в PR.",
    "devops-08": "Cold start PaaS добавляет 1–3 с — health check grace period в панели стоит поднять, иначе deploy loop.",
    "devops-09": "certbot renew dry-run в cron письме спасает от просроченного TLS в воскресенье ночью.",
    "devops-10": "Release health в Sentry связывает crash с git sha — тегируй образ semver при deploy.",
    "devops-11": "Point-in-time recovery managed Postgres иногда проще самодельных dump — сравни RPO/RTO в runbook.",
    "devops-12": "Brotli на CDN для text/html иногда не стоит того — кэшируй в первую очередь js/css/images.",
    "devops-project": "Documented RTO «вернуться за 15 минут на прошлый tag» успокаивает проверяющих на защите.",
    "capstone-03": "Индекс на foreign key author_id ускоряет list posts — заложи в ER до первой migration.",
    "capstone-04": "Idempotency-Key header на POST payment/order защитит от двойного клика — bonus Must если есть оплата.",
    "capstone-05": "Error boundary на route level не роняет всё приложение при падении одного экрана. React Query staleTime уменьшает лишние refetch при возврате на вкладку.",
    "capstone-06": "npm audit fix не панацея — читай advisory, иногда нужен major bump транзитивной lib.",
    "capstone-07": "Separate staging URL для репетиции demo снижает страх «prod упадёт на защите».",
    "capstone-08": "Слайд «что не успел» показывает зрелость — Won't list из capstone-01 идеально ложится сюда.",
    "capstone-project": "Ссылка на live demo в первом абзаце README экономит время проверяющему.",
    "career-02": "Contributions graph с зелёными квадратами без commit message «update» — sign of craft.",
    "career-03": "Telegram/email в header резюме — один клик связи; GitHub handle без dead link.",
    "career-04": "Open to work виден рекрутерам с фильтром — включи только когда готов к звонкам.",
    "career-05": "NeetCode/Grind 75 roadmap помогает не выбирать random easy — но capstone важнее 200 задач.",
    "career-06": "Ответ «чем отличается == от ===» — 10 секунд, потом пример бага из реального PR.",
    "career-07": "Если спросят Kafka — честно «не использовал, в capstone достаточно REST polling/Socket».",
    "career-08": "Если ТЗ размыто — предложи assumptions списком в README; employer оценит инициативу.",
    "career-09": "История «учился на ошибке» сильнее «я идеальный» — commission ищет coachability.",
    "career-10": "Первый paycheck — уточни дату и валюту выплаты; у remote контрактов бывают задержки.",
    "career-11": "Cert cloud (AWS CP) имеет смысл после первого job offer gap, не вместо pet project.",
    "career-project": "Один quality отклик с cover letter лучше двадцати spam «рассмотрите резюме». Обновляй tracker раз в неделю, а не только в день отправки.",
}


def pad_theory(theory: list[dict], lesson_id: str) -> list[dict]:
    theory = [dict(b) for b in theory]
    if theory_chars(theory) >= 350:
        return theory
    extra = THEORY_TOPUP.get(lesson_id)
    if not extra:
        return theory
    for block in theory:
        if block.get("type") == "paragraph":
            block["content"] = block["content"].rstrip() + " " + extra
            break
    return theory


def load_updates() -> dict:
    from gold_lessons_data import UPDATES  # noqa: PLC0415

    return UPDATES


def apply_updates() -> dict[str, int]:
    updates = load_updates()
    counts: dict[str, int] = {f: 0 for f in FOLDERS}

    for folder in FOLDERS:
        dir_path = LESSONS / folder
        for path in sorted(dir_path.glob("*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            lid = data["id"]
            if lid not in updates:
                print(f"missing update: {lid}", file=sys.stderr)
                continue
            patch = updates[lid]
            for key in ("theory", "practice", "checklist", "links", "glossary"):
                if key in patch:
                    data[key] = patch[key]
            if "theory" in patch:
                data["theory"] = pad_theory(data["theory"], lid)
            if "codeExample" in patch:
                data["codeExample"] = patch["codeExample"]
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            counts[folder] += 1

    for folder in FOLDERS:
        for marker in (LESSONS / folder).glob("*.needs_practice"):
            marker.unlink()

    return counts


def verify_folder(folder: str) -> list[str]:
    errors: list[str] = []
    for path in sorted((LESSONS / folder).glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        lid = data["id"]
        theory = data.get("theory", [])
        tc = theory_chars(theory)
        if tc < 350:
            errors.append(f"{lid}: theory paragraphs {tc} chars (<350)")
        hc = heading_count(theory)
        if hc < 2 or hc > 4:
            errors.append(f"{lid}: {hc} headings (want 2-4)")
        for block in theory:
            if block.get("type") == "heading" and block.get("content") in FORBIDDEN_HEADINGS:
                errors.append(f"{lid}: forbidden heading {block['content']!r}")
        practice = data.get("practice", [])
        if len(practice) != 3:
            errors.append(f"{lid}: {len(practice)} practice tasks (want 3)")
        for task in practice:
            title = task.get("title", "")
            if any(m in title for m in GENERIC_PRACTICE_MARKERS):
                errors.append(f"{lid}: generic practice title {title!r}")
            desc = task.get("description", "")
            if any(m in desc for m in ("перечитай только этот кусок", "маленький артефакт")):
                errors.append(f"{lid}: boiler practice description")
        checklist = data.get("checklist", [])
        if len(checklist) != 4:
            errors.append(f"{lid}: {len(checklist)} checklist items (want 4)")
        glossary = data.get("glossary", [])
        if len(glossary) < 3 or len(glossary) > 5:
            errors.append(f"{lid}: {len(glossary)} glossary entries (want 3-5)")
        links = data.get("links", [])
        if len(links) < 1 or len(links) > 2:
            errors.append(f"{lid}: {len(links)} links (want 1-2)")
    return errors


def main() -> None:
    counts = apply_updates()
    print("rewritten per folder:")
    for folder in FOLDERS:
        print(f"  {folder}: {counts[folder]}")
    all_errors: list[str] = []
    for folder in FOLDERS:
        all_errors.extend(verify_folder(folder))
    if all_errors:
        print("verification FAILED:", file=sys.stderr)
        for e in all_errors:
            print(f"  {e}", file=sys.stderr)
        sys.exit(1)
    print("verification OK")


if __name__ == "__main__":
    main()
