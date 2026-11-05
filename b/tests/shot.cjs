// 빠른 화면 사진: node tests/shot.cjs [폭] [다크] → tests/out/quick_*.png
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const serve = require('./serve.cjs');
(async () => {
  const W = +(process.argv[2] || 384), dark = process.argv[3] === 'dark';
  const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const srv = await serve(path.join(__dirname, '..', 'web'));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: 860 }, colorScheme: dark ? 'dark' : 'light', deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const KST = (h, mi) => { const d = new Date(); d.setHours(h, mi, 0, 0); return d.getTime(); };
  await p.addInitScript(now => { window.__B_SCENARIO = { now }; }, KST(13, 20));
  await p.goto(srv.url); await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(out, 'quick_today.png'), fullPage: true });
  await p.click('[data-open]'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'quick_detail.png'), fullPage: true });
  console.log(JSON.stringify(errs));
  await b.close(); srv.close();
})();
