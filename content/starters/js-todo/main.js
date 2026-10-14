const form = document.querySelector('#form');
const input = document.querySelector('#input');
const list = document.querySelector('#list');

/** @type {{ id: string, title: string, done: boolean }[]} */
let todos = JSON.parse(localStorage.getItem('todos') || '[]');

function save() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function render() {
  list.innerHTML = '';
  for (const todo of todos) {
    const li = document.createElement('li');
    li.textContent = todo.title;
    if (todo.done) li.style.textDecoration = 'line-through';
    li.addEventListener('click', () => {
      todo.done = !todo.done;
      save();
      render();
    });
    list.append(li);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  todos.push({ id: crypto.randomUUID(), title: input.value.trim(), done: false });
  input.value = '';
  save();
  render();
});

render();
