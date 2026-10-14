import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';

const API = 'http://localhost:4000';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/tasks`);
      setTasks(await res.json());
    } catch {
      setError('API недоступен');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return setError('Не удалось создать');
    setTitle('');
    await load();
  }

  if (loading) return <p>Загрузка…</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <main>
      <h1>Tasks</h1>
      <form onSubmit={onSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      {tasks.length === 0 ? <p>Пусто</p> : (
        <ul>{tasks.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
