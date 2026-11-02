// 자료 지키기: 백업 왕복, 저장 공간이 가득 찼을 때, 저장된 자료가 깨졌을 때(문제점 점검 기술 4·9)
const { openApp, ready, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function sample() {
  return [
    ['settings', settings()],
    ['it_1', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', remind: '10', createdAt: old, updatedAt: old }],
    ['rt_m', { type: 'routine', name: '아침 준비', days: [1, 2, 3, 4, 5], mode: 'start', target: '07:30', times: 6, every: 5, on: true,
      steps: [{ id: 'a', name: '씻기', min: 15 }], createdAt: old, updatedAt: old }],
    ['tt_a', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', remind: '10', on: true, createdAt: old, updatedAt: old }],
    ['medlog', { type: 'medlog', days: { '2026-11-01': 10, '2026-11-02': 5 }, updatedAt: old }]
  ];
}
const strip = docs => docs.filter(([id]) => id !== 'settings').map(([id, d]) => [id, JSON.stringify(d)]).sort((a, b) => a[0].localeCompare(b[0]));

module.exports = async function () {
  const c = checker('자료 지키기');

  // 1) 백업 → 처음 상태로 → 불러오기: 명상 기록까지 그대로
  let app = await openApp({ data: sample() });
  try {
    const p = app.page;
    const before = strip(await p.evaluate(() => window.BX_T.docs()));
    const text = await p.evaluate(() => window.BX_T.backup());
    await p.evaluate(() => window.BX_T.reset('all'));
    await p.waitForTimeout(300);
    const wiped = await p.evaluate(() => window.BX_T.docs().filter(([id, d]) => d && ['item', 'routine', 'tt', 'medlog'].includes(d.type)).length);
    c.eq(wiped, 0, '처음 상태로 되돌리면 일정·루틴·시간표·명상 기록이 지워짐');
    await p.evaluate(t => window.BX_T.restore(t), text);
    await p.waitForTimeout(300);
    const after = strip(await p.evaluate(() => window.BX_T.docs()));
    const ids = after.map(x => x[0]);
    ['it_1', 'rt_m', 'tt_a', 'medlog'].forEach(id => c.ok(ids.includes(id), '불러오기 뒤 ' + id + '가 있음'));
    c.eq(after.filter(x => ['it_1', 'rt_m', 'tt_a', 'medlog'].includes(x[0])), before.filter(x => ['it_1', 'rt_m', 'tt_a', 'medlog'].includes(x[0])), '불러온 내용이 백업 전과 같음');
    // 휴대폰에도 저장됐는지: 다시 열어도 그대로
    await p.reload(); await ready(p);
    const reopened = await p.evaluate(() => window.BX_T.docs().map(([id]) => id));
    c.ok(reopened.includes('medlog') && reopened.includes('it_1'), '다시 열어도 불러온 자료가 남아 있음');
    c.eq(app.errors, [], '화면 오류(백업)');
  } finally { await app.close(); }

  // 2) 저장 공간이 가득 찼을 때: 조용히 사라지지 않고 위쪽 띠로 알린다
  app = await openApp({ data: sample() });
  try {
    const p = app.page;
    const filled = await p.evaluate(() => {
      // 남은 자리를 거의 다 채운다(크롬 계열은 출처마다 약 500만 자)
      let lo = 0, hi = 6e6;
      while (hi - lo > 2000) { const mid = Math.floor((lo + hi) / 2); try { localStorage.setItem('fill', 'x'.repeat(mid)); lo = mid; } catch (e) { hi = mid; } }
      localStorage.setItem('fill', 'x'.repeat(lo));
      return lo;
    });
    c.ok(filled > 1e6, '저장 공간 채우기');
    await p.evaluate(() => window.BX_T.write('it_big', { type: 'item', title: '긴 메모 일정', note: 'y'.repeat(20000), date: '2026-11-03', createdAt: new Date().toISOString() }));
    await p.waitForTimeout(400);
    const banner = await p.evaluate(() => window.BX_T.banner());
    c.ok(/저장하지 못했어요/.test(banner), '저장 실패를 위쪽 띠로 알림: ' + JSON.stringify(banner));
    await p.evaluate(() => localStorage.removeItem('fill'));
    await p.evaluate(() => window.BX_T.write('it_ok', { type: 'item', title: '작은 일정', date: '2026-11-03', createdAt: new Date().toISOString() }));
    await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => window.BX_T.banner()), '', '다시 저장되면 띠가 사라짐');
  } finally { await app.close(); }

  // 3) 저장된 자료가 깨졌을 때: 지우지 않고 따로 둔다
  app = await openApp({ data: null });
  try {
    const p = app.page;
    const broken = JSON.stringify(sample()).slice(0, 300);
    await p.evaluate(b => { localStorage.setItem('bx:data', b); }, broken);
    await p.reload(); await ready(p); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => localStorage.getItem('bx:data.broken')), broken, '깨진 자료를 bx:data.broken에 그대로 보관');
    c.ok(/따로 보관/.test(await p.evaluate(() => window.BX_T.banner())), '깨진 자료를 보관했다고 알림');
  } finally { await app.close(); }
  return c.done();
};
