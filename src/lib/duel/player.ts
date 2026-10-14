const ID_KEY = "fullstacker-duel-player-id";
const NAME_KEY = "fullstacker-duel-player-name";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id = randomId();
    window.localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getPlayerName(): string {
  if (typeof window === "undefined") return "Игрок";
  return window.localStorage.getItem(NAME_KEY) || "Игрок";
}

export function setPlayerName(name: string) {
  window.localStorage.setItem(NAME_KEY, name.trim().slice(0, 24) || "Игрок");
}
