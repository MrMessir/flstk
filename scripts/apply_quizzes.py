#!/usr/bin/env python3
"""
Записывает авторские тесты (по 5 вопросов на урок) из scripts/quizzes/<модуль>.py
в поле quiz файлов content/lessons/<модуль>/<id>.json.

Проверки: ровно 5 вопросов, 4 разных варианта, непустое пояснение,
неповторяющиеся формулировки, варианты не слишком длинные.
Запуск:  python3 scripts/apply_quizzes.py [--check]
"""
import hashlib
import importlib.util
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LESSONS = ROOT / "content" / "lessons"
QUIZ_DIR = Path(__file__).resolve().parent / "quizzes"
QUESTIONS_PER_LESSON = 5


def load_all():
    data = {}
    sys.path.insert(0, str(QUIZ_DIR))
    for path in sorted(QUIZ_DIR.glob("*.py")):
        if path.name.startswith("_"):
            continue
        spec = importlib.util.spec_from_file_location(f"quiz_{path.stem}", path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        for lid, questions in mod.QUIZ.items():
            if lid in data:
                raise SystemExit(f"тест для {lid} задан дважды")
            data[lid] = questions
    return data


def validate(lid, questions):
    problems = []
    if len(questions) != QUESTIONS_PER_LESSON:
        problems.append(f"{lid}: нужно {QUESTIONS_PER_LESSON} вопросов, сейчас {len(questions)}")
    prompts = set()
    for i, q in enumerate(questions, 1):
        tag = f"{lid} q{i}"
        options = [q["correct"], *q["wrong"]]
        if len(set(o.strip().lower() for o in options)) != 4:
            problems.append(f"{tag}: варианты повторяются")
        if any(not o.strip() for o in options):
            problems.append(f"{tag}: пустой вариант")
        if any(len(o) > 160 for o in options):
            problems.append(f"{tag}: вариант длиннее 160 символов")
        if not q["explanation"].strip():
            problems.append(f"{tag}: нет пояснения")
        if q["prompt"] in prompts:
            problems.append(f"{tag}: повторяется формулировка")
        prompts.add(q["prompt"])
    return problems


def build(lid, questions):
    out = []
    for i, q in enumerate(questions, 1):
        options = [q["correct"], *q["wrong"]]
        seed = int(hashlib.sha256(f"{lid}-{i}".encode()).hexdigest()[:8], 16)
        random.Random(seed).shuffle(options)
        out.append(
            {
                "id": f"{lid}-q{i}",
                "prompt": q["prompt"],
                "options": options,
                "correctIndex": options.index(q["correct"]),
                "explanation": q["explanation"],
            }
        )
    return out


def main(check_only):
    data = load_all()
    problems = []
    for lid, questions in data.items():
        problems += validate(lid, questions)
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    if check_only:
        print(f"ok: тестов проверено {len(data)} (вопросов {len(data) * QUESTIONS_PER_LESSON})")
        return
    for lid, questions in data.items():
        matches = list(LESSONS.glob(f"*/{lid}.json"))
        if len(matches) != 1:
            raise SystemExit(f"нет файла для {lid}")
        f = matches[0]
        lesson = json.loads(f.read_text(encoding="utf-8"))
        lesson["quiz"] = build(lid, questions)
        f.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"записано тестов: {len(data)}")


if __name__ == "__main__":
    main("--check" in sys.argv)
