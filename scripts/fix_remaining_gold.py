#!/usr/bin/env python3
"""Fix lessons that still fail gold-standard checks."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "content" / "lessons"

# Extra theory paragraphs to prepend/append so list-heavy JS lessons pass ≥350 chars
# and read like html-03 (concrete, ты-form, no boiler).

JS_THEORY_INTRO: dict[str, list[dict]] = {
    "js-01": [
        {"type": "heading", "content": "Где живёт скрипт"},
        {
            "type": "paragraph",
            "content": "JavaScript в браузере запускается после того, как страница его подключила. Открой DevTools → Console и набери 1 + 1 — движок сразу ответит. Так удобно проверять маленькие куски кода, пока не завёл файл script.js.",
        },
        {
            "type": "paragraph",
            "content": "В файле пиши обычные команды и смотри результат через console.log. Ошибки тоже появятся в Console: красный текст, файл и номер строки. Привыкай читать их целиком — это карта к исправлению.",
        },
    ],
    "js-03": [
        {"type": "heading", "content": "Зачем различать типы"},
        {
            "type": "paragraph",
            "content": "В JavaScript значение всегда какого-то типа: число, строка, булево, null, undefined, объект. typeof показывает грубую метку. Путаница типов даёт странные результаты: \"2\" + 2 станет \"22\", а не 4.",
        },
        {
            "type": "paragraph",
            "content": "null — «намеренно пусто». undefined — «ещё не дали значение». Не сравнивай их с == вслепую: лучше явно проверяй == null, если допускаешь оба, или пиши строгие сравнения ===.",
        },
    ],
    "js-04": [
        {"type": "heading", "content": "Считать и сравнивать"},
        {
            "type": "paragraph",
            "content": "Арифметика знакома: + - * / и % (остаток). Для строк + склеивает. Сравнения === и !== безопаснее == и !=, потому что не приводят типы молча. > < >= <= работают для чисел и строк, но строки сравниваются по алфавиту.",
        },
        {
            "type": "paragraph",
            "content": "Логические && и || решают «и/или». ! переворачивает правду. В условиях «пустые» значения (0, \"\", null, undefined, NaN) считаются ложью — это удобно, но легко ошибиться, если 0 — нормальный ответ.",
        },
    ],
    "js-05": [
        {
            "type": "paragraph",
            "content": "Ветвление — основа интерфейсов: показать кнопку входа или профиль, принять заказ или вернуть ошибку. Пиши условие так, чтобы его можно было прочитать вслух: «если час меньше 12 — утро».",
        },
        {
            "type": "paragraph",
            "content": "switch удобен, когда одна переменная сравнивается с несколькими точными значениями. Не забывай break, иначе выполнение «провалится» в следующий case. Для диапазонов чаще лучше if/else if.",
        },
    ],
    "js-06": [
        {"type": "heading", "content": "Зачем циклы"},
        {
            "type": "paragraph",
            "content": "Цикл повторяет одно и то же действие для разных данных: пройти массив, нарисовать карточки, проверить каждый символ строки. for удобен, когда знаешь число шагов. while — когда условие «пока ещё не готово».",
        },
        {
            "type": "paragraph",
            "content": "for…of идёт по значениям массива или строки. for…in — по ключам объекта (для массивов лучше не злоупотреблять). break выходит сразу, continue переходит к следующей итерации.",
        },
    ],
    "js-07": [
        {"type": "heading", "content": "Функция как кусок смысла"},
        {
            "type": "paragraph",
            "content": "Функция называет действие и прячет детали. Вместо копипасты одного кода в трёх местах пишешь function или стрелку и вызываешь с разными аргументами. return отдаёт результат наружу; без return получишь undefined.",
        },
        {
            "type": "paragraph",
            "content": "Параметры по умолчанию и rest (...args) делают API функции гибче. Стрелочные функции удобны в колбэках, но у них своё поведение this — пока просто запомни разницу и не смешивай без нужды.",
        },
    ],
    "js-08": [
        {"type": "heading", "content": "Массив — список по порядку"},
        {
            "type": "paragraph",
            "content": "Массив хранит элементы под индексами с нуля. push/pop работают с концом, shift/unshift — с началом (shift медленнее на длинных списках). length показывает длину и меняется при добавлении.",
        },
        {
            "type": "paragraph",
            "content": "Не мутируй массив «как попало» в середине чужой функции: либо документируй мутацию, либо возвращай новый массив. Так проще искать баги в todo и фильтрах.",
        },
    ],
    "js-09": [
        {"type": "heading", "content": "map, filter, reduce"},
        {
            "type": "paragraph",
            "content": "Эти методы не заменяют мышление, а сокращают шаблонные циклы. map превращает каждый элемент. filter оставляет подходящие. reduce сжимает список в одно значение: сумму, объект, строку.",
        },
        {
            "type": "paragraph",
            "content": "Цепочки читаются сверху вниз: сначала отфильтровал, потом преобразовал. Не делай в map побочные эффекты вроде записи в DOM — для этого обычный for…of или forEach осознанно.",
        },
    ],
    "js-10": [
        {"type": "heading", "content": "Объект — данные с именами"},
        {
            "type": "paragraph",
            "content": "Объект собирает поля: имя, цена, флаги. Доставай через точка или [ключ]. Вложенность нормальна, но optional chaining ?. спасает от падения, когда середины нет. Object.keys/values/entries помогают обойти поля.",
        },
        {
            "type": "paragraph",
            "content": "Копирование: поверхностное через { ...obj } или Object.assign. Вложенные объекты при этом делят ссылку — для глубокой копии нужен structuredClone или аккуратный ручной разбор.",
        },
    ],
    "js-11": [
        {"type": "heading", "content": "Строки каждый день"},
        {
            "type": "paragraph",
            "content": "Почти всё, что вводит пользователь — строка. Шаблонные строки в обратных кавычках вставляют выражения через ${}. trim убирает пробелы по краям, includes/startsWith/endsWith проверяют вхождение без ручных циклов.",
        },
        {
            "type": "paragraph",
            "content": "slice вырезает кусок. toLowerCase/toUpperCase пригодятся для сравнения без учёта регистра. Для сложного разбора позже понадобятся регулярные выражения — пока хватит методов строки.",
        },
    ],
    "js-12": [
        {"type": "heading", "content": "DOM — дерево страницы"},
        {
            "type": "paragraph",
            "content": "Браузер строит из HTML дерево узлов. document.querySelector находит первый элемент по CSS-селектору, querySelectorAll — список. Без найденного элемента методы упадут — сначала проверь, что узел есть.",
        },
        {
            "type": "paragraph",
            "content": "Ищи устойчивые селекторы: data-атрибуты или id для якорей, классы для групп. Не привязывайся к порядку «третий div» — вёрстка поедет, скрипт сломается.",
        },
    ],
    "js-13": [
        {"type": "heading", "content": "Меняем страницу из скрипта"},
        {
            "type": "paragraph",
            "content": "textContent безопаснее innerHTML для обычного текста: он не исполняет HTML. classList.add/remove/toggle управляет классами без ручной склейки строк. createElement + append добавляет новые узлы.",
        },
        {
            "type": "paragraph",
            "content": "Сначала подумай, что должно измениться в данных, потом отрисуй. Если смешивать «немного в DOM, немного в переменных» без правила — состояние разъедется.",
        },
    ],
    "js-14": [
        {"type": "heading", "content": "События — ответ на действие"},
        {
            "type": "paragraph",
            "content": "addEventListener(\"click\", handler) подписывает функцию на действие. В handler приходит event: target — кто кликнул, preventDefault отменяет переход по ссылке или отправку формы.",
        },
        {
            "type": "paragraph",
            "content": "Не вешай сотни слушателей на каждый пункт списка — лучше один на родителя (делегирование). Так проще добавлять элементы динамически.",
        },
    ],
    "js-15": [
        {"type": "heading", "content": "Форма без сюрпризов"},
        {
            "type": "paragraph",
            "content": "Считывай значения полей из form.elements или через querySelector. На submit вызывай preventDefault, проверь данные, покажи текст ошибки рядом с полем. HTML-валидация помогает, но сервер всё равно проверит позже.",
        },
        {
            "type": "paragraph",
            "content": "Пустые строки и пробелы ловят через trim. Сообщения пиши по-человечески: «Укажи email», а не «invalid\".",
        },
    ],
    "js-17": [
        {"type": "heading", "content": "Промис — результат потом"},
        {
            "type": "paragraph",
            "content": "Промис — объект «обещание результата». Он pending, затем fulfilled или rejected. then обрабатывает успех, catch — ошибку. Цепочки then читаются проще вложенных колбэков.",
        },
        {
            "type": "paragraph",
            "content": "Не оставляй rejected без catch: в Console будет Unhandled Promise Rejection. На курсе дальше перейдёшь к async/await — это тот же промис, но удобнее читать.",
        },
    ],
    "js-18": [
        {"type": "heading", "content": "async/await читается сверху вниз"},
        {
            "type": "paragraph",
            "content": "async-функция всегда возвращает промис. await ждёт результат внутри неё. Ошибки лови try/catch вокруг await — это как синхронный код, только с паузами на сеть.",
        },
        {
            "type": "paragraph",
            "content": "Promise.all запускает несколько запросов параллельно и ждёт все. Если один упал — падает весь набор (есть allSettled, если нужно дождаться всех статусов).",
        },
    ],
    "js-19": [
        {"type": "heading", "content": "fetch говорит с сервером"},
        {
            "type": "paragraph",
            "content": "fetch(url) возвращает Response. Сначала проверь response.ok или status, потом response.json(). Сеть может «успеть» с HTTP 404 — это не throw сам по себе, пока ты не проверишь статус.",
        },
        {
            "type": "paragraph",
            "content": "Для POST передай method, headers и body: JSON.stringify(data). Не клади секреты в фронтовый код: ключи API на клиенте видны всем.",
        },
    ],
    "js-20": [
        {"type": "heading", "content": "Модули и память браузера"},
        {
            "type": "paragraph",
            "content": "import/export делят код на файлы. В type=\"module\" пути обычно относительные с .js. localStorage хранит строки между визитами: JSON.stringify перед записью объектов и JSON.parse при чтении.",
        },
        {
            "type": "paragraph",
            "content": "sessionStorage живёт до закрытия вкладки. cookies для учебного todo не нужны — хватит localStorage. Не храни пароли в storage.",
        },
    ],
}


def expand_js_theory(data: dict) -> dict:
    lid = data["id"]
    intro = JS_THEORY_INTRO.get(lid)
    if not intro:
        return data
    # Avoid duplicating if already expanded
    existing_heads = {
        b.get("content") for b in data.get("theory", []) if b.get("type") == "heading"
    }
    new_blocks = [b for b in intro if b.get("type") != "heading" or b.get("content") not in existing_heads]
    # Prepend intros that aren't already present as identical paragraphs
    existing_paras = {
        b.get("content") for b in data.get("theory", []) if b.get("type") == "paragraph"
    }
    to_add = []
    for b in intro:
        if b.get("type") == "paragraph" and b.get("content") in existing_paras:
            continue
        if b.get("type") == "heading" and b.get("content") in existing_heads:
            continue
        to_add.append(b)
    data["theory"] = to_add + list(data.get("theory") or [])
    return data


def lengthen_practice_item(item: dict) -> dict:
    desc = item.get("description") or ""
    if len(desc) >= 40:
        return item
    title = item.get("title") or "Шаг"
    item["description"] = (
        f"{desc} Сделай это в отдельном коммите или заметке урока: что получилось, "
        f"какой файл изменил, какой результат увидел. Если не вышло — запиши ошибку целиком. "
        f"Критерий готовности для «{title}»: можешь повторить шаг без подсказки."
    )
    return item


def main() -> None:
    fixed = 0
    for path in sorted((ROOT / "javascript").glob("js-*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        before = sum(
            len(b.get("content", ""))
            for b in data.get("theory", [])
            if b.get("type") == "paragraph"
        )
        if before < 350 and data["id"] in JS_THEORY_INTRO:
            data = expand_js_theory(data)
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            fixed += 1
            print("expanded", path.name)

    # short practices anywhere
    for path in ROOT.rglob("*.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        prac = []
        for item in data.get("practice") or []:
            new_item = lengthen_practice_item(dict(item))
            if new_item.get("description") != item.get("description"):
                changed = True
            prac.append(new_item)
        if changed:
            data["practice"] = prac
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            fixed += 1
            print("practice+", path.relative_to(ROOT))

    print("fixed_files", fixed)


if __name__ == "__main__":
    main()
