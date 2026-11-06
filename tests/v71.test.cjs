// 시험판 71(대표 11/6 선택실 9 · 1번 'B 아이콘 줄 + 요약' + 메모 "A보기 방식도 선택할수 있으면 … 우측 상단에 설정 버튼 … 간략형, 기존, 칩 … 직접입력 기능도",
// 결정 사안 d20261106-addlook · s27 · s28 · maplook A): 새 일정 창 보기 방식 · 날짜 빠른 칩 · 장소 줄 '지도'
// - 처음은 간략형: 요약 한 줄(날짜 · 시간 · 장소 · 알림 · 출발은 보라 굵게) + 아이콘 단추 다섯(날짜 · 출발 · 알림 · 메모 · 더 보기)
// - 오른쪽 위 톱니 → '보기 방식' 페이지(간략형 · 기존 · 칩), '완료'를 눌러야 바뀌고 ‹ 는 그대로. 이 휴대폰에 기억(settings.bxAddView)
// - 날짜 빠른 칩: 내일 · 3일 후 · 1주 후 · 1개월 후 · 직접 입력(날짜 페이지). 셋 모두, 기존은 날짜 줄 바로 아래
// - 더 보기 · ⋯: 시간(간략형) · 장소 · 캘린더 · 사진·파일 줄. 장소가 있으면 줄 끝 '지도'(휴대폰 지도 앱, geo:)
// - 말하기처럼 한 번에 들어온 문장도 기억해 둔 장소 이동 시간으로 출발(전에는 장소를 채우기 전에 출발을 계산해 빠짐)
const { openApp, settings, checker } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';
const NOW = '2026-11-02T07:40:00+09:00';
const TYPED = '내일 오후 3시 강남역 치과';
const seed = (view) => [['settings', settings({ bxAddView: view })],
  ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 0, createdAt: old }],
  ['it_1', { type: 'item', title: '치과 정기 검진', date: '2026-11-02', start: '15:00', end: '16:00', remind: '10', location: '강남역 연세바른치과', createdAt: old, updatedAt: old }],
  ['travelmem', { type: 'travelmem', map: { '강남역': 40 }, updatedAt: old }]];
const form = p => p.evaluate(() => window.BX_T.fn.form());
const setDoc = p => p.evaluate(() => (window.BX_T.docs().find(([id]) => id === 'settings') || [0, {}])[1]);

module.exports = async function () {
  const c = checker('시험판 71 · 새 일정 창 보기 방식');
  for (const theme of ['light', 'dark']) {
    const app = await openApp({ width: 384, height: 832, colorScheme: theme, now: NOW, data: seed(undefined) });
    const p = app.page;
    try {
      await p.waitForTimeout(1200);
      // geo: 링크를 누르면 기록만(휴대폰 지도 앱 대신)
      await p.evaluate(() => { window.__geo = []; const k = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (/^geo:/.test(this.href)) { window.__geo.push(this.href); return; } return k.apply(this, arguments); }; });
      await p.click('.bx-fab'); await p.waitForTimeout(700);
      const st0 = await p.evaluate(() => {
        const el = document.getElementById('f-chips');
        return { brief: el.classList.contains('bx-ed-brief'), sum: (el.querySelector('.bx-ed-sum') || {}).textContent,
          ibs: Array.from(el.querySelectorAll('.bx-ib')).map(b => b.querySelector('span').textContent),
          tile: Array.from(el.querySelectorAll('.bx-ib > i')).map(i => { const r = i.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }),
          qd: Array.from(el.querySelectorAll('.bx-qd .chip')).map(b => b.textContent + (b.dataset.bxqd ? '=' + b.dataset.bxqd : '')),
          gear: !!document.querySelector('#sheet-root .sheet-h [data-fpanel="view"]'), gearShown: (() => { const g = document.querySelector('#sheet-root .sheet-h [data-fpanel="view"]'); return !!g && g.getBoundingClientRect().width >= 40; })() };
      });
      c.ok(st0.brief, theme + ': 처음은 간략형');
      c.eq(st0.sum, '11월 2일 (월) · 종일 · 알림 없음', theme + ': 적기 전 요약 한 줄');
      c.eq(st0.ibs, ['날짜', '출발', '알림', '메모', '더 보기'], theme + ': 아이콘 단추 다섯');
      c.eq(st0.tile, ['48x48', '48x48', '48x48', '48x48', '48x48'], theme + ': 아이콘 칸 48');
      c.eq(st0.qd, ['내일=2026-11-03', '3일 후=2026-11-05', '1주 후=2026-11-09', '1개월 후=2026-12-02', '직접 입력'], theme + ': 날짜 빠른 칩 + 끝자리 직접 입력');
      c.ok(st0.gear && st0.gearShown, theme + ': 오른쪽 위 톱니(보기 방식)');
      // 한 번에 들어온 문장(말하기와 같음): 장소 · 기억해 둔 이동 40분 → 오후 2:20 출발
      await p.fill('#f-title', TYPED); await p.waitForTimeout(800);
      const f1 = await form(p);
      c.eq([f1.date, f1.start, f1.end, f1.location, f1.travel], ['2026-11-03', '15:00', '16:00', '강남역', 40], theme + ': 한 번에 적은 문장도 장소 · 이동 시간');
      const st1 = await p.evaluate(() => {
        const el = document.getElementById('f-chips');
        const b = el.querySelector('.bx-ed-sum b');
        const hint = document.querySelector('#f-hint > .hint');
        return { sum: el.querySelector('.bx-ed-sum').textContent, bold: b && b.textContent, boldColor: b && getComputedStyle(b).color, accent: getComputedStyle(document.documentElement).getPropertyValue('--accent-text').trim(),
          on: Array.from(el.querySelectorAll('.bx-ib')).map(x => x.classList.contains('on')),
          pressed: Array.from(el.querySelectorAll('.bx-qd .chip[aria-pressed="true"]')).map(x => x.textContent),
          hintHidden: !hint || getComputedStyle(hint).display === 'none' };
      });
      c.eq(st1.sum, '11월 3일 (화) · 오후 3:00–4:00 · 강남역 · 알림 10분 전 · 오후 2:20 출발', theme + ': 적은 뒤 요약');
      c.eq(st1.bold, '오후 2:20 출발', theme + ': 출발은 굵게');
      c.eq(st1.on, [true, true, true, false, true], theme + ': 정한 것은 연보라(날짜 · 출발 · 알림 · 더 보기 안 장소)');
      c.eq(st1.pressed, ['내일'], theme + ': 적은 날이 빠른 칩이면 고른 모양');
      c.ok(st1.hintHidden, theme + ': 간략형에서는 해석 줄을 숨김(요약 한 줄에 보임)');
      // 빠른 칩
      await p.click('#f-chips .bx-qd [data-bxqd="2026-11-05"]'); await p.waitForTimeout(250);
      c.eq([(await form(p)).date, await p.evaluate(() => document.querySelector('#f-chips .bx-ed-sum').textContent.split(' · ')[0])], ['2026-11-05', '11월 5일 (목)'], theme + ': 3일 후 → 그날');
      await p.click('#f-chips .bx-qd-own'); await p.waitForTimeout(400);
      c.eq(await p.evaluate(() => { const e = document.getElementById('bx-ep'); return e && [e.dataset.k, document.getElementById('bx-ep-t').textContent]; }), ['date', '날짜'], theme + ': 직접 입력 → 날짜 페이지');
      await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
      // 더 보기: 시간 · 장소(지도) · 캘린더 · 사진·파일
      const mo = await p.evaluate(() => { const b = document.querySelector('#f-chips .bx-ib[data-bxmore]'); const box = document.querySelector('#f-chips .bx-more'); return [b.getAttribute('aria-expanded'), box.hidden]; });
      c.eq(mo, ['false', true], theme + ': 더 보기는 처음에 접힘');
      await p.click('#f-chips .bx-ib[data-bxmore]'); await p.waitForTimeout(250);
      const rows = await p.evaluate(() => Array.from(document.querySelectorAll('#f-chips .bx-more > .bx-er')).map(r => (r.querySelector('.bx-er-t') || {}).textContent + (r.querySelector('.bx-er-map') ? ' +지도' : '')));
      c.eq(rows.slice(0, 3), ['오후 3:00 ~ 오후 4:00', '강남역 +지도', '캘린더'], theme + ': 더 보기 줄(시간 · 장소 + 지도 · 캘린더)');
      const lay = await p.evaluate(() => {
        const r = document.querySelector('#f-chips .bx-er-loc'), t = r.querySelector('.bx-er-t').getBoundingClientRect(), t0 = document.querySelector('#f-chips .bx-more > .bx-er:first-child .bx-er-t').getBoundingClientRect(), m = r.querySelector('.bx-er-map').getBoundingClientRect();
        return { col: Math.round(t.left - t0.left), mapH: Math.round(m.height), mapIn: m.right <= r.getBoundingClientRect().right + 0.5, gap: Math.round(m.left - t.right) >= 0 };
      });
      c.eq(lay, { col: 0, mapH: 36, mapIn: true, gap: true }, theme + ': 장소 글은 다른 줄과 같은 칸, 지도 단추 36 · 줄 안');
      await p.click('#f-chips .bx-er-map'); await p.waitForTimeout(200);
      c.eq(await p.evaluate(() => window.__geo), ['geo:0,0?q=' + encodeURIComponent('강남역')], theme + ': 지도 → 휴대폰 지도 앱(geo:)');
      c.ok(await p.evaluate(() => !document.getElementById('bx-ep')), theme + ': 지도를 눌러도 장소 페이지는 열리지 않음');
      await p.click('#f-chips .bx-er-loc .bx-er-in'); await p.waitForTimeout(400);
      c.eq(await p.evaluate(() => { const e = document.getElementById('bx-ep'); return e && document.getElementById('bx-ep-t').textContent; }), '장소', theme + ': 장소 줄의 나머지 → 장소 페이지');
      await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
      // 보기 방식 페이지: ‹ 는 그대로, 완료로 바뀜
      await p.click('#sheet-root .sheet-h [data-fpanel="view"]'); await p.waitForTimeout(400);
      const vp = await p.evaluate(() => ({ t: document.getElementById('bx-ep-t').textContent, rows: Array.from(document.querySelectorAll('#bx-ep [data-bxview]')).map(b => b.querySelector('b').textContent + (b.getAttribute('aria-checked') === 'true' ? '✓' : '')) }));
      c.eq(vp, { t: '보기 방식', rows: ['간략형✓', '기존', '칩'] }, theme + ': 보기 방식 페이지');
      await p.click('#bx-ep [data-bxview="chip"]'); await p.waitForTimeout(150);
      c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#bx-ep [data-bxview]')).map(b => b.getAttribute('aria-checked'))), ['false', 'false', 'true'], theme + ': 고르면 ✓가 옮겨 감');
      await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
      c.ok(await p.evaluate(() => document.getElementById('f-chips').classList.contains('bx-ed-brief')) && (await setDoc(p)).bxAddView === undefined, theme + ': ‹ 는 바꾸지 않음');
      await p.click('#sheet-root .sheet-h [data-fpanel="view"]'); await p.waitForTimeout(400);
      await p.click('#bx-ep [data-bxview="chip"]'); await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(500);
      const ch = await p.evaluate(() => { const el = document.getElementById('f-chips'); return { chip: el.classList.contains('bx-ed-chip'), title: document.getElementById('f-title').value,
        vcs: Array.from(el.querySelectorAll('.bx-vcs > .bx-vc')).map(b => (b.textContent || '').trim() || 'more'), on: Array.from(el.querySelectorAll('.bx-vcs > .bx-vc')).map(b => b.classList.contains('on')) }; });
      c.eq((await setDoc(p)).bxAddView, 'chip', theme + ': 완료 → 이 휴대폰에 기억');
      c.ok(ch.chip && ch.title === TYPED, theme + ': 칩 보기 · 적은 글 그대로');
      c.eq(ch.vcs, ['11월 5일 (목)', '오후 3:00–4:00', '오후 2:20 출발', '10분 전', '메모', 'more'], theme + ': 값 칩(날짜 · 시간 · 출발 · 알림 · 메모 · ⋯)');
      c.eq(ch.on, [true, true, true, true, false, true], theme + ': 정한 값 칩은 고른 모양');
      await p.click('#f-chips .bx-vc[data-fpanel="time"]'); await p.waitForTimeout(400);
      c.eq(await p.evaluate(() => document.getElementById('bx-ep') && document.getElementById('bx-ep-t').textContent), '시간', theme + ': 시간 칩 → 시간 페이지');
      await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(300);
      await p.click('#f-chips .bx-vc-more'); await p.waitForTimeout(250);
      c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#f-chips .bx-more > .bx-er')).map(r => (r.querySelector('.bx-er-t') || {}).textContent)).then(x => x.slice(0, 2)), ['강남역', '캘린더'], theme + ': ⋯ → 장소 · 캘린더(시간은 칩에)');
      // 기존: 날짜 줄 바로 아래 빠른 칩, 장소 줄 끝 지도
      await p.click('#sheet-root .sheet-h [data-fpanel="view"]'); await p.waitForTimeout(400);
      await p.click('#bx-ep [data-bxview="list"]'); await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(500);
      const ls = await p.evaluate(() => { const el = document.getElementById('f-chips'); const k = Array.from(el.children).map(x => x.matches('.bx-er-q') ? 'q' : x.matches('.bx-er-loc') ? 'loc' : x.dataset.fpanel || (x.matches('.bx-er-rem') ? 'rem' : x.matches('.bx-er-more') ? 'more' : x.className)); return { list: el.classList.contains('bx-ed-list'), k: k.slice(0, 6) }; });
      c.eq(ls, { list: true, k: ['date', 'q', 'time', 'loc', 'rem', 'more'] }, theme + ': 기존 — 날짜 줄 아래 빠른 칩 · 장소 줄 지도');
      const qcol = await p.evaluate(() => { const q = document.querySelector('#f-chips .bx-er-q .chip').getBoundingClientRect(), t = document.querySelector('#f-chips > .bx-er[data-fpanel="date"] .bx-er-t').getBoundingClientRect(); return Math.round(q.left - t.left); });
      c.eq(qcol, 0, theme + ': 빠른 칩은 줄 글과 같은 칸에서 시작');
      // 간략형으로 돌려 저장
      await p.click('#sheet-root .sheet-h [data-fpanel="view"]'); await p.waitForTimeout(400);
      await p.click('#bx-ep [data-bxview="brief"]'); await p.click('#bx-ep [data-bxep="done"]'); await p.waitForTimeout(500);
      await p.click('#sheet-root [data-act="save"]'); await p.waitForTimeout(600);
      const saved = await p.evaluate(() => window.BX_T.docs().map(([, d]) => d).find(d => d.type === 'item' && d.title === '강남역 치과'));
      c.ok(saved && saved.date === '2026-11-05' && saved.start === '15:00' && saved.location === '강남역' && saved.travel === 40, theme + ': 저장(날짜 · 시각 · 장소 · 이동) ' + JSON.stringify(saved && [saved.date, saved.start, saved.location, saved.travel]));
      // 일정 수정 창: 같은 방식 + 맨 아래 일정 삭제
      await p.click('.row-main[data-id="it_1"]'); await p.waitForTimeout(700);
      const ed = await p.evaluate(() => { const el = document.getElementById('f-chips'); return { brief: el.classList.contains('bx-ed-brief'), del: !!el.querySelector(':scope > .bx-er-del'), gear: !!document.querySelector('#sheet-root .sheet-h [data-fpanel="view"]'), sum: el.querySelector('.bx-ed-sum').textContent }; });
      c.ok(ed.brief && ed.del && ed.gear, theme + ': 일정 수정 창도 간략형 · 일정 삭제 · 톱니');
      c.eq(ed.sum, '11월 2일 (월) · 오후 3:00–4:00 · 강남역 연세바른치과 · 알림 10분 전', theme + ': 수정 창 요약');
      c.eq(app.errors, [], theme + ': 화면 오류');
    } catch (e) { c.ok(false, theme + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  // 폭 360: 아이콘 다섯이 한 줄 · 칩이 넘치지 않음
  for (const view of [undefined, 'chip']) {
    const app = await openApp({ width: 360, height: 780, colorScheme: 'light', now: NOW, data: seed(view) });
    const p = app.page;
    try {
      await p.waitForTimeout(1200);
      await p.click('.bx-fab'); await p.waitForTimeout(700);
      await p.fill('#f-title', TYPED); await p.waitForTimeout(800);
      const r = await p.evaluate(() => {
        const el = document.getElementById('f-chips'), W = el.getBoundingClientRect().right + 0.5;
        const over = Array.from(el.querySelectorAll('.bx-ib, .chip')).filter(b => b.getBoundingClientRect().right > W).map(b => b.textContent);
        const tops = new Set(Array.from(el.querySelectorAll('.bx-ib')).map(b => Math.round(b.getBoundingClientRect().top)));
        return { over, oneRow: tops.size <= 1, scroll: document.documentElement.scrollWidth <= innerWidth };
      });
      c.eq(r, { over: [], oneRow: true, scroll: true }, '폭 360 ' + (view || 'brief') + ': 넘치지 않음');
      c.eq(app.errors, [], '폭 360 ' + (view || 'brief') + ': 화면 오류');
    } catch (e) { c.ok(false, '폭 360 ' + (view || 'brief') + ': ' + (e && e.stack || e)); }
    finally { await app.close(); }
  }
  return c.done();
};
