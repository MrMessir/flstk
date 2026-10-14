const store = new Map();

export function findAll() {
  return [...store.values()];
}

export function insert(dto) {
  const row = { id: crypto.randomUUID(), ...dto, createdAt: new Date().toISOString() };
  store.set(row.id, row);
  return row;
}
