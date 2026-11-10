# todo-v4-react

W11 实验：把 W9/W10 的原生 DOM Todo 重构为 React 组件 + State 驱动（V4.0）。

## 命令

```bash
npm install
npm run dev      # 本地开发
npm run build    # tsc --noEmit && vite build
npm run test     # vitest run（3 个文件 37 条用例）
npm run preview  # 预览 dist
```

## 组件职责

| 组件 | 职责 |
| --- | --- |
| `TodoApp` | 唯一持有 `todos` / `filter` 的组件；增删改都是 `setTodos(prev => 纯函数(prev, ...))`；`useEffect` 只做 localStorage 持久化 |
| `TodoForm` | 管理输入框内容，提交时通过 `onAdd` 把纯文本向上传 |
| `TodoList` | 只遍历 `todos` 渲染 `TodoItem`，空列表时显示对应提示 |
| `TodoItem` | 单条任务；完成、编辑、删除都通过回调向上传；编辑态是组件内部的纯 UI 状态 |

数据向下传（props），事件向上传（回调）；领域逻辑全部保留在 `src/domain/todo.ts` 的纯函数里，组件不复制业务规则。

## 目录

```
src/
├─ components/   TodoApp.tsx / TodoForm.tsx / TodoList.tsx / TodoItem.tsx
├─ domain/       todo.ts（纯函数 + 类型）
├─ __tests__/    todo.test.ts / todo.patched.test.ts / TodoApp.test.tsx
├─ storage.ts    localStorage 读写（含异常兜底）
├─ App.tsx
└─ main.tsx      React 挂载入口（全项目唯一一处 DOM 查询）
```

## 截图

`docs/` 下为实验报告使用的 6 张截图；`scripts/shot-app.mjs` 与 `scripts/shot-terminal.mjs` 用于重新生成。
