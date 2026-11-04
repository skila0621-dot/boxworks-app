// 시험판 55(대표 11/5 01:30 · 03:41 · 03:48, 결정 기록 D-28): 공통 부품 · 대표가 고른 값 · 단추 견본 · 홈 상자 제목
// (1) 단추 · 칩 · 나눔 단추 · 글자 단추 · 아이콘 단추 · 체크는 app.css 맨 앞 '공통 부품' 한 곳. 값은 선택실에서 고른 것
// (2) 웹 원본의 같은 규칙은 빌드 때 지움(scripts/ui-owned.mjs) · 화면 규칙이 모양을 다시 정하면 정렬 점검(comp)이 걸림
// (3) 아이콘이 앞에 붙은 단추는 아이콘 쪽 안쪽 여백을 줄임 · 처리 중 · 못 누름에서도 크기 그대로
// (4) 출발 아이콘은 '집에서 나가기' · 홈 '오늘 할 일' · '오늘의 메모' 제목은 상자 밖 위 · 날짜 이동 줄 글자 20 · '완료' 오른쪽 끝 32
// (5) CI에서 걸린 것(빌드 61): 목록 시각 칸이 가장 넓은 시각('오후 12:59', 굵기 800)보다 좁았음 → 칸 폭 공통 값 --row-tw 80.
//     같은 종류(글이 칸보다 넓음) 앱 전체: 확인 필요 '오늘 오전 11:00로' · 사진·파일 3칸 · 이동 시간 4칸 '1시간 30분' · 아래 메뉴 칩 '✓ 캘린더'.
//     정렬 점검에 fit(가장 넓은 시각) · '안쪽 여백 침범'(flex 상자 안 글)을 더함 — 일부러 만든 넘침을 잡는지 여기서 확인
const fs = require('fs');
const path = require('path');
const { openApp, settings, checker, ROOT } = require('./harness.cjs');
const old = '2026-10-29T00:00:00.000Z';

module.exports = async function () {
  const c = checker('시험판 55 · 공통 부품 · 고른 값 · 단추 견본 · 홈 상자 제목');
  const css = fs.readFileSync(path.join(ROOT, 'web-src', 'app.css'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');
  // (2) 원본 규칙: 공통 부품이 가져간 것은 www에 없음
  const base = html.replace(/<style id="bx-app-css">[\s\S]*?<\/style>/, '');
  c.ok(!/(^|[}\s])\.btn\{height:50px/.test(base) && !/(^|[}\s])\.seg button\{height:40px/.test(base) && !/(^|[}\s])\.icon-btn\{width:40px/.test(base), '웹 원본의 단추 · 나눔 단추 · 아이콘 단추 규칙은 빌드에서 지움');
  c.ok(/svg\.i\{[^}]*stroke-width:var\(--ic-sw,1\.8\)/.test(base), '아이콘 선 굵기는 공통 값(--ic-sw) 하나');
  const sec = css.slice(css.indexOf('/* ━━ 공통 부품'), css.indexOf('/* 단추 견본(시험용 화면'));
  c.ok(sec.length > 2000 && !/html\.bx-app :is\(/.test(sec), '공통 부품은 :where로(화면의 숨김 규칙이 늘 이김)');
  c.ok(!/::after\{content:"";position:absolute;left:(0|-4px|50%)/.test(sec), '누르는 범위를 몰래 넓히는 칸(::after) 없음(체크 칸만 예외)');

  const app = await openApp({ width: 384, height: 832, data: [['settings', settings()],
    ['it_2', { type: 'item', title: '노동부 방문', date: '2026-11-02', start: '11:00', end: '11:30', travel: 30, createdAt: old, updatedAt: old }],
    ['mm_1', { type: 'memo', date: '2026-11-02', text: '은행 서류', at: '06:20', createdAt: old, updatedAt: old }]] });
  const p = app.page;
  try {
    await p.waitForTimeout(700);
    // (1) 고른 값: 주 C · 보조 B · 칩 D · 나눔 D · 글자 C · 아이콘 A · 체크 A · 사이 C · 선 B · 글자 역할 B
    const tok = await p.evaluate(() => { const R = getComputedStyle(document.documentElement); return ['--b-h', '--b-r', '--bs-h', '--bs-r', '--c-h', '--c-r', '--sg-h', '--tb-fs', '--tb-fw', '--icb', '--ck', '--b-gap', '--ic-sw', '--lh-body', '--ls-body', '--ls-title'].map(k => R.getPropertyValue(k).trim()); });
    c.eq(tok, ['48px', '12px', '36px', '10px', '36px', '10px', '40px', '14px', '600', '44px', '24px', '8px', '1.8', '23.2px', '-.16px', '0px'], '고른 값(주 C · 보조 B · 칩 D · 나눔 D · 글자 C · 아이콘 A · 체크 A · 사이 C · 선 B · 글자 역할 B)');
    // (3) 단추 견본: 상태마다 같은 크기, 아이콘이 앞에 붙으면 왼쪽 여백 18 - 4
    const sp = await p.evaluate(() => {
      window.BX_specimen();
      const b = Array.from(document.querySelectorAll('#bx-spec .btn.primary:not(.sm):not(.block)'));
      const r = e => { const q = e.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; };
      const plain = b.find(e => !e.querySelector('svg') && !e.disabled && !e.classList.contains('is-busy'));
      const dis = b.find(e => e.disabled), busy = b.find(e => e.classList.contains('is-busy')), ic = b.find(e => e.querySelector('svg.i'));
      const sec2 = document.querySelector('#bx-spec .btn:not(.primary):not(.sm):not(.block)');
      const chip = document.querySelector('#bx-spec .bx-cchip[aria-pressed="true"]'), chip0 = document.querySelector('#bx-spec .bx-cchip[aria-pressed="false"]');
      const long = document.querySelectorAll('#bx-spec .btn.block > span')[1];
      return { plain: r(plain), dis: r(dis), busy: r(busy), padIc: getComputedStyle(ic).paddingLeft, padIcR: getComputedStyle(ic).paddingRight, secBg: getComputedStyle(sec2).backgroundColor,
        chipFw: [getComputedStyle(chip).fontWeight, getComputedStyle(chip0).fontWeight], chipH: [r(chip)[1], r(chip0)[1]], ell: getComputedStyle(long).textOverflow, cut: long.scrollWidth > long.clientWidth };
    });
    c.eq([sp.plain, sp.dis, sp.busy], [sp.plain, sp.plain, sp.plain], "'저장' · 못 누름 · 처리 중이 같은 크기 " + JSON.stringify(sp.plain));
    c.eq([sp.padIc, sp.padIcR], ['14px', '18px'], '아이콘이 앞에 붙은 단추: 아이콘 쪽 안쪽 여백만 4 줄임');
    c.ok(sp.secBg !== 'rgba(0, 0, 0, 0)', '보조 단추 B: 회색 채움 ' + sp.secBg);
    c.ok(sp.chipFw[0] === sp.chipFw[1] && sp.chipH[0] === sp.chipH[1] && sp.chipH[0] === 36, '칩: 고르기 전 · 고른 것이 같은 굵기 · 높이(36) ' + JSON.stringify(sp));
    c.ok(sp.ell === 'ellipsis' && sp.cut, '긴 글 단추는 줄을 바꾸지 않고 …');
    await p.evaluate(() => document.getElementById('bx-spec').remove());
    // (4) 홈 상자 제목은 상자 밖 위: 제목 아래 끝보다 상자(::before) 위 끝이 아래
    const home = await p.evaluate(() => {
      const card = document.querySelector('#tcard2'), h = document.querySelector('#h-todo'), cs = getComputedStyle(card), bf = getComputedStyle(card, '::before');
      const mm = document.querySelector('.screen.today .bx-mm-card'), mh = document.querySelector('#h-memo');
      return { bg: cs.backgroundColor, boxTop: card.getBoundingClientRect().top + parseFloat(bf.top), hBottom: h.getBoundingClientRect().bottom, hLeft: Math.round(h.getBoundingClientRect().left),
        mmBoxTop: mm ? mm.getBoundingClientRect().top + parseFloat(getComputedStyle(mm, '::before').top) : 0, mhBottom: mh ? mh.getBoundingClientRect().bottom : 1 };
    });
    c.ok(home.bg === 'rgba(0, 0, 0, 0)' && home.boxTop >= home.hBottom && home.hLeft === 32, "홈 '오늘 할 일' 제목은 상자 밖 위, 글자 줄 32에서 시작 " + JSON.stringify(home));
    c.ok(home.mmBoxTop >= home.mhBottom, "홈 '오늘의 메모' 제목도 상자 밖 위");
    // 출발 아이콘: 집에서 나가기(일정 창 출발·준비 줄)
    await p.click('#tcard2 .row-main[data-id="it_2"]'); await p.waitForTimeout(600);
    const go = await p.evaluate(() => { const r = document.querySelector('#sheet-root .bx-er[data-fpanel="go"] svg'); return r ? r.innerHTML : ''; });
    c.ok(/M3 11 9\.5 5\.5 16 11/.test(go) && !/circle cx="14" cy="4"/.test(go), "출발·준비 줄 아이콘은 '집에서 나가기'(걷는 사람 아님)");
    // '완료' 오른쪽 끝 32 · 날짜 이동 줄 글자 20
    await p.click('#sheet-root [data-fpanel="date"]').catch(() => {}); await p.waitForTimeout(800);
    const pg = await p.evaluate(() => { const ok = document.querySelector('#bx-ep .bx-ep-ok'), d = document.querySelector('#bx-ep .bx-dcal-h b'); if (!ok) return null; const rg = document.createRange(); rg.selectNodeContents(ok); return { right: Math.round(innerWidth - rg.getBoundingClientRect().right), dfs: d ? getComputedStyle(d).fontSize : '' }; });
    c.ok(pg && pg.right === 32, "페이지 머리 '완료' 글자 끝이 화면 끝에서 32 " + JSON.stringify(pg));
    c.ok(pg && pg.dfs === '20px', '날짜 페이지 달력 머리 글자 20');
  } finally { await app.close(); }
  // (5) 목록 시각 칸 · 같은 종류
  const app2 = await openApp({ width: 360, height: 780, data: [['settings', settings()],
    ['it_1', { type: 'item', title: '보고서 마감', date: '2026-11-02', start: '10:00', end: '12:30', createdAt: old, updatedAt: old }],
    ['it_9', { type: 'item', title: '지난 일', date: '2026-11-01', start: '11:00', createdAt: old, updatedAt: old }]] });
  const q = app2.page;
  try {
    await q.waitForTimeout(700);
    c.eq(await q.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--row-tw').trim()), '80px', '목록 시각 칸 폭은 공통 값 하나(--row-tw 80)');
    // 가장 넓은 시각을 굵기 800으로 넣어도 2px 남음
    const room = await q.evaluate(() => { const b = document.createElement('b'); b.style.cssText = 'position:fixed;top:0;left:0;white-space:nowrap;font-size:16px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:var(--ls-body)'; b.textContent = '오후 12:59'; document.body.appendChild(b); const w = b.getBoundingClientRect().width; b.remove(); return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-tw')) - w; });
    c.ok(room >= 2, "가장 넓은 시각('오후 12:59' · 굵기 800)이 시각 칸에 2px 넘게 남음 " + room.toFixed(2));
    // 확인 필요: 미루는 단추는 아이콘 없이 글만(span) · 두 칸은 글이 다 들어가는 폭 아래로 안 줄어듦
    await q.click('[data-act="bx-late-open"]'); await q.waitForTimeout(600);
    const lc = await q.evaluate(() => { const b = document.querySelector('.bx-lc-a [data-bx-late="today"], .bx-lc-a [data-bx-late="later"]'); if (!b) return null; const sp = b.querySelector(':scope > span'); return { svg: !!b.querySelector('svg'), cut: sp ? sp.scrollWidth > sp.clientWidth : true, cols: getComputedStyle(b.parentElement).gridTemplateColumns }; });
    c.ok(lc && !lc.svg && !lc.cut, "확인 필요 '오늘 …로' 단추: 아이콘 없이 글 전부 보임(폭 360) " + JSON.stringify(lc));
    await q.evaluate(() => window.BX_back && window.BX_back()); await q.waitForTimeout(300);
    // 이동 시간 칸 글: 정시는 'N시간', 나머지는 'N분'
    await q.click('#tcard2 .row-main[data-id="it_1"]'); await q.waitForTimeout(500);
    await q.click('#sheet-root .bx-er[data-fpanel="go"]'); await q.waitForTimeout(600);
    const tv = await q.evaluate(() => Array.from(document.querySelectorAll('#bx-ep [data-ftv]')).map(b => { const r = document.createRange(); r.selectNodeContents(b); const s = getComputedStyle(b), q = b.getBoundingClientRect(); return [b.textContent.trim(), r.getBoundingClientRect().width <= q.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) + 0.5]; }));
    c.ok(tv.length >= 7 && tv.some(x => x[0] === '90분') && tv.some(x => x[0] === '1시간') && !tv.some(x => /시간 \d+분/.test(x[0])) && tv.every(x => x[1]), "이동 시간 칸: 정시는 'N시간', 나머지는 'N분'('1시간 30분' → '90분'), 폭 360에서 칸 안에 다 들어감 " + JSON.stringify(tv));
    await q.evaluate(() => { for (let i = 0; i < 4; i++) window.BX_back && window.BX_back(); }); await q.waitForTimeout(400);
    // 정렬 점검의 새 검사가 일부러 만든 넘침을 잡는지(검사가 늘 '통과'만 하는 게 아님을 확인)
    const audit = require('./layout/checks.js').toString();
    await q.evaluate(() => { const d = document.createElement('div'); d.id = 'bx-t55'; d.style.cssText = 'position:fixed;left:16px;top:120px;z-index:99999;background:#fff;display:grid;gap:8px';
      d.innerHTML = '<div style="display:grid;grid-template-columns:70px"><button type="button" class="btn sm">사진 고르기</button></div>' +
        '<span class="row-time" style="display:block;width:70px"><b style="display:block;white-space:nowrap;font-size:16px;font-weight:800">오전 7:30</b></span>';
      document.body.appendChild(d); });
    const got = await q.evaluate('(' + audit + ')({top:true})');
    const mine = got.filter(x => /bx-t55|row-time|btn\.sm/.test(x.p || '') && (x.k === 'fit' || x.why === '안쪽 여백 침범'));
    c.ok(mine.some(x => x.k === 'fit') && mine.some(x => x.why === '안쪽 여백 침범'), "정렬 점검이 일부러 만든 넘침을 잡음(70px 칸의 '오전 7:30' → fit, 좁은 칸 '사진 고르기' → 안쪽 여백 침범) " + JSON.stringify(mine.map(x => x.k + ':' + x.t)));
    c.eq(app2.errors, [], '화면 오류');
  } finally { await app2.close(); }
  return c.done();
};
