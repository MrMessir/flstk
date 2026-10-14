import { useMemo, useState } from 'react';
import { useCart } from './store';

const PRODUCTS = [
  { id: '1', title: 'Ноутбук', price: 800 },
  { id: '2', title: 'Мышь', price: 25 },
  { id: '3', title: 'Клавиатура', price: 60 },
];

export function App() {
  const [q, setQ] = useState('');
  const { items, add } = useCart();
  const list = useMemo(
    () => PRODUCTS.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Каталог</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" />
      <p>В корзине: {items.length}</p>
      <ul>
        {list.map((p) => (
          <li key={p.id}>
            {p.title} — {p.price}{" "}
            <button type="button" onClick={() => add(p.id)}>
              В корзину
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
