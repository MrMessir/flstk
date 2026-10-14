type Todo = { id: string; title: string; done: boolean };

const app = document.querySelector('#app');
if (!app) throw new Error('#app missing');

let todos: Todo[] = [];

function render(): void {
  app.innerHTML = `
    <h1>TS Todo</h1>
    <form id="form"><input id="title" required /><button>Add</button></form>
    <ul>${todos.map((t) => `<li data-id="${t.id}">${t.title}</li>`).join('')}</ul>`;
  document.querySelector('#form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.querySelector<HTMLInputElement>('#title');
    if (!input?.value.trim()) return;
    todos = [...todos, { id: crypto.randomUUID(), title: input.value.trim(), done: false }];
    render();
  });
}

render();
