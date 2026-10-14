/** Map common Supabase Auth English errors to Russian product copy. */
export function authErrorMessage(raw: string | undefined | null): string {
  const message = (raw || "").trim();
  const lower = message.toLowerCase();

  if (!message) return "Не удалось выполнить вход";
  if (lower.includes("invalid login credentials")) {
    return "Неверный email или пароль";
  }
  if (lower.includes("email not confirmed")) {
    return "Подтверди email по ссылке из письма, затем войди";
  }
  if (lower.includes("user already registered")) {
    return "Этот email уже зарегистрирован — войди";
  }
  if (lower.includes("password should be at least")) {
    return "Пароль слишком короткий (минимум 6 символов)";
  }
  if (lower.includes("signup is disabled")) {
    return "Регистрация временно отключена";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Слишком много попыток. Подожди минуту";
  }
  return message;
}
