// 시험판 40: 시간표 여러 개 — 칩으로 하나씩 보기, 새 수업은 보고 있는 시간표로, 홈에 보이기(홈 · 위젯에서만 빠지고 알림은 그대로),
// 기간(끝나면 홈 · 알림에서 빠지고 '끝남'으로 남음), 만들기 · 이름 · 삭제(되돌리기), 백업(대표 결정 11/3 21:51, 결정 기록 D-15)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function seed() {
  return [['settings', settings()],
    ['tts_main', { type: 'ttset', name: '학교', home: true, from: '2026-09-01', to: '2026-12-18', order: 0, createdAt: old }],
    ['tts_a', { type: 'ttset', name: '학원', home: false, from: null, to: null, order: 1, createdAt: old }],
    ['tts_b', { type: 'ttset', name: '물리치료', home: true, from: '2026-09-01', to: '2026-10-31', order: 2, createdAt: old }],
    ['tt_s', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', place: '301호', remind: '10', color: '#2a78d6', on: true, createdAt: old, updatedAt: old }],
    ['tt_m', { type: 'tt', name: '수학 학원', days: [1, 3], start: '19:00', end: '21:00', place: '', remind: '10', color: '#6250d6', on: true, set: 'tts_a', createdAt: old, updatedAt: old }],
    ['tt_p', { type: 'tt', name: '물리치료', days: [1, 2, 4], start: '14:00', end: '15:00', place: '', remind: '10', color: '#e34948', on: true, set: 'tts_b', createdAt: old, updatedAt: old }]];
}
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
const blocks = p => p.evaluate(() => Array.from(document.querySelectorAll('.tt-body .tt-b b')).map(b => b.textContent));

module.exports = async function () {
  const c = checker('시험판 40 · 시간표 여러 개 · 홈에 보이기 · 기간');
  let app = await openApp({ data: seed() });
  try {
    const p = app.page;
    // (1) 알림: 홈에서 뺀 학원은 그대로 울리고, 끝난 물리치료는 울리지 않고, 학교는 12월 18일까지만
    const plan = await p.evaluate(() => window.BX_alarmPlan(60).filter(a => /^tt_/.test(a.id)).map(a => a.id));
    c.ok(plan.some(id => id === 'tt_tt_m_2026-11-02'), '홈에서 뺀 시간표(학원)도 알림은 그대로 ' + plan.filter(x => /tt_m/.test(x)).slice(0, 2));
    c.ok(!plan.some(id => /^tt_tt_p_/.test(id)), '기간이 끝난 시간표(물리치료)는 알림 없음');
    c.ok(plan.some(id => id === 'tt_tt_s_2026-12-16') && !plan.some(id => /^tt_tt_s_2026-12-(2[1-9]|3)/.test(id)), '학교는 12월 18일까지만 알림');
    // (2) 홈 · 위젯: 학교만(학원은 홈에서 뺌, 물리치료는 끝남)
    const homeTt = await p.evaluate(() => Array.from(document.querySelectorAll('#tcard2 .tt-row .row-title')).map(e => e.textContent));
    c.eq(homeTt, ['경영학원론'], '홈 오늘 할 일: 학교 수업만');
    // 위젯은 지난 7일도 넘겨 본다 → 오늘부터만 본다(물리치료는 10월 31일까지라 그 전 주에는 있음)
    const wd = await p.evaluate(() => window.BX_widgetData().items.filter(i => i.k === 'tt' && i.at >= Date.parse('2026-11-02T00:00:00+09:00')).map(i => i.title));
    c.ok(wd.includes('경영학원론') && !wd.includes('수학 학원') && !wd.includes('물리치료'), '위젯도 학교 수업만(오늘부터) ' + JSON.stringify(Array.from(new Set(wd))));
    c.ok(await p.evaluate(() => window.BX_widgetData().items.some(i => i.k === 'tt' && i.title === '물리치료' && i.at < Date.parse('2026-11-01T00:00:00+09:00'))), '기간 안이던 지난주에는 물리치료가 그대로(위젯 ‹로 넘겨 볼 때)');
    // (3) 시간표 화면: 칩으로 하나씩
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(700);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.bx-ttchips .bx-cchip')).map(b => b.textContent.trim())), ['학교', '학원', '물리치료 · 끝남', '시간표'], '시간표 칩 줄');
    // 시간표 색(대표 11/3 23:30): 칩마다 색 점. 고른 적 없으면 순서대로 기본 색
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.bx-ttchips [data-bxtts] .bx-cdot')).map(i => i.style.getPropertyValue('--c'))), ['#2a78d6', '#1baf7a', '#eda100'], '칩의 시간표 색 점');
    c.eq(await blocks(p), ['경영학원론', '경영학원론'], '학교 시간표의 수업만');
    c.ok(/9월 1일 ~ 12월 18일/.test(await p.evaluate(() => (document.querySelector('.bx-tt-note') || {}).textContent || '')), '기간 한 줄');
    await p.click('[data-bxtts="tts_a"]'); await p.waitForTimeout(500);
    c.eq(await blocks(p), ['수학 학원', '수학 학원'], '학원 칩 → 학원 수업만');
    c.ok(/홈에 안 보임 · 알림은 울려요/.test(await p.evaluate(() => document.querySelector('.bx-tt-note').textContent)) && await p.evaluate(() => localStorage.getItem('bx:ttSel')) === 'tts_a', '학원: 홈에 안 보임 한 줄 · 고른 시간표를 기억');
    await p.click('[data-bxtts="tts_b"]'); await p.waitForTimeout(500);
    c.ok(/끝난 시간표/.test(await p.evaluate(() => document.querySelector('.bx-tt-note').textContent)) && (await blocks(p)).length === 3, '끝난 시간표도 지우지 않고 그대로 보임');
    // (4) 새 수업은 보고 있는 시간표로(학원)
    await p.click('[data-bxtts="tts_a"]'); await p.waitForTimeout(400);
    await p.click('[data-act="tt-new"]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('[data-bxttpick]')).map(b => [b.textContent, b.getAttribute('aria-pressed')])), [['학교', 'false'], ['학원', 'true'], ['물리치료', 'false']], '수업 창: 시간표 고르기(학원이 골라져 있음)');
    await p.fill('#tt-name', '영어 학원');
    await p.click('[data-act="tt-day"][data-d="5"]');
    await p.click('[data-act="tt-save"]'); await p.waitForTimeout(500);
    const eng = await p.evaluate(() => window.BX_T.docs().filter(([, d]) => d && d.type === 'tt' && d.name === '영어 학원').map(([, d]) => [d.set, d.color]));
    c.eq(eng, [['tts_a', '#1baf7a']], '새 수업 → 학원, 색은 학원 색으로 시작');
    // 수업을 다른 시간표로 옮기기
    await p.click('.tt-b[data-id="tt_m"]'); await p.waitForTimeout(400);
    // 시험판 45: 시간표는 줄을 누르면 페이지
    await p.click('[data-bxtt45="set"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-bxttpick="tts_main"]'); await p.waitForTimeout(150);
    await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(250);
    await p.click('[data-act="tt-save"]'); await p.waitForTimeout(500);
    c.ok((await doc(p, 'tt_m')).set === null && (await blocks(p)).every(b => b !== '수학 학원'), '수업 창에서 학교로 옮기기(처음 시간표는 비움)');
    // (5) 고른 칩을 한 번 더 → 자세히: 홈에 보이기 · 기간
    await p.click('[data-bxtts="tts_a"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => (document.querySelector('#sheet-title') || {}).textContent), '시간표', '고른 칩을 한 번 더 누르면 그 시간표 설정');
    await p.click('#sheet-root [data-bxttshome]'); await p.waitForTimeout(300);
    c.eq((await doc(p, 'tts_a')).home, true, '홈에 보이기 켜기');
    await p.click('#sheet-root [data-bxttscol="#6250d6"]'); await p.waitForTimeout(300);
    c.ok((await doc(p, 'tts_a')).color === '#6250d6' && await p.evaluate(() => document.querySelector('.bx-ttchips [data-bxtts="tts_a"] .bx-cdot').style.getPropertyValue('--c')) === '#6250d6' && (await doc(p, 'tt_m')).color === '#6250d6', '시간표 색 바꾸기 → 칩 점 · 이미 넣은 수업 색은 그대로');
    await p.click('#sheet-root [data-bxttsper]'); await p.waitForTimeout(300);
    let a = await doc(p, 'tts_a');
    c.ok(a.from === '2026-11-02' && a.to === null && await p.evaluate(() => !!document.getElementById('bx-tts-to')), '기간 켜기: 오늘부터, 끝나는 날은 고르게 비움');
    await p.evaluate(() => { const i = document.getElementById('bx-tts-to'); i.value = '2026-11-01'; i.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(300);
    a = await doc(p, 'tts_a');
    c.eq(a.to, '2026-11-02', '끝나는 날이 시작보다 앞이면 시작 날로');
    await p.evaluate(() => { const i = document.getElementById('bx-tts-to'); i.value = '2026-11-30'; i.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(300);
    const plan2 = await p.evaluate(() => window.BX_alarmPlan(60).filter(a => /^tt_tt_m|^tt_tt_.*/.test(a.id)).map(a => a.id));
    c.ok((await doc(p, 'tts_a')).to === '2026-11-30' && !plan2.some(id => /^tt_.*_2026-12-/.test(id) && !/tt_tt_s_|tt_tt_m_/.test(id)), '학원 기간 11월 30일까지 → 12월 알림 없음');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    // (6) 만들기 · 이름 · 삭제 · 되돌리기
    await p.click('[data-act="bx-ttsets"]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root .bx-calrow .bx-at b')).map(b => b.textContent.trim())), ['학교', '학원', '물리치료'], '시간표 목록');
    await p.click('#sheet-root [data-act="bx-tts-add"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'bx-tts-name'), '만들면 이름 칸에 커서');
    await p.fill('#bx-tts-name', '치과 교정'); await p.waitForTimeout(700);
    const nid = await p.evaluate(() => localStorage.getItem('bx:ttSel'));
    c.ok((await doc(p, nid)).name === '치과 교정', '새 시간표 이름 · 새 시간표를 고름');
    c.eq((await doc(p, nid)).color, '#1baf7a', '새 시간표 색은 쓰지 않은 색부터(학교 파랑 · 학원 보라 · 물리치료 노랑 → 청록)');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    c.eq(await blocks(p), [], '새 시간표는 비어 있음');
    await p.click('[data-bxtts="tts_b"]'); await p.waitForTimeout(400);
    await p.click('[data-bxtts="tts_b"]'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-act="bx-tts-del"]'); await p.waitForTimeout(500);
    c.ok(!(await doc(p, 'tts_b')) && !(await doc(p, 'tt_p')), '삭제: 시간표와 수업');
    await p.evaluate(() => { const b = Array.from(document.querySelectorAll('.toast button, #toast button')).find(x => /되돌리기/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(500);
    c.ok(!!(await doc(p, 'tts_b')) && !!(await doc(p, 'tt_p')), '되돌리기: 시간표와 수업이 그대로');
    // (7) 캘린더 목록에도 시간표 줄(삭제 뒤에는 시간표 목록 창이 열려 있음)
    await p.evaluate(() => { const x = document.querySelector('#sheet-root [data-act="sheet-close"]'); if (x) x.click(); }); await p.waitForTimeout(300);
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(500);
    await p.click('[data-act="bx-cals"]'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => { const h = Array.from(document.querySelectorAll('#sheet-root .bx-ft-hd')).find(x => /시간표/.test(x.textContent)); return !!h && h.nextElementSibling.querySelectorAll('[data-tts]').length === 4; }), '캘린더 목록 아래 시간표 줄(홈에 보이기)');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    // (8) 백업에 시간표 묶음이 들어가고 되살아남
    const bk = await p.evaluate(() => window.BX_T.backup());
    c.ok(/"type": "ttset"/.test(bk), '백업에 시간표 묶음');
    await p.evaluate(() => window.BX_T.reset('all')); await p.waitForTimeout(600);
    c.ok(!(await doc(p, 'tts_a')), '처음 상태로 되돌리면 시간표 묶음도 지움');
    await p.evaluate(t => window.BX_T.restore(t), bk); await p.waitForTimeout(900);
    c.ok((await doc(p, 'tts_a')) && (await doc(p, 'tts_a')).name === '학원', '불러오기로 시간표 묶음이 되살아남');
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }

  // (9) 처음 쓰던 시간표(문서 없음)는 '시간표'로 보이고, 이름을 바꾸면 그때 문서를 만든다
  app = await openApp({ data: [['settings', settings()], ['tt_s', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', remind: '10', color: '#2a78d6', on: true, createdAt: old, updatedAt: old }]] });
  try {
    const p = app.page;
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(600);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.bx-ttchips .bx-cchip')).map(b => b.textContent.trim())), ['시간표', '시간표'], '시간표가 하나일 때: [시간표] [+ 시간표]');
    c.ok(await p.evaluate(() => !document.querySelector('.bx-tt-note')), '기간 · 홈 설정이 없으면 한 줄 없음');
    await p.click('[data-bxtts="tts_main"]'); await p.waitForTimeout(400);
    await p.fill('#bx-tts-name', '학교'); await p.waitForTimeout(700);
    const m = await doc(p, 'tts_main');
    c.ok(m && m.type === 'ttset' && m.name === '학교', '이름을 바꾸면 처음 시간표 문서를 만듦');
    c.eq(app.errors, [], '화면 오류(2)');
  } finally { await app.close(); }
  return c.done();
};
