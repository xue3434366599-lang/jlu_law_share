import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { demos, published } from './fixtures.js';

const browser = await chromium.launch({ channel: 'msedge', headless:true });
const context = await browser.newContext({ permissions:['clipboard-read','clipboard-write'] });
const page = await context.newPage();
const errors = []; page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const base = 'http://127.0.0.1:8000';
const count = async n => { await page.locator('#result-count').filter({hasText:`共 ${n} 份资料`}).waitFor(); };
await mkdir('test-results', { recursive:true });
try {
  await page.goto(base); await count(0);
  assert.match(await page.locator('#results').innerText(), /资料库正在建设中/);
  assert.equal(await page.locator('#project-email').innerText(), 'jlu_law_share@qq.com');
  const mail = await page.locator('#submit-email').getAttribute('href');
  assert.match(mail,/^mailto:jlu_law_share@qq.com\?/);
  for(const label of ['【资料投稿】','署名方式：','资料来源及分享权限说明：','是否允许平台免费公开分享：']) assert.ok(decodeURIComponent(mail).includes(label));
  await page.locator('#copy-email').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'jlu_law_share@qq.com');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable:true, value: {writeText:() => Promise.reject(new Error('denied'))} }));
  await page.locator('#copy-email').click();
  await page.getByText(/无法自动复制/).waitFor();
  for (const width of [1440,1024,390,375]) {
    await page.setViewportSize({width,height:1000}); await page.goto(base); await count(0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `empty layout ${width}`);
    await page.screenshot({path:`test-results/empty-${width}.png`,fullPage:true});
  }
  const attack = '<img src=x onerror="window.injected=true">';
  const fixture = [...published, ...demos, null, {}, {...published[0],id:'unsafe',url:'javascript:alert(1)'}, {...published[0],id:'injection',title:attack,description:attack}, {id:'minimal',title:'最少字段测试',url:'https://example.invalid/minimal',status:'published'}];
  await page.route('**/data/resources.json', route => route.fulfill({json:fixture}));
  await page.reload(); await count(6);
  assert.equal(await page.locator('#results img').count(),0);
  assert.equal(await page.evaluate(() => window.injected),undefined);
  assert.equal(await page.locator('#results a:not([rel="noopener noreferrer"])').count(),0);
  await page.selectOption('#grade','2025'); await count(3);
  assert.equal(await page.locator('#course option').count(),2);
  await page.selectOption('#course','民法'); await page.selectOption('#teacher','示例教师乙'); await count(1);
  await page.selectOption('#type','exam-recall'); await page.selectOption('#classType','实验班');
  await page.fill('#search','债法'); await count(1);
  assert.match(await page.locator('#results').innerText(),/单人回忆.*非官方试题/s);
  await page.fill('#search','不存在的词'); await count(0);
  assert.match(await page.locator('#results').innerText(),/暂时没有找到/);
  await page.click('#reset'); await count(6);
  await page.selectOption('#grade','2025'); await page.selectOption('#course','民法'); await page.selectOption('#teacher','示例教师乙');
  await page.selectOption('#grade','2026'); await count(1);
  assert.equal(await page.inputValue('#course'),''); assert.equal(await page.inputValue('#teacher'),'');
  await page.click('#reset'); await count(6);
  for (const width of [1440,1024,390,375]) {
    await page.setViewportSize({width,height:1000});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `cards layout ${width}`);
    await page.screenshot({path:`test-results/cards-${width}.png`,fullPage:true});
  }
  await page.unroute('**/data/resources.json');
  await page.route('**/data/resources.json', route => route.fulfill({status:200,body:'broken json'}));
  await page.reload(); await page.getByRole('button',{name:'重新加载',exact:true}).waitFor();
  await page.unroute('**/data/resources.json'); await page.click('button:has-text("重新加载")'); await count(0);
  // Check keyboard access from the start of the page.
  await page.reload(); await count(0); await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').innerText(),'跳至资料库');
  assert.deepEqual(errors,[]);
  console.log('PASS: empty/live fixture states, all filters and reset, injection/link safety, mailto, clipboard success/failure, retry, keyboard, 4 responsive widths; no console or page errors.');
} finally { await browser.close(); }
