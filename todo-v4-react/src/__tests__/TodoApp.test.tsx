import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoApp from '../components/TodoApp';

// 轨道 B：UI 行为验证。所有断言都只看「渲染结果」与「State 快照」，
// 全程不查询 DOM 节点去做写操作 —— 因为组件里根本没有可写的 DOM 入口。

function stateOf(): unknown {
  const el = screen.getByTestId('state-json');
  return JSON.parse(el.textContent ?? 'null') as unknown;
}

async function addTask(text: string): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('任务内容'), text);
  await user.click(screen.getByRole('button', { name: '添加' }));
}

describe('TodoApp - State 驱动 UI', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('初始没有任务时显示空提示，State 为 []', () => {
    render(<TodoApp />);
    expect(screen.getByText('还没有任务，先添加一条吧。')).toBeInTheDocument();
    expect(stateOf()).toEqual([]);
  });

  it('输入任务点击添加：列表多一项、输入框清空、State 同步', async () => {
    render(<TodoApp />);
    const input = screen.getByLabelText('任务内容');
    await addTask('任务A');

    expect(screen.getByText('任务A')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(stateOf()).toEqual([{ id: 1, text: '任务A', completed: false }]);
  });

  it('纯空白不会添加任何任务（业务规则在领域层拦截）', async () => {
    render(<TodoApp />);
    await addTask('   ');
    expect(stateOf()).toEqual([]);
    expect(screen.getByText('还没有任务，先添加一条吧。')).toBeInTheDocument();
  });

  it('点击“完成”：样式变为完成态，State 的 completed 变 true', async () => {
    render(<TodoApp />);
    await addTask('任务A');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '完成' }));

    expect(screen.getByTestId('todo-item-1')).toHaveClass('done');
    expect(screen.getByRole('button', { name: '取消完成' })).toBeInTheDocument();
    expect(stateOf()).toEqual([{ id: 1, text: '任务A', completed: true }]);
  });

  it('点击“删除”：列表移除该项，State 同步少一项', async () => {
    render(<TodoApp />);
    await addTask('任务A');
    await addTask('任务B');
    const user = userEvent.setup();
    const itemA = screen.getByTestId('todo-item-1');
    await user.click(within(itemA).getByRole('button', { name: '删除' }));

    expect(screen.queryByText('任务A')).not.toBeInTheDocument();
    expect(screen.getByText('任务B')).toBeInTheDocument();
    expect(stateOf()).toEqual([{ id: 2, text: '任务B', completed: false }]);
  });

  it('编辑任务：保存后文字更新，State 同步；取消后不变', async () => {
    render(<TodoApp />);
    await addTask('任务A');
    const user = userEvent.setup();
    const item = screen.getByTestId('todo-item-1');

    await user.click(within(item).getByRole('button', { name: '编辑' }));
    const editInput = screen.getByLabelText('编辑任务 任务A');
    await user.clear(editInput);
    await user.type(editInput, '任务A-改');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('任务A-改')).toBeInTheDocument();
    expect(stateOf()).toEqual([{ id: 1, text: '任务A-改', completed: false }]);

    await user.click(screen.getByRole('button', { name: '编辑' }));
    await user.type(screen.getByLabelText('编辑任务 任务A-改'), '不要了');
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.getByText('任务A-改')).toBeInTheDocument();
  });

  it('筛选“未完成 / 已完成”只改变呈现，不改变 State', async () => {
    render(<TodoApp />);
    await addTask('未完成项');
    await addTask('已完成项');
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: '完成' })[1] as HTMLElement);
    const before = stateOf();

    await user.click(screen.getByRole('button', { name: '未完成' }));
    expect(screen.getByText('未完成项')).toBeInTheDocument();
    expect(screen.queryByText('已完成项')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '已完成' }));
    expect(screen.getByText('已完成项')).toBeInTheDocument();
    expect(screen.queryByText('未完成项')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '全部' }));
    expect(screen.getByText('未完成项')).toBeInTheDocument();
    expect(screen.getByText('已完成项')).toBeInTheDocument();
    expect(stateOf()).toEqual(before);
  });

  it('清除已完成：State 中 completed=true 的项全部移除', async () => {
    render(<TodoApp />);
    await addTask('A');
    await addTask('B');
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: '完成' })[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: '清除已完成' }));

    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(stateOf()).toEqual([{ id: 2, text: 'B', completed: false }]);
  });

  it('任务写入 localStorage，重新挂载后从 State 恢复', async () => {
    const { unmount } = render(<TodoApp />);
    await addTask('持久化任务');
    unmount();

    render(<TodoApp />);
    expect(screen.getByText('持久化任务')).toBeInTheDocument();
    expect(stateOf()).toEqual([{ id: 1, text: '持久化任务', completed: false }]);
  });

  it('任务文字按纯文本渲染，HTML 不会变成节点', async () => {
    render(<TodoApp />);
    await addTask('<img src=x onerror="alert(1)">');
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
