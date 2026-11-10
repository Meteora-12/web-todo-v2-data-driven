# -*- coding: utf-8 -*-
import copy
import docx
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

SRC = r'C:/Users/PO/Desktop/web编程/W11/ai用的.docx'
OUT = r'C:/Users/PO/Desktop/web编程/W11/[李远正][2024150156]AI协作日志W11.docx'
IMG = 'C:/Users/PO/Desktop/web编程/W11/todo-v4-react/docs/'

doc = docx.Document(SRC)


def find_para(pred):
    for p in doc.paragraphs:
        if pred(p.text.strip()):
            return p
    raise KeyError('not found')


def find_exact(text):
    return find_para(lambda t: t == text)


def clear_runs(p):
    for child in list(p._p):
        if child.tag == qn('w:r') or child.tag == qn('w:hyperlink'):
            p._p.remove(child)


def add_run(p, text, bold=False, size=None, mono=False, italic=False, color=None):
    run = p.add_run(text)
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn('w:hint'), 'eastAsia')
    if mono:
        rFonts.set(qn('w:ascii'), 'Consolas')
        rFonts.set(qn('w:hAnsi'), 'Consolas')
        rFonts.set(qn('w:eastAsia'), '宋体')
        run.font.size = Pt(9)
    elif size is not None:
        run.font.size = Pt(size)
    if bold:
        run.bold = True
    if italic:
        run.italic = True
    if color is not None:
        run.font.color.rgb = color
    return run


def set_text(p, text, bold=False, size=None):
    clear_runs(p)
    add_run(p, text, bold=bold, size=size)
    return p


def insert_para(anchor, text='', bold=False, size=None):
    p = doc.add_paragraph()
    anchor._p.addnext(p._p)
    p.paragraph_format.space_after = Pt(3)
    if text:
        add_run(p, text, bold=bold, size=size)
    return p


def shade(p, fill='F4F6F8'):
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    pPr.append(shd)
    # 左侧竖线，读起来像代码块
    pBdr = OxmlElement('w:pBdr')
    left = OxmlElement('w:left')
    left.set(qn('w:val'), 'single')
    left.set(qn('w:sz'), '12')
    left.set(qn('w:space'), '8')
    left.set(qn('w:color'), 'C7D2FE')
    pBdr.append(left)
    pPr.append(pBdr)


def insert_code(anchor, lines):
    cursor = anchor
    for i, text in enumerate(lines):
        p = doc.add_paragraph()
        cursor._p.addnext(p._p)
        pf = p.paragraph_format
        pf.space_before = Pt(0)
        pf.space_after = Pt(0)
        pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
        pf.left_indent = Cm(0.15)
        if text:
            add_run(p, text, mono=True)
        shade(p)
        cursor = p
    # 删掉被清空的占位段，避免代码块上方多一条空行
    cursor._p.getparent().remove(anchor._p)
    nxt = cursor._p.getnext()
    if nxt is not None and nxt.tag == qn('w:p'):
        pPr = nxt.find(qn('w:pPr'))
        if pPr is None:
            pPr = OxmlElement('w:pPr')
            nxt.insert(0, pPr)
        spacing = pPr.find(qn('w:spacing'))
        if spacing is None:
            spacing = OxmlElement('w:spacing')
            pPr.append(spacing)
        spacing.set(qn('w:before'), '160')
    return cursor


def insert_image(anchor, path, width_cm, caption):
    p = doc.add_paragraph()
    anchor._p.addnext(p._p)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run()
    run.add_picture(path, width=Cm(width_cm))
    cap = doc.add_paragraph()
    p._p.addnext(cap._p)
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(8)
    add_run(cap, caption, size=9, italic=True, color=RGBColor(0x6B, 0x72, 0x80))
    if not anchor.text.strip():
        anchor._p.getparent().remove(anchor._p)
    return cap


# ================= 基本信息 =================
p = find_exact('使用的AI工具及方式： ＿＿＿＿＿＿＿＿')
set_text(p, '使用的AI工具及方式： DeepSeek V4，命令行调用（AI 出组件拆分方案和代码，我逐条看 diff，再用 build / test / 浏览器复核）')
p = find_exact('Git 仓库链接：＿＿＿＿＿＿＿＿')
set_text(p, 'Git 仓库链接：https://github.com/Meteora-12/web-todo-v2-data-driven')

# ================= 任务 1 =================
p_ai = find_exact('1. 我让 AI 做了（组件拆分/State 接入中 AI 做了什么）')
p = insert_para(p_ai,
    '我先给 AI 的是 W9/W10 的工程现状：src/main.ts 里还是原生 DOM 渲染，领域层 todo.ts 已经是纯函数，'
    'storage.ts 负责 localStorage，36 条 Vitest 用例全过。我要求它先不写代码，只给出组件拆分方案。')
p = insert_para(p,
    'AI 给了一版四层结构：TodoApp 持有 todos、filter；TodoForm 只管输入框；TodoList 只负责遍历；'
    'TodoItem 负责单条的完成、删除、编辑。数据用 props 向下传，事件用回调向上传，并顺手给出了每个组件的 Props 接口。'
    '我确认职责边界后，让它按这个结构生成 .tsx 文件，并把 todo.ts / storage.ts 原样迁进 src/domain 与 src/storage.ts。')
p = insert_para(p,
    '期间它建议把 filter 也放进 TodoList 内部，我拒绝了：筛选是视图状态，放进 TodoList 后 TodoApp 拿不到它做计数，'
    '而且同一份数据会存两处。最后 filter 留在 TodoApp，TodoList 只接收已经筛好的 todos。')

p_me = find_exact('2. 我做了（我自己完成了什么）')
p = insert_para(p_me,
    '① 用 Vite 5 + React 18 + TypeScript 建了 todo-v4-react 工程，package.json 里固定 '
    'build = tsc --noEmit && vite build、test = vitest run，tsconfig 开启 strict 与 noUncheckedIndexedAccess；'
    '② 把 W9 的 todo.ts、storage.ts 原样保留，只改 import 路径，业务规则可以继续复用（todo.test.ts 11 条 + todo.patched.test.ts 16 条领域用例原样带过来）；'
    '③ 逐个组件落代码：TodoApp 用 useState 惰性初始化读取 localStorage，所有增删改都走 setTodos(prev => 纯函数(prev, ...))，'
    'useEffect 只负责把 todos 写回 localStorage；④ 自己补了 TodoItem 的行内编辑（editing / draft 两个局部状态）和三档筛选；'
    '⑤ 写了 10 条 React Testing Library 用例，用 getByText / getByRole 断言页面与 State 快照一致；'
    '⑥ 跑 npm run build、npm run test，并截取页面与终端证据。')

# 代码片段 ①
p_code1 = find_exact('// 在此粘贴（要求至少包含：useState 定义、添加、切换、删除各一段）')
set_text(p_code1, '')
insert_code(p_code1, [
    '// src/components/TodoApp.tsx —— 唯一持有 todos 的组件',
    "const [todos, setTodos] = useState<Todo[]>(() => loadTodos(localStorage));",
    "const [filter, setFilter] = useState<Filter>('all');",
    '',
    '// 副作用只做持久化，State 是唯一事实来源',
    'useEffect(() => {',
    '  saveTodos(localStorage, todos);',
    '}, [todos]);',
    '',
    '// 增：不可变更新，返回新数组',
    'function handleAdd(text: string): void {',
    '  setTodos((prev) => addTodo(prev, text));',
    '}',
    '',
    '// 改：只替换命中的那条，其余对象保持原引用',
    'function handleToggle(id: number): void {',
    '  setTodos((prev) => toggleTodo(prev, id));',
    '}',
    '',
    '// 删：filter 生成新数组',
    'function handleDelete(id: number): void {',
    '  setTodos((prev) => removeTodo(prev, id));',
    '}',
    '',
    '// 派生值：页面上的列表永远是 State 的函数，不另存一份',
    'const visibleTodos = filterTodos(todos, filter);',
    'const remaining = todos.filter((todo) => !todo.completed).length;',
])

# 代码片段 ②
p_code2 = find_exact('// 在此粘贴（例如 TodoListProps、TodoItemProps）')
set_text(p_code2, '')
insert_code(p_code2, [
    '// 数据向下传，事件向上传：子组件只声明自己要什么，不依赖父组件的实现',
    'export interface TodoFormProps {',
    '  onAdd: (text: string) => void;',
    '}',
    '',
    'export interface TodoListProps {',
    '  todos: readonly Todo[];',
    '  filter: Filter;',
    '  onToggle: (id: number) => void;',
    '  onDelete: (id: number) => void;',
    '  onEdit: (id: number, text: string) => void;',
    '}',
    '',
    'export interface TodoItemProps {',
    '  todo: Todo;',
    '  onToggle: (id: number) => void;',
    '  onDelete: (id: number) => void;',
    '  onEdit: (id: number, text: string) => void;',
    '}',
])

# 运行截图
p_shot = find_exact('（在此粘贴：① React 版 Todo 跑通的页面截图；② npm run build 成功终端截图）')
set_text(p_shot, '')
insert_image(p_shot, IMG + 's1_app_crop.png', 9.6, '图 1  React 版 Todo 跑通页面（3 条任务，第 1 条已完成）')
last = find_para(lambda t: t.startswith('图 1'))
insert_image(last, IMG + 's2_build.png', 14.6, '图 2  npm run build 成功，tsc 0 报错、vite 产物生成')

# 踩的坑
p_pit = find_exact('5. 踩的坑（选填）')
p = insert_para(p_pit,
    '坑一：一开始在 handleAdd 里直接 todos.push(newTodo) 再 setTodos(todos)，引用没变，React 判定没有更新，页面不刷新。'
    '改成 setTodos(prev => [...prev, newTodo]) 后才生效——这也是任务 3 靶子代码里的同一个问题。')
p = insert_para(p,
    '坑二：持久化的 useEffect 依赖写成 [todos]，又在里面 setTodos，会触发死循环。最后 effect 只调 saveTodos，不回头改 State。')
p = insert_para(p,
    '坑三：jsdom 里 localStorage 在用例之间不会自动清空，第二条用例一开始就带着上一条的任务。'
    '在 afterEach 里同时 cleanup() 和 localStorage.clear() 才稳定。')

# ================= 任务 2 =================
p_self = find_exact('全项目搜索 document.querySelector、document.getElementById、innerHTML。')
p = insert_para(p_self,
    '用 ripgrep 分两步搜：先搜 src/components 与 src/domain（所有业务组件和领域层），0 matches；再搜整个 src/，'
    '只命中 main.tsx:6 的 document.getElementById(\'root\') —— 那是 React 的挂载入口，取到容器后交给 createRoot，'
    '之后所有渲染都由 React 接管。querySelector 与 innerHTML 全项目 0 命中。'
    'W9 的 render() 里 todoList.innerHTML = \'\'、createElement、appendChild 那一整套已经全部删掉。')

p = find_exact('粘贴搜索结果截图')
set_text(p, '')
last = insert_image(p, IMG + 's3_search.png', 14.6, '图 3  源码级搜索：组件/领域层 0 命中，全项目仅 React 挂载入口一处')

p = find_exact('粘贴 src/components/ 目录结构截图（证明你确实拆了组件）。')
set_text(p, '')
last = insert_image(p, IMG + 's4_tree.png', 12.4, '图 4  src 目录结构：components 下 4 个组件，领域逻辑独立在 domain/todo.ts')

p = find_exact('npm run test 终端截图（须显示全部 passed）。')
set_text(p, '')
last = insert_image(p, IMG + 's5_test.png', 14.6, '图 5  npm run test：3 个文件 37 条用例全部 passed')

p_fail = find_exact('如果测试失败了，你是怎么修的？（例如：保留了纯函数 addTodo 供测试调用，State 更新用 setTodos(addTodo(todos, text)) 组合，而不是把逻辑全塞进组件里。）')
p = insert_para(p_fail,
    '第一次跑确实失败了，但失败的不是业务逻辑：todo.patched.test.ts 还 import 着 W9 的 readIdFromDataset（从 DOM 的 dataset 取 id），'
    'React 版没有这个函数，Vitest 直接报 “No export named readIdFromDataset”。')
p = insert_para(p,
    '我的处理是：先确认 React 里 id 一路都是 number（Todo.id 的类型保证，不再经过 dataset 字符串），这个函数确实没有存在意义，'
    '所以删掉的是“dataset 字符串 → number”那一条用例，而不是删掉断言本身；parseTodoId 的边界用例全部保留。'
    '另外 27 条领域用例的 import 只改了路径，断言一条没动；State 更新统一写成 setTodos(prev => addTodo(prev, text))，'
    '业务逻辑仍然住在 todo.ts 的纯函数里，组件不复制规则。修完复跑 3 个文件 37 条全过（图 5）。')

# 表 0：UI 行为验证
table = doc.tables[0]
actual = [
    '列表出现“任务A”，输入框清空，State 面板同步出现 { id: 1, text: "任务A", completed: false }',
    '展开“查看当前 State”，3 条记录与页面 3 行一一对应，文字、顺序、completed 全部一致（图 6）',
    '文字变灰并出现删除线，按钮由“完成”变“取消完成”，State 里 completed 变为 true',
    '列表剩 2 项，State 也剩 2 条，计数从“2 项未完成 / 共 3 项”变为“1 项未完成 / 共 2 项”',
]
for i, text in enumerate(actual, start=1):
    cell = table.rows[i].cells[2]
    cell.text = ''
    para = cell.paragraphs[0]
    add_run(para, text, size=9)

# 状态一致性说明
p_state = find_exact('状态一致性说明：请用一段话说明你是如何确认“页面呈现”与“State 数据”一致的。')
p = insert_para(p_state,
    '我判断页面与 State 一致靠三点：① 整个组件树里只有 TodoApp 持有 todos，TodoList / TodoItem 收到的都是 props，'
    '子组件没有能力偷偷改数据；② 页面上的每一行都是 todos.map 的结果，筛选只是 filterTodos(todos, filter) 的派生值，'
    '不额外存一份列表；③ 页面底部放了一个“查看当前 State”面板，把 todos 原样序列化出来。'
    '我按“新增 A、B → 完成 A → 删除 B”的顺序操作，每步都对照列表行数、删除线、按钮文字、计数与 JSON 内容，'
    '结果始终一一对应（图 6）。单测里也用 state-json 的 JSON 与 getByText 的渲染结果做了同样的对照。')
insert_image(p, IMG + 's1b_state_crop.png', 8.2, '图 6  页面列表、“2 项未完成 / 共 3 项”计数与 State 快照逐条一致')

# 任务 2 踩坑：定位到【轨道 B】之后的那一个“3. 踩的坑”，而不是任务 1 的
p_track_b = find_exact('【轨道 B：UI 行为验证】')
paras = doc.paragraphs
idx_b = next(i for i, p in enumerate(paras) if p._p is p_track_b._p)
p_pit2 = next(p for p in paras[idx_b:] if p.text.strip() == '3. 踩的坑（选填）')
p = insert_para(p_pit2,
    '坑一：rg 默认遵守 .gitignore，dist/ 被跳过。如果只对着 dist 搜，会以为“没有 DOM 操作”，其实要搜的是 src/ 源码。')
p = insert_para(p,
    '坑二：StrictMode 下开发环境的 effect 会执行两次，localStorage 看起来写了两遍。查了 React 文档确认是故意的开发期行为，'
    '生产构建只执行一次，数据结果一致。')

# ================= 任务 3 =================
p_prompt_label = find_exact('1. 我的 Prompt（提问约束）')
p = insert_para(p_prompt_label,
    '角色：你是一名熟悉 React 18 + TypeScript 的前端工程师。')
p = insert_para(p,
    '上下文：下面这段 TodoApp 是“假 React”：用 ref 式数组 push 直接改 state，用 getElementById + innerHTML 手动写 DOM，'
    'toggle 时原地修改对象后把同一个引用交给 setTodos。')
p = insert_para(p,
    '任务：在不改变业务行为的前提下，把它改成符合 React 范式的函数组件。')
p = insert_para(p, '硬约束（逐条遵守）：')
p = insert_para(p, '① 删除所有 document.querySelector / getElementById / innerHTML / createElement，列表只能由 todos.map 渲染；')
p = insert_para(p, '② 禁止直接修改 state：不能 push / splice / 给对象属性赋值，必须返回新数组、新对象；')
p = insert_para(p, '③ setTodos 一律使用函数式更新，避免闭包拿到旧 todos；')
p = insert_para(p, '④ 保留原有业务规则：纯空白不能添加、点击 li 切换完成状态、添加后输入框清空；')
p = insert_para(p, '⑤ 不能引入 any、@ts-ignore、eslint-disable，key 必须使用稳定且唯一的 id；')
p = insert_para(p,
    '输出：先给完整代码，再用 3 条说明分别对应上面 ①②③ 的修改点，不要解释 React 是什么。')

# AI 修复结果
p_ai_code = find_exact('（在此粘贴 AI 修复后的核心代码）')
set_text(p_ai_code, '')
insert_code(p_ai_code, [
    'function TodoApp() {',
    '  const [todos, setTodos] = useState([]);',
    "  const [text, setText] = useState('');",
    '',
    '  function handleAdd() {',
    "    const trimmed = text.trim();",
    "    if (trimmed === '') return;                 // 业务规则保留在入口",
    '    const newTodo = { id: Date.now(), text: trimmed, completed: false };',
    '    setTodos((prev) => [...prev, newTodo]);     // 新数组 + 函数式更新',
    "    setText('');",
    '  }',
    '',
    '  function handleToggle(id) {',
    '    setTodos((prev) =>                          // 不在原对象上改',
    '      prev.map((todo) =>',
    '        todo.id === id ? { ...todo, completed: !todo.completed } : todo,',
    '      ),',
    '    );',
    '  }',
    '',
    '  return (',
    '    <div>',
    '      <input value={text} onChange={(e) => setText(e.target.value)} />',
    '      <button onClick={handleAdd}>添加</button>',
    '      <ul>                                      {/* 手动 DOM 写入已删除 */}',
    '        {todos.map((todo) => (',
    '          <li key={todo.id} onClick={() => handleToggle(todo.id)}>',
    "            {todo.text} {todo.completed ? '✔' : ''}",
    '          </li>',
    '        ))}',
    '      </ul>',
    '    </div>',
    '  );',
    '}',
])

# 表 1：范式残留审查
t1 = doc.tables[1]
rows = [
    ('手动写 DOM',
     "listRef = todos; listRef.push(newTodo); setTodos(listRef); 之后又 getElementById('todo-list').innerHTML += `<li>...`",
     '修了',
     "删除 listRef 与整段 DOM 写入，只剩 setTodos(prev => [...prev, newTodo])；列表由 todos.map 渲染，ul 上的 id 也去掉了"),
    ('原地修改 state 数组',
     'todos.map 里直接 t.completed = !t.completed，然后把同一个 todos 传给 setTodos，引用没变，React 不会重渲染',
     '修了',
     "prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo)，命中项返回新对象，其余保持原引用"),
    ('非函数式更新（第一版残留）',
     '第一版虽然删了 push，但写成 setTodos([...todos, newTodo])，连续两次添加读到的是同一个旧 todos，第二条会覆盖第一条',
     '第一版没修，第二版修了',
     'setTodos(prev => [...prev, newTodo])，两个点击事件都基于最新的 prev，不会互相覆盖'),
]
for ri, (a, b, c, d) in enumerate(rows, start=1):
    for ci, text in enumerate((a, b, c, d)):
        cell = t1.rows[ri].cells[ci]
        cell.text = ''
        add_run(cell.paragraphs[0], text, size=9)

# 业务行为验证
p_rule = find_exact('举一个具体规则，说明 AI 改完后它是否仍成立。')
p = insert_para(p_rule,
    '举“纯空白不能添加”：原代码是 if (text.trim() === \'\') return;。AI 最终版保留了这行，而且把 newTodo.text 改成 text.trim()，'
    '规则仍然成立。另一个规则“点击某条只切换它自己”也成立：map 只对 id 命中的项返回新对象，其余项保持原引用，不会误伤别的任务。')

p_verify = find_exact('你是怎么验证的？')
p = insert_para(p_verify,
    '三种方式都用了：① 看 diff，确认判断在 setTodos 之前，DOM 写入和 push 一行不剩，没有 any / ignore / disable；'
    '② 跑单测，addTodo([], \'   \') 返回空数组、toggleTodo 只翻转目标 id；'
    '③ 在浏览器里输入三个空格点添加，列表与 State 都不变；再添加两条并分别切换，只有被点的那条变化。')

p_disp = find_exact('（在此作答，并说明理由）')
set_text(p_disp,
    '部分修改（第一版退回，第二版接受）。退回第一版的原因：它删掉了 DOM 操作，但 setTodos([...todos, newTodo]) 仍然用闭包里的旧 todos，'
    '连续添加两条时第二条会覆盖第一条——这只是把“直接改数组”换成了“用旧数组拼新数组”，范式没有修彻底。'
    '另外 Date.now() 做 id 我没让它保留：同一毫秒连续添加两条会撞 key，切换或删除会误伤另一条，我按 W9 的 nextId(todos)（最大 id + 1）改掉。'
    '第二版这两处都改了，没有 any / @ts-ignore / eslint-disable，纯空白、切换、清空输入框三条业务规则原样保留，单测与手动点击都通过，所以我接受。')

# 总结
p_sum_q = find_exact('本周从“原生 DOM”转到“React 状态驱动”，你最大的收获是什么？')
p = insert_para(p_sum_q,
    '最大的收获是：判断“页面对不对”不再靠去 DOM 里找节点，而是先想清楚 State 应该是什么样，再确认页面是不是它的函数——'
    'State 是唯一事实来源，DOM 只是渲染结果。')

# 表头措辞与列宽
hdr = t1.rows[0].cells[3]
clear_runs(hdr.paragraphs[0])
add_run(hdr.paragraphs[0], '证据（AI 修复后的代码）', bold=True, size=9)

for table, widths in (
    (doc.tables[0], (4.4, 4.4, 5.8)),
    (doc.tables[1], (2.0, 4.6, 2.0, 6.0)),
):
    table.autofit = False
    for row in table.rows:
        for cell, w in zip(row.cells, widths):
            cell.width = Cm(w)

# 行不跨页 + 表头重复，避免表格被切出半行
for table in (doc.tables[0], doc.tables[1]):
    header_trPr = table.rows[0]._tr.get_or_add_trPr()
    header_trPr.append(OxmlElement('w:tblHeader'))
    for row in table.rows:
        row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))

# 靶子代码之后的两处标题补一点段前距
find_exact('1. 我的 Prompt（提问约束）').paragraph_format.space_before = Pt(12)
find_exact('3. 审查报告').paragraph_format.space_before = Pt(12)

doc.save(OUT)
print('saved', OUT)
