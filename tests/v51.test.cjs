// 시험판 51(대표 11/4 디자인 가이드, 결정 기록 D-24): 브랜드 색 보라 · 보라 위 글자는 흰색 · 글자 크기 6단계 · 시각은 오전 · 오후
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const STEPS = [11.5, 13, 14, 16, 20, 28, 38, 50];
const data = [['settings', settings({ bxDock: ['routines', 'month', 'today', 'tt', 'memo'], bxReport: { on: true, at: '07:30' } })],
  ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 0, createdAt: old }],
  ['it_1', { type: 'item', title: '노동부 방문', date: '2026-11-02', start: '15:00', end: '16:00', remind: '10', travel: 20, location: '롯데마트 옆 고용복지센터', categoryId: 'c_p', createdAt: old, updatedAt: old }],
  ['it_2', { type: 'item', title: '저녁 약속', date: '2026-11-02', start: '18:30', end: '20:00', remind: '10', location: '강남역 2번 출구', categoryId: 'c_p', createdAt: old, updatedAt: old }],
  ['it_3', { type: 'item', title: '점심', date: '2026-11-02', start: '11:30', end: '13:00', createdAt: old, updatedAt: old }],
  ['rt_m', { type: 'routine', name: '아침 준비', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '07:30', times: 6, every: 5, on: true,
    steps: [{ id: 'a', name: '씻기', min: 15 }, { id: 'b', name: '옷 입기', min: 10 }], createdAt: old, updatedAt: old }],
  ['tt_a', { type: 'tt', name: '경영학원론', days: [1, 3], start: '10:30', end: '12:00', place: '301호', remind: '10', on: true, createdAt: old, updatedAt: old }],
  ['mm_1', { type: 'memo', date: '2026-11-02', text: '은행 서류 챙기기', at: '09:05', createdAt: '2026-11-02T00:05:00.000Z', updatedAt: '2026-11-02T00:05:00.000Z' }],
  ['mm_2', { type: 'memo', date: '2026-11-02', text: '우산 가져가기', at: '13:40', createdAt: '2026-11-02T04:40:00.000Z', updatedAt: '2026-11-02T04:40:00.000Z' }]];

// 화면에 보이는 글자의 크기 중 6단계(+ 명상 숫자)가 아닌 것
const offScale = p => p.evaluate(steps => {
  const bad = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const e = n.parentElement; if (!e || !e.getBoundingClientRect().height) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const fs = parseFloat(cs.fontSize); if (!steps.includes(fs)) bad.add(fs + 'px ' + e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' "' + n.nodeValue.trim().slice(0, 12) + '"');
  }
  return Array.from(bad).slice(0, 8);
}, STEPS);
// 화면에 보이는 'HH:MM' 가운데 앞에 오전 · 오후가 없는 것(입력 칸 값 · 사용자 글은 빼고)
const bare24 = p => p.evaluate(() => {
  const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const t = n.nodeValue; const e = n.parentElement; if (!e || !e.getBoundingClientRect().height) continue;
    if (e.closest('.row-title, .bx-mm-x, textarea')) continue;
    const re = /(오전|오후)?\s*(\d{1,2}):(\d{2})/g; let m, prev = null;
    while ((m = re.exec(t))) { if (!m[1] && !(prev && /[–~-]\s*$/.test(t.slice(prev, m.index)))) out.push(t.trim().slice(0, 30)); prev = re.lastIndex; }
  }
  return out;
});

module.exports = async function () {
  const c = checker('시험판 51 · 보라 · 보라 위 흰 글자 · 글자 6단계 · 오전 · 오후');
  const app = await openApp({ data, now: '2026-11-02T13:55:00+09:00' });
  try {
    const p = app.page;
    // (1) 도우미
    c.eq(await p.evaluate(() => { const { bxT, bxTR, bxH, bxHR } = window.BX_TIME; return [bxT('15:00'), bxT('00:05'), bxT('12:00'), bxTR('15:00', '16:00'), bxTR('11:00', '13:00'), bxTR('09:00', ''), bxH(9), bxH(24), bxHR(9, 18), bxHR(9, 11)]; }),
      ['오후 3:00', '오전 12:05', '오후 12:00', '오후 3:00–4:00', '오전 11:00–오후 1:00', '오전 9:00', '오전 9시', '자정', '오전 9시–오후 6시', '오전 9시–11시'], 'bxT · bxTR · bxH · bxHR');
    c.eq(await p.evaluate(() => { const { bxHMAll } = window.BX_TIME; return [bxHMAll('오후 3:00–4:00'), bxHMAll('15:00'), bxHMAll('오전 12:30 · 오후 12:30'), bxHMAll('오전 11:00–오후 1:00')]; }),
      [[900, 960], [900], [30, 750], [660, 780]], 'bxHMAll: 화면 글에서 시각 읽기(뒤 시각은 앞의 오전 · 오후를 이어받음)');
    // (2) 색: 채운 보라는 라이트 · 다크 같은 #7C3AED, 그 위 글자는 흰색, 바탕 위 보라 글자는 다크에서 밝게
    const col = mode => p.evaluate(m => {
      document.documentElement.setAttribute('data-theme', m);
      const cs = getComputedStyle(document.documentElement), v = k => cs.getPropertyValue(k).trim().toLowerCase();
      const fab = document.querySelector('.bx-fab'), now = document.querySelector('.now-line');
      return { accent: v('--accent'), ink: v('--accent-ink'), text: v('--accent-text'), fabBg: fab && getComputedStyle(fab).backgroundColor, fabFg: fab && getComputedStyle(fab).color, now: now && getComputedStyle(now).color };
    }, mode);
    const L = await col('light'), D = await col('dark');
    c.eq([L.accent, L.ink, L.text, L.fabBg, L.fabFg, L.now], ['#7c3aed', '#ffffff', '#7c3aed', 'rgb(124, 58, 237)', 'rgb(255, 255, 255)', 'rgb(124, 58, 237)'], '라이트: 보라 #7C3AED · 위 글자 흰색 · 지금 줄 보라');
    c.eq([D.accent, D.ink, D.text, D.fabBg, D.fabFg, D.now], ['#7c3aed', '#ffffff', '#a98bfa', 'rgb(124, 58, 237)', 'rgb(255, 255, 255)', 'rgb(169, 139, 250)'], '다크: 채운 보라는 같은 #7C3AED · 위 글자 흰색 · 바탕 위 보라 글자는 밝은 #A98BFA');
    // 시험판 56(목록 줄 C): 출발은 둘째 줄 보라 글자(다크에서는 밝은 보라)
    c.eq(await p.evaluate(() => { const r = document.querySelector('#tcard2 .row.bx-next .rc-sub.go'); return r ? getComputedStyle(r).color : null; }), 'rgb(169, 139, 250)', '다크: 다음 일정 출발 글자는 밝은 보라(#A98BFA)');
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    // (3) 홈: 시각은 오전 · 오후, 시각 칸에 한 줄
    const home = await p.evaluate(() => ({
      now: document.querySelector('.now-line .tnum').textContent,
      rows: Array.from(document.querySelectorAll('#tcard2 .row.rowc')).filter(r => r.getBoundingClientRect().height).map(r => Array.from(r.querySelectorAll('.row-time > *')).map(e => e.textContent).concat(r.querySelector('.rc-sub.go') ? [r.querySelector('.rc-sub.go').textContent] : [])),
      oneLine: Array.from(document.querySelectorAll('#tcard2 .row-time b')).filter(b => b.getBoundingClientRect().height).every(b => b.getBoundingClientRect().height < 26)
    }));
    c.eq(home.now, '지금 오후 1:55', "'지금' 줄: 지금 오후 1:55");
    c.ok(home.rows.some(r => JSON.stringify(r) === '["오후 3:00","오후 4:00","오후 2:40 출발"]') && home.rows.some(r => JSON.stringify(r) === '["오후 6:30","오후 8:00"]') && home.oneLine, '홈 줄: 시작 · 끝 · 출발 모두 오전 · 오후, 시작 시각은 한 줄 ' + JSON.stringify(home));
    c.eq(await bare24(p), [], '홈: 오전 · 오후 없는 시각 없음');
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.bx-mm-row > .bx-mm-t')).filter(e => e.getBoundingClientRect().height).map(e => e.textContent)).then(a => a.slice(0, 2)), ['오전 9:05', '오후 1:40'], '오늘의 메모: 적은 시각도 오전 · 오후');
    c.eq(await offScale(p), [], '홈: 글자 크기는 6단계만');
    // (4) 캘린더 · 시간표 · 루틴 · 메모
    for (const [v, name] of [['month', '캘린더'], ['tt', '시간표'], ['routines', '루틴'], ['memo', '메모']]) {
      await p.click('.dock [data-view="' + v + '"]'); await p.waitForTimeout(500);
      c.eq(await offScale(p), [], name + ': 글자 크기는 6단계만');
      c.eq(await bare24(p), [], name + ': 오전 · 오후 없는 시각 없음');
    }
    await p.click('.dock [data-view="tt"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => [document.querySelector('.bx-tt-ap').textContent, Array.from(document.querySelectorAll('.tt-line span')).map(s => s.textContent).slice(0, 5)]), ['오전', ['9', '10', '11', '오후12', '1']], '시간표 시각 줄: 12시간 숫자, 왼쪽 위 오전, 정오에 오후');
    c.ok(/오전 9시–오후 6시/.test(await p.evaluate(() => document.querySelector('.bx-tt-head p').textContent)), '시간표 머리: 오전 9시–오후 6시');
    // (5) 일정 창: 시각 칸 · 출발 줄 · 시간 페이지의 입력 칸
    await p.click('.dock [data-view="today"]'); await p.waitForTimeout(500);
    await p.click('#tcard2 .row-main[data-id="it_1"]'); await p.waitForTimeout(700);
    // 시험판 56(일정 넣기 나): 시간 줄 하나 '오후 3:00 ~ 오후 4:00', 출발·준비는 '자세히' 안(정해져 있어 펼쳐서 열림)
    c.eq(await p.evaluate(() => document.querySelector('#f-chips [data-fpanel="time"] .bx-er-t').textContent), '오후 3:00 ~ 오후 4:00', '일정 창: 시간 줄 시작 ~ 끝');
    c.ok(await p.evaluate(() => Array.from(document.querySelectorAll('#f-chips .bx-er-t')).some(t => t.textContent === '오후 2:40 출발')), "일정 창: '오후 2:40 출발' 줄");
    c.eq(await p.evaluate(() => { const b = document.querySelector('#sheet-root .bx-pill49'); const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(b).backgroundColor); const a = m ? m[1].split(',').map(Number) : []; return a.length === 3 || a[3] === 1; }), true, "'취소 | 저장' 바탕은 채운 색(뒤가 비치지 않음)");
    c.eq(await offScale(p), [], '일정 창: 글자 크기는 6단계만');
    await p.click('#f-chips [data-fpanel="time"]'); await p.waitForTimeout(600);
    // 시험판 62(선택실 4 · 1번 B): 시간 페이지는 휴대폰 시계 창 대신 시작 · 끝 칸 + 세 칸 바퀴(v62). 칸 글은 오전 · 오후
    const tp = await p.evaluate(() => ['f-start', 'f-end'].map(id => { const b = document.getElementById(id); return b ? [b.tagName, b.textContent.trim()] : null; }));
    c.eq(tp, [['BUTTON', '오후 3:00'], ['BUTTON', '오후 4:00']], '시간 페이지: 시작 · 끝 칸 글은 오전 · 오후');
    await p.evaluate(() => { const it = Array.from(document.querySelectorAll('#bx-ep .bx-wc[data-wpart="ap"] .bx-wi')).find(e => e.textContent.trim() === '오전'); it.click(); }); await p.waitForTimeout(250);
    await p.evaluate(() => { const it = Array.from(document.querySelectorAll('#bx-ep .bx-wc[data-wpart="h"] .bx-wi')).find(e => e.textContent.trim() === '9'); it.click(); }); await p.waitForTimeout(250);
    await p.evaluate(() => { const it = Array.from(document.querySelectorAll('#bx-ep .bx-wc[data-wpart="m"] .bx-wi')).find(e => e.textContent.trim() === '30'); it.click(); }); await p.waitForTimeout(250);
    c.eq(await p.evaluate(() => [window.BX_T.fn.form().start, document.getElementById('f-start').textContent.trim(), document.getElementById('f-end').textContent.trim()]), ['09:30', '오전 9:30', '오전 10:30'], '바퀴로 고르면 글이 바로 바뀜(값은 그대로 HH:MM, 끝은 소요 시간만큼)');
    c.eq(await offScale(p), [], '시간 페이지: 글자 크기는 6단계만');
    // (6) 알람 · 알림 글
    const sync = await p.evaluate(() => JSON.stringify(window.__sync.slice(-1)[0] || {}));
    const strs = []; JSON.parse(sync, (k, v) => { if (typeof v === 'string' && /\d{1,2}:\d{2}/.test(v) && !/^\d{4}-\d\d-\d\dT/.test(v) && ['sub', 'body', 'next', 'ps', 'title', 'text'].includes(k)) strs.push(v); return v; });
    const bad = strs.filter(s => /(^|[^전후\d]\s?)\b\d{1,2}:\d{2}/.test(s.replace(/(오전|오후) \d{1,2}:\d{2}(–\d{1,2}:\d{2})?/g, '')));
    c.ok(strs.length > 3 && bad.length === 0 && strs.some(s => /오후 3:00 도착/.test(s)), '알람 · 알림 글의 시각도 오전 · 오후 ' + JSON.stringify(bad.slice(0, 4)));
    // (7) 설정: 목록 · 묶음 화면의 값도 오전 · 오후, 글자 6단계
    await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(300);
    await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(400);
    await p.click('.ab-menu'); await p.waitForTimeout(500);
    await p.locator('#sheet-root button', { hasText: '설정' }).last().click(); await p.waitForTimeout(700);
    const setTxt = await p.evaluate(() => document.querySelector('.screen.settings, .screen') ? document.body.innerText : '');
    c.ok(/아침 요약 오전 7:30/.test(setTxt), "설정 목록: '아침 요약 오전 7:30'");
    c.eq(await bare24(p), [], '설정 목록: 오전 · 오후 없는 시각 없음');
    c.eq(await offScale(p), [], '설정 목록: 글자 크기는 6단계만');
    for (const name of ['화면', '알림', '캘린더']) {
      const row = p.locator('.screen button, .screen [role="button"]', { hasText: name }).first();
      if (!(await row.count())) { c.ok(false, '설정 줄 없음: ' + name); continue; }
      await row.click(); await p.waitForTimeout(600);
      c.eq(await bare24(p), [], '설정 › ' + name + ': 오전 · 오후 없는 시각 없음');
      c.eq(await offScale(p), [], '설정 › ' + name + ': 글자 크기는 6단계만');
      await p.evaluate(() => window.BX_back && window.BX_back()); await p.waitForTimeout(500);
    }
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
