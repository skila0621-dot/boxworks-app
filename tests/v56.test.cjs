// 시험판 56(대표 11/5 선택실 2: 홈 목록 줄 C · 일정 넣기 나, 결정 기록 D-29)
// (1) 목록 줄 C: 일정 · 루틴 · 수업 줄이 같은 줄 하나 [종류 아이콘 | 시각 | 이름 + 둘째 줄 하나 | 체크]. 홈 · 캘린더 주 같은 칸
//     '자세히 ⌄' · 오른쪽 출발 칸 · '확인' 단추 없음. 수업 체크 = 그날 다녀왔어요, 루틴 체크 = 오늘 다 했어요, 루틴 줄을 누르면 단계 창
// (2) 일정 넣기 나: 꼭 적을 것(제목) 강조 · 날짜 · 시간 · 장소 세 줄 · 알림(없음 · 기본값 · 직접) · 맨 아래 '자세히'(접힘)
//     여러 날은 날짜 줄 하나('11월 2일 (월) → 11월 4일 (수)')
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';

module.exports = async function () {
  const c = checker('시험판 56 · 목록 줄 C · 일정 넣기 나');
  const data = [['settings', settings({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1 })],
    ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 0, createdAt: old }],
    ['it_1', { type: 'item', title: '노동부 방문', date: '2026-11-02', start: '11:00', end: '11:30', travel: 30, createdAt: old, updatedAt: old }],
    ['it_2', { type: 'item', title: '원두 주문', date: '2026-11-02', createdAt: old, updatedAt: old }],
    ['it_3', { type: 'item', title: '부산 출장', date: '2026-11-02', endDate: '2026-11-04', categoryId: 'c_p', createdAt: old, updatedAt: old }],
    ['rt_a', { type: 'routine', name: '공부 시작', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '21:30', times: 0, on: true,
      steps: [{ id: 's0', name: '책상 정리', min: 10 }, { id: 's1', name: '공부', min: 55 }], createdAt: old, updatedAt: old }],
    ['tt_a', { type: 'tt', name: '경영학 수업', days: [1], start: '10:00', end: '12:00', place: '301호', remind: '10', color: '#e8710a', on: true, createdAt: old, updatedAt: old }]];
  const app = await openApp({ width: 384, height: 832, now: '2026-11-02T03:45:00+09:00', data });
  const p = app.page;
  try {
    await p.waitForTimeout(900);
    // (1) 줄 모양: 종류 아이콘 · 체크가 맨 뒤 · 같은 칸
    const rows = await p.evaluate(() => Array.from(document.querySelectorAll('#tcard2 .bx-tl .row')).filter(r => r.getBoundingClientRect().height > 0).map(r => {
      const x = e => e ? Math.round(e.getBoundingClientRect().left) : null, ic = r.querySelector('.rc-ic svg');
      return { kind: r.dataset.kind, rowc: r.classList.contains('rowc'), last: r.lastElementChild ? r.lastElementChild.className : '', ic: ic ? ic.innerHTML.slice(0, 18) : '',
        x: [x(r.querySelector('.rc-ic')), x(r.querySelector('.row-time')), x(r.querySelector('.row-title')), x(r.lastElementChild)],
        title: r.querySelector('.row-title') ? r.querySelector('.row-title').textContent : '', sub: r.querySelector('.rc-sub') ? r.querySelector('.rc-sub').textContent : '' };
    }));
    c.ok(rows.length >= 4 && rows.every(r => r.rowc && /chk/.test(r.last)), '홈 목록의 일정 · 루틴 · 수업 줄이 모두 목록 줄 C(체크가 맨 오른쪽) ' + JSON.stringify(rows.map(r => r.kind + ':' + r.title)));
    // 시험판 61: 시각 없는 '원두 주문'은 '오늘 할 일' 맨 위 '종일' 줄(같은 목록 줄 C)
    c.ok(await p.evaluate(() => { const r = Array.from(document.querySelectorAll('#tcard2 .bx-tl .row')).find(x => (x.querySelector('.row-title') || {}).textContent === '원두 주문'); return !!r && r.classList.contains('rowc') && /chk/.test(r.lastElementChild.className) && r.querySelector('.row-time').textContent.trim() === '종일'; }), "시각 없는 일정은 '종일' 줄로, 목록 줄 C");
    c.ok(new Set(rows.map(r => r.x.join(','))).size === 1, '모든 줄이 같은 칸(아이콘 · 시각 · 이름 · 체크 시작 위치) ' + JSON.stringify(rows.map(r => r.x)));
    const byT = t => rows.find(r => r.title === t) || {};
    c.ok(new Set(['it', 'rt', 'tt'].map(k => (rows.find(r => r.kind === k) || {}).ic)).size === 3, '종류 아이콘 셋(일정 · 루틴 · 수업)이 서로 다름');
    // 종류 아이콘은 앱 아이콘 한 세트(ICON · 루틴 아이콘)에서만 꺼낸다(따로 그린 아이콘 없음, 정렬 점검 icon과 같은 기준)
    c.ok(await p.evaluate(() => { const S = window.BX_ICONSRC || {}, set = new Set([].concat(Object.values(S.app || {}), Object.values(S.rt || {})).map(h => { const d = document.createElement('div'); d.innerHTML = String(h); return d.firstElementChild ? d.firstElementChild.outerHTML : ''; })); const ics = Array.from(document.querySelectorAll('.rowc .rc-ic svg')); return ics.length >= 3 && ics.every(s => set.has(s.outerHTML)); }), '종류 아이콘이 모두 앱 아이콘 세트 안의 것(수업 = 루틴 아이콘의 책)');
    c.eq([byT('노동부 방문').sub, byT('경영학 수업').sub, byT('공부 시작').sub], ['오전 10:30 출발', '301호', '17시간 45분 뒤 · 책상 정리부터'], '둘째 줄 하나: 출발 · 장소 · 남은 시간(루틴)');
    c.eq(await p.evaluate(() => document.querySelectorAll('#tcard2 .bx-rt-tog, #tcard2 .bx-r49-go, #tcard2 .lamp, #tcard2 .tt-dot').length), 0, "'자세히 ⌄' · 오른쪽 출발 칸 · '확인' 단추 · 수업 점 없음");
    // 수업 체크 = 그날 다녀왔어요(가로줄), 다시 누르면 취소
    await p.click('#tcard2 .row[data-kind="tt"] .chk'); await p.waitForTimeout(400);
    const tt = await p.evaluate(() => { const r = document.querySelector('#tcard2 .row[data-kind="tt"]'); return [r.classList.contains('done'), getComputedStyle(r.querySelector('.row-title')).textDecorationLine]; });
    c.ok(tt[0] && tt[1] === 'line-through', '수업 체크: 그날 다녀왔어요 · 이름에 가로줄');
    await p.click('#tcard2 .row[data-kind="tt"] .chk'); await p.waitForTimeout(400);
    c.ok(!(await p.evaluate(() => document.querySelector('#tcard2 .row[data-kind="tt"]').classList.contains('done'))), '수업 체크를 다시 누르면 취소');
    // 루틴 줄을 누르면 단계 창, 체크는 오늘 다 했어요(되돌리기 있음)
    await p.click('#tcard2 .row[data-kind="rt"] .row-main'); await p.waitForTimeout(600);
    const sh = await p.evaluate(() => ({ t: (document.querySelector('#sheet-root h2') || {}).textContent, steps: document.querySelectorAll('#sheet-root .bx-rtpage .rt-steps li').length, foot: !!document.querySelector('#sheet-root .bx-rtpage .bx-rt-foot [data-act="rt-skip"]') }));
    c.ok(sh.t === '공부 시작' && sh.steps >= 2 && sh.foot, "루틴 줄을 누르면 단계 창(단계 목록 · 맨 아래 '오늘 쉬기') " + JSON.stringify(sh));
    await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(400);
    await p.click('#tcard2 .row[data-kind="rt"] .chk'); await p.waitForTimeout(500);
    const rt = await p.evaluate(() => { const r = document.querySelector('#tcard2 .row[data-kind="rt"]'); return [r.classList.contains('done'), r.querySelector('.rc-sub').textContent, (Array.from(document.querySelectorAll('#toasts .toast')).pop() || {}).textContent || '']; });
    c.ok(rt[0] && rt[1] === '모두 완료' && /되돌리기/.test(rt[2]), '루틴 체크: 오늘 다 했어요 · 되돌리기 ' + JSON.stringify(rt));
    // 캘린더 주 목록도 같은 줄
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
    await p.click('#bx-vsw [data-bxvsw="week"]'); await p.waitForTimeout(600);
    c.ok(await p.evaluate(() => { const rs = Array.from(document.querySelectorAll('.screen .row')).filter(r => r.getBoundingClientRect().height > 0); return rs.length > 0 && rs.every(r => r.classList.contains('rowc') && r.lastElementChild.classList.contains('chk') && r.querySelector('.rc-ic')); }), '캘린더 주 목록도 목록 줄 C');
    await p.click('.dock [data-view="today"]').catch(() => {}); await p.waitForTimeout(500);

    // (2) 일정 넣기 나
    await p.click('.bx-fab'); await p.waitForTimeout(700);
    const ed = await p.evaluate(() => {
      const list = document.getElementById('f-chips'), kids = Array.from(list.children).filter(e => e.getBoundingClientRect().height > 0);
      const tin = document.querySelector('#sheet-root .bx-inrow:has(> #f-title)');
      return { rows: kids.map(e => e.dataset.fpanel ? e.dataset.fpanel + (e.dataset.bxsub ? ':' + e.dataset.bxsub : '') : e.classList.contains('bx-er-rem') ? 'rem3' : e.dataset.bxmore ? 'more' : e.className),
        must: (document.querySelector('#sheet-root .bx-must') || {}).textContent || '', ring: tin ? getComputedStyle(tin).boxShadow : '',
        hidden: Array.from(document.querySelectorAll('#f-chips .bx-more [data-fpanel]')).map(e => e.dataset.fpanel + (e.dataset.bxsub ? ':' + e.dataset.bxsub : '')), moreOpen: !document.querySelector('#f-chips .bx-more').hidden };
    });
    c.eq(ed.rows, ['date', 'time', 'more:loc', 'rem3', 'more'], '새 일정 창: 날짜 · 시간 · 장소 · 알림 · 자세히');
    c.ok(/꼭 적을 것/.test(ed.must) && /inset/.test(ed.ring), "제목 칸 위 '꼭 적을 것' · 칸에 보라 테 " + JSON.stringify([ed.must, ed.ring]));
    c.ok(!ed.moreOpen && ed.hidden.join(',') === 'go,cat,more:note,att' || (!ed.moreOpen && ed.hidden.join(',') === 'cat,more:note,att'), "'자세히'는 접혀 있고 출발·준비 · 캘린더 · 메모 · 사진·파일이 그 안 " + JSON.stringify(ed.hidden));
    await p.click('#f-chips [data-bxmore]'); await p.waitForTimeout(250);
    c.ok(await p.evaluate(() => !document.querySelector('#f-chips .bx-more').hidden && document.querySelector('#f-chips [data-bxmore]').getAttribute('aria-expanded') === 'true'), "'자세히'를 누르면 맨 아래에 펼침");
    // 알림: 시각을 적으면 기본값(10분 전), 없음 · 기본값 · 직접
    await p.fill('#f-title', '오후 3시 치과'); await p.waitForTimeout(500);
    const pressed = () => p.evaluate(() => Array.from(document.querySelectorAll('#f-chips [data-bxrem3]')).filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.bxrem3).join(',') + '|' + ((document.querySelector('#f-chips .bx-rem3-n') || {}).textContent || ''));
    c.ok(/^def\|기본값 10분 전/.test(await pressed()), '시각이 있는 일정은 알림 기본값(10분 전) ' + await pressed());
    await p.click('#f-chips [data-bxrem3="none"]'); await p.waitForTimeout(250);
    c.ok(/^none\|/.test(await pressed()), '알림 없음');
    await p.click('#f-chips [data-bxrem3="def"]'); await p.waitForTimeout(250);
    c.ok(/^def\|/.test(await pressed()), '알림 기본값으로 다시');
    await p.click('#f-chips [data-bxrem3="own"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => { const pg = document.getElementById('bx-ep'); return !!pg && pg.dataset.k === 'rem'; }), "'직접'을 누르면 알림 페이지");
    await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => /오후 3:00/.test(document.querySelector('#f-chips [data-fpanel="time"]').textContent)), '시간 줄에 적은 말의 시각(오후 3:00)');
    await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(300);
    await p.evaluate(() => { const x = document.querySelector('#sheet-root [data-act="sheet-close"]'); if (x) x.click(); }); await p.waitForTimeout(400);
    // 여러 날: 날짜 줄 하나에 '→' · 캘린더가 정해진 일정은 '자세히'를 펼쳐서 연다
    await p.evaluate(() => { const b = document.querySelector('#tcard2 [data-act="edit"][data-id="it_3"]'); if (b) b.click(); }); await p.waitForTimeout(700);
    const md = await p.evaluate(() => ({ d: (document.querySelector('#f-chips [data-fpanel="date"]') || {}).textContent || '', open: !document.querySelector('#f-chips .bx-more').hidden }));
    c.ok(/11월 2일 \(월\) → 11월 4일 \(수\)/.test(md.d) && md.open, "여러 날 일정: 날짜 줄 '11월 2일 (월) → 11월 4일 (수)' · 캘린더가 있어 자세히 펼침 " + JSON.stringify(md));
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
