import { useState } from 'react';
import type { Todo } from '../domain/todo';

// 子组件只接收数据（待办对象）和回调（事件向上传），自己不持有任何待办数据。
export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, text: string) => void;
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  // 编辑态是纯 UI 状态，属于这个组件自己；真正的任务文本仍然只在 TodoApp 的 todos 里。
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  function startEdit(): void {
    setDraft(todo.text);
    setEditing(true);
  }

  function commitEdit(): void {
    onEdit(todo.id, draft);
    setEditing(false);
  }

  function cancelEdit(): void {
    setDraft(todo.text);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="todo-item" data-testid={`todo-item-${todo.id}`}>
        <input
          className="edit-input"
          aria-label={`编辑任务 ${todo.text}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitEdit();
            if (event.key === 'Escape') cancelEdit();
          }}
          autoFocus
        />
        <button className="save" onClick={commitEdit}>
          保存
        </button>
        <button className="cancel" onClick={cancelEdit}>
          取消
        </button>
      </li>
    );
  }

  const className = todo.completed ? 'todo-item done' : 'todo-item';
  return (
    <li className={className} data-testid={`todo-item-${todo.id}`}>
      <span className="todo-text">{todo.text}</span>
      <span className="actions">
        <button className="toggle" onClick={() => onToggle(todo.id)}>
          {todo.completed ? '取消完成' : '完成'}
        </button>
        <button className="edit" onClick={startEdit}>
          编辑
        </button>
        <button className="delete" onClick={() => onDelete(todo.id)}>
          删除
        </button>
      </span>
    </li>
  );
}
