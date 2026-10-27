# Todo 列表 V2.0 —— TypeScript 重构与单元测试（W9）

把 W8 的事件委托版 JS 应用重构为 strict 模式的 TypeScript，并补齐单元测试。

## 目录结构

```
todo-v2-ts/
├── index.html                 页面结构
├── src/
│   ├── todo.ts                领域模型 + 纯函数（id 解析 / 脏数据清洗 / 增删改查）
│   ├── storage.ts             localStorage 读写（异常兜底）
│   ├── main.ts                DOM 渲染与事件委托
│   └── __tests__/
│       ├── todo.test.ts             任务2：手写单测（11 条）
│       ├── todo.ai.test.ts          任务3：AI 生成的原始测试（保留对照）
│       └── todo.patched.test.ts     任务3：人工修补后的测试（17 条）
└── docs/test-run-manual.png   任务2 运行截图
```

## 常用命令

```bash
npm install
npm run dev     # 启动 Vite 开发服务器
npm run build   # tsc --noEmit，strict 模式类型检查
npm run test    # vitest run，36 条测试全部通过
```

## W8 → W9 的关键改动

- `interface Todo` 替代隐式对象；`id` 从 `string` 改为 `number`，DOM 的 `dataset.id` 通过 `parseTodoId` 显式转换（空串不会被 `Number('') === 0` 误判）。
- `JSON.parse` 的结果统一按 `unknown` 处理，用类型守卫 `isTodo` + `sanitizeTodos` 过滤脏数据、去重 id。
- `addTodo` 的 id 由「现有最大 id + 1」生成，避免 `Date.now()` 同毫秒重复。
- 业务逻辑与 DOM / localStorage 解耦，纯函数全部可单测；storage 通过 `Pick<Storage, ...>` 注入，测试无需浏览器。
