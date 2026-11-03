// 시험판 34: 삼성 '절전 앱·깊은 절전 앱'(대표 지적 11/3: 여기 들어가면 알람이 제때 안 울림).
// 알람 허락 화면에서 '절전에서 빼기'를 삼성 휴대폰에서는 꼭 할 일로, 앱을 열 때마다 확인해 맨 위 빨간 줄, 누르면 앱 정보(배터리 → 제한 없음)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const data = () => [['settings', settings()], ['it_1', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', remind: '10', createdAt: old, updatedAt: old }]];
const spy = p => p.evaluate(() => { window.__open = []; window.Capacitor.Plugins.BxAlarm.openSettings = async x => { window.__open.push(x && x.which); return {}; }; });
const rowOf = (p, name) => p.evaluate(n => { const r = Array.from(document.querySelectorAll('#bx-start .bxp-row')).find(x => x.textContent.indexOf(n) >= 0); return r ? r.innerText.replace(/\s+/g, ' ').trim() : null; }, name);
const bar = p => p.evaluate(() => { const b = document.getElementById('bx-permbar'); return b ? b.innerText.replace(/\s+/g, ' ').trim() : null; });

module.exports = async function () {
  const c = checker('시험판 34 · 삼성 절전에서 빼기');

  // 1) 삼성, 알림·정확한 알람·잠금 화면은 허락했고 '제한 없음'이 아님 → 첫 알람 때 허락 화면이 뜨고 절전에서 빼기가 꼭 할 일
  let app = await openApp({ data: data(), perms: { notifications: true, exact: true, fullScreen: true, battery: false, maker: 'samsung' } });
  try {
    const p = app.page;
    await p.waitForTimeout(2200);
    await spy(p);
    c.ok(await p.evaluate(() => !!document.querySelector('#bx-start .bxp-list')), '삼성: 다른 허락이 다 있어도 절전에서 빼기 때문에 허락 화면이 뜸');
    const row = await rowOf(p, '절전에서 빼기');
    c.ok(row && /깊은 절전/.test(row) && !/권장/.test(row) && /설정 열기/.test(row), "절전에서 빼기: '권장'이 아니라 꼭 할 일, 깊은 절전 설명 " + JSON.stringify(row));
    c.eq(await p.evaluate(() => (document.querySelector('#bx-start .bxs-go') || {}).textContent), '절전에서 빼기', "파란 단추도 '절전에서 빼기'");
    c.ok(await p.evaluate(() => /앱 정보가 열리면 ‘배터리’를 눌러 ‘제한 없음’/.test(document.getElementById('bx-start').innerText)), '앱 정보 › 배터리 › 제한 없음 안내');
    await p.click('#bx-start .bxs-go'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => window.__open), ['battery'], '누르면 앱 정보(배터리)를 연다');
    // 2) 이대로 두면: 맨 위 빨간 줄이 남는다
    await p.click('#bx-start [data-bxp-nav="later"]'); await p.waitForTimeout(300);
    await p.evaluate(() => window.BX_permCheck()); await p.waitForTimeout(300);
    const b = await bar(p);
    c.ok(b && /삼성 절전 때문에 알람이 늦거나 안 울릴 수 있어요/.test(b) && /제한 없음/.test(b) && /설정 열기$/.test(b), '삼성 절전 빨간 줄 ' + JSON.stringify(b));
    await p.click('#bx-permbar [data-act="bx-perm-fix"]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => window.__open.slice(-1)), ['battery'], '빨간 줄의 설정 열기 → 앱 정보(배터리)');
    // 3) 제한 없음으로 바꾸고 돌아오면 사라진다
    await p.evaluate(() => { window.__perm.battery = true; window.BX_permCheck(); }); await p.waitForTimeout(300);
    c.eq(await bar(p), null, "'제한 없음'이면 빨간 줄이 사라짐");
    // 4) 배터리 '제한'(어느 휴대폰이든) → 알람이 안 울릴 수 있음
    await p.evaluate(() => { window.__perm.restricted = true; window.BX_permCheck(); }); await p.waitForTimeout(300);
    c.ok(/배터리가 ‘제한’이라 알람이 울리지 않을 수 있어요/.test(await bar(p) || ''), "배터리 '제한' 빨간 줄");
    await p.click('#bx-permbar [data-act="bx-perm-fix"]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => window.__open.slice(-1)), ['battery'], "'제한' 줄도 앱 정보(배터리)");
    c.eq(app.errors, [], '화면 오류(삼성)');
  } finally { await app.close(); }

  // 5) 삼성이 아닌 휴대폰: 절전에서 빼기는 예전처럼 '권장'(알람시계 알람은 절전 중에도 울림), 이것만으로는 화면·빨간 줄을 띄우지 않음
  app = await openApp({ data: data(), perms: { notifications: true, exact: true, fullScreen: true, battery: false } });
  try {
    const p = app.page;
    await p.waitForTimeout(2200);
    c.ok(await p.evaluate(() => !document.querySelector('#bx-start .bxp-list') && !document.getElementById('bx-permbar')), '삼성이 아니면 절전만으로는 허락 화면·빨간 줄 없음');
  } finally { await app.close(); }
  app = await openApp({ data: data(), perms: { notifications: false, exact: true, fullScreen: true, battery: false } });
  try {
    const p = app.page;
    await p.waitForTimeout(2200);
    const row = await rowOf(p, '절전에서 빼기');
    c.ok(row && /권장/.test(row) && !/깊은 절전/.test(row), "삼성이 아니면 '권장' " + JSON.stringify(row));
    c.eq(app.errors, [], '화면 오류(삼성 아님)');
  } finally { await app.close(); }
  return c.done();
};
