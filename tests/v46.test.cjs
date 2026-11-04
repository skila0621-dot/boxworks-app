// 시험판 46: 삼성 기준 점검 계속(대표 11/4 1:34 "메뉴 위치가 변동되는 방식 지양")
// 확인 필요 카드의 '날짜 변경'은 카드 아래로 펼치지 않고 페이지(내일 · 모레 · 다음 주 월, 날짜 · 시각 줄, 완료로 옮김)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function seed() {
  return [['settings', settings()],
    ['c_w', { type: 'category', name: '일·공부', color: '#2a78d6', order: 0, createdAt: old }],
    ['it_a', { type: 'item', title: '보고서 내기', date: '2026-11-01', start: '17:00', end: '18:00', categoryId: 'c_w', createdAt: old, updatedAt: old }],
    ['it_b', { type: 'item', title: '은행 서류', date: '2026-10-31', categoryId: 'c_w', createdAt: old, updatedAt: old }]];
}
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);

module.exports = async function () {
  const c = checker('시험판 46 · 확인 필요 날짜 변경 페이지');
  const app = await openApp({ data: seed() });
  try {
    const p = app.page;
    // 홈 요약 상자: 상자 안 20 → 화살표 · 숫자 칸이 글자 줄 32에서
    const sum = await p.evaluate(() => { const e = document.querySelector('.bx-sumcard'), st = Array.from(e.querySelectorAll('.bx-st')).map(b => b.getBoundingClientRect());
      return { pl: getComputedStyle(e).paddingLeft, l: Math.round(st[0].left), r: Math.round(innerWidth - st[st.length - 1].right) }; });
    c.eq(sum, { pl: '20px', l: 32, r: 32 }, '홈 요약 상자 안 20 · 숫자 칸 32에서 시작');
    c.eq(await p.evaluate(() => [getComputedStyle(document.getElementById('h-todo')).fontSize, getComputedStyle(document.getElementById('h-memo')).fontSize]), ['20px', '20px'], "상자 제목 '오늘 할 일' · '오늘의 메모' 같은 크기(20)");
    await p.click('[data-act="bx-late-open"]'); await p.waitForTimeout(500);
    const card = () => p.evaluate(() => Array.from(document.querySelectorAll('#sheet-b .bx-lc')).map(e => Math.round(e.getBoundingClientRect().top)));
    const tops0 = await card();
    c.eq(tops0.length, 2, '확인 필요: 카드 둘');
    await p.click('#sheet-b [data-bx-late="pick"][data-id="it_a"]'); await p.waitForTimeout(400);
    const pg = await p.evaluate(() => ({ t: (document.getElementById('bx-pg-t') || {}).textContent, q: Array.from(document.querySelectorAll('#bx-pg [data-bxlate46]')).map(b => [b.textContent.trim(), b.getAttribute('aria-pressed')]),
      d: document.querySelector('#bx-pg #bx-lc-date').value, tm: document.querySelector('#bx-pg #bx-lc-time').value, inline: !!document.querySelector('#sheet-b .bx-lc-pick') }));
    c.eq(pg, { t: '날짜 변경', q: [['내일11/3', 'true'], ['모레11/4', 'false'], ['다음 주 월11/9', 'false']], d: '2026-11-03', tm: '17:00', inline: false }, "'날짜 변경'은 페이지: 내일 · 모레 · 다음 주 월, 날짜 · 시각 줄(카드 아래로 펼치지 않음)");
    // ‹ : 그대로
    await p.click('#bx-pg [data-bxlate46="2026-11-04"]'); await p.waitForTimeout(150);
    await p.click('#bx-pg [data-bxpg="back"]'); await p.waitForTimeout(300);
    const a0 = await doc(p, 'it_a');
    c.ok(a0.date === '2026-11-01' && await p.evaluate(() => !document.getElementById('bx-pg') && !document.getElementById('bx-lc-date')) && JSON.stringify(await card()) === JSON.stringify(tops0), '‹ : 옮기지 않고, 카드 자리도 그대로');
    // 모레 → 완료: 11/4 17:00–18:00
    await p.click('#sheet-b [data-bx-late="pick"][data-id="it_a"]'); await p.waitForTimeout(400);
    await p.click('#bx-pg [data-bxlate46="2026-11-04"]'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => document.getElementById('bx-lc-date').value), '2026-11-04', '모레를 누르면 날짜 줄도 11/4');
    await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(500);
    const a1 = await doc(p, 'it_a');
    c.eq([a1.date, a1.start, a1.end, a1.origDate], ['2026-11-04', '17:00', '18:00', '2026-11-01'], '완료: 11월 4일 17:00–18:00으로 옮김(걸리는 시간 그대로)');
    c.ok(await p.evaluate(() => /11월 4일 오후 5:00로 옮겼어요/.test(document.body.textContent)), "알림 글 '11월 4일 오후 5:00로 옮겼어요'");
    // 시각 없는 일정: 날짜만
    await p.click('#sheet-b [data-bx-late="pick"][data-id="it_b"]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => document.getElementById('bx-lc-time').value), '', '시각 없는 일정: 시각 줄은 비어 있음');
    await p.fill('#bx-lc-date', '2026-11-06'); await p.dispatchEvent('#bx-lc-date', 'change'); await p.waitForTimeout(150);
    c.ok(await p.evaluate(() => Array.from(document.querySelectorAll('#bx-pg [data-bxlate46]')).every(b => b.getAttribute('aria-pressed') === 'false')), '날짜를 직접 고르면 빠른 칸 표시는 꺼짐');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    c.ok((await doc(p, 'it_b')).date === '2026-10-31' && await p.evaluate(() => !document.getElementById('bx-pg') && !!document.getElementById('sheet-b')), '휴대폰 뒤로: 페이지만 닫고 그대로');
    await p.click('#sheet-b [data-bx-late="pick"][data-id="it_b"]'); await p.waitForTimeout(400);
    await p.fill('#bx-lc-date', '2026-11-06'); await p.dispatchEvent('#bx-lc-date', 'change');
    await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(500);
    const b1 = await doc(p, 'it_b');
    c.eq([b1.date, b1.start || null], ['2026-11-06', null], '완료: 시각 없이 11월 6일로');
    // 새 루틴 템플릿 칸: 채운 상자, 창 끝에서 12 · 글자 32
    await p.evaluate(() => { const x = document.querySelector('#sheet-root [data-act="sheet-close"]'); if (x) x.click(); }); await p.waitForTimeout(300);
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('[data-act="bx-rt-new"]').click()); await p.waitForTimeout(500);
    const tp = await p.evaluate(() => { const t = document.querySelectorAll('.bx-tpl'), a = t[0].getBoundingClientRect(), b = t[1].getBoundingClientRect(), x = t[0].querySelector('b').getBoundingClientRect(), cs = getComputedStyle(t[0]);
      return { l: Math.round(a.left), r: Math.round(innerWidth - b.right), tx: Math.round(x.left), bd: cs.borderTopWidth }; });
    c.eq(tp, { l: 12, r: 12, tx: 32, bd: '0px' }, '새 루틴 템플릿: 테두리 없는 채운 상자, 창 끝에서 12 · 글자 32');
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
