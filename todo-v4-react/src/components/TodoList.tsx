import type { Filter, Todo } from '../domain/todo';
import TodoItem from './TodoItem';

// 列表只负责遍历渲染，不碰 State，也不直接操作 DOM。
export interface TodoListProps {
  todos: readonly Todo[];
  filter: Filter;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, text: string) => void;
}

const EMPTY_TEXT: Record<Filter, string> = {
  all: '还没有任务，先添加一条吧。',
  active: '没有未完成的任务。',
  done: '还没有已完成的任务。',
};

export default function TodoList({ todos, filter, onToggle, onDelete, onEdit }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="empty">{EMPTY_TEXT[filter]}</p>;
  }

  return (
    <ul className="todo-list" data-testid="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
