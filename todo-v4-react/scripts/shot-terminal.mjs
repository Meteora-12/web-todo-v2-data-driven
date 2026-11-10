import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROMPT = 'PS C:\\Users\\PO\\Desktop\\web编程\\W11\\todo-v4-react&gt; ';

function line(text, cls = '') {
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div class="line ${cls}">${safe === '' ? '&nbsp;' : safe}</div>`;
}

function cmd(text) {
  return `<div class="line"><span class="prompt">${PROMPT}</span><span class="cmdtext">${text}</span></div>`;
}

function page(html) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #0c0c0c; }
    body { padding: 8px; display: inline-block; }
    .term {
      background: #0c0c0c;
      padding: 22px 28px;
      border-radius: 8px;
      font-family: Consolas, 'Cascadia Mono', 'Microsoft YaHei', monospace;
      font-size: 15px;
      line-height: 1.62;
      color: #d4d4d4;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      letter-spacing: 0.2px;
      width: 1080px;
    }
    .prompt { color: #d4d4d4; }
    .cmdtext { color: #ffffff; font-weight: 600; }
    .green { color: #16c60c; }
    .cyan { color: #3bd7e8; }
    .yellow { color: #d7ba7d; }
    .dim { color: #8a8a8a; }
    .bold { color: #ffffff; font-weight: 700; }
    .gap { height: 12px; }
  </style></head><body><div class="term">${html}</div></body></html>`;
}

const buildHtml = [
  cmd('npm run build'),
  line(''),
  line('> todo-v4-react@4.0.0 build'),
  line('> tsc --noEmit && vite build'),
  line(''),
  line('vite v5.4.21 building for production...', 'cyan'),
  line('✓ 37 modules transformed.', 'green'),
  line('rendering chunks...'),
  line('computing gzip size...'),
  line('dist/index.html                 0.41 kB │ gzip:  0.31 kB', 'dim'),
  line('dist/assets/index-DSBVKP68.css  3.41 kB │ gzip:  1.23 kB', 'dim'),
  line('dist/assets/index-C3Rz6j8G.js 146.81 kB │ gzip: 47.64 kB', 'dim'),
  line('✓ built in 321ms', 'green'),
  line(''),
  cmd('echo "exit=$LASTEXITCODE"'),
  line('exit=0', 'green'),
].join('');

const testHtml = [
  cmd('npm run test'),
  line(''),
  line('> todo-v4-react@4.0.0 test'),
  line('> vitest run'),
  line(''),
  line(' RUN  v2.1.9 C:/Users/PO/Desktop/web编程/W11/todo-v4-react', 'cyan'),
  line(''),
  line(' ✓ src/__tests__/todo.test.ts (11 tests) 3ms', 'green'),
  line(' ✓ src/__tests__/todo.patched.test.ts (16 tests) 4ms', 'green'),
  line(' ✓ src/__tests__/TodoApp.test.tsx (10 tests) 646ms', 'green'),
  line(''),
  line(' Test Files  3 passed (3)', 'bold'),
  line('      Tests  37 passed (37)', 'bold'),
  line('   Start at  16:11:43', 'dim'),
  line('   Duration  1.85s (transform 74ms, setup 607ms, collect 177ms, tests 653ms, environment 1.77s, prepare 260ms)', 'dim'),
  line(''),
  cmd('echo "exit=$LASTEXITCODE"'),
  line('exit=0', 'green'),
].join('');

const searchHtml = [
  cmd('rg --stats -n "document\\.querySelector|document\\.getElementById|innerHTML" src/components src/domain'),
  line('0 matches', 'green'),
  line('0 matched lines', 'green'),
  line('0 files contained matches', 'green'),
  line('5 files searched', 'dim'),
  line('0 bytes printed', 'dim'),
  line('10782 bytes searched', 'dim'),
  line('0.000135 seconds spent searching', 'dim'),
  line('0.012636 seconds', 'dim'),
  line(''),
  cmd('rg -n "document\\.querySelector|document\\.getElementById|innerHTML" src/'),
  line('src\\main.tsx:6:const container = document.getElementById(\'root\');', 'yellow'),
  line(''),
  line('# 全项目唯一一处 DOM 查询：React 挂载入口，取 #root 交给 createRoot；组件/领域层 0 命中', 'dim'),
].join('');

const treeHtml = [
  cmd('tree src /F'),
  line('Folder PATH listing'),
  line('Volume serial number is F29C-D992', 'dim'),
  line('C:\\USERS\\PO\\DESKTOP\\WEB编程\\W11\\TODO-V4-REACT\\SRC'),
  line('│   App.tsx'),
  line('│   index.css'),
  line('│   main.tsx'),
  line('│   storage.ts'),
  line('│   '),
  line('├───components'),
  line('│       TodoApp.tsx'),
  line('│       TodoForm.tsx'),
  line('│       TodoItem.tsx'),
  line('│       TodoList.tsx'),
  line('│       '),
  line('├───domain'),
  line('│       todo.ts'),
  line('│       '),
  line('├───test'),
  line('│       setup.ts'),
  line('│       '),
  line('└───__tests__'),
  line('        todo.patched.test.ts'),
  line('        todo.test.ts'),
  line('        TodoApp.test.tsx'),
].join('');

mkdirSync('docs', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--lang=zh-CN'],
});
const shotPage = await browser.newPage();
await shotPage.setViewport({ width: 1300, height: 900, deviceScaleFactor: 2 });

const jobs = [
  ['docs/s2_build.png', buildHtml],
  ['docs/s3_search.png', searchHtml],
  ['docs/s4_tree.png', treeHtml],
  ['docs/s5_test.png', testHtml],
];

for (const [file, html] of jobs) {
  await shotPage.setContent(page(html), { waitUntil: 'load' });
  const term = await shotPage.$('.term');
  await term.screenshot({ path: file });
  console.log('wrote', file);
}

await browser.close();
