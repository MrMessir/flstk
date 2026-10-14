#!/usr/bin/env python3
"""
Убирает одинаковые блоки теории, которые enrich_theory() раньше добавлял
в каждый «тонкий» урок модуля. Оставляет по одному экземпляру на модуль:
в первом уроке (<part>-01) и в уроке-проекте (<part>-project).

Идемпотентен. Запуск:  python3 scripts/dedupe_boilerplate.py [--dry-run]
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESSONS = ROOT / "content" / "lessons"
KEEP_SUFFIXES = ("-01", "-project")
MIN_REPEATS = 3  # блок, повторённый в >=3 уроках модуля, считаем шаблоном


def key(block: dict) -> str:
    return json.dumps(block, ensure_ascii=False, sort_keys=True)


def main(dry: bool) -> None:
    removed_total = 0
    for part_dir in sorted(p for p in LESSONS.iterdir() if p.is_dir()):
        files = sorted(part_dir.glob("*.json"))
        data = {f: json.loads(f.read_text(encoding="utf-8")) for f in files}
        freq: Counter[str] = Counter()
        for lesson in data.values():
            for k in {key(b) for b in lesson.get("theory", [])}:
                freq[k] += 1
        boiler = {k for k, n in freq.items() if n >= MIN_REPEATS}
        if not boiler:
            continue
        changed = 0
        for f, lesson in data.items():
            if f.stem.endswith(KEEP_SUFFIXES):
                continue
            theory = lesson.get("theory", [])
            kept = [b for b in theory if key(b) not in boiler]
            if len(kept) != len(theory):
                removed_total += len(theory) - len(kept)
                changed += 1
                if not dry:
                    lesson["theory"] = kept
                    f.write_text(
                        json.dumps(lesson, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8",
                    )
        print(f"{part_dir.name:11} шаблонных блоков: {len(boiler)}, уроков изменено: {changed}")
    print(f"Удалено блоков: {removed_total}{' (dry-run)' if dry else ''}")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
