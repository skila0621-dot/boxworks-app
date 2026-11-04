// 시험판 48(대표 11/4 13:45 ~ 14:07): 명상 끝내기(휴대폰 알림 · 앱 안 줄) · 호흡 꽃잎 · '소리와 호흡' 줄 · + 단추 /
// 일정 알림 페이지 정렬 · 시간표 여백 · 메모 화면(목록만 + 새 메모 페이지) · 휴대폰 캘린더 일정 색 · 칩 줄 밀기 · 위젯 → 홈
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
const toasts = p => p.evaluate(() => Array.from(document.querySelectorAll('#toasts > *')).map(t => t.textContent));
// 손가락으로 옆으로 밀기(touchstart → touchend)
const swipe = (p, sel, dx) => p.evaluate(({ sel, dx }) => {
  const el = document.querySelector(sel); const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const t0 = new Touch({ identifier: 1, target: el, clientX: x, clientY: y }), t1 = new Touch({ identifier: 1, target: el, clientX: x + dx, clientY: y + 2 });
  el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t0], changedTouches: [t0] }));
  el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t1] }));
}, { sel, dx });

module.exports = async function () {
  const c = checker('시험판 48 · 명상 끝내기 · 호흡 · 알림 페이지 · 시간표 · 메모 화면 · 캘린더 · 위젯 → 홈');
  // (1) 명상
  let app = await openApp({ data: [['settings', settings()]] });
  try {
    const p = app.page;
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(500);
    // '소리와 호흡' 줄: 글자 칸이 줄을 채우고 › 는 오른쪽 끝
    const row = await p.evaluate(() => { const r = document.querySelector('.bx-med-row'), t = r.querySelector('.bx-mm-t'), ch = r.querySelector(':scope > svg.i');
      return { grow: getComputedStyle(t).flexGrow, fs: getComputedStyle(t.querySelector('b')).fontSize, gap: Math.round(r.getBoundingClientRect().right - ch.getBoundingClientRect().right) }; });
    c.eq(row, { grow: '1', fs: '16px', gap: 0 }, "'소리와 호흡' 줄: 글자 칸이 줄을 채우고 › 는 오른쪽 끝");
    c.eq(await p.evaluate(() => document.querySelectorAll('.bx-med-dial.idle .bx-med-fl i').length), 6, '고르는 화면: 원 뒤 꽃잎 여섯 장');
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(400);
    const st = await p.evaluate(() => ({ mo: window.__mo || [], bg: window.__bg.map(x => x[0]), lead: document.querySelector('.bx-med-dial').style.getPropertyValue('--bx-bd'),
      cls: document.querySelector('.bx-med-run').className, anim: getComputedStyle(document.querySelector('.bx-med-fl i')).animationName }));
    c.ok(st.mo.length === 1 && st.mo[0].min === 10 && st.mo[0].bell === true && st.mo[0].endAt - st.mo[0].startAt === 600000, '시작: 휴대폰 명상 알림(10분 · 종소리) ' + JSON.stringify(st.mo));
    c.ok(/bx-br-on/.test(st.cls) && /lead/.test(st.cls) && st.anim === 'bxPetal' && /^\d+ms$/.test(st.lead) && +st.lead.replace('ms', '') > 4000, '시작 전 5초: 꽃잎은 첫 종 때 피기 시작(지연 ' + st.lead + ')');
    await p.waitForTimeout(5400);
    const br = await p.evaluate(() => ({ cls: document.querySelector('.bx-med-run').className, d: document.querySelector('.bx-med-dial').style.getPropertyValue('--bx-bd'), core: getComputedStyle(document.querySelector('.bx-med-circle')).animationName }));
    c.ok(/breath/.test(br.cls) && br.core === 'bxCore', '첫 종 뒤: 원과 꽃잎이 같이 숨 쉼 ' + JSON.stringify(br));
    // 다른 화면: 아래쪽 '명상 중' 줄, + 단추 · 일 · 주 · 월은 그 위로
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
    const bar = await p.evaluate(() => { const b = document.getElementById('bx-medbar'); if (!b) return null; const r = b.getBoundingClientRect(), f = document.querySelector('.bx-fab').getBoundingClientRect(), v = document.getElementById('bx-vsw').getBoundingClientRect(), d = document.querySelector('.dock').getBoundingClientRect();
      return { h: b.querySelector('#bx-mb-h').textContent, s: b.querySelector('#bx-mb-s').textContent, aboveDock: Math.round(d.top - r.bottom), fab: f.bottom <= r.top - 4, vsw: v.bottom <= r.top - 4 }; });
    c.ok(bar && /^명상 중 · 9:5\d 남음$/.test(bar.h) && bar.s === '10분' && bar.aboveDock >= 6 && bar.aboveDock <= 9 && bar.fab && bar.vsw, "다른 화면: 아래 메뉴 위 '명상 중 · 남은 시간' 줄, + 단추 · 일 · 주 · 월은 그 위 " + JSON.stringify(bar));
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(600);
    const tb = await p.evaluate(() => ({ bar: document.getElementById('bx-medbar').getBoundingClientRect().bottom, tt: document.querySelector('.bx-ttbar').getBoundingClientRect().top }));
    c.ok(tb.tt - tb.bar >= 6 && tb.tt - tb.bar <= 10, '시간표: 줄은 아래 도구 줄 위 ' + JSON.stringify(tb));
    // 줄을 누르면 명상 화면, 그곳에선 줄이 없다
    await p.click('[data-bxmb="open"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !!document.querySelector('.screen.med .bx-med-run') && !document.getElementById('bx-medbar')), "줄을 누르면 명상 화면(명상 화면에서는 줄 없음)");
    // 줄의 '끝내기'
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(500);
    await p.click('[data-bxmb="stop"]'); await p.waitForTimeout(500);
    const sp = await p.evaluate(() => ({ bar: !!document.getElementById('bx-medbar'), last: (window.__mo || []).slice(-1)[0], stop: window.__bg.some(x => x[0] === 'stop') }));
    c.ok(!sp.bar && sp.last && sp.last.clear === true, "'끝내기': 줄이 사라지고 휴대폰 명상 알림도 지움 " + JSON.stringify(sp));
    c.ok((await toasts(p)).some(t => /명상을 끝냈어요/.test(t)), "'명상을 끝냈어요' 알림 글");
    // 휴대폰 알림의 '명상 끝내기'(휴대폰이 'medStop'을 알려 줌): 3분 하고 끝내면 3분 기록
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(400);
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(300);
    const t0 = await p.evaluate(() => Date.now());
    await p.evaluate(t => window.__bgLs.medStop({ at: t + 5000 + 3 * 60000 + 2000 }), t0); await p.waitForTimeout(500);
    const ml = await doc(p, 'medlog');
    c.ok(await p.evaluate(() => !document.querySelector('.bx-med-run') && !!document.querySelector('.bx-med-set')), "휴대폰 알림의 '명상 끝내기': 앱의 '명상 중' 화면도 치움");
    c.ok(ml && Object.values(ml.days || {}).some(v => v >= 3), '끝낸 시각까지 한 만큼 기록(3분) ' + JSON.stringify(ml && ml.days));
    c.eq(app.errors, [], '화면 오류(명상)');
  } finally { await app.close(); }

  // (2) 일정 알림 페이지 · 시간표 · 메모 화면 · + 단추 · 위젯 → 홈
  const data = [['settings', settings({ bxDock: ['routines', 'month', 'today', 'tt', 'memo'] })],
    ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 0, createdAt: old }],
    ['it_1', { type: 'item', title: '노동부 방문', date: '2026-11-02', start: '15:00', end: '16:00', remind: '10', travel: 20, location: '롯데마트 옆 고용복지센터', categoryId: 'c_p', createdAt: old, updatedAt: old }]];
  app = await openApp({ data, now: '2026-11-02T13:55:00+09:00' });
  try {
    const p = app.page;
    await p.click('#tcard2 .row-main[data-id="it_1"]'); await p.waitForTimeout(500);
    await p.click('#f-chips [data-fpanel="rem"]'); await p.waitForTimeout(400);
    await p.click('#bx-ep [data-bx-rem="adv"]'); await p.waitForTimeout(400);
    const al = await p.evaluate(() => { const L = s => Array.from(document.querySelectorAll(s)).map(e => Math.round(e.getBoundingClientRect().left)), R = s => Array.from(document.querySelectorAll(s)).map(e => Math.round(e.getBoundingClientRect().right));
      return { q: Array.from(document.querySelectorAll('#bx-ep .bx-rem-q .pick')).map(b => b.textContent.trim()), gl: Array.from(document.querySelectorAll('#bx-ep .bx-rem-adv .fg-l')).map(e => e.textContent.trim()),
        labels: L('#bx-ep .bx-rem-adv .fg-l'), rows: L('#bx-ep .bx-rem-adv .rem-picks .pick'), when: L('#bx-ep .rem-when'), box: R('#bx-ep .rgrid'), add: R('#bx-ep .rc-add') }; });
    c.eq(al.q, ['정시', '10분 전', '1시간 전', '직접 입력'], "알림 페이지: '직접 입력' 줄은 늘 '직접 입력'(전에는 '10분 전'이 두 번)");
    c.eq(al.gl, ['정한 알림', '사전 알림', '정한 시각'], '직접 입력: 정한 알림 · 사전 알림 · 정한 시각');
    c.ok([...al.labels, ...al.rows, ...al.when].every(x => x === 32) && al.box.every(x => x === 378) && al.add.every(x => x === 358), '글자는 모두 화면 끝에서 32, 상자 오른쪽 끝 378 · + 단추 358(넘치지 않음) ' + JSON.stringify(al));
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    await p.evaluate(() => { const x = document.querySelector('#sheet-root [data-act="sheet-close"]'); if (x) x.click(); }); await p.waitForTimeout(400);
    // 시간표: 칩 줄 바로 아래 시간표, 빈 시간표 설명은 시간표 칸 안
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(600);
    const tt = await p.evaluate(() => { const ch = document.querySelector('.screen.tt .bx-ttchips').getBoundingClientRect(), hd = document.querySelector('.screen.tt .bx-tt-head').getBoundingClientRect(), g = document.querySelector('.screen.tt .tt-wrap').getBoundingClientRect(), e = document.querySelector('.tt-empty');
      return { headToChips: Math.round(ch.top - hd.bottom), chipsToGrid: Math.round(g.top - ch.bottom), inGrid: !!(e && e.closest('.tt-body')) }; });
    c.eq(tt, { headToChips: 14, chipsToGrid: 10, inGrid: true }, '시간표: 제목 → 칩 14 · 칩 → 시간표 10, 설명은 시간표 칸 안');
    // 메모 화면: + 단추(새 메모), 메모 없으면 안내만
    await p.click('.dock [data-view="memo"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !document.querySelector('.screen.memo input') && !!document.querySelector('.bx-mmp-empty') && document.documentElement.classList.contains('bx-fab-on')), '메모 화면: 적는 칸 없이 안내 · + 단추');
    await p.click('.bx-fab'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => [document.getElementById('bx-mmn-t').textContent, document.activeElement.id]), ['새 메모', 'bx-mmn-ta'], "+ → '새 메모' 페이지, 적는 칸에 커서");
    await p.fill('#bx-mmn-ta', '버릴 글'); await p.click('#bx-mmn [data-bxmmn="back"]'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => !document.getElementById('bx-mmn') && !window.BX_T.docs().some(([, d]) => d && d.type === 'memo')), '‹ : 적지 않고 닫음');
    await p.click('.bx-fab'); await p.waitForTimeout(400);
    await p.fill('#bx-mmn-ta', '은행 서류 챙기기'); await p.dispatchEvent('#bx-mmn-ta', 'input');
    c.eq(await p.evaluate(() => document.getElementById('bx-mmn-n').textContent), '9 / 300', '글자 수');
    await p.click('#bx-mmn [data-bxmmn="done"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.screen.memo .bx-mmp-quick .bx-mm-x')).map(e => e.textContent)), ['은행 서류 챙기기'], '완료 → 오늘 메모에 저장 · 목록에 보임');
    await p.click('.bx-fab'); await p.waitForTimeout(300);
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => !document.getElementById('bx-mmn') && !!document.querySelector('.screen.memo')), '휴대폰 뒤로: 새 메모 페이지만 닫음');
    // 다른 화면에서는 + 가 새 일정
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !document.querySelector('.bx-fab').dataset.bxmemo && /새 일정/.test(document.querySelector('.bx-fab').getAttribute('aria-label'))), '캘린더의 + 는 새 일정 그대로');
    // 위젯 단추 → 먼저 홈(대표 11/4 14:07)
    await p.evaluate(() => window.__wl.add({ ds: '2026-11-02' })); await p.waitForTimeout(900);
    c.ok(await p.evaluate(() => !!document.querySelector('.screen.today') && !!document.querySelector('#f-title')), '위젯 + : 캘린더를 보던 중이어도 홈 화면에서 새 일정 창');
    await p.evaluate(() => { const x = document.querySelector('[data-act="sheet-close"]'); if (x) x.click(); }); await p.waitForTimeout(400);
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(400);
    await p.evaluate(() => window.__wl.home({})); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !!document.querySelector('.screen.today')), "위젯 '앱 열기' : 홈 화면");
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(400);
    await p.evaluate(() => window.__wl.open({ k: 'item', id: 'it_1', ds: '2026-11-02' })); await p.waitForTimeout(900);
    c.ok(await p.evaluate(() => !!document.querySelector('.screen.today') && (document.querySelector('#f-title') || {}).value === '노동부 방문'), '위젯 일정 줄 : 홈 화면에서 고치기 창');
    c.eq(app.errors, [], '화면 오류(알림 · 시간표 · 메모 · 위젯)');
  } finally { await app.close(); }

  // (3) 캘린더: 휴대폰 캘린더 일정도 그 캘린더 색 · 칩 줄을 밀면 달은 그대로 · 다시 그려도 밀어 둔 자리
  app = await openApp({ data: [['settings', settings()],
    ['c_w', { type: 'category', name: '업무', color: '#2a78d6', order: 0, createdAt: old }], ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 1, createdAt: old }],
    ['c_e', { type: 'category', name: '기타', color: '#e39a0b', order: 2, createdAt: old }], ['c_x', { type: 'category', name: '운동 · 건강 기록', color: '#6250d6', order: 3, createdAt: old }]] });
  try {
    const p = app.page;
    const pcache = { at: Date.parse('2026-11-02T06:00:00+09:00'), events: [
      { eventId: 91, begin: Date.parse('2026-11-20T00:00:00Z'), end: Date.parse('2026-11-21T00:00:00Z'), allDay: true, title: '아빠 생신', calendarId: 7, calendar: 'My calendar', color: -11751600, location: '', description: '' },
      { eventId: 93, begin: Date.parse('2026-11-24T00:00:00Z'), end: Date.parse('2026-11-27T00:00:00Z'), allDay: true, title: '출장', calendarId: 7, calendar: 'My calendar', color: -11751600, location: '', description: '' }] };
    await p.evaluate(pc => { localStorage.setItem('bx:pcal', JSON.stringify({ on: true })); localStorage.setItem('bx:pcache', JSON.stringify(pc)); }, pcache);
    await p.reload(); await p.waitForFunction(() => window.BX_T && document.querySelector('.dock')); await p.waitForTimeout(700);
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
    const pc = await p.evaluate(() => { const ch = getComputedStyle(document.querySelector('.cell .c-chip[data-item^="pc_"]')), bar = getComputedStyle(document.querySelector('.cell .c-bar.pc')), cc = getComputedStyle(document.querySelector('.bx-cchip.pc'));
      return { bg: ch.backgroundColor, bl: ch.borderLeftWidth, bt: ch.borderTopWidth, bar: bar.backgroundColor, barB: bar.borderTopWidth, chip: cc.boxShadow }; });
    c.ok(pc.bg !== 'rgba(0, 0, 0, 0)' && pc.bl === '2px' && pc.bt === '0px' && pc.bar === 'rgb(76, 175, 80)' && pc.barB === '0px' && pc.chip === 'none', '휴대폰 캘린더 일정 · 칩: 테두리 칸이 아니라 그 캘린더 색 ' + JSON.stringify(pc));
    const h0 = await p.evaluate(() => document.querySelector('.screen.month h1').textContent);
    await swipe(p, '.screen .bx-cchips', -140); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => document.querySelector('.screen.month h1').textContent), h0, '칩 줄을 옆으로 밀면 달은 그대로');
    await swipe(p, '.screen.month .cal', -140); await p.waitForTimeout(600);
    c.ok(await p.evaluate(h0 => document.querySelector('.screen.month h1').textContent !== h0, h0), '달력 칸을 밀면 다음 달(그대로)');
    await p.evaluate(() => { const r = document.querySelector('.screen .bx-cchips'); r.scrollLeft = 60; });
    await p.evaluate(() => window.BX_rerender ? window.BX_rerender() : 0); await p.waitForTimeout(300);
    await p.evaluate(() => { const b = document.querySelector('.screen.month [data-act="month-nav"][data-d="-1"]'); if (b) b.click(); }); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => Math.abs(document.querySelector('.screen .bx-cchips').scrollLeft - 60) <= 1), '다시 그려도 칩 줄은 밀어 둔 자리 그대로');
    c.eq(app.errors, [], '화면 오류(캘린더)');
  } finally { await app.close(); }
  return c.done();
};
