import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

/** @typedef {{ term: string, meaning: string, example: string }} GlossaryEntry */

/** @type {Record<string, GlossaryEntry[]>} */
const GLOSSARY = {
  "html-01": [
    { term: "HTML", meaning: "Язык разметки: описывает, что есть на странице.", example: "<h1>Привет</h1>" },
    { term: "браузер", meaning: "Программа, которая открывает сайты и рисует страницу по HTML.", example: "Chrome, Firefox, Safari" },
    { term: "<body>", meaning: "Блок с тем, что видно человеку на странице.", example: "<body><p>Текст</p></body>" },
    { term: "тег", meaning: "Пометка в угловых скобках, которую читает браузер.", example: "<p>абзац</p>" },
  ],
  "html-02": [
    { term: "<!DOCTYPE html>", meaning: "Первая строка файла: «это современная HTML-страница».", example: "<!DOCTYPE html>" },
    { term: "<html lang=\"ru\">", meaning: "Корень страницы. lang говорит, что текст на русском.", example: "<html lang=\"ru\">...</html>" },
    { term: "<head>", meaning: "Служебный блок: заголовок вкладки, кодировка, стили.", example: "<head><title>Сайт</title></head>" },
    { term: "<meta charset=\"UTF-8\">", meaning: "Чтобы русские буквы отображались правильно.", example: "<meta charset=\"UTF-8\" />" },
    { term: "<title>", meaning: "Текст на вкладке браузера.", example: "<title>Моя страница</title>" },
  ],
  "html-03": [
    { term: "атрибут", meaning: "Уточнение на открывающем теге: имя=\"значение\".", example: "<h1 title=\"Подсказка\">" },
    { term: "title", meaning: "Подсказка при наведении мыши.", example: "<span title=\"Это подсказка\">текст</span>" },
    { term: "id", meaning: "Уникальное имя элемента на странице.", example: "<h1 id=\"start\">" },
    { term: "<strong>", meaning: "Важный текст, обычно жирный.", example: "<strong>важно</strong>" },
    { term: "<br />", meaning: "Перенос строки внутри абзаца.", example: "строка 1<br />строка 2" },
  ],
  "html-04": [
    { term: "<h1>…<h6>", meaning: "Заголовки. h1 — главный, дальше по уровням.", example: "<h1>Тема</h1><h2>Раздел</h2>" },
    { term: "<p>", meaning: "Абзац текста.", example: "<p>Один абзац.</p>" },
    { term: "<em>", meaning: "Смысловое ударение, обычно курсив.", example: "<em>именно так</em>" },
    { term: "<blockquote>", meaning: "Цитата или отдельная выделенная фраза.", example: "<blockquote><p>Цитата</p></blockquote>" },
    { term: "<code>", meaning: "Кусочек кода внутри текста.", example: "<code>&lt;p&gt;</code>" },
  ],
  "html-05": [
    { term: "<ul>", meaning: "Список без строгого порядка (точки).", example: "<ul><li>хлеб</li></ul>" },
    { term: "<ol>", meaning: "Нумерованный список шагов.", example: "<ol><li>Открыть файл</li></ol>" },
    { term: "<li>", meaning: "Один пункт списка.", example: "<li>Пункт</li>" },
    { term: "<a href>", meaning: "Ссылка. href — куда ведёт.", example: "<a href=\"https://example.com\">Сайт</a>" },
    { term: "якорь #", meaning: "Ссылка на место на этой же странице.", example: "<a href=\"#end\">Вниз</a>" },
  ],
  "html-06": [
    { term: "<img>", meaning: "Картинка. Одиночный тег.", example: "<img src=\"cat.jpg\" alt=\"Кот\" />" },
    { term: "src", meaning: "Адрес файла картинки или видео.", example: "src=\"photo.jpg\"" },
    { term: "alt", meaning: "Текст, если картинка не загрузилась; описание для доступности.", example: "alt=\"Рыжий кот\"" },
    { term: "<figure> / <figcaption>", meaning: "Картинка вместе с подписью.", example: "<figure><img ... /><figcaption>Подпись</figcaption></figure>" },
    { term: "<video controls>", meaning: "Видео с кнопками play/pause.", example: "<video controls><source src=\"clip.mp4\" type=\"video/mp4\" /></video>" },
  ],
  "html-07": [
    { term: "<header>", meaning: "Шапка страницы: название и часто меню.", example: "<header><p>Сайт</p></header>" },
    { term: "<nav>", meaning: "Блок навигационных ссылок.", example: "<nav><a href=\"#\">Меню</a></nav>" },
    { term: "<main>", meaning: "Главное уникальное содержимое страницы. Один на страницу.", example: "<main>...</main>" },
    { term: "<section>", meaning: "Раздел с темой и обычно заголовком.", example: "<section><h2>Обо мне</h2></section>" },
    { term: "<footer>", meaning: "Подвал: год, контакты, второстепенные ссылки.", example: "<footer><p>2026</p></footer>" },
  ],
  "html-08": [
    { term: "<table>", meaning: "Таблица для данных в строках и колонках.", example: "<table>...</table>" },
    { term: "<tr>", meaning: "Одна строка таблицы.", example: "<tr><td>Ячейка</td></tr>" },
    { term: "<th>", meaning: "Ячейка-заголовок колонки или строки.", example: "<th>День</th>" },
    { term: "<td>", meaning: "Обычная ячейка с данными.", example: "<td>HTML</td>" },
    { term: "colspan", meaning: "Ячейка занимает несколько колонок.", example: "<td colspan=\"2\">Выходной</td>" },
  ],
  "html-09": [
    { term: "<form>", meaning: "Анкета на странице: собирает ответы полей.", example: "<form method=\"get\">...</form>" },
    { term: "<input>", meaning: "Поле ввода.", example: "<input type=\"text\" name=\"name\" />" },
    { term: "<label>", meaning: "Подпись поля. Связка через for и id.", example: "<label for=\"email\">Почта</label>" },
    { term: "name", meaning: "Имя ответа: без него поле не попадёт в отправку.", example: "name=\"email\"" },
    { term: "type=\"radio\" / checkbox", meaning: "Один выбор из группы / галочка да-нет.", example: "<input type=\"checkbox\" name=\"agree\" />" },
  ],
  "html-10": [
    { term: "required", meaning: "Поле нельзя оставить пустым.", example: "<input required />" },
    { term: "minlength / maxlength", meaning: "Минимальная и максимальная длина текста.", example: "minlength=\"2\" maxlength=\"40\"" },
    { term: "placeholder", meaning: "Серая подсказка внутри поля. Не заменяет label.", example: "placeholder=\"Аня\"" },
    { term: "<select> / <option>", meaning: "Выпадающий список и его пункты.", example: "<select><option>Тема</option></select>" },
    { term: "<textarea>", meaning: "Большое многострочное поле.", example: "<textarea rows=\"4\"></textarea>" },
  ],
  "html-project": [
    { term: "семантика", meaning: "Теги по смыслу роли: header, main, section, а не всё подряд div.", example: "<main><section>...</section></main>" },
    { term: "resume.html", meaning: "Отдельный файл итоговой страницы-резюме.", example: "index/resume.html открыть двойным щелчком" },
  ],
  "css-01": [
    { term: "CSS", meaning: "Правила внешнего вида: цвет, размер, отступы.", example: "p { color: blue; }" },
    { term: "<style>", meaning: "CSS прямо в HTML внутри head.", example: "<style>p { color: navy; }</style>" },
    { term: "<link rel=\"stylesheet\">", meaning: "Подключение внешнего файла стилей.", example: "<link rel=\"stylesheet\" href=\"styles.css\" />" },
    { term: "style=\"...\"", meaning: "Стиль прямо на одном теге.", example: "<h1 style=\"color: tomato;\">" },
  ],
  "css-02": [
    { term: "селектор", meaning: "Указывает, кого красим.", example: "p { ... } или .card { ... }" },
    { term: ".class", meaning: "Селектор по классу. Точка в начале.", example: ".note { color: brown; }" },
    { term: "#id", meaning: "Селектор по id. Решётка в начале.", example: "#top { color: teal; }" },
    { term: "nav a", meaning: "Ссылка внутри nav — селектор потомка.", example: "nav a { color: black; }" },
  ],
  "css-03": [
    { term: "каскад", meaning: "Как браузер выбирает победителя среди нескольких правил.", example: "класс сильнее тега, id сильнее класса" },
    { term: "специфичность", meaning: "«Сила» селектора: тег < класс < id < style на теге.", example: "#warn победит .note" },
    { term: "!important", meaning: "Принудительный приоритет. Лучше не злоупотреблять.", example: "color: red !important;" },
  ],
  "css-04": [
    { term: "hex-цвет", meaning: "Цвет кодом из # и шести символов.", example: "color: #0f8a8a;" },
    { term: "rem", meaning: "Размер относительно шрифта всей страницы.", example: "font-size: 2rem;" },
    { term: "CSS-переменная", meaning: "Своё имя для цвета или размера.", example: ":root { --main: #0f8a8a; } color: var(--main);" },
    { term: "rgba", meaning: "Цвет с прозрачностью.", example: "background: rgba(0,0,0,0.1);" },
  ],
  "css-05": [
    { term: "box model", meaning: "Коробка элемента: content + padding + border + margin.", example: "padding: 16px; border: 1px solid #ccc;" },
    { term: "padding", meaning: "Внутренний отступ от текста до края.", example: "padding: 16px;" },
    { term: "margin", meaning: "Внешний отступ до соседних блоков.", example: "margin: 12px;" },
    { term: "box-sizing: border-box", meaning: "width включает padding и border.", example: "* { box-sizing: border-box; }" },
  ],
  "css-06": [
    { term: "display: flex/block/inline", meaning: "Как элемент встаёт в поток: блок, строка, flex-ряд.", example: "display: flex;" },
    { term: "position: sticky", meaning: "Прилипает при прокрутке (шапка).", example: "position: sticky; top: 0;" },
    { term: "position: fixed", meaning: "Приклеен к окну браузера.", example: "position: fixed; top: 20%;" },
    { term: "z-index", meaning: "Кто выше при наложении блоков.", example: "z-index: 10;" },
  ],
  "css-07": [
    { term: "float", meaning: "Элемент «плывёт», текст обтекает его.", example: "float: left;" },
    { term: "clear", meaning: "Следующий блок начинается ниже float.", example: "clear: both;" },
  ],
  "css-08": [
    { term: "display: flex", meaning: "Дети родителя выстраиваются в ряд или столбик.", example: ".nav { display: flex; }" },
    { term: "justify-content", meaning: "Выравнивание вдоль главной оси.", example: "justify-content: space-between;" },
    { term: "align-items", meaning: "Выравнивание поперёк оси.", example: "align-items: center;" },
    { term: "gap", meaning: "Расстояние между flex/grid-детьми.", example: "gap: 16px;" },
  ],
  "css-09": [
    { term: "flex: 1", meaning: "Элемент забирает свободное место.", example: ".main { flex: 1; }" },
    { term: "flex-basis", meaning: "Стартовая ширина до роста/сжатия.", example: "flex: 0 0 180px;" },
    { term: "flex-grow / flex-shrink", meaning: "Можно ли расти / сжиматься.", example: "flex-grow: 1;" },
  ],
  "css-10": [
    { term: "display: grid", meaning: "Сетка по колонкам и строкам.", example: "display: grid;" },
    { term: "grid-template-columns", meaning: "Сколько колонок и какой ширины.", example: "grid-template-columns: 1fr 1fr 1fr;" },
    { term: "fr", meaning: "Доля свободного места в сетке.", example: "1fr 2fr" },
  ],
  "css-11": [
    { term: "grid-area", meaning: "Имя области, куда встаёт блок.", example: "grid-area: header;" },
    { term: "grid-template-areas", meaning: "Макет сетки словами.", example: "\"head head\" \"side main\"" },
    { term: "auto-fit + minmax", meaning: "Колонки сами подстраиваются под ширину окна.", example: "repeat(auto-fit, minmax(220px, 1fr))" },
  ],
  "css-12": [
    { term: "font-family", meaning: "Семейство шрифта.", example: "font-family: Georgia, serif;" },
    { term: "line-height", meaning: "Межстрочный интервал.", example: "line-height: 1.6;" },
    { term: "border-radius", meaning: "Скругление углов.", example: "border-radius: 12px;" },
    { term: "box-shadow", meaning: "Тень блока.", example: "box-shadow: 0 8px 24px rgba(0,0,0,.08);" },
  ],
  "css-13": [
    { term: ":hover", meaning: "Стиль при наведении мыши.", example: "a:hover { color: teal; }" },
    { term: ":focus", meaning: "Стиль, когда элемент в фокусе (Tab).", example: "button:focus { outline: 3px solid lime; }" },
    { term: "::before / ::after", meaning: "Декор до/после содержимого через CSS.", example: "content: \"→\";" },
    { term: "accent-color", meaning: "Цвет системных контролов вроде checkbox.", example: "accent-color: #0f8a8a;" },
  ],
  "css-14": [
    { term: "meta viewport", meaning: "Чтобы телефон не «притворялся» широким экраном.", example: "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />" },
    { term: "@media", meaning: "Правила только при определённой ширине окна.", example: "@media (min-width: 700px) { ... }" },
    { term: "mobile-first", meaning: "Сначала стили для узкого экрана, потом дополнения для широкого.", example: "база → min-width: 700px" },
  ],
  "css-project": [
    { term: "лендинг", meaning: "Одна рекламная/портфолио-страница с секциями.", example: "header + hero + cards + footer" },
    { term: "адаптив", meaning: "Удобный вид на телефоне и компьютере.", example: "auto-fit или @media" },
  ],
  "js-01": [
    { term: "JavaScript", meaning: "Язык поведения страницы: клики, расчёты, запросы.", example: "console.log(\"Привет\")" },
    { term: "<script src>", meaning: "Подключение файла скрипта к HTML.", example: "<script src=\"script.js\"></script>" },
    { term: "console.log", meaning: "Печатает значение во вкладку Console.", example: "console.log(\"Hello world\")" },
    { term: "консоль", meaning: "Вкладка инструментов браузера для сообщений и ошибок.", example: "F12 → Console" },
  ],
  "js-02": [
    { term: "let", meaning: "Переменная, значение которой можно менять.", example: "let step = 1; step = 2;" },
    { term: "const", meaning: "Имя с постоянной привязкой: новое значение не присвоить.", example: "const name = \"Аня\";" },
    { term: "переменная", meaning: "Имя, к которому прикреплено значение.", example: "let age = 20;" },
  ],
  "js-03": [
    { term: "string", meaning: "Текст в кавычках.", example: "\"привет\"" },
    { term: "number", meaning: "Число.", example: "25" },
    { term: "boolean", meaning: "Да или нет: true / false.", example: "true" },
    { term: "typeof", meaning: "Проверка типа значения.", example: "typeof \"Аня\" // \"string\"" },
    { term: "null / undefined", meaning: "Специально пусто / ещё не задали значение.", example: "let box; // undefined" },
  ],
  "js-04": [
    { term: "===", meaning: "Строгое сравнение без автоприведения типов.", example: "2 === \"2\" // false" },
    { term: "+ для строк", meaning: "Склеивает текст.", example: "\"Привет, \" + name" },
    { term: "%", meaning: "Остаток от деления.", example: "7 % 2 // 1" },
    { term: "? :", meaning: "Короткий выбор из двух значений.", example: "age >= 18 ? \"можно\" : \"рано\"" },
  ],
  "js-05": [
    { term: "if / else", meaning: "Ветвление: если условие правда — один код, иначе другой.", example: "if (score >= 60) { ... } else { ... }" },
    { term: "else if", meaning: "Дополнительная проверка, если предыдущие не подошли.", example: "else if (hour < 18)" },
    { term: "switch", meaning: "Выбор по точному значению.", example: "switch (lang) { case \"js\": ... }" },
  ],
  "js-06": [
    { term: "for", meaning: "Цикл со счётчиком.", example: "for (let i = 1; i <= 5; i++) { ... }" },
    { term: "while", meaning: "Повторять, пока условие правда.", example: "while (n > 0) { n--; }" },
    { term: "for...of", meaning: "Пройти элементы массива.", example: "for (const item of list) { ... }" },
  ],
  "js-07": [
    { term: "function", meaning: "Именованный кусок кода, который можно вызывать.", example: "function sum(a, b) { return a + b; }" },
    { term: "return", meaning: "Вернуть результат из функции наружу.", example: "return a + b;" },
    { term: "стрелочная функция", meaning: "Короткая запись функции.", example: "const max = (a, b) => (a > b ? a : b);" },
  ],
  "js-08": [
    { term: "массив", meaning: "Список значений в квадратных скобках.", example: "[\"хлеб\", \"молоко\"]" },
    { term: "push / pop", meaning: "Добавить / убрать элемент в конце.", example: "list.push(\"яйца\")" },
    { term: "length", meaning: "Сколько элементов в массиве.", example: "list.length" },
    { term: "join", meaning: "Собрать массив в одну строку.", example: "list.join(\", \")" },
  ],
  "js-09": [
    { term: "map", meaning: "Новый массив: каждый элемент преобразован.", example: "users.map(u => u.name)" },
    { term: "filter", meaning: "Новый массив только из подходящих элементов.", example: "users.filter(u => u.age >= 18)" },
    { term: "reduce", meaning: "Свернуть массив в одно значение.", example: "nums.reduce((s, n) => s + n, 0)" },
  ],
  "js-10": [
    { term: "объект", meaning: "Данные с именованными полями.", example: "{ name: \"Аня\", age: 20 }" },
    { term: "метод", meaning: "Функция внутри объекта.", example: "user.sayHi()" },
    { term: "JSON.stringify / parse", meaning: "Объект ↔ текстовая JSON-строка.", example: "JSON.stringify(user)" },
  ],
  "js-11": [
    { term: "шаблонная строка", meaning: "Строка в обратных кавычках с ${...}.", example: "`Привет, ${name}`" },
    { term: "trim", meaning: "Убрать пробелы по краям строки.", example: "\"  Аня  \".trim()" },
    { term: "split", meaning: "Разрезать строку в массив.", example: "\"a,b\".split(\",\")" },
    { term: "includes", meaning: "Есть ли подстрока внутри строки.", example: "text.includes(\"@\")" },
  ],
  "js-12": [
    { term: "DOM", meaning: "Дерево объектов страницы, которым управляет JS.", example: "document.querySelector(\"h1\")" },
    { term: "querySelector", meaning: "Найти первый элемент по CSS-селектору.", example: "document.querySelector(\"#title\")" },
    { term: "querySelectorAll", meaning: "Найти все подходящие элементы.", example: "document.querySelectorAll(\"li\")" },
    { term: "textContent", meaning: "Текст внутри элемента.", example: "title.textContent" },
  ],
  "js-13": [
    { term: "createElement", meaning: "Создать новый HTML-элемент в памяти.", example: "document.createElement(\"li\")" },
    { term: "append", meaning: "Вставить элемент внутрь родителя в конец.", example: "list.append(item)" },
    { term: "classList", meaning: "Добавить/убрать/переключить CSS-класс.", example: "box.classList.toggle(\"active\")" },
  ],
  "js-14": [
    { term: "addEventListener", meaning: "Подписаться на событие: клик, ввод и т.д.", example: "button.addEventListener(\"click\", fn)" },
    { term: "click", meaning: "Событие клика мышью.", example: "\"click\"" },
    { term: "input", meaning: "Событие при каждом изменении поля.", example: "field.addEventListener(\"input\", fn)" },
    { term: "preventDefault", meaning: "Отменить действие браузера по умолчанию.", example: "event.preventDefault()" },
  ],
  "js-15": [
    { term: "submit", meaning: "Событие отправки формы.", example: "form.addEventListener(\"submit\", fn)" },
    { term: "input.value", meaning: "Текущий текст поля.", example: "form.elements.email.value" },
    { term: "checked", meaning: "Включена ли галочка.", example: "agree.checked" },
  ],
  "js-16": [
    { term: "setTimeout", meaning: "Выполнить функцию один раз через N миллисекунд.", example: "setTimeout(() => console.log(\"позже\"), 1000)" },
    { term: "setInterval", meaning: "Повторять функцию снова и снова.", example: "setInterval(tick, 1000)" },
    { term: "clearInterval", meaning: "Остановить повторение.", example: "clearInterval(id)" },
  ],
  "js-17": [
    { term: "Promise", meaning: "Обещание результата в будущем: успех или ошибка.", example: "new Promise((resolve) => resolve(\"ok\"))" },
    { term: "then / catch", meaning: "Что делать при успехе / при ошибке.", example: "wait(500).then(console.log)" },
    { term: "Promise.all", meaning: "Дождаться нескольких промисов сразу.", example: "Promise.all([p1, p2])" },
  ],
  "js-18": [
    { term: "async", meaning: "Функция, которая работает с промисами и всегда возвращает Promise.", example: "async function run() { ... }" },
    { term: "await", meaning: "Подождать результат промиса внутри async.", example: "const data = await wait(500, \"ok\")" },
    { term: "try / catch", meaning: "Поймать ошибку при await или рискованном коде.", example: "try { await load() } catch (e) { ... }" },
  ],
  "js-19": [
    { term: "fetch", meaning: "Запрос к адресу в интернете.", example: "await fetch(url)" },
    { term: "response.ok", meaning: "Удачный ли HTTP-статус ответа.", example: "if (!response.ok) throw ..." },
    { term: "response.json()", meaning: "Прочитать тело ответа как JSON.", example: "const data = await response.json()" },
  ],
  "js-20": [
    { term: "import / export", meaning: "Разбить код на файлы-модули.", example: "import { save } from \"./storage.js\"" },
    { term: "type=\"module\"", meaning: "Подключить скрипт как ES-модуль.", example: "<script type=\"module\" src=\"main.js\"></script>" },
    { term: "localStorage", meaning: "Хранилище строк в браузере между визитами.", example: "localStorage.setItem(\"key\", \"value\")" },
  ],
  "js-project": [
    { term: "CRUD списка дел", meaning: "Создать, показать, удалить задачи в интерфейсе.", example: "push + render + filter" },
    { term: "persist", meaning: "Сохранить состояние, чтобы пережило F5.", example: "saveTasks(tasks) → localStorage" },
  ],
};

const roots = ["html", "css", "javascript"].map((p) =>
  path.join(process.cwd(), "content/lessons", p),
);

let updated = 0;
for (const dir of roots) {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  for (const name of files) {
    const filePath = path.join(dir, name);
    const lesson = JSON.parse(await readFile(filePath, "utf8"));
    const entries = GLOSSARY[lesson.id];
    if (!entries) {
      console.warn("missing glossary for", lesson.id);
      continue;
    }
    lesson.glossary = entries;
    await writeFile(filePath, JSON.stringify(lesson, null, 2) + "\n", "utf8");
    updated += 1;
  }
}
console.log("updated", updated);
