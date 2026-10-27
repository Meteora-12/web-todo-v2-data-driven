// ===== 领域模型：所有函数只依赖这个类型，不允许 any =====
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export type Filter = 'all' | 'active' | 'done';

// 判断任意 unknown（JSON.parse 的结果）是不是一个合法的 Todo。
// 这就是"处理脏数据"的入口：类型收窄只能靠运行时检查，不能靠断言。
export function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    Number.isInteger(candidate.id) &&
    candidate.id > 0 &&
    typeof candidate.text === 'string' &&
    candidate.text.trim() !== '' &&
    typeof candidate.completed === 'boolean'
  );
}

// 清洗 localStorage 里读出来的任意数据：非数组 → []，逐条过滤非法项，按 id 去重。
// 去重是为了防止"同一条任务出现两次、删一个还剩一个"的脏状态。
export function sanitizeTodos(raw: unknown): Todo[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const result: Todo[] = [];
  for (const item of raw) {
    if (!isTodo(item)) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push({ id: item.id, text: item.text, completed: item.completed });
  }
  return result;
}

// 从字符串（localStorage 或 DOM dataset）解析出任务 id：
// 空串必须单独拦，因为 Number('') === 0 而不是 NaN，是最容易踩的坑。
export function parseTodoId(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const id = Number(trimmed);
  if (!Number.isInteger(id)) return null;
  return id > 0 ? id : null;
}

// 解析 localStorage 的字符串；JSON 损坏或结构不对都兜底为 []。
export function parseTodos(json: string | null): Todo[] {
  if (json === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  return sanitizeTodos(parsed);
}

// 新 id 用"现有最大 id + 1"，而不是 Date.now()：
// 同一毫秒内连续添加两条会拿到相同 id，删除/切换就会误伤另一条。
export function nextId(todos: readonly Todo[]): number {
  return todos.reduce((max, todo) => (todo.id > max ? todo.id : max), 0) + 1;
}

// 添加：返回新数组，不修改入参
export function addTodo(todos: readonly Todo[], text: string): Todo[] {
  const trimmed = text.trim();
  if (trimmed === '') return [...todos];
  return [...todos, { id: nextId(todos), text: trimmed, completed: false }];
}

// 删除：filter 生成新数组
export function removeTodo(todos: readonly Todo[], id: number): Todo[] {
  return todos.filter((todo) => todo.id !== id);
}

// 切换：只翻转命中的那条，其余对象保持原引用
export function toggleTodo(todos: readonly Todo[], id: number): Todo[] {
  return todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
}

// 编辑：空文字视为取消，不改动任何任务
export function editTodo(todos: readonly Todo[], id: number, newText: string): Todo[] {
  const trimmed = newText.trim();
  if (trimmed === '') return [...todos];
  return todos.map((todo) => (todo.id === id ? { ...todo, text: trimmed } : todo));
}

// 清除已完成
export function clearCompleted(todos: readonly Todo[]): Todo[] {
  return todos.filter((todo) => !todo.completed);
}

// 筛选：纯函数，不在内部保存视图状态
export function filterTodos(todos: readonly Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'done':
      return todos.filter((todo) => todo.completed);
    case 'all':
      return [...todos];
  }
}

// 从 DOM 的 dataset 取 id：字符串 → number，非法值返回 null，调用方提前 return。
export function readIdFromDataset(dataset: DOMStringMap): number | null {
  return parseTodoId(dataset.id);
}
