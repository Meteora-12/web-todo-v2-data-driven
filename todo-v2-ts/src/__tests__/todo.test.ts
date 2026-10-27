import { describe, it, expect } from 'vitest';
import { addTodo, toggleTodo, type Todo } from '../todo.js';

// 手写测试（任务2）：不依赖 AI，只覆盖 addTodo / toggleTodo 的正常与边界
const sample = (): Todo[] => [
  { id: 1, text: '写作业', completed: false },
  { id: 2, text: '跑步', completed: true },
];

describe('addTodo - 正常情况', () => {
  it('追加一条新任务，字段完整', () => {
    const result = addTodo(sample(), '买牛奶');
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ id: 3, text: '买牛奶', completed: false });
  });

  it('前后空格会被去掉', () => {
    const result = addTodo([], '  背单词  ');
    expect(result[0]?.text).toBe('背单词');
  });

  it('不修改原数组（返回新数组）', () => {
    const original = sample();
    addTodo(original, '买牛奶');
    expect(original).toHaveLength(2);
    expect(original).toEqual(sample());
  });
});

describe('addTodo - 边界拦截', () => {
  it('空字符串不添加', () => {
    expect(addTodo(sample(), '')).toHaveLength(2);
  });

  it('纯空格不添加', () => {
    expect(addTodo([], '   ')).toHaveLength(0);
  });

  it('连续添加时 id 不会重复', () => {
    const first = addTodo([], 'A');
    const second = addTodo(first, 'B');
    expect(second[1]?.id).not.toBe(second[0]?.id);
  });
});

describe('toggleTodo - 正常情况', () => {
  it('只翻转目标任务', () => {
    const result = toggleTodo(sample(), 1);
    expect(result[0]?.completed).toBe(true); // 1 从 false → true
    expect(result[1]?.completed).toBe(true); // 2 保持 true
  });

  it('连续切换两次回到原状态', () => {
    const once = toggleTodo(sample(), 1);
    const twice = toggleTodo(once, 1);
    expect(twice[0]?.completed).toBe(false);
  });

  it('不修改原数组（返回新数组）', () => {
    const original = sample();
    toggleTodo(original, 1);
    expect(original[0]?.completed).toBe(false);
  });
});

describe('toggleTodo - 边界拦截', () => {
  it('不存在的 id：任务列表原样返回', () => {
    const result = toggleTodo(sample(), 999);
    expect(result).toHaveLength(2);
    expect(result).toEqual(sample());
  });

  it('切换结果仍是布尔值', () => {
    const result = toggleTodo(sample(), 1);
    expect(typeof result[0]?.completed).toBe('boolean');
  });
});
