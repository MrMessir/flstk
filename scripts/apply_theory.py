#!/usr/bin/env python3
"""
Записывает авторскую теорию из scripts/theory/<модуль>.py в content/lessons/<модуль>/<id>.json.
Источник правды для этих уроков — файлы в scripts/theory/. Остальные поля урока не меняются.

Проверки: нет одинаковых абзацев в разных уроках, минимальный объём, есть заголовки.
Запуск:  python3 scripts/apply_theory.py [--check]
"""
import importlib.util
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESSONS = ROOT / "content" / "lessons"
THEORY_DIR = Path(__file__).resolve().parent / "theory"
MIN_CHARS = 1500


def text_of(block):
    return block.get("content") or " ".join(block.get("items", []))


def load_all():
    data = {}
    for path in sorted(THEORY_DIR.glob("*.py")):
        if path.name.startswith("_"):
            continue
        spec = importlib.util.spec_from_file_location(f"theory_{path.stem}", path)
        mod = importlib.util.module_from_spec(spec)
        sys.path.insert(0, str(THEORY_DIR))
        spec.loader.exec_module(mod)
        data.update(mod.THEORY)
    return data


def main(check_only):
    data = load_all()
    seen = defaultdict(set)
    problems = []
    for lid, blocks in data.items():
        total = sum(len(text_of(b)) for b in blocks)
        if total < MIN_CHARS:
            problems.append(f"{lid}: мало текста ({total} < {MIN_CHARS})")
        if sum(1 for b in blocks if b["type"] == "heading") < 2:
            problems.append(f"{lid}: меньше двух заголовков")
        for b in blocks:
            if b["type"] != "heading":
                seen[text_of(b)].add(lid)
    for t, ids in seen.items():
        if len(ids) > 1:
            problems.append(f"повтор текста в {sorted(ids)}: {t[:60]}…")
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    if check_only:
        print(f"ok: {len(data)} уроков проверено")
        return
    for lid, blocks in data.items():
        matches = list(LESSONS.glob(f"*/{lid}.json"))
        if len(matches) != 1:
            print(f"нет файла для {lid}")
            sys.exit(1)
        f = matches[0]
        lesson = json.loads(f.read_text(encoding="utf-8"))
        lesson["theory"] = blocks
        f.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"записано уроков: {len(data)}")


if __name__ == "__main__":
    main("--check" in sys.argv)
