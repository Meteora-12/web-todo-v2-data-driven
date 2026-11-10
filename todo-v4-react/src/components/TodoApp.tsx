import { useEffect, useState } from 'react';
import {
  addTodo,
  clearCompleted,
  editTodo,
  filterTodos,
  removeTodo,
  toggleTodo,
  type Filter,
  type Todo,
} from '../domain/todo';
import { loadTodos, saveTodos } from '../storage';
import TodoForm from './TodoForm';
import TodoList from './TodoList';

// 唯一持有 todos 的组件：数据向下传，事件向上传。
export default function TodoApp() {
  // 惰性初始化：只在首次挂载时读一次 localStorage，之后完全由 State 驱动。
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos(localStorage));
  const [filter, setFilter] = useState<Filter>('all');

  // 副作用只做持久化，不参与渲染；State 是唯一事实来源。
  useEffect(() => {
    saveTodos(localStorage, todos);
  }, [todos]);

  function handleAdd(text: string): void {
    setTodos((prev) => addTodo(prev, text));
  }

  function handleToggle(id: number): void {
    setTodos((prev) => toggleTodo(prev, id));
  }

  function handleDelete(id: number): void {
    setTodos((prev) => removeTodo(prev, id));
  }

  function handleEdit(id: number, text: string): void {
    setTodos((prev) => editTodo(prev, id, text));
  }

  function handleClearCompleted(): void {
    setTodos((prev) => clearCompleted(prev));
  }

  const visibleTodos = filterTodos(todos, filter);
  const remaining = todos.filter((todo) => !todo.completed).length;
  const filters: ReadonlyArray<{ key: Filter; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '未完成' },
    { key: 'done', label: '已完成' },
  ];

  return (
    <main className="app">
      <header className="app-header">
        <p className="badge">V4.0 · React</p>
        <h1>我的待办</h1>
        <p className="subtitle">组件拆分 + useState，页面由 State 驱动</p>
      </header>

      <TodoForm onAdd={handleAdd} />

      <div className="toolbar">
        <div className="filters" role="group" aria-label="筛选">
          {filters.map((item) => (
            <button
              key={item.key}
              className={filter === item.key ? 'filter active' : 'filter'}
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="counter" data-testid="counter">
          {remaining} 项未完成 / 共 {todos.length} 项
        </span>
      </div>

      <TodoList
        todos={visibleTodos}
        filter={filter}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <footer className="app-footer">
        <button className="clear" onClick={handleClearCompleted} disabled={remaining === todos.length}>
          清除已完成
        </button>
        <details className="state-panel">
          <summary>查看当前 State</summary>
          <pre data-testid="state-json">{JSON.stringify(todos, null, 2)}</pre>
        </details>
      </footer>
    </main>
  );
}
