// Проверка логики тестов: порог 70%, правильные ответы не уходят в браузер.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { gradeQuiz, requiredCorrect, getQuizQuestions } = await import("../src/lib/quiz/grade.ts");
const { stripQuizAnswers } = await import("../src/lib/quiz/public.ts");
const { lessonSchema } = await import("../src/lib/lessons/schema.ts");
const { normalizeLesson } = await import("../src/lib/lessons/normalize-lesson.ts");

// Порог: 70% с округлением вверх.
assert.equal(requiredCorrect(5), 4);
assert.equal(requiredCorrect(4), 3);
assert.equal(requiredCorrect(3), 3);
assert.equal(requiredCorrect(2), 2);
assert.equal(requiredCorrect(1), 1);
assert.equal(requiredCorrect(10), 7);

const questions = [0, 1, 2, 3, 4].map((i) => ({
  id: `q${i}`, prompt: `Вопрос ${i}`, options: ["a", "b", "c", "d"], correctIndex: i % 4, explanation: "потому что",
}));
const allRight = Object.fromEntries(questions.map((q) => [q.id, q.correctIndex]));
assert.equal(gradeQuiz(questions, allRight).passed, true);
// 4 из 5 проходит, 3 из 5 нет.
assert.equal(gradeQuiz(questions, { ...allRight, q0: 3 }).passed, true);
assert.equal(gradeQuiz(questions, { ...allRight, q0: 3, q1: 3 }).passed, false);
// Пропуск, мусор и дробные значения считаются неверными.
const junk = gradeQuiz(questions, { q0: 0, q1: 1.5, q2: -1, q3: Number.NaN });
assert.equal(junk.correct, 1);
assert.equal(gradeQuiz(questions, {}).correct, 0);
assert.equal(gradeQuiz([], {}).passed, false);

// Урок из реального курса: ответы не должны попасть в браузерную версию.
for (const file of ["content/lessons/html/html-02.json", "content/lessons/security/security-05.json"]) {
  const lesson = normalizeLesson(lessonSchema.parse(JSON.parse(readFileSync(file, "utf8"))));
  const full = getQuizQuestions(lesson);
  assert.ok(full.length > 0, `${file}: нет вопросов`);
  const publicJson = JSON.stringify(stripQuizAnswers(lesson));
  assert.ok(!publicJson.includes("correctIndex"), `${file}: correctIndex в публичных данных`);
  assert.equal(JSON.parse(publicJson).quiz, undefined, `${file}: поле quiz в публичных данных`);
  for (const q of full) {
    if (q.explanation) assert.ok(!publicJson.includes(q.explanation), `${file}: пояснение просочилось`);
  }
}

// Проектный урок: у него нет теста, а значит, нет и вопросов.
const project = normalizeLesson(lessonSchema.parse(JSON.parse(readFileSync("content/lessons/capstone/capstone-project.json", "utf8"))));
assert.equal(getQuizQuestions(project).length, 0);

console.log("ok quiz grading");
