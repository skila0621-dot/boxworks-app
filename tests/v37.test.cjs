// 시험판 37: (1) 여백 · 반투명 상자(대표 지적 11/3 17:25–17:33 '좌우 여백이 좁다 · 성격이 다른 것끼리 너무 붙어 있다')
// (2) 알림 진동 3번 + 놓치면 다시(대표 결정 11/3: 유튜브를 보다 알림이 진동 한 번 뒤 사라져 놓침) — 3분 · 10분 뒤 다시 알림이 계획에 들어가는지
// (3) 새 일정 알림 칩(대표 지적 11/3 18:12 '알림 없음을 바로 체크한 것처럼 보인다 · 기본값을 보여 주자') (4) 움직임(시트 닫힘 · 체크)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const NOW = '2026-11-03T10:00:00+09:00';
const item = (id, extra) => [id, Object.assign({ type: 'item', title: '치과', date: '2026-11-03', start: '15:00', remind: '10', createdAt: old, updatedAt: old }, extra || {})];
const rect = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(innerWidth - r.right), w: Math.round(r.width) }; }, sel);

module.exports = async function () {
  const c = checker('시험판 37 · 여백 · 상자 나누기 · 알림 다시 · 알림 칩 · 움직임');

  let app = await openApp({ now: NOW, data: [['settings', settings()], item('it_a'), item('it_b', { title: '은행', start: '16:00', done: true }), item('it_c', { title: '장보기', start: null })] });
  try {
    const p = app.page;
    // (2) 일정은 처음에 '알림'으로 울린다 → 3분 · 10분 뒤 한 번씩 더(휴대폰이 알림창에 그대로 있을 때만 다시 띄움)
    const plan = await p.evaluate(() => window.BX_alarmPlan(14));
    const a0 = plan.find(a => a.kind === 'item' && /^i_it_a_/.test(a.id));
    c.ok(!!a0 && a0.lv === 'notice', '치과 일정 알림(알림)');
    const nags = plan.filter(a => a.kind === 'nag');
    c.eq(a0 ? nags.filter(n => n.of === a0.id).map(n => [n.id.slice(a0.id.length), (n.at - a0.at) / 60000, n.nag, n.title]) : null,
      [['_n1', 3, 1, '치과'], ['_n2', 10, 2, '치과']], '다시 알림: 3분 뒤 · 10분 뒤');
    c.ok(!nags.some(n => /it_b/.test(n.of)), '완료한 일정은 다시 알림도 없음');

    // (1) 설정 › 알림: 성격마다 상자 하나, 상자는 화면 끝에서 12, 글자 줄은 32
    await p.click('[data-act="more"]'); await p.waitForTimeout(500);
    // 더보기도 묶음마다 상자(bx-grp)
    const grp = await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root .bx-grp')).map(g => g.querySelectorAll('.menu-row').length));
    c.ok(grp.length >= 2 && grp.every(n => n > 0), '더보기 묶음 상자 ' + JSON.stringify(grp));
    const g0 = await rect(p, '#sheet-root .bx-grp');
    c.eq(g0 && [g0.l, g0.r], [12, 12], '더보기 상자 바깥 여백 12');
    const sheetTitle = await rect(p, '#sheet-root .sheet-h h2');
    c.eq(sheetTitle && sheetTitle.l, 32, '시트 제목은 글자 줄 32');
    await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root .menu-row')).find(b => /설정/.test(b.textContent)).click()); await p.waitForTimeout(600);
    await p.click('[data-bxset="alarm"]'); await p.waitForTimeout(600);
    const secs = await p.evaluate(() => Array.from(document.querySelectorAll('.screen.settings .set-sec')).map(s => s.getAttribute('aria-label')));
    c.eq(secs, ['알람 테스트', '알림'], '알림 묶음: 알람 테스트 · 알림 두 상자(시험판 38: 줄 → 자세한 화면)');
    const s0 = await rect(p, '.screen.settings .set-sec'), h1 = await rect(p, '.screen.settings .page-head h1');
    c.eq(s0 && [s0.l, s0.r], [12, 12], '설정 상자 바깥 여백 12');
    c.ok(h1 && h1.l >= 32, '제목 줄 ' + (h1 && h1.l));
    const lbl = await p.evaluate(() => { const b = Array.from(document.querySelectorAll('.screen.settings .bx-arow')).find(r => /아침 요약/.test(r.textContent)); const r = b && b.getBoundingClientRect(); return r ? Math.round(r.left) : null; });
    c.eq(lbl, 32, '상자 안 글자는 32(상자 안 여백 20)');
    const bg = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.screen.settings .set-sec')); return [s.backgroundColor, s.boxShadow]; });
    c.ok(/rgba\(17, 20, 24, 0\.04/.test(bg[0]) && bg[1] === 'none', '반투명 상자 · 그림자 없음 ' + bg.join(' / '));
    // 화면 설정: 고르는 값과 위젯 추가는 다른 상자
    await p.click('.bx-set-back'); await p.waitForTimeout(400);
    await p.click('[data-bxset="view"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.screen.settings .set-sec')).map(s => s.getAttribute('aria-label'))), ['화면', '위젯'], '화면 설정 상자 둘');
    // 로고 밑 제목('박스웍스' 아래 '스케줄러') 사이
    c.eq(await p.evaluate(() => getComputedStyle(document.querySelector('.brand-t')).rowGap), '6px', '로고 글자 두 줄 사이 6');

    // (3) 새 일정: 시간 없는 일정은 칩에 '알림'(정하지 않음), 칸을 열면 켜면 들어갈 기본값
    await p.click('.dock [data-view="today"]'); await p.waitForTimeout(500);
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    const chip = () => p.evaluate(() => (document.querySelector('#sheet-root [data-fpanel="rem"]') || {}).textContent.trim());
    c.eq(await chip(), '알림', '칩: 알림(사선 종 · 알림 없음 아님)');
    c.ok(await p.evaluate(() => !/M3 3l18 18/.test(document.querySelector('#sheet-root [data-fpanel="rem"]').innerHTML)), '칩 종에 사선 없음');
    await p.click('#sheet-root [data-fpanel="rem"]'); await p.waitForTimeout(300);
    const note = await p.evaluate(() => (document.querySelector('#sheet-root .bx-rem-def') || {}).textContent || '');
    c.ok(/켜면 당일 오전 9시/.test(note) && /시간을 정하면 10분 전/.test(note), '기본값 안내 · ' + note);
    await p.fill('#f-title', '내일 오후 3시 치과'); await p.waitForTimeout(400);
    c.eq(await chip(), '10분 전', '시간을 말하면 기본값 10분 전');
    // (4) 닫을 때 시트 그림이 내려가며 사라지고, 곧 치워진다
    await p.click('#sheet-root [data-act="sheet-close"]'); await p.waitForTimeout(60);
    c.eq(await p.evaluate(() => [document.querySelectorAll('.bx-ghost-sheet').length, !!document.querySelector('#sheet-root .sheet')]), [1, false], '닫으면 그림만 남고 창은 바로 비움');
    await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => document.querySelectorAll('.bx-ghost').length), 0, '그림은 곧 치움');
    // 체크하면 톡
    await p.evaluate(() => document.querySelector('.chk[data-id="it_a"]').click()); await p.waitForTimeout(50);
    c.ok(await p.evaluate(() => !!document.querySelector('.chk.bx-pop[data-id="it_a"]')), '완료 체크가 톡 튐');
  } finally { await app.close(); }

  // (2) 일정을 '알람'으로 바꾸면 다시 알림은 따로 없다(알람은 확인할 때까지 울림)
  app = await openApp({ now: NOW, data: [['settings', settings({ bxLevels: { item: 'alarm' } })], item('it_a')] });
  try {
    const plan = await app.page.evaluate(() => window.BX_alarmPlan(14));
    c.ok(plan.some(a => /^i_it_a_/.test(a.id) && a.lv === 'alarm') && !plan.some(a => a.kind === 'nag'), '알람이면 다시 알림 없음');
  } finally { await app.close(); }
  return c.done();
};
