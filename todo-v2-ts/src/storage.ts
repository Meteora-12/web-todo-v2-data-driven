import { parseTodos, type Todo } from './todo.js';

export const STORAGE_KEY = 'todos';

// 只依赖 Storage 的这两个方法，测试时可以直接传一个假对象，不用跑浏览器。
export type TodoStorage = Pick<Storage, 'getItem' | 'setItem'>;

// 读取：localStorage 本身也可能抛异常（隐私模式 / 被禁用），全部兜底为 []
export function loadTodos(storage: TodoStorage): Todo[] {
  try {
    return parseTodos(storage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

// 保存：写入失败（配额已满等）时不打断界面，只返回是否成功
export function saveTodos(storage: TodoStorage, todos: readonly Todo[]): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch {
    return false;
  }
}
