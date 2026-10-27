import { describe, it, expect } from 'vitest';
import { addTodo, toggleTodo, type Todo } from '../todo.js';

// 任务3：AI 生成的原版测试（保留原样，用于审查与对照）
describe('addTodo', () => {
  it('应该能添加任务', () => {
    const result = addTodo([], '买牛奶');
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('新任务内容不为空', () => {
    const result = addTodo([], '买牛奶');
    expect(result[0]?.text).toBeTruthy();
  });

  it('新任务默认未完成', () => {
    const result = addTodo([], '买牛奶');
    expect(result[0]?.completed).toBeFalsy();
  });

  it('空输入不会抛出异常', () => {
    expect(() => addTodo([], '')).not.toThrow();
  });

  it('相同文字可以添加多条', () => {
    const first = addTodo([], 'A');
    const second = addTodo(first, 'A');
    expect(second).toHaveLength(2);
    expect(second[0]).toEqual(second[0]);
  });
});

describe('toggleTodo', () => {
  it('切换后完成状态变为 true', () => {
    const todos: Todo[] = [{ id: 1, text: 'A', completed: false }];
    const result = toggleTodo(todos, 1);
    expect(result).toBeDefined();
    expect(result[0]?.completed).toBe(true);
  });

  it('切换两次恢复为未完成', () => {
    const todos: Todo[] = [{ id: 1, text: 'A', completed: false }];
    const once = toggleTodo(todos, 1);
    const twice = toggleTodo(once, 1);
    expect(twice[0]?.completed).toBeFalsy();
  });

  it('不存在的 id 不会报错', () => {
    const todos: Todo[] = [{ id: 1, text: 'A', completed: false }];
    expect(() => toggleTodo(todos, 999)).not.toThrow();
  });
});
