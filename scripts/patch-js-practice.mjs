import fs from "fs";
import path from "path";

const dir = path.resolve("content/lessons/javascript");

const patches = {
  "js-01": [
    {
      title: "script.js и консоль",
      description:
        "Создай index.html с <script src=\"script.js\"></script> в конце body. В script.js две строки console.log с именем и суммой 2+2. Открой F12 → Console, обнови страницу — обе строки видны.",
    },
    {
      title: "defer в head",
      description:
        "Второй файл defer.html: <script src=\"script.js\" defer></script> в head, body с одним абзацем. Убедись, что скрипт выполняется после разметки (в консоли нет ошибок querySelector null).",
    },
    {
      title: "Ошибка в консоли",
      description:
        "Временно добавь console.log(unknownVar). Прочитай красное сообщение ReferenceError, исправь файл и снова получи чистую консоль после F5.",
    },
  ],
  "js-02": [
    {
      title: "let counter и const PI",
      description:
        "В variables.js объяви let counter = 0 и const PI = 3.14. Увеличь counter на 1, выведи оба в консоль. Попробуй PI = 2 — зафиксируй TypeError/ SyntaxError в assignment.",
    },
    {
      title: "Переименование let",
      description:
        "let message = \"старт\"; присвой message = \"финиш\"; console.log(message). var old = 1 в том же файле — объясни в комментарии, почему в новом коде берёшь let.",
    },
    {
      title: "Блок и область",
      description:
        "В if (true) { let blockOnly = 42; } попробуй console.log(blockOnly) снаружи — ReferenceError. Вынеси let наверх и повтори успешный вывод.",
    },
  ],
  "js-03": [
    {
      title: "typeof для пяти значений",
      description:
        "В types.js выведи typeof для \"text\", 0, true, undefined и null. Запиши результаты в комментарии. Объясни строку typeof null.",
    },
    {
      title: "Строка против числа",
      description:
        "console.log(\"10\" + 5) и console.log(10 + 5). Добавь Number(\"10\") + 5. Скрин или копия вывода в notes.txt.",
    },
    {
      title: "Объект и массив",
      description:
        "typeof {} и typeof [1,2] — оба object. Проверь Array.isArray([1]) === true и Array.isArray({}) === false в консоли.",
    },
  ],
  "js-04": [
    {
      title: "Калькулятор скидки",
      description:
        "price = 1000, discount = 0.15. Выведи итог price * (1 - discount) и price % 3. Ожидай 850 и 1.",
    },
    {
      title: "Сравнения === и ==",
      description:
        "Сравни 0 == false и 0 === false в console.log. Запиши, какой оператор использовать в проектах.",
    },
    {
      title: "Приоритет операторов",
      description:
        "Вычисли 2 + 3 * 4 и (2 + 3) * 4. Добавь унарный + перед строкой \"42\" и выведи typeof результата.",
    },
  ],
  "js-05": [
    {
      title: "if по возрасту",
      description:
        "age = 17. if/else: «можно в кино» при age >= 18, иначе «рано». Поменяй age на 20 — текст меняется.",
    },
    {
      title: "switch по дню",
      description:
        "const day = 3; switch(day) { case 1: ... case 7: ... default: }. Выведи название дня недели для 3 и для 9 (default).",
    },
    {
      title: "Тернарный оператор",
      description:
        "const role = \"guest\"; const label = role === \"admin\" ? \"Панель\" : \"Сайт\"; выведи label. Замени role на admin — «Панель».",
    },
  ],
  "js-06": [
    {
      title: "for от 1 до 5",
      description:
        "Цикл for выводит сумму 1+2+3+4+5 в переменную sum. console.log(sum) === 15.",
    },
    {
      title: "while обратный отсчёт",
      description:
        "let n = 3; while (n > 0) { console.log(n); n--; }. Последняя строка 1, затем цикл завершается.",
    },
    {
      title: "break при первом чётном",
      description:
        "Массив [1,3,4,5]. for...of: при первом чётном выведи число и break. В консоли только 4.",
    },
  ],
  "js-07": [
    {
      title: "Функция greet",
      description:
        "function greet(name) { return `Привет, ${name}`; }. Вызов greet(\"Мира\") в console.log. Без name функция не должна падать — передай default parameter = \"гость\".",
    },
    {
      title: "Стрелочная double",
      description:
        "const double = (n) => n * 2; проверь double(4) === 8. Функция square через function declaration — оба стиля в одном файле functions.js.",
    },
    {
      title: "Параметры по умолчанию",
      description:
        "function power(base, exp = 2) возвращает base ** exp. power(3) → 9, power(2,3) → 8.",
    },
  ],
  "js-08": [
    {
      title: "Массив todos",
      description:
        "const todos = [\"HTML\", \"CSS\", \"JS\"]; console.log(todos[0], todos.length). todos.push(\"Git\") — длина 4.",
    },
    {
      title: "for...of список",
      description:
        "Напечатай каждый todo с номером: 1. HTML. Используй for...of и счётчик или entries().",
    },
    {
      title: "includes и indexOf",
      description:
        "Проверь todos.includes(\"CSS\") и indexOf(\"JS\"). Удали элемент через filter без mutating исходного массива — новый массив на 3 элемента.",
    },
  ],
  "js-09": [
    {
      title: "map цены ×2",
      description:
        "const prices = [100, 200]; const doubled = prices.map(p => p * 2); console.log(doubled) → [200,400].",
    },
    {
      title: "filter только активные",
      description:
        "users = [{name:'A', active:true},{name:'B', active:false}]. filter active → один объект. map to names → [\"A\"].",
    },
    {
      title: "reduce сумма",
      description:
        "reduce массива [1,2,3,4] в sum === 10. Затем reduce того же массива в строку \"1-2-3-4\" через join в аккумуляторе.",
    },
  ],
  "js-10": [
    {
      title: "Объект user",
      description:
        "const user = { name: \"Аня\", city: \"Казань\", age: 20 }; выведи user.city и user[\"name\"].",
    },
    {
      title: "Метод describe",
      description:
        "Добавь method describe() { return `${this.name}, ${this.city}`; }. Вызов user.describe() в консоли.",
    },
    {
      title: "Spread копия",
      description:
        "const updated = { ...user, city: \"Москва\" }; user.city не меняется, updated.city === \"Москва\".",
    },
  ],
  "js-11": [
    {
      title: "trim и length",
      description:
        "const raw = \"  hello  \"; console.log(raw.trim(), raw.trim().length) → hello и 5.",
    },
    {
      title: "includes и startsWith",
      description:
        "email = \"user@mail.ru\"; проверь includes(\"@\") && endsWith(\".ru\"). Для \"bad\" выведи false.",
    },
    {
      title: "slice и replace",
      description:
        "\"fullstacker\".slice(0,4) → \"full\". replace(\"stack\",\"STACK\") один раз — зафиксируй результат.",
    },
  ],
  "js-12": [
    {
      title: "querySelector заголовок",
      description:
        "index.html с h1#title. В dom.js const el = document.querySelector(\"#title\"); console.log(el.textContent).",
    },
    {
      title: "querySelectorAll",
      description:
        "Три li.menu-item. querySelectorAll(\".menu-item\").length === 3. forEach выведи textContent каждого.",
    },
    {
      title: "null без элемента",
      description:
        "querySelector(\"#missing\") → null. if (!el) console.log(\"не найден\") — без ошибки reading textContent.",
    },
  ],
  "js-13": [
    {
      title: "textContent и classList",
      description:
        "По кнопке #btn меняй #msg textContent на «Нажато» и добавляй classList.add(\"active\").",
    },
    {
      title: "createElement список",
      description:
        "Кнопка «Добавить» создаёт li через createElement, append в ul#list. Без innerHTML для одного li.",
    },
    {
      title: "dataset и атрибут",
      description:
        "Кнопке data-id=\"42\". В handler прочитай event.currentTarget.dataset.id — строка \"42\".",
    },
  ],
  "js-14": [
    {
      title: "click счётчик",
      description:
        "let clicks = 0; button click → clicks++, span#count показывает число. Без перезагрузки.",
    },
    {
      title: "input live",
      description:
        "input#name, p#preview. Слушатель input обновляет preview textContent текущим value.",
    },
    {
      title: "keydown Enter",
      description:
        "На input keydown: если e.key === \"Enter\", preventDefault и console.log value. Не отправляет форму.",
    },
  ],
  "js-15": [
    {
      title: "email regex простой",
      description:
        "Функция isEmail(s) проверяет наличие @ и точки после. Форма submit: если false — показать #error, preventDefault.",
    },
    {
      title: "min length пароля",
      description:
        "password.length >= 8 иначе сообщение «минимум 8». Успешный submit очищает error.",
    },
    {
      title: "aria-invalid",
      description:
        "При ошибке input.setAttribute('aria-invalid','true'), при успехе 'false'. Проверь в Elements панели.",
    },
  ],
  "js-16": [
    {
      title: "setTimeout сообщение",
      description:
        "Через 2000 ms после load console.log(\"готово\"). ID таймера сохрани в переменную.",
    },
    {
      title: "clearTimeout",
      description:
        "Кнопка «Отмена» вызывает clearTimeout(id) до срабатывания — «готово» не появляется.",
    },
    {
      title: "setInterval секунды",
      description:
        "Каждую 1000 ms увеличивай #sec на 1. Кнопка stop — clearInterval. Счёт останавливается.",
    },
  ],
  "js-17": [
    {
      title: "Promise resolve",
      description:
        "new Promise(res => setTimeout(() => res(7), 100)).then(console.log) — вывод 7.",
    },
    {
      title: "Promise reject catch",
      description:
        "Promise.reject(new Error('fail')).catch(e => console.log(e.message)) — «fail», скрипт не падает.",
    },
    {
      title: "Цепочка then",
      description:
        "Promise.resolve(2).then(n => n * 3).then(n => n + 1).then(console.log) → 7.",
    },
  ],
  "js-18": [
    {
      title: "async fetch пост",
      description:
        "async function load() { const r = await fetch('https://jsonplaceholder.typicode.com/posts/1'); const data = await r.json(); console.log(data.title); } load();",
    },
    {
      title: "try/catch async",
      description:
        "await fetch неверного URL в try/catch — выведи «сеть» в catch, без uncaught promise.",
    },
    {
      title: "parallel Promise.all",
      description:
        "const [a,b] = await Promise.all([fetch('/posts/1'), fetch('/posts/2')] — два json title в консоли (или mock URLs).",
    },
  ],
  "js-19": [
    {
      title: "fetch JSON список",
      description:
        "fetch https://jsonplaceholder.typicode.com/users выведи names первых трёх в ul через map+innerHTML или createElement.",
    },
    {
      title: "response.ok",
      description:
        "if (!response.ok) throw new Error(response.status). Проверь на URL /users/9999 — покажи status в UI.",
    },
    {
      title: "Заголовок Accept",
      description:
        "fetch с headers: { Accept: 'application/json' }. В Network вкладке Request Headers содержит Accept.",
    },
  ],
  "js-20": [
    {
      title: "storage.js module",
      description:
        "export function saveNote(text) { localStorage.setItem('note', text); } export function loadNote() { return localStorage.getItem('note') ?? ''; }. main.js type=module импортирует и выводит в textarea.",
    },
    {
      title: "Сохранение по blur",
      description:
        "textarea input или blur вызывает saveNote(value). F5 восстанавливает текст через loadNote.",
    },
    {
      title: "Разделение main/storage",
      description:
        "В storage нет document.querySelector — только localStorage. main.js не вызывает setItem напрямую.",
    },
  ],
};

for (const [id, practice] of Object.entries(patches)) {
  const file = path.join(dir, `${id}.json`);
  const lesson = JSON.parse(fs.readFileSync(file, "utf8"));
  lesson.practice = practice;
  fs.writeFileSync(file, JSON.stringify(lesson, null, 2) + "\n");
  console.log("patched", id);
}
