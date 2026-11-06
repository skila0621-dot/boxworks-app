// 시험판 72(결정 사안 d20261106-maplook B · C — 선택실 9 · 2번, 대표 메모 'A+B+C 다 필요해보임'): 장소 → 지도
// B 목록 줄: 장소가 있으면 둘째 줄 맨 앞에 장소(보라 밑줄) + 상태 하나. 장소 글자를 누르면 휴대폰 지도 앱(geo:), 줄의 나머지는 그대로 일정 창.
//   다음 일정이 장소뿐이면 장소 뒤에 남은 시간. 끝낸 일정은 글자만. 길게 누르기 메뉴에도 '지도에서 찾기'(수정 다음)
// C 알림: 출발 10분 전 · 출발할 시간 · 일정 알림에 '지도'(알람 목록 map = 장소, 휴대폰 쪽 AlarmNotify · AlarmActivity가 단추를 그림).
//   앱 안 일정 알림 카드에도 '지도'
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const seed = () => [['settings', settings({})],
  ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 0, createdAt: old }],
  ['it_1', { type: 'item', title: '치과 정기 검진', date: '2026-11-02', start: '15:00', end: '16:00', remind: '10', travel: 40, location: '강남역 연세바른치과', createdAt: old, updatedAt: old }],
  ['it_2', { type: 'item', title: '친구 약속', date: '2026-11-02', start: '18:00', end: '19:00', remind: '10', location: '홍대입구역 3번 출구', createdAt: old, updatedAt: old }],
  ['it_3', { type: 'item', title: '은행 들르기', date: '2026-11-02', start: '09:00', end: '09:30', location: '시청역', createdAt: old, updatedAt: old }],
  ['it_4', { type: 'item', title: '아침 산책', date: '2026-11-02', start: '06:30', end: '07:00', location: '한강공원', done: true, createdAt: old, updatedAt: old }],
  ['it_5', { type: 'item', title: '보고서 마감', date: '2026-11-02', start: '10:00', end: '12:30', createdAt: old, updatedAt: old }]];
const geoHook = p => p.evaluate(() => { window.__geo = []; const k = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (/^geo:/.test(this.href)) { window.__geo.push(decodeURIComponent(this.href)); return; } return k.apply(this, arguments); }; });
// 창 닫기: 일정 창은 아래 '취소', 그 밖(메뉴)은 Esc → 그래도 남으면 덮개 위쪽을 누름
const closeAny = async p => {
  const cancel = await p.evaluate(() => { const b = Array.from(document.querySelectorAll('#sheet-root .sheet-f button')).find(x => x.textContent.trim() === '취소'); if (b) { b.click(); return true; } return false; });
  if (!cancel) await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  if (await p.evaluate(() => !!document.querySelector('#sheet-root .sheet'))) { await p.mouse.click(20, 20); await p.waitForTimeout(500); }
};
const rowOf = (p, title) => p.evaluate(t => {
  const r = Array.from(document.querySelectorAll('.row.rowc')).find(x => (x.querySelector('.row-title') || {}).textContent === t);
  if (!r) return null;
  const sub = r.querySelector('.rc-sub'), loc = r.querySelector('.rc-loc'), loc0 = r.querySelector('.rc-loc0');
  const lr = loc && loc.getBoundingClientRect(), sr = sub && sub.getBoundingClientRect();
  return { sub: sub ? sub.textContent : '', cls: sub ? sub.className : '', loc: loc ? loc.textContent : '', q: loc ? loc.dataset.bxmapq : '', aria: loc ? loc.getAttribute('aria-label') : '',
    plain: loc0 ? loc0.textContent : '', underline: loc ? getComputedStyle(loc).textDecorationLine : '', inLine: !!(lr && sr && lr.top >= sr.top - 1 && lr.bottom <= sr.bottom + 1),
    rowH: Math.round(r.getBoundingClientRect().height) };
}, title);

module.exports = async function () {
  const c = checker('시험판 72 · 장소 → 지도(목록 줄 · 알림)');
  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: '2026-11-02T07:40:00+09:00', data: seed() });
    const p = app.page;
    try {
      await p.waitForTimeout(1200);
      await geoHook(p);
      // B: 목록 줄 둘째 줄
      const r1 = await rowOf(p, '치과 정기 검진'), r2 = await rowOf(p, '친구 약속'), r3 = await rowOf(p, '은행 들르기'), r4 = await rowOf(p, '아침 산책'), r5 = await rowOf(p, '보고서 마감');
      c.eq(r1 && r1.sub, '강남역 연세바른치과 · 오후 2:20 출발', theme + ': 장소 + 출발(둘째 줄 하나)');
      c.eq(r1 && [r1.q, r1.aria], ['강남역 연세바른치과', '지도 앱에서 강남역 연세바른치과 찾기'], theme + ': 장소 글자 = 지도 앱으로 찾기');
      c.ok(r1 && /underline/.test(r1.underline) && r1.inLine, theme + ': 장소는 밑줄, 둘째 줄 안');
      c.ok(r1 && /\bgo\b/.test(r1.cls), theme + ': 출발이 있으면 보라 굵게(go)');
      c.eq(r2 && [r2.sub, /rc-lo/.test(r2.cls)], ['홍대입구역 3번 출구', true], theme + ': 상태가 없으면 장소만(rc-lo)');
      c.ok(r3 && /^시청역 · \d/.test(r3.sub) && / 뒤$/.test(r3.sub) && /\bnx\b/.test(r3.cls), theme + ': 다음 일정이 장소뿐이면 장소 뒤에 남은 시간 ' + JSON.stringify(r3 && r3.sub));
      c.eq(r4 && [r4.plain, r4.q], ['한강공원', ''], theme + ': 끝낸 일정은 장소 글자만(누르지 않음)');
      c.eq(r5 && r5.loc, '', theme + ': 장소 없는 일정은 그대로');
      // 장소 글자를 누르면 지도 앱, 일정 창은 열리지 않음
      await p.evaluate(() => { const r = Array.from(document.querySelectorAll('.row.rowc')).find(x => /치과/.test(x.textContent)); r.querySelector('.rc-loc').scrollIntoView({ block: 'center' }); });
      await p.waitForTimeout(300);
      await p.click('.row.rowc .rc-loc[data-bxmapq="강남역 연세바른치과"]');
      await p.waitForTimeout(400);
      const g1 = await p.evaluate(() => ({ geo: window.__geo.slice(), sheet: !!document.querySelector('#sheet-root .sheet') }));
      c.eq(g1, { geo: ['geo:0,0?q=강남역 연세바른치과'], sheet: false }, theme + ': 장소 글자 → 지도 앱(창은 안 열림)');
      // 줄의 나머지(제목)를 누르면 지금처럼 일정 창
      await p.evaluate(() => { const r = Array.from(document.querySelectorAll('.row.rowc')).find(x => /치과/.test(x.textContent)); r.querySelector('.row-title').click(); });
      await p.waitForTimeout(700);
      const ed = await p.evaluate(() => { const s = document.querySelector('#sheet-root .sheet'); return { open: !!s, title: (document.getElementById('f-title') || {}).value || '' }; });
      c.eq(ed, { open: true, title: '치과 정기 검진' }, theme + ': 줄의 나머지는 일정 창');
      await closeAny(p);
      // 길게 누르기 메뉴: 수정 다음 '지도에서 찾기'(장소가 있을 때만)
      const press = async t => {
        const box = await p.evaluate(tt => { const r = Array.from(document.querySelectorAll('.row.rowc')).find(x => (x.querySelector('.row-title') || {}).textContent === tt); const m = r.querySelector('.row-title'); m.scrollIntoView({ block: 'center' }); const b = m.getBoundingClientRect(); return { x: b.left + 8, y: b.top + b.height / 2 }; }, t);
        await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up(); await p.waitForTimeout(500);
        return p.evaluate(() => Array.from(document.querySelectorAll('#sheet-root [data-bx-im]')).map(b => b.dataset.bxIm + ':' + b.querySelector('.ml').textContent));
      };
      const m1 = await press('치과 정기 검진');
      c.eq(m1.slice(0, 2), ['edit:수정', 'map:지도에서 찾기'], theme + ': 길게 누르기 메뉴 수정 다음 지도에서 찾기');
      await p.click('#sheet-root [data-bx-im="map"]'); await p.waitForTimeout(500);
      const g2 = await p.evaluate(() => ({ geo: window.__geo.slice(-1)[0], sheet: !!document.querySelector('#sheet-root .sheet') }));
      c.eq(g2, { geo: 'geo:0,0?q=강남역 연세바른치과', sheet: false }, theme + ': 메뉴 지도에서 찾기 → 지도 앱');
      const m5 = await press('보고서 마감');
      c.ok(m5.length > 0 && !m5.some(x => /^map:/.test(x)), theme + ': 장소 없는 일정 메뉴에는 지도 없음 ' + JSON.stringify(m5));
      await closeAny(p);
      // C: 알람 목록의 map(휴대폰 쪽 '지도' 단추)
      const plan = await p.evaluate(() => window.BX_alarmPlan(3).filter(a => /it_[125]/.test(a.id)).map(a => [a.id.replace(/_\d{10,}$/, ''), a.title, a.map || '']));
      const pick = re => plan.find(a => re.test(a[0]));
      c.eq(pick(/^iv_it_1_pre/) && pick(/^iv_it_1_pre/)[2], '강남역 연세바른치과', theme + ': 출발 10분 전 알림에 지도(map)');
      c.eq(pick(/^iv_it_1_leave/) && pick(/^iv_it_1_leave/).slice(1), ['출발할 시간', '강남역 연세바른치과'], theme + ': 출발할 시간 알람에 지도(map)');
      // 치과(이동 40분)의 10분 전 알림은 이동 중이라 휴대폰에 걸지 않음(tvRemTimes) → 이동 없는 친구 약속으로 본다
      c.ok(!!pick(/^i_it_2/) && pick(/^i_it_2/)[2] === '홍대입구역 3번 출구', theme + ': 일정 알림에도 지도(map) ' + JSON.stringify(pick(/^i_it_2/)));
      c.ok(!plan.some(a => /it_5/.test(a[0]) && a[2]), theme + ': 장소 없는 일정은 map 없음');
      // 360 폭: 긴 장소 + 출발이 한 줄 안(자리가 모자라면 장소가 먼저 …, 출발 시각은 끝까지 보임)
      await p.setViewportSize({ width: 360, height: 800 }); await p.waitForTimeout(500);
      const narrow = await p.evaluate(() => {
        const r = Array.from(document.querySelectorAll('.row.rowc')).find(x => /치과/.test(x.textContent));
        const sub = r.querySelector('.rc-sub'), loc = r.querySelector('.rc-loc'), st = r.querySelector('.rc-sub > .rc-st');
        return { locCut: loc.scrollWidth > loc.clientWidth + 1, stCut: st.scrollWidth > st.clientWidth + 1, st: st.textContent, locW: Math.round(loc.getBoundingClientRect().width),
          lines: Math.round(sub.getBoundingClientRect().height / parseFloat(getComputedStyle(sub).lineHeight)) };
      });
      c.ok(narrow.locCut && !narrow.stCut && narrow.st === ' · 오후 2:20 출발' && narrow.locW >= 30 && narrow.lines === 1, theme + ': 360에서 장소가 먼저 …, 출발 시각은 다 보임, 한 줄 ' + JSON.stringify(narrow));
    } finally { await app.close(); }
  }
  // C: 앱 안 일정 알림 카드(알림 시각 오후 2:50, 장소가 있으면 '지도')
  {
    const app = await openApp({ width: 384, height: 832, now: '2026-11-02T14:51:00+09:00', data: seed() });
    const p = app.page;
    try {
      await p.waitForTimeout(1500);
      await geoHook(p);
      const card = await p.evaluate(() => {
        const a = Array.from(document.querySelectorAll('#alarms .alarm')).find(x => /치과/.test(x.textContent));
        return a ? Array.from(a.querySelectorAll('.alarm-a button')).map(b => b.textContent.trim() + (b.dataset.bxmapq ? '=' + b.dataset.bxmapq : '')) : null;
      });
      c.ok(!!card && card.includes('지도=강남역 연세바른치과'), '앱 안 일정 알림 카드에 지도 ' + JSON.stringify(card));
      if (card) {
        await p.click('#alarms .alarm [data-bxmapq]'); await p.waitForTimeout(400);
        c.eq(await p.evaluate(() => window.__geo.slice(-1)[0]), 'geo:0,0?q=강남역 연세바른치과', '알림 카드 지도 → 지도 앱');
      }
    } finally { await app.close(); }
  }
  return c.done();
};
