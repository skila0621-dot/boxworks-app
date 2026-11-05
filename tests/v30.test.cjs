// 시험판 30: 누르면 나오는 칸은 누른 자리에서(규칙 12), 빈 공간 줄이기, 일정 넣는 입구·마이크, 고르는 칸 규칙(규칙 11)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function data(extra) {
  return [
    ['settings', settings(Object.assign({ bxReport: { on: true, at: '07:30' } }, extra || {}))],
    ['it_1', { type: 'item', title: '치과', date: '2026-11-02', start: '15:00', remind: '10', createdAt: old, updatedAt: old }],
    ['it_2', { type: 'item', title: '장보기', date: '2026-11-02', createdAt: old, updatedAt: old }],
    ['it_3', { type: 'item', title: '보고서 마감', date: '2026-11-03', start: '10:00', createdAt: old, updatedAt: old }],
    ['rt_m', { type: 'routine', name: '아침 준비', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '07:30', times: 6, every: 5, on: true,
      steps: [{ id: 'a', name: '씻기', min: 15 }, { id: 'b', name: '옷 입기', min: 10 }], createdAt: old, updatedAt: old }],
    ['tt_a', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', remind: '10', on: true, createdAt: old, updatedAt: old }]
  ];
}
const rect = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right }; }, sel);

module.exports = async function () {
  const c = checker('시험판 30 · 시선 흐름 · 빈 공간');

  // 1) 홈: 한 목록, 시각 순서(07:30 루틴 → 10:30 수업 → 15:00 일정), 칸 제목 없음. 시각 없는 일정(장보기)은 시험판 58부터 아래 '시간 미지정 일정' 상자(D-27 ②)
  let app = await openApp({ data: data() });
  try {
    const p = app.page;
    const s = await p.evaluate(() => ({
      order: Array.from(document.querySelectorAll('.bx-tl > *')).map(e => e.classList.contains('now-line') ? '지금' : (e.querySelector('.row-title') || e.querySelector('.rt-h > b') || e.querySelector('.row-main') || e).textContent.replace(/\s+/g, ' ').trim().slice(0, 12)),
      heads: Array.from(document.querySelectorAll('#tcard2 h2')).map(h => h.textContent.trim())
    }));
    c.eq(s.heads, ['오늘 할 일'], "홈에는 '오늘 할 일' 제목 하나(루틴·일정·수업 칸 제목 없음)");
    const want = ['지금', '아침 준비', '경영학원론', '치과'];
    c.ok(s.order.length === want.length && want.every((w, i) => (s.order[i] || '').indexOf(w) >= 0), '시각 순서: ' + JSON.stringify(s.order));
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#tcard-ut .row-title')).map(e => e.textContent.trim())), ['장보기'], "시각 없는 일정은 '시간 미지정 일정' 상자에");
    // 새 일정 창: 마이크에 '말하기', 칩을 눌러도 칩이 움직이지 않는다
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    // 시험판 60(대표 11/5 22:03 '마이크 아이콘으로만'): 글자는 빼고 이름(화면 읽기)만 '말하기'
    c.ok(await p.evaluate(() => { const b = document.querySelector('#sheet-root [data-act="bx-mic"]'); return !!b && b.getAttribute('aria-label') === '말하기' && !(b.innerText || '').trim(); }), "마이크 단추: 아이콘만, 이름은 '말하기'");
    c.ok(await p.evaluate(() => { const fp = document.getElementById('f-panel'); return !!fp && fp.hidden; }), '새 일정 창은 작게 시작(고르는 칸은 칩을 누를 때만)');
    c.ok(/내일 오후 3시 치과\|금요일 저녁 7시 친구 약속/.test(await p.evaluate(() => (document.querySelector('#sheet-root [data-act="bx-mic"]') || {}).getAttribute('data-ex') || '')), '말하기를 누르면 보여 줄 예문 둘');
    // 시험판 44(대표 11/4 1:34 · 1:50): 줄을 누르면 그 아래로 펼치지 않고 페이지가 열린다. 줄 자리는 움직이지 않는다
    let off = [];
    // 시험판 56(일정 넣기 나): 캘린더 · 출발·준비 · 메모는 맨 아래 '자세히' 안. 펼쳐 두고 본다
    await p.click('#f-chips [data-bxmore]'); await p.waitForTimeout(200);
    for (const [sel, t] of [['[data-fpanel="date"]', '날짜'], ['[data-bxsub="loc"]', '장소'], ['[data-fpanel="cat"]', '캘린더'], ['[data-fpanel="rem"]', '알림'], ['[data-fpanel="go"]', '출발·준비'], ['[data-bxsub="note"]', '메모']]) {
      const s2 = '#f-chips ' + sel;
      const b0 = await rect(p, s2); if (!b0) { off.push(t + ' 줄 없음'); continue; }
      await p.click(s2); await p.waitForTimeout(400);
      const pg = await p.evaluate(() => { const e = document.getElementById('bx-ep'); return e ? [e.querySelector('#bx-ep-t').textContent, e.getBoundingClientRect().height] : null; });
      const b1 = await rect(p, s2);
      if (!pg || pg[0] !== t || pg[1] < 800 || !b1 || Math.abs(b1.y - b0.y) > 1) off.push(t + ' ' + JSON.stringify({ pg, y0: Math.round(b0.y), y1: b1 && Math.round(b1.y) }));
      await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(250);
    }
    c.eq(off, [], '새 일정 창: 줄을 누르면 페이지(이름 · 완료), 줄 자리는 그대로');
    // 일정 알림 고르는 칸(규칙 11): 시간을 정한 일정은 정시·10분 전·1시간 전 + 직접 입력, '알림 없이'는 아래 글자 단추
    await p.fill('#f-title', '내일 오후 3시 치과'); await p.waitForTimeout(300);
    await p.click('#f-chips [data-fpanel="rem"]'); await p.waitForTimeout(300);
    const q = await p.evaluate(() => Array.from(document.querySelectorAll('#f-rem .bx-rem-q .pick')).map(b => b.textContent.trim()));
    c.eq(q, ['정시', '10분 전', '1시간 전', '직접 입력'].map((x, i) => i < 3 ? x : q[3]), '일정 알림 칩: ' + JSON.stringify(q));
    await p.click('#f-rem [data-bx-rem="60"]'); await p.waitForTimeout(200);
    const remTxt = () => p.evaluate(() => (document.querySelector('#f-chips .bx-rem3-n') || {}).textContent.trim());
    c.eq(await remTxt(), '1시간 전', "칩 하나를 고르면 알림이 그 하나로");
    await p.click('#f-rem [data-bx-remsw]'); await p.waitForTimeout(200);
    const offState = await p.evaluate(() => ({ chip: Array.from(document.querySelectorAll('#f-chips [data-bxrem3]')).filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent).join(''), opts: document.querySelectorAll('#f-rem .bx-rem-q').length, sw: (document.querySelector('#f-rem [data-bx-remsw]') || {}).getAttribute('aria-checked') }));
    c.eq(offState, { chip: '없음', opts: 0, sw: 'false' }, "알림을 끄면 일정 창 알림은 '없음', 아래 선택지는 없음(시험판 37 · 56)");
    await p.click('#f-rem [data-bx-remsw]'); await p.waitForTimeout(200);
    c.eq(await remTxt(), '1시간 전', '다시 켜면 끄기 전 값(1시간 전)');
    await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(200);
    c.eq(app.errors, [], '화면 오류(홈·새 일정)');
  } finally { await app.close(); }

  // 1-2) 홈은 '지금'부터(대표 요청 11/2): 하는 중인 일은 '지금', 다음 일은 '다음', 지난 일은 맨 위 한 줄로 접힘
  for (const [now, want] of [
    ['2026-11-02T07:40:00+09:00', { now: '아침 준비', next: '경영학원론', past: 0 }],
    ['2026-11-02T16:00:00+09:00', { now: '', next: '', past: 3 }]
  ]) {
    app = await openApp({ data: data(), now });
    try {
      const p = app.page;
      const r = await p.evaluate(() => {
        const name = e => e ? (e.querySelector('.rt-h > b, .row-title') || e).textContent.trim() : '';
        const tog = document.querySelector('.bx-past-tog'), box = document.querySelector('.bx-past');
        return { now: name(document.querySelector('.bx-tl > .bx-now')), next: name(document.querySelector('.bx-tl > .bx-next, .bx-tl > .bx-next-soft')),
          past: box ? box.children.length : 0, hidden: box ? box.hidden : null, tog: tog ? tog.textContent.trim() : '',
          nextTag: (document.querySelector('.bx-tl > .bx-next-soft .rc-sub, .bx-tl > .bx-next .rc-sub') || {}).textContent || '',
          done: !!document.querySelector('.bx-tl-done') };
      });
      const t = now.slice(11, 16);
      c.eq(r.now, want.now, t + ' 지금 하는 일');
      c.eq(r.next, want.next, t + ' 다음 일');
      c.eq(r.past, want.past, t + ' 접힌 지난 일 개수');
      if (want.past) {
        c.ok(r.hidden === true && /지난 일 3개/.test(r.tog), t + ' 지난 일은 접힌 한 줄 ' + JSON.stringify(r));
        c.ok(r.done, t + " 남은 일이 없으면 '오늘 남은 일은 없어요'");
        await p.click('.bx-past-tog'); await p.waitForTimeout(200);
        c.eq(await p.evaluate(() => document.querySelector('.bx-past').hidden), false, t + ' 누르면 지난 일이 펼쳐짐');
      } else c.ok(/분 뒤$|시간 뒤$/.test(r.nextTag), t + " 다음 일 둘째 줄에 남은 시간('N분 뒤', 목록 줄 C) " + JSON.stringify(r.nextTag));
      c.eq(app.errors, [], t + ' 화면 오류');
    } finally { await app.close(); }
  }

  // 2) 설정: 켜기를 누르면 시각 칩이 그 바로 아래 오른쪽에(오른쪽 끝이 켜기 단추와 같은 줄)
  app = await openApp({ data: data({ bxReport: { on: false, at: '07:30' } }) });
  try {
    const p = app.page;
    await p.click('[data-act="more"]'); await p.waitForTimeout(400);
    await p.locator('#sheet-root button', { hasText: '설정' }).first().click(); await p.waitForTimeout(600);
    // 시험판 32: 설정은 묶음 목록 → 알림 묶음으로 들어간다
    await p.click('[data-bxset="alarm"]'); await p.waitForTimeout(500);
    // 시험판 38: 묶음 화면의 줄 → 자세한 화면(아침 요약)
    await p.click('[data-bxset="alarm/rep"]'); await p.waitForTimeout(500);
    await p.evaluate(() => document.querySelector('[data-bxrep="1"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(200);
    const seg = await rect(p, '[data-bxrep="1"]');
    await p.click('[data-bxrep="1"]'); await p.waitForTimeout(500);
    const chip = await rect(p, '.bx-tchip:has(#bx-rep-t)');
    c.ok(chip && Math.abs(chip.r - seg.r) < 6 && chip.y > seg.y && chip.y - (seg.y + seg.h) < 70, '아침 일정 시각: 켜기 바로 아래 오른쪽 ' + JSON.stringify({ seg, chip }));
    c.eq(await p.evaluate(() => document.querySelector('.bx-tchip:has(#bx-rep-t) .bx-tchip-v').textContent), '오전 7:30', '시각은 오전 · 오후로 보인다(시험판 51)');
    await p.evaluate(() => { const i = document.getElementById('bx-rep-t'); i.value = '06:45'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.waitForTimeout(400);
    const rep = await p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'settings') || [0, {}])[1].bxReport);
    c.eq(rep && rep.at, '06:45', '시계 창에서 고른 시각이 저장된다');
  } finally { await app.close(); }

  // 3) 수업 추가: '직접 입력'이 그 칩 자리에서 입력칸이 되고, 저장된다
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(600);
    await p.locator('button', { hasText: '수업 추가' }).filter({ visible: true }).first().click(); await p.waitForTimeout(500);
    // 시험판 45: 알림은 줄을 누르면 페이지(삼성 방식)
    await p.click('[data-bxtt45="rem"]'); await p.waitForTimeout(300);
    const pills = await p.evaluate(() => Array.from(document.querySelectorAll('#bx-pg .tt-pills > *')).map(e => e.textContent.trim()));
    c.eq(pills, ['정시', '10분 전', '30분 전', '직접 입력'], '수업 알림: 셋 + 직접 입력');
    const cb = await rect(p, '#bx-pg [data-act="tt-rem"][data-v="custom"]');
    await p.click('#bx-pg [data-act="tt-rem"][data-v="custom"]'); await p.waitForTimeout(300);
    const inp = await rect(p, '#tt-rem-c');
    c.ok(inp && Math.abs(inp.y - cb.y) < 12 && inp.x > cb.x - 40, "'직접 입력' 자리에서 입력칸이 열림 " + JSON.stringify({ cb, inp }));
    await p.fill('#tt-rem-c', '20');
    await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(250);
    await p.fill('#tt-name', '통계학');
    if (await p.evaluate(() => !document.querySelector('[data-act="tt-day"][aria-pressed="true"]'))) await p.click('[data-act="tt-day"][data-d="2"]');
    await p.click('#sheet-root [data-act="tt-save"]'); await p.waitForTimeout(500);
    const tt = await p.evaluate(() => (window.BX_T.docs().find(([, d]) => d && d.type === 'tt' && d.name === '통계학') || [0, null])[1]);
    c.eq(tt && tt.remind, '20', '직접 입력한 20분 전이 저장됨');
    // 알림 스위치를 끄면 아래 칸이 없어지고, 알림 없이 저장된다
    await p.locator('button', { hasText: '수업 추가' }).filter({ visible: true }).first().click(); await p.waitForTimeout(500);
    await p.click('[data-bxtt45="rem"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-act="tt-remsw"]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => document.querySelectorAll('.tt-pills').length), 0, '수업 알림을 끄면 아래 칸이 없음');
    await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(250);
    await p.fill('#tt-name', '선형대수'); await p.click('[data-act="tt-day"][data-d="4"]');
    await p.click('#sheet-root [data-act="tt-save"]'); await p.waitForTimeout(500);
    const tt2 = await p.evaluate(() => (window.BX_T.docs().find(([, d]) => d && d.type === 'tt' && d.name === '선형대수') || [0, null])[1]);
    c.eq(tt2 && tt2.remind, '', '알림 없이 저장됨');
    c.eq(app.errors, [], '화면 오류(시간표)');
  } finally { await app.close(); }

  // 4) 주간·월간: 일정 없는 날은 한 줄, 월간은 날짜를 누르면 아래 목록이 그날로
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(600);
    await p.evaluate(() => Array.from(document.querySelectorAll('.cal [data-date="2026-11-03"]')).find(e => e.getBoundingClientRect().width > 20).click());
    await p.waitForTimeout(600);
    const ds = await p.evaluate(() => ({ sheet: (document.querySelector('#sheet-title') || {}).textContent || '', foot: Array.from(document.querySelectorAll('#sheet-root #sheet-f button')).map(b => b.textContent.trim()) }));
    c.ok(/11월 3일/.test(ds.sheet) && ds.foot.length === 1 && /일정 추가/.test(ds.foot[0]), "월간: 날짜를 누르면 그날 창, 아래는 '이날 일정 넣기' 하나 " + JSON.stringify(ds));
    // 시험판 43(대표 결정 11/4 0:55): 월간|주간은 위에서 빠지고 왼쪽 아래 일 · 주 · 월
    await p.evaluate(() => { const c = document.querySelector('#sheet-root [data-act="sheet-close"]'); if (c) c.click(); }); await p.waitForTimeout(300);
    const sw = await p.evaluate(() => { const v = document.getElementById('bx-vsw'); const r = v && v.getBoundingClientRect(); return { top: !!document.querySelector('.bx-ch-top'), left: r ? Math.round(r.left) : -1 }; });
    c.ok(!sw.top && sw.left >= 0 && sw.left < 40, '월간|주간 줄 없음 · 왼쪽 아래 일 · 주 · 월 ' + JSON.stringify(sw));
    await p.click('#bx-vsw [data-bxvsw="week"]'); await p.waitForTimeout(600);
    const wk = await p.evaluate(() => Array.from(document.querySelectorAll('.day-g')).map(e => [e.id.slice(-2), e.classList.contains('bx-wk-empty'), Math.round(e.getBoundingClientRect().height)]));
    const empty = wk.filter(x => x[1]);
    c.ok(empty.length >= 3 && empty.every(x => x[2] <= 52), '일정 없는 날은 한 줄 ' + JSON.stringify(wk));
    c.eq(app.errors, [], '화면 오류(캘린더)');
  } finally { await app.close(); }

  // 6) 날짜 창 아래(규칙 13): 넣는 칸이 흩어지지 않고, 넣기 단추는 창 맨 아래 가득 하나
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.evaluate(() => window.BX_T.day('2026-11-03')); await p.waitForTimeout(600);
    const f = await p.evaluate(() => { const ft = document.querySelector('#sheet-root #sheet-f'); const bs = ft ? Array.from(ft.querySelectorAll('button,input')).filter(e => e.getBoundingClientRect().width > 0) : []; const r = bs[0] ? bs[0].getBoundingClientRect() : null; return { n: bs.length, t: bs.map(b => b.textContent.trim()), w: r ? Math.round(r.width) : 0, W: innerWidth }; });
    c.ok(f.n === 1 && /일정 추가/.test(f.t[0]) && f.w > f.W * 0.8, '날짜 창 아래: 이날 일정 넣기 하나, 가득 ' + JSON.stringify(f));
    await p.click('#sheet-root #sheet-f [data-act="new"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => (document.querySelector('#f-chips [data-fpanel="date"]') || {}).textContent.trim()), '11월 3일 (화)', '같은 새 일정 창이 그 날짜(11월 3일)로 열림');
  } finally { await app.close(); }

  // 5) 명상: 5·10·20분 + 직접 입력, 직접 입력은 그 자리에서
  app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(600);
    const mins = await p.evaluate(() => Array.from(document.querySelector('.bx-med-set .picks').children).map(e => e.textContent.trim()));
    c.eq(mins, ['5분', '10분', '20분', '직접 입력'], '명상 시간: 셋 + 직접 입력');
    await p.click('[data-med-custom]'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => !!document.querySelector('.bx-med-set .picks #bx-med-cmin')), '직접 입력이 칩 줄 안에서 입력칸으로');
    // 중간 종: 스위치를 켜야 간격 칸이 나온다
    await p.click('[data-act="bx-med-sound"]'); await p.waitForTimeout(300);
    const bell0 = await p.evaluate(() => document.querySelectorAll('[data-med-bell]').length);
    await p.click('[data-med-bellsw]'); await p.waitForTimeout(300);
    const bell1 = await p.evaluate(() => Array.from(document.querySelectorAll('[data-med-bell]')).map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')));
    c.ok(bell0 === 0 && bell1.length >= 2, '중간 종: 꺼져 있으면 간격 칸 없음, 켜면 나옴 ' + JSON.stringify(bell1));
    c.eq(app.errors, [], '화면 오류(명상)');
  } finally { await app.close(); }
  return c.done();
};
