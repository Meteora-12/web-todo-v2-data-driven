import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://localhost:4173/';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--lang=zh-CN', '--force-device-scale-factor=2'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 780, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });

async function addTask(text) {
  await page.click('input[aria-label="任务内容"]');
  await page.type('input[aria-label="任务内容"]', text);
  await page.click('.todo-form button[type="submit"]');
}

await addTask('完成 V4.0 组件拆分');
await addTask('补齐单元测试回归');
await addTask('整理 W11 截图证据');
// 把第一条标记为已完成
await page.click('[data-testid="todo-item-1"] .toggle');
await page.waitForFunction(() => {
  const el = document.querySelector('[data-testid="todo-item-1"]');
  return el?.classList.contains('done');
});

await new Promise((r) => setTimeout(r, 250));
await page.screenshot({ path: 'docs/s1_app.png', fullPage: true });

// 展开 State 面板，同一张图里同时看到「页面」与「State」
await page.click('.state-panel summary');
await new Promise((r) => setTimeout(r, 250));
await page.screenshot({ path: 'docs/s1b_state.png', fullPage: true });

// 再切到「已完成」筛选，验证呈现由 State 派生
await page.click('.filters button:nth-child(3)');
await new Promise((r) => setTimeout(r, 250));
await page.screenshot({ path: 'docs/s1c_filter.png', fullPage: true });

await browser.close();
console.log('app screenshots done');
