#!/usr/bin/env node
// 와이어프레임 수정 지시(번호 핀 + 메모) 점검 — 가짜 db로 페이지를 열어 누르고 · 적고 · 고침 표시 · 다시 열기 · 지우기까지
//   node tests/layout/wire-notes.cjs PAGE [SHOTS]   (PAGE = wire.cjs --out 폴더. 그 안 img/에 사진이 있는 화면을 하나 골라 씀)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = path.resolve(process.argv[2] || '.'), OUT = process.argv[3] || '';
const shot = (pg, name) => OUT ? pg.screenshot({ path: path.join(OUT, name) }) : null;
const MOCK = `
  window.__store = new Map(); window.__subs = []; window.__writes = 0;
  const snapOf = () => ({ docs: Array.from(window.__store.entries()).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([id, data]) => ({ id, exists: true, data: () => JSON.parse(JSON.stringify(data)) })) });
  window.__emit = () => setTimeout(() => window.__subs.forEach(cb => cb(snapOf())), 5);
  const col = { limit() { return col; }, onSnapshot(cb) { window.__subs.push(cb); setTimeout(() => cb(snapOf()), 10); return () => {}; },
    doc(id) { return {
      set: async d => { window.__writes++; window.__store.set(id, JSON.parse(JSON.stringify(d))); window.__emit(); },
      update: async d => { window.__writes++; if (!window.__store.has(id)) throw { code: 'not_found' }; window.__store.set(id, Object.assign({}, window.__store.get(id), d)); window.__emit(); },
      delete: async () => { window.__writes++; window.__store.delete(id); window.__emit(); } }; } };
  window.claude = { use: async n => n === 'db' ? { collection: () => col } : null };
`;
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 384, height: 832 } });
  const p = await ctx.newPage();
  await p.addInitScript(MOCK);
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + path.join(DIR, 'index.html'));
  await p.waitForFunction(() => document.getElementById('fxN').textContent.startsWith('남은'));
  ok(await p.textContent('#fxN') === '남은 0개 · 고친 0개', 'empty count');
  // 사진이 있는 첫 화면(홈 구역)
  const have = new Set(fs.readdirSync(path.join(DIR, 'img')).map(f => 'img/' + f));
  const pick = await p.evaluate(have => { const w = Array.from(document.querySelectorAll('.area .sc .pw[data-part="위"]')).find(x => have.includes(x.dataset.img)); w.scrollIntoView(); return { img: w.dataset.img, key: w.dataset.key, label: w.dataset.label, trial: w.dataset.trial }; }, Array.from(have));
  console.log('pick', pick);
  await p.click('.area .sc .pw[data-img="' + pick.img + '"]');
  ok(await p.isVisible('#ov'), 'overlay open');
  ok((await p.textContent('#ovT')).includes(pick.label), 'overlay title');
  ok(await p.isHidden('#ovF'), 'form hidden at first');
  await p.waitForFunction(() => document.getElementById('ovI').complete && document.getElementById('ovI').naturalWidth > 0);
  const r = await p.locator('#ovI').boundingBox();
  await p.mouse.click(r.x + r.width * 0.4, r.y + r.height * 0.2);
  ok(await p.isVisible('#ovF'), 'form shown after tap');
  ok((await p.textContent('#ovL')).startsWith('1번'), 'label 1번');
  ok(await p.waitForFunction(() => document.activeElement && document.activeElement.id === 'ovTa', null, { timeout: 2000 }).then(() => true, () => false), 'textarea focused');
  await p.fill('#ovTa', '글자를 한 단계 작게');
  // 위치를 다시 눌러도 적은 글은 남는다
  await p.mouse.click(r.x + r.width * 0.42, r.y + r.height * 0.22);
  ok(await p.inputValue('#ovTa') === '글자를 한 단계 작게', 'memo kept on re-tap');
  await p.click('#ovSave');
  await p.waitForFunction(() => window.__store.size === 1);
  const d1 = await p.evaluate(() => Array.from(window.__store.values())[0]);
  ok(d1.n === 1 && Math.abs(d1.x - 0.42) < 0.01 && Math.abs(d1.y - 0.22) < 0.01 && d1.img === pick.img && d1.key === pick.key && d1.status === 'open' && d1.memo === '글자를 한 단계 작게' && d1.part === '위' && d1.trial === +pick.trial, 'doc 1 fields ' + JSON.stringify(d1));
  ok(await p.isHidden('#ovF'), 'form hidden after save');
  await p.waitForSelector('#ovPins .pin.big');
  const pin = await p.locator('#ovPins .pin.big').boundingBox();
  const r2 = await p.locator('#ovI').boundingBox();
  ok(Math.abs(pin.x + pin.width / 2 - (r2.x + r2.width * 0.42)) < 2 && Math.abs(pin.y + pin.height / 2 - (r2.y + r2.height * 0.22)) < 2, 'overlay pin position');
  await shot(p, 'wfn_overlay.png');
  // 두 번째: 눌렀다가 닫기 → 저장 안 됨
  await p.mouse.click(r2.x + r2.width * 0.7, r2.y + r2.height * 0.6);
  ok((await p.textContent('#ovL')).startsWith('2번'), 'label 2번');
  await p.fill('#ovTa', '이 단추를 아래로');
  await shot(p, 'wfn_typing.png');
  await p.click('#ovCancel');
  ok(await p.evaluate(() => window.__store.size) === 1 && await p.locator('#ovPins .pin').count() === 1, 'cancel keeps 1');
  await p.mouse.click(r2.x + r2.width * 0.7, r2.y + r2.height * 0.6);
  await p.fill('#ovTa', '이 단추를 아래로');
  await p.click('#ovSave');
  await p.waitForFunction(() => window.__store.size === 2);
  await p.click('#ovX');
  ok(await p.isHidden('#ov'), 'overlay closed');
  // 작은 사진 위 핀 · 카드 아래 줄 · 맨 위 목록
  const thumbPins = await p.$$eval('.area .sc .pw[data-img="' + pick.img + '"] .pin', xs => xs.map(x => x.textContent));
  ok(thumbPins.join(',') === '1,2', 'thumb pins ' + thumbPins);
  const tw = await p.locator('.area .sc .pw[data-img="' + pick.img + '"]').boundingBox();
  const tp = await p.locator('.area .sc .pw[data-img="' + pick.img + '"] .pin').first().boundingBox();
  ok(Math.abs(tp.x + tp.width / 2 - (tw.x + tw.width * 0.42)) < 2.5 && Math.abs(tp.y + tp.height / 2 - (tw.y + tw.height * 0.22)) < 2.5, 'thumb pin position');
  ok(await p.locator('.sc-n[data-key="' + pick.key + '"] button').count() === 2, 'card rows');
  ok(await p.textContent('#fxN') === '남은 2개 · 고친 0개', 'count 2');
  ok((await p.textContent('#fxList')).includes(pick.label), 'top list has label');
  if (OUT) await p.locator('.area .sc[data-key="' + pick.key + '"]').screenshot({ path: path.join(OUT, 'wfn_card.png') });
  // 맨 위 목록에서 1번 → 고치기
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('#fxList [data-note]:first-child');
  ok(await p.isVisible('#ovF') && await p.inputValue('#ovTa') === '글자를 한 단계 작게', 'edit opens with memo');
  ok(await p.isVisible('#ovDel') && await p.isHidden('#ovRe'), 'edit buttons');
  ok(await p.locator('#ovPins .pin.on').count() === 1, 'edited pin highlighted');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id) !== 'ovTa', 'no keyboard pop on edit');
  await p.fill('#ovTa', '날짜 글자를 한 단계 작게');
  await p.click('#ovSave');
  await p.waitForFunction(() => Array.from(window.__store.values()).some(d => d.memo === '날짜 글자를 한 단계 작게'));
  await p.click('#ovX');
  // 통합관리실이 1번을 고침으로
  await p.evaluate(() => { for (const [id, d] of window.__store) if (d.n === 1) window.__store.set(id, Object.assign({}, d, { status: 'done', doneIn: 71, doneNote: '날짜 글자 20 → 16', doneAt: '2026-11-07T01:00:00Z' })); window.__emit(); });
  await p.waitForFunction(() => document.getElementById('fxN').textContent === '남은 1개 · 고친 1개');
  ok(!(await p.isHidden('#fxDone')), 'done details shown');
  const thumb2 = await p.$$eval('.area .sc .pw[data-img="' + pick.img + '"] .pin', xs => xs.map(x => x.textContent));
  ok(thumb2.join(',') === '2', 'thumb only open pins ' + thumb2);
  await p.click('#fxDoneS');
  ok((await p.textContent('#fxDoneList')).includes('시험판 71에서 고침 · 날짜 글자 20 → 16'), 'done row text');
  await shot(p, 'wfn_list.png');
  await p.click('#fxDoneList [data-note]');
  ok(await p.isVisible('#ovDone') && (await p.textContent('#ovDone')).includes('시험판 71에서 고쳤어요'), 'done banner');
  ok(await p.isVisible('#ovRe'), 'reopen visible');
  ok(await p.locator('#ovPins .pin.ok').count() === 1, 'done pin green while editing');
  await shot(p, 'wfn_done.png');
  await p.fill('#ovTa', '날짜 글자를 한 단계 작게 — 아직 커요');
  await p.click('#ovRe');
  await p.waitForFunction(() => Array.from(window.__store.values()).some(d => d.n === 1 && d.status === 'open' && d.reopenedAt));
  await p.waitForFunction(() => document.getElementById('fxN').textContent === '남은 2개 · 고친 0개');
  ok((await p.textContent('#fxSt')).includes('다시 열었어요'), 'reopen message');
  // 2번 지우기(두 번 눌러야)
  await p.click('#ovPins [data-note]:nth-child(2)').catch(() => {});
  let label = await p.textContent('#ovL');
  if (!label.startsWith('2번')) { await p.click('#ovList [data-note]:nth-child(2)'); label = await p.textContent('#ovL'); }
  ok(label.startsWith('2번'), 'editing 2');
  await p.click('#ovDel');
  ok(await p.evaluate(() => window.__store.size) === 2 && (await p.textContent('#ovDel')).includes('한 번 더'), 'delete armed');
  await p.click('#ovDel');
  await p.waitForFunction(() => window.__store.size === 1);
  ok(await p.isHidden('#ovF'), 'form closed after delete');
  await p.keyboard.press('Escape');
  ok(await p.isHidden('#ov'), 'escape closes');
  // 지난 시험판 사진에 단 것(같은 화면 · 같은 부분)은 회색
  await p.evaluate(k => { window.__store.set('old1', { n: 9, label: k.label, key: k.key, img: 'img/' + k.key + '@40.jpg', trial: 40, part: '위', x: 0.5, y: 0.5, memo: '예전 사진에 단 것', status: 'open', at: '2026-11-01T00:00:00Z' }); window.__emit(); }, pick);
  await p.waitForFunction(() => document.getElementById('fxN').textContent === '남은 2개 · 고친 0개');
  ok(await p.locator('.area .sc .pw[data-img="' + pick.img + '"] .pin.old').count() === 1, 'old pin grey');
  ok((await p.textContent('.sc-n[data-key="' + pick.key + '"]')).includes('시험판 40 사진에 단 것'), 'old row note');
  // 키보드: 사진에 초점 → Enter
  await p.focus('.area .sc .pw[data-img="' + pick.img + '"]');
  await p.keyboard.press('Enter');
  ok(await p.isVisible('#ov'), 'enter opens');
  await p.keyboard.press('Escape');
  ok(await p.evaluate(i => document.activeElement && document.activeElement.dataset && document.activeElement.dataset.img === i, pick.img), 'focus returns');
  // 가로 넘침 없음 (360 · 1280)
  for (const w of [360, 412, 1280]) {
    await p.setViewportSize({ width: w, height: 800 });
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no h-scroll page ' + w);
    await p.click('.area .sc .pw[data-img="' + pick.img + '"]');
    ok(await p.evaluate(() => { const o = document.getElementById('ov'); return o.scrollWidth <= o.clientWidth + 1; }), 'no h-scroll overlay ' + w);
    const rr = await p.locator('#ovI').boundingBox(); await p.mouse.click(rr.x + rr.width * 0.3, rr.y + 40);
    const f = await p.locator('#ovF').boundingBox();
    ok(f && f.y + f.height <= 800 + 1, 'form on screen ' + w);
    if (w === 360) await shot(p, 'wfn_360.png');
    if (w === 1280) await shot(p, 'wfn_1280.png');
    await p.click('#ovCancel'); await p.click('#ovX');
  }
  ok(errs.length === 0, 'page errors ' + errs.join(' | '));
  // db 없이 열면: 보기만 · 안내
  const p2 = await ctx.newPage();
  const errs2 = []; p2.on('pageerror', e => errs2.push(String(e)));
  await p2.addInitScript('window.claude = { use: async () => null };');
  await p2.goto('file://' + path.join(DIR, 'index.html'));
  await p2.waitForFunction(() => document.getElementById('fxN').textContent !== '불러오는 중');
  ok((await p2.textContent('#fxSt')).includes('claude.ai에서'), 'no-db note');
  await p2.click('.area .sc .pw[data-img="' + pick.img + '"]');
  const r3 = await p2.locator('#ovI').boundingBox(); await p2.mouse.click(r3.x + 50, r3.y + 50);
  ok(await p2.isHidden('#ovF') && (await p2.textContent('#ovHint')).includes('claude.ai'), 'no-db no form');
  ok(errs2.length === 0, 'page errors (no db) ' + errs2.join(' | '));
  await b.close();
  console.log('passes', passes, 'fails', fails);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
