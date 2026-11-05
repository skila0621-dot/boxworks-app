// 시험판 58(대표 11/4 22:20 · 22:25 · 22:40 · 22:46 ②)
// (1) 설정 › 화면 › 시각 표시: 오전 · 오후(기본) | 24시간 — 앱 · 알림 글 · 위젯 자료 · 휴대폰 알람(h24)이 같이 바뀐다
// (2) 시간 없는 하루 일정: 시험판 61부터 '종일'로 '오늘 할 일' 맨 위(시험판 58 ~ 60은 '시간 미지정 일정' 상자), 안 한 것이 먼저
// (3) 캘린더 칩을 길게 누르면 색 바꾸기 · 이 캘린더 빼기(휴대폰 캘린더도). 뺀 캘린더는 캘린더 목록 맨 아래에서 다시 넣기
// (4) 버그: 휴대폰 캘린더 앱에서 끈 캘린더 · 고르기에서 뺀 캘린더의 일정이 계속 보이던 것
// (5) '머리 말리기' 아이콘, 시간 페이지 '소요 시간' 글자가 '시간' 글자와 같은 줄
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const DAY = '2026-11-02';
const T = (h, m) => Date.parse(DAY + 'T' + String(h).padStart(2, '0') + ':' + String(m || 0).padStart(2, '0') + ':00+09:00');

module.exports = async function () {
  const c = checker('시험판 58 · 시각 표시 · 시간 미지정 상자 · 캘린더 칩 길게 누르기 · 휴대폰 캘린더 끄기');
  const data = [['settings', settings({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockMemo: 1 })],
    ['c_w', { type: 'category', name: '회사', color: '#2a78d6', order: 0, createdAt: old }],
    ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 1, createdAt: old }],
    ['it_t', { type: 'item', title: '노동부', date: DAY, start: '14:00', end: '15:00', categoryId: 'c_p', createdAt: old, updatedAt: old }],
    ['it_w', { type: 'item', title: '주간 회의', date: DAY, start: '16:00', end: '17:00', categoryId: 'c_w', createdAt: old, updatedAt: old }],
    ['it_u1', { type: 'item', title: '원두주문', date: DAY, categoryId: 'c_p', done: true, createdAt: old, updatedAt: old }],
    ['it_u2', { type: 'item', title: '택배 보내기', date: DAY, categoryId: 'c_p', createdAt: old, updatedAt: old }],
    ['it_s', { type: 'item', title: '부산 출장', date: '2026-11-01', endDate: '2026-11-03', categoryId: 'c_w', createdAt: old, updatedAt: old }],
    ['it_y', { type: 'item', title: '은행 서류', date: '2026-11-01', categoryId: 'c_p', createdAt: old, updatedAt: old }],
    ['rt_d', { type: 'routine', name: '머리 손질', days: [0, 1, 2, 3, 4, 5, 6], mode: 'start', target: '07:00', times: 6, every: 5, on: true,
      steps: [{ id: 'd0', name: '머리 감기', min: 5 }, { id: 'd1', name: '머리 말리기', min: 7 }], createdAt: old, updatedAt: old }],
    ['tt_a', { type: 'tt', name: '경영학원론', days: [1], start: '09:00', end: '10:30', place: '301호', color: '#2a78d6', on: true, createdAt: old, updatedAt: old }]];
  const app = await openApp({ width: 384, height: 900, now: '2026-11-02T11:20:00+09:00', data });
  const p = app.page;
  const dock = async v => { await p.click('.dock [data-view="' + v + '"]'); await p.waitForTimeout(600); };
  const longPress = async sel => {
    const bb = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
    if (!bb) return false;
    await p.mouse.move(bb.x, bb.y); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(450);
    return true;
  };
  try {
    await p.waitForTimeout(900);
    // ── (5) 아이콘 ──
    c.eq(await p.evaluate(() => { const f = window.BX_T.fn; return [f.icon('머리 말리기'), f.icon('머리말리기'), f.icon('드라이'), f.icon('드라이브 가기')]; }), ['drop', 'drop', 'drop', null], "'머리 말리기' · '드라이'는 물방울, '드라이브'는 물방울이 아님");

    // ── (2) 시간 없는 하루 일정 — 시험판 61부터 '종일'로 '오늘 할 일' 맨 위(대표 11/5 22:48 · 22:50, 시험판 58 ~ 60의 '시간 미지정 일정' 상자는 없앰) ──
    const ut = await p.evaluate(() => {
      const a = document.getElementById('tcard2'), tl = a && a.querySelector('.bx-tl');
      const kids = tl ? Array.from(tl.children) : [], at = id => kids.findIndex(e => e.querySelector && e.querySelector('[data-id="' + id + '"]'));
      const row = id => kids.find(e => e.querySelector && e.querySelector('[data-id="' + id + '"]'));
      const tmOf = id => { const r = row(id); const tm = r && r.querySelector('.row-time'); return tm ? tm.textContent.trim() : null; };
      return { box: !!document.getElementById('tcard-ut'), u2: at('it_u2'), u1: at('it_u1'), s: at('it_s'), now: kids.findIndex(e => e.classList.contains('now-line')), past: kids.findIndex(e => e.classList.contains('bx-past-tog')),
        tm: [tmOf('it_u2'), tmOf('it_u1')], done: [row('it_u2'), row('it_u1')].map(r => !!r && r.classList.contains('done')) };
    });
    c.ok(ut && !ut.box, "'시간 미지정 일정' 상자는 없음(시험판 61)");
    c.ok(ut && ut.u2 === 0 && ut.u2 < ut.s && ut.s < ut.u1 && ut.u1 < ut.past && ut.past < ut.now, "'오늘 할 일' 맨 위: 안 한 종일(택배 보내기) → 여러 날(부산 출장) → 한 것(원두주문) → 지난 일 → 지금 " + JSON.stringify(ut));
    c.eq(ut && ut.tm, ['종일', '종일'], "시각 칸은 '종일'");
    c.eq(ut && ut.done, [false, true], '한 것은 가로줄 + 흐리게');
    await p.click('#tcard2 .row .chk[data-id="it_u2"]'); await p.waitForTimeout(600);
    c.ok(await p.evaluate(() => { const r = document.querySelector('#tcard2 .row .chk[data-id="it_u2"]'); return !!r && r.closest('.row').classList.contains('done'); }), '종일 줄에서 체크하면 완료');
    await p.click('#tcard2 .row .chk[data-id="it_u2"]'); await p.waitForTimeout(500);
    // 어제까지 못 한 시각 없는 일정은 종일 줄이 아니라 '지난 일'(확인 필요)
    c.ok(await p.evaluate(() => { const b = document.querySelector('#tcard2 .bx-past'); return !!b && !!b.querySelector('[data-id="it_y"]'); }), "어제까지 못 한 일(은행 서류)은 '지난 일'에");

    // ── (1) 시각 표시 ──
    c.eq(await p.evaluate(() => { const f = window.BX_T.fn; return [f.bxT('15:00'), f.bxTR('09:00', '10:30'), f.bxH(13), window.BX_clock24()]; }), ['오후 3:00', '오전 9:00–10:30', '오후 1시', false], '기본은 오전 · 오후');
    await p.evaluate(() => { const b = document.querySelector('.ab-menu'); if (b) b.click(); }); await p.waitForTimeout(400);
    await p.evaluate(() => { const b = document.querySelector('[data-menu="prefs"]'); if (b) b.click(); }); await p.waitForTimeout(500);
    await p.click('[data-bxset="view"]'); await p.waitForTimeout(400);
    const vrow = await p.evaluate(() => { const r = Array.from(document.querySelectorAll('.bx-arow')).find(e => /시각 표시/.test(e.textContent)); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; });
    c.eq(vrow, '시각 표시오전 · 오후 (오후 3:00)', '설정 › 화면에 시각 표시 줄(지금 값)');
    await p.click('[data-bxset="view/clock"]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('[data-clock-set]')).map(b => [b.textContent.trim(), b.getAttribute('aria-pressed')])), [['오전 · 오후', 'true'], ['24시간', 'false']], '시각 표시: 오전 · 오후 | 24시간, 기본은 오전 · 오후');
    await p.click('[data-clock-set="24"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => [window.BX_clock24(), document.documentElement.classList.contains('bx-h24'), (window.BX_T.docs().find(([k]) => k === 'settings') || [0, {}])[1].clock, document.querySelector('[data-clock-set="24"]').getAttribute('aria-pressed')]), [true, true, '24', 'true'], '24시간을 고르면 저장되고 바로 바뀜');
    c.eq(await p.evaluate(() => { const f = window.BX_T.fn; return [f.bxT('15:00'), f.bxT('09:05'), f.bxTR('09:00', '10:30'), f.bxTR('11:00', '13:00'), f.bxH(13), f.bxHR(9, 18), f.hmText('00:30')]; }), ['15:00', '09:05', '09:00–10:30', '11:00–13:00', '13시', '9시–18시', '00:30'], '24시간 글자');
    // 예시 글도 같은 규칙: 설정 › 알림 › 잠금 화면 표시
    await p.click('.bx-set-back'); await p.waitForTimeout(300); await p.click('.bx-set-back'); await p.waitForTimeout(300);
    await p.click('[data-bxset="alarm"]'); await p.waitForTimeout(300); await p.click('[data-bxset="alarm/lock"]'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => /치과 · 14:30 출발/.test(document.querySelector('#screen').textContent) && !/오후 2:30/.test(document.querySelector('#screen').textContent)), "잠금 화면 표시 예시도 24시간('치과 · 14:30 출발')");
    await dock('today'); await p.waitForTimeout(400);
    const h24 = await p.evaluate(() => {
      const r = document.querySelector('#tcard2 .row-main[data-id="it_t"]'), row = r && r.closest('.row');
      const tw = getComputedStyle(document.documentElement).getPropertyValue('--row-tw').trim();
      const txt = document.querySelector('#screen').innerText;
      return { t: row ? row.querySelector('.row-time').textContent.trim() : null, tw, ampm: /(오전|오후)\s?\d{1,2}:\d{2}/.test(txt) };
    });
    c.eq(h24, { t: '14:0015:00', tw: '56px', ampm: false }, '홈: 시각 14:00 · 15:00, 시각 칸 56, 화면에 오전 · 오후 시각 없음');
    const wd = await p.evaluate(() => { const d = window.BX_widgetData(); return [d.h24, (d.items.find(i => i.title === '노동부') || {}).at]; });
    c.eq(wd, [true, T(14)], '위젯 자료에 h24');
    await p.waitForTimeout(1200);
    c.eq(await p.evaluate(() => { const s = window.__sync[window.__sync.length - 1]; return s ? s.h24 : null; }), true, '휴대폰 알람(잠금 화면 · 루틴 진행 알림)에도 h24');
    c.ok(await p.evaluate(() => { const al = window.BX_alarmPlan(1) || []; return al.length > 0 && al.every(a => !/(오전|오후)\s?\d{1,2}:\d{2}/.test(String(a.title || '') + ' ' + String(a.sub || '') + ' ' + String(a.next || ''))); }), '알람 글에도 오전 · 오후 없음');
    await dock('tt'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => { const ax = Array.from(document.querySelectorAll('.tt-line span, .tt-h')).map(e => e.textContent).join(' '); return !/오전|오후/.test(ax) && /\b13\b/.test(ax); }), '시간표 시 칸: 0~24, 오전 · 오후 글자 없음');
    // 되돌리기: 오전 · 오후
    await p.evaluate(() => { const b = document.querySelector('.ab-menu'); if (b) b.click(); }); await p.waitForTimeout(400);
    await p.evaluate(() => { const b = document.querySelector('[data-menu="prefs"]'); if (b) b.click(); }); await p.waitForTimeout(500);
    await p.click('[data-bxset="view"]'); await p.waitForTimeout(300); await p.click('[data-bxset="view/clock"]'); await p.waitForTimeout(300);
    await p.click('[data-clock-set=""]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => [window.BX_clock24(), window.BX_T.fn.bxT('15:00'), document.documentElement.classList.contains('bx-h24')]), [false, '오후 3:00', false], '오전 · 오후로 되돌림');
    await dock('today');

    // ── (3) 캘린더 칩 길게 누르기 ──
    await dock('month');
    c.ok(await longPress('.page-head .bx-cchip[data-bxcsel="c_w"]'), '회사 칩');
    const menu = await p.evaluate(() => { const sh = document.querySelector('#sheet-root .sheet'); return sh ? { title: (sh.querySelector('.sh-t, h2, .sheet-title') || {}).textContent, sw: sh.querySelectorAll('[data-bxccol]').length, out: !!sh.querySelector('[data-act="bx-ccm-out"]'), sel: window.BX_T.fn.calSel() } : null; });
    c.ok(menu && menu.sw === 8 && menu.out && menu.sel === '', '칩을 길게 누르면 색 바꾸기(8색) · 이 캘린더 빼기, 칩 고르기는 되지 않음 ' + JSON.stringify(menu));
    await p.click('#sheet-root [data-bxccol="#e34948"]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => [(window.BX_T.docs().find(([k]) => k === 'c_w') || [0, {}])[1].color, document.querySelector('.page-head .bx-cchip[data-bxcsel="c_w"] .bx-cdot').style.getPropertyValue('--c')]), ['#e34948', 'var(--cat-red)'], '색 바꾸기: 캘린더 색 · 칩 점');
    await p.click('#sheet-root [data-act="bx-ccm-out"]'); await p.waitForTimeout(600);
    const out = await p.evaluate(() => ({ hidden: (window.BX_T.docs().find(([k]) => k === 'c_w') || [0, {}])[1].hidden, chip: !!document.querySelector('.page-head .bx-cchip[data-bxcsel="c_w"]'),
      cal: Array.from(document.querySelectorAll('.cal [data-item]')).map(e => e.dataset.item).filter(id => id === 'it_w' || id === 'it_s'), toast: (document.querySelector('#toasts') || {}).textContent || '',
      wd: window.BX_widgetData().items.some(i => i.title === '주간 회의'), alarm: (window.BX_alarmPlan(2) || []).some(a => /주간 회의/.test(a.title + ' ' + (a.sub || ''))) }));
    c.ok(out.hidden === true && !out.chip && !out.cal.length && /뺐어요/.test(out.toast) && /되돌리기/.test(out.toast), '이 캘린더 빼기: 칩 · 달력에서 빠지고 되돌리기 ' + JSON.stringify(out));
    c.ok(!out.wd, '뺀 캘린더 일정은 위젯에서도 빠짐');
    await dock('today');
    c.ok(await p.evaluate(() => !document.querySelector('#tcard2 [data-id="it_w"]')), '뺀 캘린더 일정은 홈에서도 빠짐');
    await dock('month');
    await p.click('.page-head [data-act="bx-cals"]'); await p.waitForTimeout(500);
    const back = await p.evaluate(() => { const r = document.querySelector('#sheet-root .bx-calout[data-cal="c_w"]'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; });
    c.ok(back && /회사/.test(back) && /다시 넣기/.test(back), "캘린더 목록 맨 아래 '뺀 캘린더'에 회사 · 다시 넣기 " + JSON.stringify(back));
    await p.click('#sheet-root [data-act="bx-cal-back"][data-id="c_w"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => [(window.BX_T.docs().find(([k]) => k === 'c_w') || [0, {}])[1].hidden, !!document.querySelector('#sheet-root .bx-calout')]), [false, false], '다시 넣기');
    await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(300);

    // ── (4) 휴대폰 캘린더: 끈 캘린더 · 뺀 캘린더 ──
    // 휴대폰 쪽 흉내: 예전 휴대폰 쪽처럼 고른 캘린더(ids)가 있으면 휴대폰에서 끈 캘린더(3)도 돌려준다 — 앱 쪽에서도 걸러야 함
    await p.evaluate(({ T0 }) => {
      const ev = (id, cal, h, title) => ({ eventId: id, begin: T0 + h * 3600e3, end: T0 + (h + 1) * 3600e3, title, location: '', description: '', allDay: false, calendarId: cal, color: cal === '1' ? -15584170 : cal === '2' ? -1499549 : -7617718, calendar: cal === '1' ? '내 캘린더' : cal === '2' ? '가족' : '숨긴 캘린더' });
      window.__pcCalls = 0;
      window.Capacitor.Plugins.BxCalendar = {
        status: async () => ({ granted: true }), request: async () => ({ granted: true }),
        calendars: async () => ({ calendars: [{ id: '1', name: '내 캘린더', account: 'me', color: -15584170, visible: true }, { id: '2', name: '가족', account: 'me', color: -1499549, visible: true }, { id: '3', name: '숨긴 캘린더', account: 'me', color: -7617718, visible: false }] }),
        events: async o => { window.__pcCalls++; await new Promise(r => setTimeout(r, window.__pcDelay || 0)); const all = [ev('e1', '1', 12, '팀 점심'), ev('e2', '2', 18, '가족 저녁'), ev('e3', '3', 20, '숨긴 일정')]; return { events: o && o.ids ? all.filter(e => o.ids.includes(e.calendarId) || e.calendarId === '3') : all }; },
        open: async () => ({})
      };
      localStorage.setItem('bx:pcal', JSON.stringify({ on: true, ids: ['1', '2', '3'] }));
    }, { T0: T(0) });
    await p.evaluate(() => window.BX_pcRefresh(true)); await p.waitForTimeout(700);
    const pcs = () => p.evaluate(() => window.BX_T.fn.pcTitles('2026-11-02'));
    c.eq(await pcs(), ['가족 저녁', '팀 점심'], '휴대폰 캘린더 앱에서 끈 캘린더(숨긴 캘린더)는 고른 캘린더에 있어도 보이지 않음');
    // 설정 › 휴대폰 캘린더에서 '가족'을 끄면 바로 빠지고, 읽는 중이었어도 끝난 뒤 다시 읽음
    await p.evaluate(() => { window.__pcDelay = 400; window.BX_pcRefresh(true); }); await p.waitForTimeout(80);
    const n0 = await p.evaluate(() => window.__pcCalls);
    await p.evaluate(() => { const b = document.querySelector('.ab-menu'); if (b) b.click(); }); await p.waitForTimeout(300);
    await p.evaluate(() => { const b = document.querySelector('[data-menu="prefs"]'); if (b) b.click(); }); await p.waitForTimeout(400);
    await p.click('[data-bxset="pcal"]'); await p.waitForTimeout(400);
    const list = await p.evaluate(() => Array.from(document.querySelectorAll('[data-pc-cal]')).map(b => [b.dataset.pcCal, b.getAttribute('aria-pressed')]));
    c.eq(list, [['1', 'true'], ['2', 'true']], '설정의 보여 줄 캘린더에는 휴대폰에서 보이는 캘린더만');
    await p.click('[data-pc-cal="2"]'); await p.waitForTimeout(60);
    c.eq(await pcs(), ['팀 점심'], '끄면 다시 읽기를 기다리지 않고 바로 빠짐');
    await p.waitForTimeout(1300);
    c.ok((await p.evaluate(() => window.__pcCalls)) >= n0 + 1 && JSON.stringify(await pcs()) === JSON.stringify(['팀 점심']), '읽는 중에 바꿔도 끝난 뒤 한 번 더 읽음(뺀 캘린더 일정이 남지 않음)');
    await p.evaluate(() => { window.__pcDelay = 0; });
    await p.click('[data-pc-cal="2"]'); await p.waitForTimeout(800);
    c.eq(await pcs(), ['가족 저녁', '팀 점심'], '다시 켜면 다시 보임');
    // 휴대폰 캘린더 칩: 색 바꾸기(이 휴대폰에서만) · 이 캘린더 빼기
    await dock('month');
    c.ok(await longPress('.page-head .bx-cchip[data-bxcsel="pcc_2"]'), '가족 칩');
    const pm = await p.evaluate(() => { const sh = document.querySelector('#sheet-root .sheet'); return sh ? { sw: sh.querySelectorAll('[data-bxccol]').length, first: (sh.querySelector('[data-bxccol]') || {}).getAttribute && sh.querySelector('[data-bxccol]').getAttribute('aria-label'), note: /휴대폰 캘린더 앱의 색은 그대로/.test(sh.textContent) } : null; });
    c.ok(pm && pm.sw === 9 && pm.first === '휴대폰 캘린더 색' && pm.note, '휴대폰 캘린더 칩: 휴대폰 캘린더 색 + 8색 · 이 휴대폰에서만 ' + JSON.stringify(pm));
    await p.click('#sheet-root [data-bxccol="#6250d6"]'); await p.waitForTimeout(400);
    const pcol = await p.evaluate(() => [JSON.parse(localStorage.getItem('bx:pcal')).colors, (window.BX_widgetData().items.find(i => i.title === '가족 저녁') || {}).c, document.querySelector('.page-head .bx-cchip[data-bxcsel="pcc_2"] .bx-cdot').style.getPropertyValue('--c')]);
    c.eq(pcol, [{ 2: '#6250d6' }, '#6250d6', '#6250d6'], '고른 색: 저장 · 위젯 색 막대 · 칩 점');
    await p.click('#sheet-root [data-act="bx-ccm-out"]'); await p.waitForTimeout(800);
    c.eq(await p.evaluate(() => [JSON.parse(localStorage.getItem('bx:pcal')).ids.includes('2'), !!document.querySelector('.page-head .bx-cchip[data-bxcsel="pcc_2"]')]), [false, false], '휴대폰 캘린더 빼기: 읽지 않음(고른 캘린더에서 뺌) · 칩 없음');
    c.eq(await pcs(), ['팀 점심'], '뺀 휴대폰 캘린더 일정 없음');
    await p.click('.page-head [data-act="bx-cals"]'); await p.waitForTimeout(500);
    c.ok(await p.evaluate(() => !!document.querySelector('#sheet-root .bx-calout[data-cal="pcc_2"]') && !document.querySelector('#sheet-root .bx-calout[data-cal="pcc_3"]')), "'뺀 캘린더'에 가족(휴대폰에서 끈 캘린더는 없음)");
    await p.click('#sheet-root [data-act="bx-cal-back"][data-id="pcc_2"]'); await p.waitForTimeout(800);
    c.eq(await pcs(), ['가족 저녁', '팀 점심'], '다시 넣기');
    await p.evaluate(() => { if (window.BX_back) window.BX_back(); }); await p.waitForTimeout(300);

    // ── (5) 시간 페이지: '소요 시간' 글자가 '시간' 글자와 같은 줄 ──
    await dock('today');
    await p.click('#tcard2 .row-main[data-id="it_t"]'); await p.waitForTimeout(500);
    await p.evaluate(() => { const b = document.querySelector('#sheet-root [data-bxmore]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await p.waitForTimeout(250);
    await p.click('#sheet-root [data-fpanel="time"]'); await p.waitForTimeout(500);
    const lab = await p.evaluate(() => Array.from(document.querySelectorAll('#bx-ep #f-time .fg-l')).filter(e => e.getBoundingClientRect().height > 0).map(e => [e.textContent.trim(), Math.round(e.getBoundingClientRect().left)]));
    c.ok(lab.length >= 2 && lab.every(x => x[1] === lab[0][1]), "시간 페이지 이름표('시간' · '소요 시간')가 같은 줄에서 시작 " + JSON.stringify(lab));
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
