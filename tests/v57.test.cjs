// 시험판 57(대표 11/5 선택실 3: 곧 시작 강조 A · 위젯 줄 사이 선 다 · 끝난 일정 다 · 줄을 긋는 때는 메모대로)
// (1) 체크한 일정: 시각 · 이름 가로줄 + 줄 전체 반쯤 흐리게(목록 줄 C, 앱 전체)
// (2) 시간이 지났는데 체크하지 않은 일정(확인 필요): 조금 연하게 + 체크 왼쪽에 확인 필요 아이콘(동그라미 안 느낌표, 앱 아이콘 세트) 깜박임
//     먹었는지 확인하지 않은 약 단계가 있는 루틴도 같은 아이콘. 끝난 수업은 확인 필요가 아니라 흐리게만
// (3) 체크 · 확인 필요 아이콘은 줄 세로 가운데(두 줄이어도)
// (4) 위젯 자료: 수업 체크(그날 다녀왔어요) · 약 확인 필요(miss)
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';

module.exports = async function () {
  const c = checker('시험판 57 · 끝난 일정 가로줄 + 흐리게 · 확인 필요 아이콘 · 체크 가운데');
  const data = [['settings', settings()],
    ['it_d', { type: 'item', title: '원두주문', date: '2026-11-02', done: true, createdAt: old, updatedAt: old }],
    ['it_l', { type: 'item', title: '경영학 수업', date: '2026-11-02', start: '10:00', end: '12:00', createdAt: old, updatedAt: old }],
    ['it_n', { type: 'item', title: '노동부', date: '2026-11-02', start: '14:00', end: '15:00', createdAt: old, updatedAt: old }],
    ['tt_e', { type: 'tt', name: '영어 회화', days: [1], start: '09:00', end: '09:50', place: '204호', color: '#2a78d6', on: true, createdAt: old, updatedAt: old }],
    ['rt_w', { type: 'routine', name: '출근 준비', days: [0, 1, 2, 3, 4, 5, 6], mode: 'arrive', target: '09:00', travel: 45, buffer: 15, times: 6, every: 5, on: true,
      steps: [['기상', 5], ['약 먹기', 5], ['씻고 옷 입기', 30]].map((s, i) => ({ id: 's' + i, name: s[0], min: s[1] })), createdAt: old, updatedAt: old }]];
  const app = await openApp({ width: 384, height: 900, now: '2026-11-02T13:44:00+09:00', data });
  const p = app.page;
  try {
    await p.waitForTimeout(900);
    c.ok(await p.evaluate(() => /circle/.test(String((window.BX_ICONSRC.app || {}).alertc || ''))), '앱 아이콘 세트에 확인 필요(동그라미 안 느낌표) alertc');
    // 지난 일 펼치기(끝난 일정 · 수업은 '지난 일 N개' 안)
    await p.evaluate(() => { const b = document.querySelector('#tcard2 [data-act="bx-past"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
    await p.waitForTimeout(400);
    const info = await p.evaluate(() => {
      const S = window.BX_ICONSRC.app, norm = h => { const d = document.createElement('div'); d.innerHTML = String(h); return d.firstElementChild ? d.firstElementChild.outerHTML : ''; };
      const rowOf = sel => { const e = document.querySelector(sel); return e ? e.closest('.row') : null; };
      const box = e => { const r = e.getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, cy: (r.top + r.bottom) / 2 }; };
      const deco = e => e ? getComputedStyle(e).textDecorationLine : '';
      const d = rowOf('#tcard2 [data-act="edit"][data-id="it_d"]'), l = rowOf('#tcard2 [data-act="edit"][data-id="it_l"]');
      const tt = document.querySelector('#tcard2 .row[data-kind="tt"]'), rt = document.querySelector('#tcard2 .row[data-rid="rt_w"]');
      const w = l && l.querySelector(':scope > .rc-warn'), lc = l && l.querySelector(':scope > .chk');
      return {
        done: d ? { op: getComputedStyle(d).opacity, t: deco(d.querySelector('.row-time b')), n: deco(d.querySelector('.row-title')), warn: !!d.querySelector('.rc-warn') } : null,
        late: l && w && lc ? { svg: norm(w.innerHTML) === norm(S.alertc), left: box(w).r <= box(lc).l, anim: getComputedStyle(w).animationName, main: getComputedStyle(l.querySelector(':scope > .row-main')).opacity,
          sub: (l.querySelector('.rc-sub') || {}).textContent || '', cy: Math.abs(box(lc).cy - box(l).cy), wcy: Math.abs(box(w).cy - box(l).cy), two: !!l.querySelector('.rc-sub'), deco: deco(l.querySelector('.row-title')) } : null,
        tt: tt ? { warn: !!tt.querySelector('.rc-warn'), past: tt.classList.contains('past') } : null,
        rt: rt ? { warn: !!rt.querySelector(':scope > .rc-warn'), sub: (rt.querySelector('.rc-sub') || {}).textContent || '' } : null
      };
    });
    c.ok(info.done && info.done.op === '0.5' && /line-through/.test(info.done.t) && /line-through/.test(info.done.n) && !info.done.warn, '체크한 일정: 시각 · 이름 가로줄 + 줄 반쯤 흐리게 ' + JSON.stringify(info.done));
    c.ok(info.late && info.late.svg && info.late.left && info.late.anim === 'bxWarnBlink' && info.late.main === '0.72' && /지남/.test(info.late.sub) && !/line-through/.test(info.late.deco),
      '시간이 지났는데 체크 안 한 일정: 조금 연하게 + 체크 왼쪽에 확인 필요 아이콘(세트 안의 것, 깜박임), 가로줄 없음 ' + JSON.stringify(info.late));
    c.ok(info.late && info.late.two && info.late.cy <= 1.5 && info.late.wcy <= 1.5, '두 줄인 줄에서도 체크 · 확인 필요 아이콘이 줄 세로 가운데 ' + JSON.stringify(info.late && [info.late.cy, info.late.wcy]));
    // 한 줄짜리 줄(홈 줄 높이 60보다 낮음)도 글 묶음과 체크가 같은 세로 가운데(글이 위에 붙고 체크만 내려가지 않게)
    const mids = await p.evaluate(() => Array.from(document.querySelectorAll('#tcard2 .row.rowc')).filter(r => r.getBoundingClientRect().height > 0).map(r => {
      const ps = Array.from(r.querySelectorAll(':scope > .row-main :is(.rc-ic, .row-time b, .row-time small, .row-title, .rc-sub)')).map(x => x.getBoundingClientRect()).filter(b => b.height > 0);
      const k = r.querySelector(':scope > .chk:not(.chk-sp)'); if (!ps.length || !k) return null;
      const cy = (Math.min(...ps.map(b => b.top)) + Math.max(...ps.map(b => b.bottom))) / 2, q = k.getBoundingClientRect();
      return Math.round(Math.abs((q.top + q.bottom) / 2 - cy) * 10) / 10;
    }).filter(x => x != null));
    c.ok(mids.length >= 4 && mids.every(d => d <= 1.5), '모든 줄(한 줄 · 두 줄)에서 체크가 글 묶음의 세로 가운데 ' + JSON.stringify(mids));
    c.ok(info.tt && !info.tt.warn && info.tt.past, '끝난 수업은 확인 필요 아이콘 없이 흐리게만 ' + JSON.stringify(info.tt));
    c.ok(info.rt && info.rt.warn && /먹었는지 확인/.test(info.rt.sub), '약을 확인하지 않은 루틴도 확인 필요 아이콘 ' + JSON.stringify(info.rt));
    // 움직임 줄이기: 깜박이지 않음
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => { const w = document.querySelector('#tcard2 .rc-warn'); return w ? getComputedStyle(w).animationName : null; }), 'none', '움직임 줄이기면 깜박이지 않음');
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    // 위젯 자료: 수업 체크 · 약 확인 필요
    const wd0 = await p.evaluate(() => { const its = window.BX_widgetData().items; const t = its.find(i => i.k === 'tt' && i.title === '영어 회화' && i.at === Date.parse('2026-11-02T09:00:00+09:00')); const r = its.find(i => i.k === 'routine' && i.title === '출근 준비' && i.at < Date.parse('2026-11-02T12:00:00+09:00') && i.at > Date.parse('2026-11-02T00:00:00+09:00')); return [t ? t.done : null, r ? r.miss : null]; });
    c.eq(wd0, [false, true], '위젯 자료: 수업은 아직 안 다녀옴, 루틴은 약 확인 필요(miss)');
    await p.evaluate(() => { const b = document.querySelector('#tcard2 .row[data-kind="tt"] [data-act="bx-tt-done"]'); if (b) b.click(); }); await p.waitForTimeout(600);
    c.eq(await p.evaluate(() => { const t = window.BX_widgetData().items.find(i => i.k === 'tt' && i.title === '영어 회화' && i.at === Date.parse('2026-11-02T09:00:00+09:00')); return t ? t.done : null; }), true, '수업을 체크하면 위젯 자료에도 그날 다녀옴(done)');
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
