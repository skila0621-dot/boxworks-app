// 시험판 65(결정 사안 s07 · 정할 것 2번 '사람과의 약속 알림'): 크게 울리기
// - 알림 페이지 맨 아래 '크게 울리기' 스위치(알림이 있을 때만). 켜면 이 일정의 사전 알림이 알람처럼(잠금 화면 알람 · 끌 때까지)
// - 잠금 화면에 제목이 보임(설정 '알람만'에서도). 장소는 그대로 잠금을 풀면. 사용자가 켤 때만(제목 · 장소로 짐작하지 않음)
// - 일정 창 알림 줄: 종에 소리 결 · '크게 울려요'. 휴대폰 캘린더 일정도 같은 스위치(박스웍스 쪽 덧붙인 값)
// - 알림 페이지 안에서 스위치를 켜고 끄면 '사용 중 · 사용 안 함'이 그대로(전에는 '알림'으로 돌아감)
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const NOW = '2026-11-06T09:20:00+09:00';
const seed = () => [['settings', settings({ bxStart: { at: old, mods: { routines: true } } })],
  ['it_1', { type: 'item', title: '치과', date: '2026-11-06', start: '14:00', end: '15:00', location: '강남역', remind: '60', travel: 30, createdAt: old, updatedAt: old }],
  ['it_2', { type: 'item', title: '보고서 마감', date: '2026-11-06', start: '17:00', end: '18:00', remind: '10', createdAt: old, updatedAt: old }]];
const doc = (p, id) => p.evaluate(id => (window.BX_T.docs().find(([k]) => k === id) || [0, null])[1], id);
const plan = (p, re) => p.evaluate(src => (window.BX_alarmPlan(14) || []).filter(a => a.kind !== 'nag' && new RegExp(src).test(a.id)).map(a => ({ id: a.id, kind: a.kind, lv: a.lv, pt: a.pt, ps: a.ps, pg: a.pg, title: a.title })), re);

module.exports = async function () {
  const c = checker('시험판 65 · 크게 울리기(사람과의 약속 알림)');
  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: NOW, data: seed() });
    const p = app.page;
    try {
      await p.waitForTimeout(1000);
      // 켜기 전: 사전 알림은 종류별 기본값(알람이 아님) · 잠금 화면에는 '일정 알림'
      const pre = await plan(p, '^i_it_1_');
      c.ok(pre.length === 1 && pre[0].lv !== 'alarm' && pre[0].pt === '일정 알림' && /잠금을 풀면/.test(pre[0].ps), theme + ': 켜기 전 사전 알림은 기본 세기 · 잠금 화면에 제목 없음 ' + JSON.stringify(pre));
      const lv0 = await plan(p, '^iv_it_1_');
      const leave0 = lv0.find(a => /출발할 시간/.test(a.title));
      c.ok(leave0 && leave0.pt === '출발할 시간' && leave0.ps === '일정 내용은 잠금을 풀면 보여요', theme + ': 켜기 전 출발 알람의 잠금 화면 글 ' + JSON.stringify(leave0));
      // 일정 수정 → 알림 '직접' → 페이지 맨 아래 '크게 울리기'(꺼짐)
      await p.click('.row-main[data-id="it_1"]'); await p.waitForTimeout(700);
      await p.click('#sheet-root [data-bxrem3="own"]'); await p.waitForTimeout(600);
      const pg = await p.evaluate(() => { const b = document.querySelector('#bx-ep .bx-ep-b #f-rem'), kids = b ? Array.from(b.children) : [], last = kids[kids.length - 1];
        const sw = document.querySelector('#bx-ep [data-bxloud]');
        return { last: last ? last.className : '', label: last ? last.querySelector('b').textContent : '', sub: last && last.querySelector('small') ? last.querySelector('small').textContent : '', on: sw && sw.getAttribute('aria-checked'), sw1: document.querySelector('#bx-ep .bx-swrow > span').textContent }; });
      c.ok(/bx-loud/.test(pg.last) && pg.label === '크게 울리기' && /끌 때까지/.test(pg.sub) && /잠금 화면에 제목/.test(pg.sub) && pg.on === 'false' && pg.sw1 === '사용 중', theme + ": 알림 페이지 맨 아래 '크게 울리기'(꺼짐) " + JSON.stringify(pg));
      // 켜기: 스위치 줄은 그대로 '사용 중'
      await p.click('#bx-ep [data-bxloud]'); await p.waitForTimeout(250);
      const on1 = await p.evaluate(() => ({ on: document.querySelector('#bx-ep [data-bxloud]').getAttribute('aria-checked'), sw1: document.querySelector('#bx-ep .bx-swrow > span').textContent, cls: document.querySelector('#bx-ep .bx-swrow').className }));
      c.ok(on1.on === 'true' && on1.sw1 === '사용 중' && /\bon\b/.test(on1.cls), theme + ": 켜면 스위치가 켜지고 위 줄은 그대로 '사용 중' " + JSON.stringify(on1));
      // ‹ 는 되돌림
      await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(400);
      c.ok(await p.evaluate(() => !document.querySelector('#f-chips .bx-er-rem').classList.contains('loud')), theme + ': ‹ 로 돌아가면 크게 울리기도 되돌림');
      // 다시 켜고 완료 → 일정 창 알림 줄: 종에 소리 결 · '크게 울려요'
      await p.click('#sheet-root [data-bxrem3="own"]'); await p.waitForTimeout(600);
      await p.click('#bx-ep [data-bxloud]'); await p.waitForTimeout(250);
      await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(400);
      const row = await p.evaluate(() => { const r = document.querySelector('#f-chips .bx-er-rem'), ic = r.querySelector('.bx-er-ic svg'), t = document.createElement('template'); t.innerHTML = window.BX_ICONSRC.app.bellRing;
        return { loud: r.classList.contains('loud'), ring: !!ic && ic.innerHTML === t.content.querySelector('svg').innerHTML, note: r.querySelector('.bx-rem3-n').textContent, col: getComputedStyle(r.querySelector('.bx-er-ic')).color }; });
      c.ok(row.loud && row.ring && /크게 울려요/.test(row.note), theme + ": 일정 창 알림 줄에 소리 결 종(앱 아이콘 세트) · '크게 울려요' " + JSON.stringify(row));
      await p.click('#sheet-root [data-act="save"]'); await p.waitForTimeout(600);
      const d1 = await doc(p, 'it_1');
      c.ok(d1 && d1.loud === true, theme + ': 저장하면 일정에 크게 울리기 ' + JSON.stringify(d1 && d1.loud));
      // 알람 계획: 사전 알림이 알람(잠금 화면 알람 · 끌 때까지), 잠금 화면에 제목. 다시 알림(알림창 3분 · 10분)은 없음
      const a1 = await plan(p, '^i_it_1_'), nag = (await p.evaluate(() => (window.BX_alarmPlan(14) || []).filter(a => a.kind === 'nag' && /it_1/.test(a.id)).length));
      c.ok(a1.length === 1 && a1[0].lv === 'alarm' && a1[0].pt === '치과' && /^1시간 뒤 시작$/.test(a1[0].ps) && !/강남역/.test(a1[0].pt + a1[0].ps) && nag === 0, theme + ': 사전 알림 = 알람 · 잠금 화면 제목 치과(장소는 없음) · 다시 알림 없음 ' + JSON.stringify({ a1, nag }));
      const lv1 = await plan(p, '^iv_it_1_'), leave1 = lv1.find(a => /출발할 시간/.test(a.title));
      c.ok(leave1 && leave1.pt === '출발할 시간 · 치과' && leave1.ps === '오후 2:00 도착' && leave1.lv !== 'short', theme + ': 출발 알람도 잠금 화면에 제목(장소는 없음) ' + JSON.stringify(leave1));
      // 다른 일정은 그대로
      const a2 = await plan(p, '^i_it_2_');
      c.ok(a2.length === 1 && a2[0].lv !== 'alarm' && a2[0].pt === '일정 알림', theme + ': 켜지 않은 일정은 그대로 ' + JSON.stringify(a2));
      // 다시 열면 켜져 있음 → 알림 '없음'으로 저장하면 크게 울리기도 꺼짐
      await p.click('.row-main[data-id="it_1"]'); await p.waitForTimeout(700);
      c.ok(await p.evaluate(() => document.querySelector('#f-chips .bx-er-rem').classList.contains('loud')), theme + ': 다시 열면 크게 울리기 그대로');
      await p.click('#sheet-root [data-bxrem3="none"]'); await p.waitForTimeout(300);
      const off = await p.evaluate(() => ({ loud: document.querySelector('#f-chips .bx-er-rem').classList.contains('loud'), note: document.querySelector('#f-chips .bx-rem3-n').textContent }));
      c.ok(!off.loud && off.note === '알림 없이 저장해요', theme + ": 알림 '없음'이면 줄에 크게 울리기 표시 없음 " + JSON.stringify(off));
      await p.click('#sheet-root [data-act="save"]'); await p.waitForTimeout(600);
      c.ok((await doc(p, 'it_1')).loud === false && (await plan(p, '^i_it_1_')).length === 0, theme + ': 알림 없이 저장하면 크게 울리기도 꺼짐');
      // 알림 페이지 안에서 켜고 끄기: '사용 중 · 사용 안 함'이 그대로(크게 울리기는 켰을 때만)
      await p.click('.row-main[data-id="it_2"]'); await p.waitForTimeout(700);
      await p.click('#sheet-root [data-bxrem3="own"]'); await p.waitForTimeout(600);
      const tg = async () => { await p.click('#bx-ep [data-bx-remsw]'); await p.waitForTimeout(250); return p.evaluate(() => ({ t: document.querySelector('#bx-ep .bx-swrow > span').textContent, loud: !!document.querySelector('#bx-ep .bx-loud') })); };
      const s1 = await tg(), s2 = await tg();
      c.ok(s1.t === '사용 안 함' && !s1.loud && s2.t === '사용 중' && s2.loud, theme + ": 페이지 안에서 끄면 '사용 안 함'(크게 울리기 없음) · 켜면 '사용 중' " + JSON.stringify([s1, s2]));
      await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
      c.eq(app.errors, [], theme + ': 화면 오류 없음');
    } catch (e) { c.ok(false, theme + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }

  // 휴대폰 캘린더 일정: 같은 스위치(덧붙인 값 px_). 켜면 알람 · 잠금 화면에 제목
  const pcache = { at: Date.parse('2026-11-06T06:00:00+09:00'), events: [
    { eventId: 78, begin: Date.parse('2026-11-06T13:00:00+09:00'), end: Date.parse('2026-11-06T14:00:00+09:00'), allDay: false, title: '팀 점심', calendarId: 5, calendar: '회사', color: -16744448, location: '강남역 11번 출구', description: '' }] };
  const app = await openApp({ now: NOW, data: seed() });
  try {
    const p = app.page;
    await p.evaluate(pc => { localStorage.setItem('bx:pcal', JSON.stringify({ on: true })); localStorage.setItem('bx:pcache', JSON.stringify(pc)); }, pcache);
    await p.reload(); await p.waitForFunction(() => window.BX_T && document.querySelector('.dock')); await p.waitForTimeout(700);
    await p.waitForSelector('[data-act="edit"][data-id^="pc_78"]', { state: 'attached' }); await p.evaluate(() => document.querySelector('[data-act="edit"][data-id^="pc_78"]').click()); await p.waitForTimeout(500);
    const b0 = await plan(p, '^i_pc_78');
    c.ok(b0.length === 1 && b0[0].lv !== 'alarm' && b0[0].pt === '일정 알림', '휴대폰 캘린더: 켜기 전 ' + JSON.stringify(b0));
    await p.click('[data-bxpc45="rem"]'); await p.waitForTimeout(300);
    const pg = await p.evaluate(() => { const l = document.querySelector('#bx-pg .bx-loud'); return l ? { label: l.querySelector('b').textContent, on: l.querySelector('[data-pcloud]').getAttribute('aria-checked'), last: !l.nextElementSibling } : null; });
    c.ok(pg && pg.label === '크게 울리기' && pg.on === 'false' && pg.last, "휴대폰 캘린더 알림 페이지 맨 아래 '크게 울리기' " + JSON.stringify(pg));
    await p.click('#bx-pg [data-pcloud]'); await p.waitForTimeout(250);
    await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(300);
    const k = await p.evaluate(() => (window.BX_T.docs().find(([id]) => id.startsWith('px_78')) || [0, {}])[1]);
    const rowT = await p.evaluate(() => document.querySelector('[data-bxpc45="rem"]').textContent.trim());
    const b1 = await plan(p, '^i_pc_78');
    c.ok(k.loud === true && rowT === '10분 전 · 크게 울려요' && b1.length === 1 && b1[0].lv === 'alarm' && b1[0].pt === '팀 점심', '휴대폰 캘린더: 켜면 덧붙인 값에 저장 · 줄 글 · 알람 · 잠금 화면 제목 ' + JSON.stringify({ k: k.loud, rowT, b1 }));
    // 알림을 '없음'으로 → 스위치 상자도 없음
    await p.click('[data-bxpc45="rem"]'); await p.waitForTimeout(300);
    await p.click('#bx-pg [data-pcrem=""]'); await p.waitForTimeout(250);
    c.ok(await p.evaluate(() => !document.querySelector('#bx-pg .bx-loud')) && (await plan(p, '^i_pc_78')).length === 0, "휴대폰 캘린더: 알림 '없음'이면 크게 울리기 상자 없음 · 알림 없음");
    await p.click('#bx-pg [data-bxpg="back"]'); await p.waitForTimeout(300);
    c.ok((await plan(p, '^i_pc_78'))[0].lv === 'alarm', '‹ 로 되돌리면 다시 크게 울림');
    c.eq(app.errors, [], '화면 오류(휴대폰 캘린더)');
  } catch (e) { c.ok(false, '휴대폰 캘린더: ' + (e && e.stack || e)); }
  finally { await app.close(); }

  // 설정 › 알림 › 잠금 화면 표시: '알람만' 설명에 크게 울리는 일정
  const app2 = await openApp({ now: NOW, data: seed() });
  try {
    const p = app2.page; await p.waitForTimeout(900);
    const t = await p.evaluate(() => { const h = window.BX_T && window.BX_T.fn && window.BX_T.fn.lockHtml ? window.BX_T.fn.lockHtml() : ''; return h; });
    c.ok(/크게 울리는 일정은 제목도/.test(t), "잠금 화면 표시 '알람만': 크게 울리는 일정은 제목도 " + t.slice(0, 160));
  } catch (e) { c.ok(false, '잠금 화면 표시: ' + (e && e.stack || e)); }
  finally { await app2.close(); }
  return c.done();
};
