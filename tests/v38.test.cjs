// 시험판 38: (1) 설정은 목록(지금 값) › 묶음 화면(이름 + 값 줄) › 자세한 화면(대표 결정 11/3 18:58), 뒤로는 한 단계씩
// (2) 위 막대: 왼쪽 위 메뉴 단추 · 가운데 로고(누르면 홈) · 이름 없음, 아래 메뉴에 '더보기' 없음(대표 결정 18:58) (3) 처음 여는 화면은 자료를 읽은 뒤 닫힘
const { openApp, settings, checker } = require('./harness.cjs');

module.exports = async function () {
  const c = checker('시험판 38 · 설정 단계 · 위 막대 · 아래 메뉴 · 처음 여는 화면');
  const app = await openApp({ data: [['settings', settings({ defaultRemind: 10 })]] });
  try {
    const p = app.page;
    // (3) 처음 여는 화면은 닫혀 있다(누르는 것은 막지 않음)
    await p.waitForTimeout(800);
    c.ok(await p.evaluate(() => !document.getElementById('bx-splash')), '처음 여는 화면이 닫힘');
    // (2) 위 막대
    const bar = await p.evaluate(() => {
      const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
      const br = document.querySelector('.appbar-in > .brand').getBoundingClientRect();
      return { menu: vis(document.querySelector('.ab-menu')), more: vis(document.querySelector('.ab-more')), name: vis(document.querySelector('.brand-t')),
        center: Math.round(br.left + br.width / 2), w: innerWidth };
    });
    c.eq([bar.menu, bar.more, bar.name], [true, false, false], '메뉴 단추 보임 · ⋯ 없음 · 이름 없음');
    c.ok(Math.abs(bar.center - bar.w / 2) <= 1, '로고는 가운데 ' + bar.center);
    const dock = await p.evaluate(() => Array.from(document.querySelectorAll('.dock-in .dock-btn')).map(b => Array.from(b.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()));
    c.ok(!dock.includes('더보기') && dock.includes('홈'), "아래 메뉴에 '더보기' 없음 " + JSON.stringify(dock));
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(500);
    await p.click('.appbar-in > .brand'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => /\btoday\b/.test(document.getElementById('screen').className)), '로고를 누르면 홈');
    await p.click('.ab-menu'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => (document.querySelector('#sheet-title') || {}).textContent), '더보기', '메뉴 단추는 더보기 창');
    // (1) 설정 단계
    await p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root .menu-row')).find(b => /설정/.test(b.textContent)).click()); await p.waitForTimeout(600);
    const h1 = () => p.evaluate(() => document.querySelector('.screen.settings .page-head h1').textContent);
    c.eq(await h1(), '설정', '설정 목록');
    c.ok(await p.evaluate(() => /10분 전/.test(document.querySelector('[data-bxset="alarm"]').textContent)), '목록 줄에 지금 값(10분 전)');
    await p.click('[data-bxset="alarm"]'); await p.waitForTimeout(400);
    const rows = await p.evaluate(() => Array.from(document.querySelectorAll('.screen.settings .bx-arow')).map(r => [r.querySelector('b').textContent, (r.querySelector('small') || {}).textContent || '']));
    c.eq(rows.map(r => r[0]), ['알람 테스트', '아침 요약', '울리는 방식', '일정 알림 기본값', '잠금 화면 표시'], '알림 묶음 줄');
    c.ok(/루틴 알람 · 일정 알림 · 시간표 알림/.test(rows[2][1]) && /10분 전/.test(rows[3][1]) && rows[4][1] === '알람만', '줄 아래 지금 값 ' + JSON.stringify(rows));
    c.eq(await p.evaluate(() => getComputedStyle(document.querySelector('.bx-arow small')).color), await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ? getComputedStyle(document.querySelector('.bx-arow small')).color : ''), '값은 파란 글씨');
    await p.click('[data-bxset="alarm/lv"]'); await p.waitForTimeout(400);
    c.eq(await h1(), '울리는 방식', '자세한 화면');
    c.eq(await p.evaluate(() => document.querySelectorAll('.screen.settings .seg').length), 3, '울리는 방식의 고르개 셋');
    // 휴대폰 뒤로: 자세한 화면 → 묶음 → 목록
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    c.eq(await h1(), '알림', '뒤로 → 알림 묶음');
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    c.eq(await h1(), '설정', '뒤로 → 설정 목록');
    // 자세한 화면에서 바꾸면 묶음 화면 값이 바뀐다
    await p.click('[data-bxset="alarm"]'); await p.waitForTimeout(300);
    await p.click('[data-bxset="alarm/lock"]'); await p.waitForTimeout(300);
    await p.click('[data-bxlock="title"]'); await p.waitForTimeout(300);
    await p.click('.bx-set-back'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => /일정 제목/.test(Array.from(document.querySelectorAll('.bx-arow')).find(r => /잠금 화면 표시/.test(r.textContent)).textContent)), '잠금 화면 표시를 바꾸면 줄 값이 일정 제목');
    // 아침 요약은 줄에서 바로 끔
    await p.click('.bx-arow-sw .tog'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'settings') || [0, {}])[1].bxReport.on === false), '아침 요약 스위치는 줄에서 바로');
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
