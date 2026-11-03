// 시험판 33: 명상 배경 소리(대표 요청·결정 11/3, 결정 기록 D-12). 명상 › 소리와 호흡의 '배경 소리',
// 누르면 잠깐 듣기, '소리만 틀기'(공부할 때, 화면을 꺼도), 명상과 함께 켜지고 끝 종과 함께 꺼짐
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
const data = () => [['settings', settings({ bxStart: { at: old, mods: { report: false, routines: true, tt: true, med: true } } })]];
const last = p => p.evaluate(() => window.__bg[window.__bg.length - 1] || null);
const picks = p => p.evaluate(() => Array.from(document.querySelectorAll('.bx-bg-picks .pick')).map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')));
const nowLine = p => p.evaluate(() => { const e = document.querySelector('.bx-bg-now'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; });
const onlyBtn = p => p.evaluate(() => { const b = document.querySelector('.bx-bg-only .btn'); return b ? b.textContent.trim() : null; });
const toastHas = (p, w) => p.waitForFunction(w => Array.from(document.querySelectorAll('.toast')).some(t => t.textContent.indexOf(w) >= 0), w, { timeout: 4000 }).then(() => true).catch(() => false);

module.exports = async function () {
  const c = checker('시험판 33 · 명상 배경 소리');

  let app = await openApp({ data: data() });
  try {
    const p = app.page;
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(600);
    await p.click('.bx-med-more summary'); await p.waitForTimeout(300);
    // 1) 칸: 없음 · 파도 · 숲속 새소리 · 바람 · 갈대 · 백색소음, 처음엔 '없음'. 자리는 중간 종 다음, 호흡 안내 앞
    c.eq(await picks(p), ['없음*', '파도', '숲속 새소리', '바람', '갈대', '백색소음'], '배경 소리 칸과 처음 값');
    const order = await p.evaluate(() => {
      const all = Array.from(document.querySelectorAll('.bx-med-more *'));
      const at = el => all.indexOf(el);
      return [at(document.querySelector('[data-med-bellsw]')), at(document.querySelector('.bx-bg-picks')), at(document.querySelector('[data-med-breath]'))];
    });
    c.ok(order[0] >= 0 && order[0] < order[1] && order[1] < order[2], '배경 소리는 중간 종 다음, 호흡 안내 앞 ' + JSON.stringify(order));
    c.eq(await onlyBtn(p), null, "'없음'일 때는 '소리만 틀기'가 없음");
    c.ok(await p.evaluate(() => /배경 소리 없음/.test(document.querySelector('.bx-mm-t small').textContent)), "접힌 줄에 '배경 소리 없음'");
    c.ok(await p.evaluate(() => /CC0/.test((document.querySelector('.bx-bg-credit') || {}).textContent || '')), '녹음 출처 한 줄(CC0)');

    // 2) 누르면 잠깐 듣기, 고른 값은 남고, '소리만 틀기'가 나온다
    await p.click('[data-bxbg="waves"]'); await p.waitForTimeout(300);
    c.eq(await last(p), ['preview', { sound: 'waves' }], '파도를 누르면 미리 듣기');
    c.eq(await picks(p), ['없음', '파도*', '숲속 새소리', '바람', '갈대', '백색소음'], '파도가 골라짐');
    c.eq(await p.evaluate(() => JSON.parse(localStorage.getItem('bx:med') || '{}').bg), 'waves', '고른 소리는 이 휴대폰에 남음');
    c.eq(await onlyBtn(p), '소리만 틀기', "'소리만 틀기' 단추");
    c.ok(await p.evaluate(() => /배경 소리 파도/.test(document.querySelector('.bx-mm-t small').textContent)), "접힌 줄에 '배경 소리 파도'");

    // 3) 소리만 틀기: 끌 때까지(until 없음), 맨 위에 '파도 나오는 중 · 끄기', 단추는 '소리 끄기'
    await p.click('[data-act="bx-med-bgonly"]'); await p.waitForTimeout(300);
    c.eq(await last(p), ['play', { sound: 'waves', mode: 'only' }], '소리만 틀기 → 끌 때까지 틀기');
    c.ok(await toastHas(p, '파도를 틀었어요'), "알림 '파도를 틀었어요'");
    c.eq(await nowLine(p), '파도 나오는 중화면을 꺼도 계속 나와요끄기', "맨 위 '파도 나오는 중' 줄");
    const top = await p.evaluate(() => { const a = document.querySelector('.bx-bg-now'), s = document.querySelector('.bx-med-set'); return a && s && a.parentElement === s && s.firstElementChild === a; });
    c.ok(top, '나오는 중 줄은 명상 칸 맨 위');
    c.eq(await onlyBtn(p), '소리 끄기', "틀어 둔 동안은 '소리 끄기'");

    // 4) 틀어 둔 채 다른 소리를 누르면 그 자리에서 바뀐다(미리 듣기가 아니라)
    await p.click('[data-bxbg="wind"]'); await p.waitForTimeout(300);
    c.eq(await last(p), ['play', { sound: 'wind', mode: 'only' }], '틀어 둔 중 바람을 누르면 바로 바뀜');
    c.ok(/^바람 나오는 중/.test(await nowLine(p) || ''), '맨 위 줄도 바람');

    // 5) 다른 탭에 갔다 와도 맨 위 줄이 남아 있다(잊고 켜 두지 않게)
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(400);
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(400);
    c.ok(/^바람 나오는 중/.test(await nowLine(p) || ''), '탭을 오가도 맨 위 줄이 남음');

    // 6) 맨 위 줄의 끄기
    await p.click('.bx-bg-now [data-act="bx-med-bgstop"]'); await p.waitForTimeout(300);
    c.eq(await last(p), ['stop'], '끄기');
    c.eq(await nowLine(p), null, '끄면 맨 위 줄이 사라짐');
    c.ok(await toastHas(p, '배경 소리를 껐어요'), "알림 '배경 소리를 껐어요'");

    // 7) 휴대폰이 알려 줄 때(알림창의 '끄기', 이어폰 빠짐 등): 화면이 따라 바뀐다
    await p.evaluate(() => window.__bgL({ playing: true, sound: 'birds', mode: 'only', until: 0 })); await p.waitForTimeout(300);
    c.ok(/^숲속 새소리 나오는 중/.test(await nowLine(p) || ''), "휴대폰이 '나오는 중'을 알리면 맨 위 줄");
    await p.evaluate(() => window.__bgL({ playing: false, sound: '', mode: '', until: 0 })); await p.waitForTimeout(300);
    c.eq(await nowLine(p), null, '알림창에서 끄면 맨 위 줄도 사라짐');

    // 8) 명상: 첫 종 때 켜지고(startAt) 끝 종 때 꺼짐(until). 진행 중 안내에 한 줄
    await p.evaluate(() => { const l = window.Capacitor.Plugins.BxAlarm; l.local = async () => ({}); l.cancelLocal = async () => ({}); });
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(400);
    const pl = await last(p), run = await p.evaluate(() => JSON.parse(localStorage.getItem('bx:med') || '{}').run);
    c.ok(pl && pl[0] === 'play' && pl[1].sound === 'wind' && pl[1].mode === 'med' && run && pl[1].startAt === run.startAt && pl[1].until === run.endAt && run.endAt - run.startAt === 10 * 60000,
      '명상 시작: 바람이 첫 종부터 끝 종까지 ' + JSON.stringify([pl, run && [run.startAt, run.endAt]]));
    c.ok(await p.evaluate(() => /바람도 그때 함께 꺼져요\./.test((document.querySelector('.bx-med-run .bx-med-note') || {}).textContent || '')), '진행 중 안내: 바람도 함께 꺼짐');
    await p.click('[data-act="bx-med-stop"]'); await p.waitForTimeout(300);
    c.ok(JSON.stringify(await p.evaluate(() => window.__bg.slice(-1)[0])) === '["stop"]', '끝내기를 누르면 배경 소리도 꺼짐');

    // 9) '없음'을 고르면 미리 듣기도 멈추고 '소리만 틀기'가 사라진다. 없음으로 명상하면 소리를 틀지 않는다
    await p.click('.bx-med-more summary').catch(() => {}); await p.waitForTimeout(200);
    if (!(await p.evaluate(() => document.querySelector('.bx-med-more').open))) { await p.click('.bx-med-more summary'); await p.waitForTimeout(200); }
    await p.click('[data-bxbg="none"]'); await p.waitForTimeout(300);
    c.eq(await last(p), ['preview', { sound: '' }], "'없음'은 미리 듣기 멈춤");
    c.eq(await onlyBtn(p), null, "'없음'이면 '소리만 틀기' 없음");
    const n0 = await p.evaluate(() => window.__bg.length);
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(n => window.__bg.slice(n).filter(x => x[0] === 'play').length, n0), 0, '배경 소리 없음으로 명상하면 틀지 않음');
    c.ok(await p.evaluate(() => !/함께 꺼져요/.test((document.querySelector('.bx-med-run .bx-med-note') || {}).textContent || '')), '없음이면 진행 중 안내에 배경 소리 줄 없음');
    c.eq(app.errors, [], '화면 오류(배경 소리)');
  } finally { await app.close(); }

  // 10) 배경 소리를 낼 수 없는 곳(플러그인 없음)에서는 칸을 보이지 않는다
  app = await openApp({ data: data(), sound: false });
  try {
    const p = app.page;
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(600);
    c.ok(await p.evaluate(() => !document.querySelector('.bx-bg-picks') && !/배경 소리/.test(document.querySelector('.bx-mm-t small').textContent)), '플러그인이 없으면 배경 소리 칸 없음');
    c.eq(app.errors, [], '화면 오류(플러그인 없음)');
  } finally { await app.close(); }
  return c.done();
};
