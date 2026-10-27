import {
  addTodo,
  editTodo,
  filterTodos,
  readIdFromDataset,
  removeTodo,
  toggleTodo,
  type Filter,
  type Todo,
} from './todo.js';
import { loadTodos, saveTodos } from './storage.js';

// 严格模式下 DOM 查询结果是 T | null，必须显式收窄，否则后面全是 null 报错
const list = document.querySelector<HTMLUListElement>('#todoList');
const input = document.querySelector<HTMLInputElement>('#todoInput');
const addBtn = document.querySelector<HTMLButtonElement>('#addBtn');
const filterBar = document.querySelector<HTMLDivElement>('.filters');

if (!list || !input || !addBtn || !filterBar) {
  throw new Error('页面结构缺失：找不到 #todoList / #todoInput / #addBtn / .filters');
}

// 模块初始化时 list 已收窄为非 null，但回调里会被放宽，这里保存成常量
const todoList: HTMLUListElement = list;
const todoInput: HTMLInputElement = input;

let todos: Todo[] = loadTodos(localStorage);
let filter: Filter = 'all';

function commit(next: Todo[]): void {
  todos = next;
  saveTodos(localStorage, todos);
  render();
}

function render(): void {
  todoList.innerHTML = '';

  for (const todo of filterTodos(todos, filter)) {
    const li = document.createElement('li');
    li.dataset.id = String(todo.id); // 统一存字符串，读的时候用 parseTodoId 转回 number
    li.textContent = todo.text;
    if (todo.completed) li.className = 'done';

    const del = document.createElement('button');
    del.textContent = '删除';
    del.dataset.action = 'delete';
    li.appendChild(del);

    const edit = document.createElement('button');
    edit.textContent = '编辑';
    edit.dataset.action = 'edit';
    li.appendChild(edit);

    todoList.appendChild(li);
  }
}

// 事件委托：父容器只绑一个 click，靠 closest + dataset 判断"点了谁、做了什么"
todoList.addEventListener('click', (event: MouseEvent) => {
  if (!(event.target instanceof Element)) return;
  const item = event.target.closest<HTMLLIElement>('li');
  if (!item || !todoList.contains(item)) return;

  const id = readIdFromDataset(item.dataset);
  if (id === null) return;

  const deleteBtn = event.target.closest<HTMLButtonElement>('[data-action="delete"]');
  if (deleteBtn && item.contains(deleteBtn)) {
    commit(removeTodo(todos, id));
    return;
  }

  const editBtn = event.target.closest<HTMLButtonElement>('[data-action="edit"]');
  if (editBtn && item.contains(editBtn)) {
    const newText = window.prompt('修改任务', item.firstChild?.textContent ?? '');
    if (newText !== null) commit(editTodo(todos, id, newText));
    return;
  }

  commit(toggleTodo(todos, id));
});

addBtn.addEventListener('click', () => {
  commit(addTodo(todos, todoInput.value));
  todoInput.value = '';
});

filterBar.addEventListener('click', (event: MouseEvent) => {
  if (!(event.target instanceof HTMLButtonElement)) return;
  const value = event.target.dataset.filter;
  if (value === 'all' || value === 'active' || value === 'done') {
    filter = value;
    render();
  }
});

render();
