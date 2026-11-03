// 시험판 32: 대표 휴대폰 확인 뒤 고침(11/3). 설정 묶음 목록, 루틴 단계 '알람' 스위치, 루틴 꾹 누르기,
// ⋯ 메뉴의 위젯 두기, '내가 쓸 기능' 설명과 아침 일정 받아 보기, 명상 시작 전 5초
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function data(extra) {
  return [
    ['settings', settings(Object.assign({ bxReport: { on: true, at: '07:30' }, defaultRemind: 10, bxStart: { at: old, mods: { report: true, routines: true, tt: true, med: true } } }, extra || {}))],
    ['it_1', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', createdAt: old, updatedAt: old }],
    ['rt_m', { type: 'routine', name: '아침 준비', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '07:30', times: 6, every: 5, on: true,
      steps: [{ id: 'a', name: '씻기', min: 15 }, { id: 'b', name: '빨래 돌리기', min: 40, kind: 'wait' }, { id: 'c', name: '옷 입기', min: 10 }], createdAt: old, updatedAt: old }]
  ];
}
const openSettings = async p => {
  await p.click('[data-act="more"]'); await p.waitForTimeout(400);
  await p.locator('#sheet-root button', { hasText: '설정' }).first().click(); await p.waitForTimeout(600);
};
const doc = (p, id) => p.evaluate(i => (window.BX_T.docs().find(([k]) => k === i) || [0, null])[1], id);

module.exports = async function () {
  const c = checker('시험판 32 · 휴대폰 확인 뒤 고침');

  // 1) 설정: 첫 화면은 묶음 목록, 누르면 그 묶음만, 뒤로 가기로 목록(대표 결정 11/3)
  let app = await openApp({ data: data() });
  try {
    const p = app.page;
    await openSettings(p);
    const home = await p.evaluate(() => ({
      rows: Array.from(document.querySelectorAll('.bx-set-home [data-bxset]')).map(b => [b.dataset.bxset, (b.querySelector('.ml') || {}).textContent, (b.querySelector('.mv') || {}).textContent.trim()]),
      secs: document.querySelectorAll('.set-sec .set-row').length,
      foot: (document.querySelector('.bx-set-foot') || {}).textContent || ''
    }));
    c.eq(home.rows.map(r => r[1]), ['화면', '알림', '캘린더·데이터'], '설정 첫 화면은 묶음 목록(휴대폰 캘린더는 그 기능이 있을 때만, 시험판 39: 분류 → 캘린더)');
    c.ok(home.secs === 0, '첫 화면에는 세부 칸이 없다 ' + home.secs);
    c.ok(/아침 07:30/.test(home.rows[1][2]) && /10분 전/.test(home.rows[1][2]) && /월요일 시작/.test(home.rows[0][2]), '묶음 줄 오른쪽에 지금 고른 값 ' + JSON.stringify(home.rows));
    c.ok(/^이 휴대폰에만 저장 · 시험판 \d+$/.test(home.foot), '맨 아래 한 줄에 앱 버전 ' + JSON.stringify(home.foot));
    await p.click('[data-bxset="alarm"]'); await p.waitForTimeout(400);
    const al = await p.evaluate(() => ({ h: (document.querySelector('.page-head h1') || {}).textContent, back: !!document.querySelector('.bx-set-back'), rep: !!document.querySelector('[data-bxrep]'), view: !!document.querySelector('[data-theme-set]') }));
    c.ok(al.h === '알림' && al.back && al.rep && !al.view, "알림을 누르면 알림 칸만(제목 '알림', 왼쪽 위 ‹) " + JSON.stringify(al));
    c.eq(await p.evaluate(() => window.BX_back()), true, '휴대폰 뒤로 버튼은 설정 목록으로');
    c.ok(await p.evaluate(() => !!document.querySelector('.bx-set-home')), '뒤로 가면 묶음 목록');
    await p.click('[data-bxset="data"]'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => !!document.querySelector('[data-act="bx-set-data"]') && !!document.querySelector('[data-bxset="data/reset"]')), '분류·데이터 묶음에 백업·복원과 데이터 초기화(시험판 38: 줄 → 자세한 화면)');
    await p.click('.bx-set-back'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => !!document.querySelector('.bx-set-home')), '‹ 단추로도 목록');
    c.eq(app.errors, [], '화면 오류(설정)');
  } finally { await app.close(); }

  // 2) 루틴: 단계마다 '알람' 스위치, 꾹 누르면 고치기·지우기(되돌리기)
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(600);
    await p.locator('.rt-item .rt-open', { hasText: '아침 준비' }).first().click(); await p.waitForTimeout(600);
    const sw = await p.evaluate(() => ({ sel: document.querySelectorAll('#sheet-root select.rs-kind').length, on: Array.from(document.querySelectorAll('#sheet-root [data-rs-alarm]')).map(b => b.getAttribute('aria-checked')), note: (document.querySelector('#sheet-root .bx-rs-note') || {}).textContent || '' }));
    c.ok(sw.sel === 0 && JSON.stringify(sw.on) === '["true","false","true"]' && /울리지 않고 시간만/.test(sw.note), "단계마다 '알람' 스위치(기다리는 단계는 꺼짐), 할 일/기다리기 칸 없음 " + JSON.stringify(sw));
    await p.click('#sheet-root [data-rs-alarm="2"]'); await p.waitForTimeout(200);
    await p.click('#sheet-root [data-act="rt-save"]'); await p.waitForTimeout(500);
    const rt = await doc(p, 'rt_m');
    c.eq(rt && rt.steps.map(s => s.kind), ['do', 'wait', 'wait'], "스위치를 끈 단계는 '시간만'으로 저장");
    // 꾹 누르기
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(400);
    const bb = await p.evaluate(() => { const r = document.querySelector('.rt-item .rt-open[data-rid="rt_m"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await p.mouse.move(bb.x, bb.y); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(400);
    const menu = await p.evaluate(() => ({ t: (document.querySelector('#sheet-title') || {}).textContent, rows: Array.from(document.querySelectorAll('#sheet-root [data-bx-rm]')).map(b => b.dataset.bxRm) }));
    c.ok(menu.t === '아침 준비' && JSON.stringify(menu.rows) === '["edit","del"]', '루틴을 꾹 누르면 고치기·지우기 ' + JSON.stringify(menu));
    await p.click('#sheet-root [data-bx-rm="del"]'); await p.waitForTimeout(500);
    c.eq(await doc(p, 'rt_m'), null, '지우기를 누르면 루틴이 지워짐');
    const undo = p.locator('.toast button', { hasText: '되돌리기' }).first();
    await undo.click(); await p.waitForTimeout(500);
    c.ok(!!(await doc(p, 'rt_m')), '되돌리기를 누르면 루틴이 돌아옴');
    c.eq(app.errors, [], '화면 오류(루틴)');
  } finally { await app.close(); }

  // 3) ⋯ 메뉴: 홈 화면 위젯 두기. '내가 쓸 기능': 줄마다 설명, 아침 일정 받아 보기·시각 바꾸기
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('[data-act="more"]'); await p.waitForTimeout(400);
    const more = await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root .menu-row .ml')).map(e => e.textContent.trim()));
    c.ok(more.includes('위젯 추가'), '⋯ 메뉴에 홈 화면 위젯 두기 ' + JSON.stringify(more));
    await p.locator('#sheet-root .menu-row', { hasText: '위젯 추가' }).first().click(); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => (document.querySelector('#sheet-title') || {}).textContent), '홈 화면 위젯', '누르면 위젯 창');
    await p.evaluate(() => { const c = document.querySelector('#sheet-root [data-act="sheet-close"]'); if (c) c.click(); }); await p.waitForTimeout(300);
    await p.click('[data-act="more"]'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-act="bx-feat"]'); await p.waitForTimeout(500);
    const ft = await p.evaluate(() => ({
      desc: Array.from(document.querySelectorAll('#sheet-root .bx-ft-t small')).map(e => e.textContent.trim()),
      more: (document.querySelector('#sheet-root .bx-ft-more') || {}).textContent || ''
    }));
    c.ok(ft.desc.length >= 4 && ft.desc.every(Boolean), '기능마다 한 줄 설명 ' + JSON.stringify(ft.desc));
    c.ok(/07:30/.test(ft.more) && /알림창/.test(ft.more) && /미리 보기/.test(ft.more), '아침 일정: 언제 어디로 오는지와 받아 보기 ' + JSON.stringify(ft.more));
    await p.evaluate(() => { const l = window.Capacitor.Plugins.BxAlarm; l.local = async x => { window.__local = x; return {}; }; });
    await p.click('#sheet-root [data-act="bx-rep-try"]'); await p.waitForTimeout(300);
    const loc = await p.evaluate(() => window.__local && Object.assign({ now: Date.now() }, window.__local.alarms[0]));
    c.ok(loc && loc.kind === 'report' && loc.report && loc.at > loc.now - 1000 && loc.at - loc.now < 10000, '지금 한 번 받아 보기: 오늘 일정 알림을 몇 초 뒤로 건다 ' + JSON.stringify(loc && { kind: loc.kind, t: loc.title, d: loc.at - loc.now }));
    await p.click('#sheet-root [data-bxset="alarm"]'); await p.waitForTimeout(600);
    c.ok(await p.evaluate(() => !document.querySelector('#sheet-root .sheet') && (document.querySelector('.page-head h1') || {}).textContent === '알림'), "'시각 바꾸기'는 설정 › 알림으로");
    c.eq(app.errors, [], '화면 오류(메뉴)');
  } finally { await app.close(); }

  // 4) 명상: 시작을 누르면 5초를 센 뒤 첫 종(첫 종도 휴대폰 알람으로)
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.evaluate(() => { const l = window.Capacitor.Plugins.BxAlarm; window.__local = null; l.local = async x => { window.__local = x; return {}; }; l.cancelLocal = async () => ({}); });
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(600);
    const t0 = await p.evaluate(() => Date.now());
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(400);
    const lead = await p.evaluate(() => ({ cls: (document.querySelector('.bx-med-run') || {}).className || '', n: (document.getElementById('bx-med-left') || {}).textContent, cue: (document.getElementById('bx-med-cue') || {}).textContent }));
    c.ok(/lead/.test(lead.cls) && /^[45]$/.test(lead.n) && /내려놓고/.test(lead.cue), '시작 전 5초: 숫자와 안내 ' + JSON.stringify(lead));
    const list = await p.evaluate(() => (window.__local && window.__local.alarms || []).map(a => [a.id, a.at, a.sound]));
    const st = list.find(a => a[0] === 'med_start'), en = list.find(a => a[0] === 'med_end');
    c.ok(st && Math.abs(st[1] - t0 - 5000) < 1500 && st[2] === 'bowl' && en && Math.abs(en[1] - st[1] - 10 * 60000) < 50, '첫 종은 5초 뒤 휴대폰 알람으로, 끝 종은 그로부터 10분 ' + JSON.stringify(list.slice(0, 2)));
    await p.waitForTimeout(5300);
    const run = await p.evaluate(() => ({ cls: (document.querySelector('.bx-med-run') || {}).className || '', n: (document.getElementById('bx-med-left') || {}).textContent }));
    c.ok(!/lead/.test(run.cls) && /^(10:00|9:5\d)$/.test(run.n), '5초 뒤에는 남은 시간 ' + JSON.stringify(run));
    c.eq(app.errors, [], '화면 오류(명상)');
  } finally { await app.close(); }
  return c.done();
};
