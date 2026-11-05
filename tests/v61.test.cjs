// 시험판 61(대표 11/5 22:48 · 22:50)
// (1) 시간이 없는 하루 일정은 '종일' — '오늘 할 일' 맨 위 종일 줄(시각 칸 '종일'), '시간 미지정 일정' 상자는 없음
// (2) 확인 알림: 그날 종일 일정이 있으면 '오늘 시간이 정해지지 않은 일정이 N개 있어요. 확인하세요.' — 종일 일정 알림 시각(처음 오전 9시)에,
//     그 시각이 지난 뒤 시간 없이 넣으면 넣은 지 30분 뒤 한 번 더. 누르면 홈(open: 'home'). 여러 날 · 다 한 것 · 홈에서 뺀 캘린더는 세지 않음
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const at = s => Date.parse(s + '+09:00');

module.exports = async function () {
  const c = checker('시험판 61 · 시간 없는 일정은 종일로 맨 위 · 확인 알림');
  const base = (extra = {}) => [['settings', settings(Object.assign({ bxDock: ['routines', 'month', 'tt', 'memo'], bxDockMig: 1, bxDockMemo: 1 }, extra))],
    ['c_h', { type: 'category', name: '숨김', color: '#888888', order: 1, home: false, createdAt: old }],
    ['it_n', { type: 'item', title: '노동부', date: '2026-11-05', start: '14:00', end: '15:00', createdAt: old, updatedAt: old }],
    ['it_d', { type: 'item', title: '장보기', date: '2026-11-05', createdAt: old, updatedAt: old }],
    ['it_x', { type: 'item', title: '원두 주문', date: '2026-11-05', done: true, createdAt: old, updatedAt: old }],
    ['it_s', { type: 'item', title: '부산 출장', date: '2026-11-04', endDate: '2026-11-06', createdAt: old, updatedAt: old }],
    ['it_h', { type: 'item', title: '숨긴 캘린더 일', date: '2026-11-05', categoryId: 'c_h', createdAt: old, updatedAt: old }],
    ['it_m', { type: 'item', title: '은행 서류', date: '2026-11-06', createdAt: old, updatedAt: old }]];

  // (1) 홈: 종일 줄이 맨 위
  for (const clock of ['', '24']) {
    const app = await openApp({ width: clock ? 360 : 384, height: 900, now: '2026-11-05T12:20:00+09:00', data: base({ clock }) });
    const p = app.page;
    try {
      await p.waitForTimeout(1100);
      const h = await p.evaluate(() => {
        const tl = document.querySelector('#tcard2 .bx-tl'), kids = tl ? Array.from(tl.children) : [];
        const idx = id => kids.findIndex(e => e.querySelector && e.querySelector('[data-id="' + id + '"]'));
        const tm = id => { const k = kids[idx(id)]; const t = k && k.querySelector('.row-time b'); return t ? [t.textContent.trim(), Math.round(t.getBoundingClientRect().height)] : null; };
        return { box: !!document.getElementById('tcard-ut'), d: idx('it_d'), s: idx('it_s'), x: idx('it_x'), n: idx('it_n'), now: kids.findIndex(e => e.classList.contains('now-line')),
          tm: tm('it_d'), word: /시간 미지정/.test(document.querySelector('.screen.today').textContent) };
      });
      const tag = clock ? '24시간 · 폭 360' : '오전 · 오후 · 폭 384';
      c.ok(!h.box && !h.word, tag + ": '시간 미지정' 상자 · 글이 없음 " + JSON.stringify(h));
      c.ok(h.d === 0 && h.d < h.s && h.s < h.x && h.x < h.now && h.now < h.n, tag + ': 맨 위 종일 줄 — 안 한 종일(장보기) → 여러 날(부산 출장) → 한 것(원두 주문) → 지금 → 시각 있는 일정 ' + JSON.stringify(h));
      c.ok(h.tm && h.tm[0] === '종일' && h.tm[1] < 30, tag + ": 시각 칸 '종일' 한 줄 " + JSON.stringify(h.tm));
      c.eq(app.errors, [], tag + ': 화면 오류');
    } finally { await app.close(); }
  }

  // (2) 확인 알림
  const planOf = async (now, data) => {
    const app = await openApp({ width: 384, height: 832, now, data });
    try { await app.page.waitForTimeout(900); return await app.page.evaluate(() => (window.BX_alarmPlan(3) || []).filter(a => /^utc_/.test(a.id))); }
    finally { await app.close(); }
  };
  {
    const ps = await planOf('2026-11-05T08:00:00+09:00', base());
    const a = ps.find(x => x.id === 'utc_2026-11-05'), b = ps.find(x => x.id === 'utc_2026-11-06');
    c.ok(a && a.at === at('2026-11-05T09:00:00') && a.sub === '오늘 시간이 정해지지 않은 일정이 1개 있어요. 확인하세요.' && /장보기/.test(a.body) && !/원두|부산|숨긴/.test(a.body),
      "오늘 오전 9시: '오늘 시간이 정해지지 않은 일정이 1개 있어요. 확인하세요.'(다 한 것 · 여러 날 · 홈에서 뺀 캘린더는 빼고) " + JSON.stringify(a));
    c.ok(a && a.open === 'home' && a.lv === 'notice' && a.pt === '확인할 일정' && !/장보기/.test(a.ps), '누르면 홈 · 알림(한 번 울림) · 잠금 화면에는 개수만 ' + JSON.stringify(a && [a.open, a.lv, a.pt, a.ps]));
    c.ok(b && b.at === at('2026-11-06T09:00:00') && /은행 서류/.test(b.body), '다음 날도 그날 오전 9시 ' + JSON.stringify(b && [b.at, b.body]));
  }
  {
    // 종일 일정 알림 시각을 오전 8:30으로 정했으면 그 시각
    const ps = await planOf('2026-11-05T08:00:00+09:00', base({ defaultRemindDay: 'd0@08:30' }));
    const a = ps.find(x => x.id === 'utc_2026-11-05');
    c.ok(a && a.at === at('2026-11-05T08:30:00'), "'종일 일정 알림 시각' 오전 8:30이면 그 시각 " + JSON.stringify(a && a.at));
  }
  {
    // 확인 시각(9시)이 지난 뒤 시간 없이 넣은 일정: 넣은 지 30분 뒤 한 번 더
    const d = base(); d.push(['it_q', { type: 'item', title: '약국 들르기', date: '2026-11-05', createdAt: '2026-11-05T09:40:00.000+09:00', updatedAt: '2026-11-05T09:40:00.000+09:00' }]);
    const ps = await planOf('2026-11-05T10:00:00+09:00', d);
    const a = ps.find(x => /^utc_2026-11-05_/.test(x.id));
    c.ok(a && a.at === at('2026-11-05T10:10:00') && a.sub === '오늘 시간이 정해지지 않은 일정이 2개 있어요. 확인하세요.', '9시 뒤에 시간 없이 넣으면 30분 뒤(오전 10:10) 한 번 더 ' + JSON.stringify(a && [a.at, a.sub]));
    c.ok(!ps.find(x => x.id === 'utc_2026-11-05'), '지난 9시 알림은 다시 걸지 않음');
  }
  {
    // 9시 전에 넣은 것뿐이면 9시가 지난 뒤에는 더 보내지 않음 · 종일 일정이 없으면 없음
    const ps = await planOf('2026-11-05T10:00:00+09:00', base());
    c.ok(!ps.find(x => /^utc_2026-11-05/.test(x.id)), '9시 전에 넣은 것뿐이면 9시 뒤에는 다시 보내지 않음 ' + JSON.stringify(ps.map(x => x.id)));
    const none = base().filter(([k]) => !['it_d', 'it_h', 'it_m'].includes(k));
    const ps2 = await planOf('2026-11-05T08:00:00+09:00', none);
    c.eq(ps2.map(x => x.id), [], '종일 일정이 없으면 확인 알림 없음');
  }
  return c.done();
};
