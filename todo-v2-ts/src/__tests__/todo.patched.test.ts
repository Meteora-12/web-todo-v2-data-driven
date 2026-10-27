import { describe, it, expect } from 'vitest';
import {
  addTodo,
  filterTodos,
  parseTodoId,
  parseTodos,
  readIdFromDataset,
  sanitizeTodos,
  toggleTodo,
  type Todo,
} from '../todo.js';
import { loadTodos, saveTodos, STORAGE_KEY, type TodoStorage } from '../storage.js';

// 任务3③：针对 AI 测试的漏洞做的修补用例

describe('修补①：无效断言 → 验证具体的值', () => {
  it('addTodo 返回的任务字段必须逐一相等', () => {
    const result = addTodo([], '买牛奶');
    expect(result).toEqual([{ id: 1, text: '买牛奶', completed: false }]);
  });

  it('completed 必须是严格的 false，而不是 falsy', () => {
    const result = addTodo([], '买牛奶');
    expect(result[0]?.completed).toBe(false);
  });

  it('空输入必须返回空数组，而不是"只要不抛错"', () => {
    expect(addTodo([], '')).toEqual([]);
    expect(addTodo([], '   ')).toEqual([]);
  });

  it('相同文字的任务内容各自独立可读', () => {
    const first = addTodo([], 'A');
    const second = addTodo(first, 'A');
    expect(second.map((todo) => todo.text)).toEqual(['A', 'A']);
    expect(second[0]?.id).not.toBe(second[1]?.id);
  });
});

describe('修补②：dataset.id 字符串 → number', () => {
  it('合法数字字符串能转成 number', () => {
    expect(parseTodoId('12')).toBe(12);
    expect(parseTodoId(' 3 ')).toBe(3);
  });

  it('空串不能被 Number("") === 0 蒙混过关', () => {
    expect(parseTodoId('')).toBeNull();
    expect(parseTodoId('   ')).toBeNull();
    expect(parseTodoId(undefined)).toBeNull();
  });

  it('非数字 / 小数 / 负数 / 零都判为非法', () => {
    expect(parseTodoId('abc')).toBeNull();
    expect(parseTodoId('12abc')).toBeNull();
    expect(parseTodoId('1.5')).toBeNull();
    expect(parseTodoId('-1')).toBeNull();
    expect(parseTodoId('0')).toBeNull();
  });

  it('从 DOMStringMap 读取 id', () => {
    expect(readIdFromDataset({ id: '7' } as DOMStringMap)).toBe(7);
    expect(readIdFromDataset({} as DOMStringMap)).toBeNull();
  });
});

describe('修补③：localStorage 脏数据清洗', () => {
  it('null / 非 JSON / 非数组都兜底为空数组', () => {
    expect(parseTodos(null)).toEqual([]);
    expect(parseTodos('不是JSON')).toEqual([]);
    expect(parseTodos('null')).toEqual([]);
    expect(parseTodos('{"id":1}')).toEqual([]);
  });

  it('混合脏数据只保留合法项', () => {
    const raw = JSON.stringify([
      { id: 1, text: '合法任务', completed: false },
      { id: '2', text: 'id 是字符串', completed: false },
      { id: 3, text: '   ', completed: false },
      { id: 4, text: '状态不是布尔', completed: 'yes' },
      null,
      42,
    ]);
    expect(parseTodos(raw)).toEqual([{ id: 1, text: '合法任务', completed: false }]);
  });

  it('重复 id 只保留第一条', () => {
    const raw = JSON.stringify([
      { id: 1, text: '第一次', completed: false },
      { id: 1, text: '第二次', completed: true },
    ]);
    expect(sanitizeTodos(JSON.parse(raw) as unknown)).toEqual([
      { id: 1, text: '第一次', completed: false },
    ]);
  });
});

describe('修补④：依赖异常（localStorage 不可用）', () => {
  const broken: TodoStorage = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };

  it('读取抛异常时返回空列表而不是崩溃', () => {
    expect(loadTodos(broken)).toEqual([]);
  });

  it('写入失败时返回 false，不向上抛异常', () => {
    expect(saveTodos(broken, [])).toBe(false);
  });

  it('正常存储能写入并读回相同数据', () => {
    const map = new Map<string, string>();
    const storage: TodoStorage = {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, value) => {
        map.set(key, value);
      },
    };
    const todos: Todo[] = [{ id: 1, text: 'A', completed: true }];
    expect(saveTodos(storage, todos)).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBe(JSON.stringify(todos));
    expect(loadTodos(storage)).toEqual(todos);
  });
});

describe('修补⑤：状态维度（筛选与切换联动）', () => {
  const todos: Todo[] = [
    { id: 1, text: '未完成', completed: false },
    { id: 2, text: '已完成', completed: true },
  ];

  it('切换后任务会从 active 视图消失、出现在 done 视图', () => {
    const next = toggleTodo(todos, 1);
    expect(filterTodos(next, 'active').map((todo) => todo.id)).toEqual([]);
    expect(filterTodos(next, 'done').map((todo) => todo.id)).toEqual([1, 2]);
  });

  it('筛选不修改原数组', () => {
    filterTodos(todos, 'done');
    expect(todos).toHaveLength(2);
  });
});

describe('修补⑥：安全维度（任务文字按纯文本处理）', () => {
  it('HTML 字符串原样存为文字，不会被解析成节点', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const result = addTodo([], payload);
    expect(result[0]?.text).toBe(payload);
    expect(result[0]?.text).not.toContain('<script');
  });
});
