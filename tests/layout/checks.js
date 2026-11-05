// 화면 한 장을 재는 함수(브라우저 안에서 돈다). 대표 상시 규칙(11/4 22:59, 결정 기록 D-27)의 다섯 가지 + 앞선 점검(D-26)
//  ① tap    누르는 것끼리 겹침
//  ② cover  떠 있는 것(+ 단추 · 취소|저장 · 알림 글 · 아래 메뉴)이 글자나 단추를 가림 — 맨 아래까지 밀었을 때(opts.bottom)
//  ③ cut    글자 잘림(…로 줄인 것 말고): 화면 밖 · 상자 밖 · 숨김 상자에 잘림 · 입력칸 안내 글
//  ④ col    같은 목록 안 줄끼리 칸 시작 위치(시각 · 아이콘 · 이름 · 상태 · 체크)
//  ⑤ icon   같은 목록 안 아이콘: 한 세트 · 같은 크기 · 같은 굵기
//  + midword(낱말 가운데 줄바꿈) · time24(오전 · 오후 없는 시각, 12시간 표시일 때) · comp(공통 부품과 다른 모양, 시험판 55)
//  + fit(시각이 든 고정 칸에 가장 넓은 시각을 넣어도 2px 남는지 — 데이터 · 휴대폰 글자 그리기에 따라 넓어짐, 시험판 55 CI)
//  + mid(목록 줄의 체크 · 확인 필요 아이콘이 그 줄 글 묶음의 세로 가운데에 있는지 — 대표 메모 11/5 '그 일정에 중앙 정렬', 시험판 57)
// 결과: [{k, p(자리), t(글), ...}] — 하나라도 있으면 시험판을 내지 않는다
module.exports = function audit(opts){
  opts = opts || {};
  const W = innerWidth, H = innerHeight, out = [];
  const cs = e => getComputedStyle(e);
  const srOnly = e => { for (let x = e; x && x !== document.body; x = x.parentElement) { const r = x.getBoundingClientRect(); if ((r.width <= 1.5 || r.height <= 1.5) && cs(x).overflow !== 'visible') return true; if (x.classList && x.classList.contains('sr')) return true; } return false; };
  const vis = e => { const r = e.getBoundingClientRect(); if (r.width <= 0.5 || r.height <= 0.5 || r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return false; const s = cs(e); return s.visibility !== 'hidden' && +s.opacity > 0.05 && s.display !== 'contents'; };
  const name = x => x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const path = e => { const a = []; for (let x = e; x && x !== document.body && a.length < 3; x = x.parentElement) a.unshift(name(x)); return a.join('>'); };
  const txt = e => (e.textContent || e.getAttribute && (e.getAttribute('aria-label') || '') || '').replace(/\s+/g, ' ').trim().slice(0, 30);
  const hidden = e => { for (let x = e; x; x = x.parentElement) { if (x.hidden) return true; const s = cs(x); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity <= 0.05) return true; } return false; };
  let all = Array.from(document.body.querySelectorAll('*')).filter(e => !e.closest('svg,script,style,#bx-splash,template') && vis(e) && !hidden(e));
  // 화면을 덮는 층(창 · 페이지 · 처음 화면)이 열려 있으면 그 밑은 누를 수 없다 → 맨 위 층 안만 잰다(알림 글처럼 그 위에 뜬 것은 함께)
  const big = all.filter(e => { const q = cs(e).position; if (q !== 'fixed' && q !== 'absolute') return false; const r = e.getBoundingClientRect(); return r.width * r.height >= W * H * 0.45; });
  const tp = document.elementFromPoint(W / 2, H * 0.6);
  const modal = big.filter(m => tp && (m === tp || m.contains(tp))).sort((a, b) => (a.contains(b) ? 1 : b.contains(a) ? -1 : 0))[0] || null;
  if (modal) all = all.filter(e => modal.contains(e) || (/fixed/.test(cs(e).position) && !big.includes(e) && !e.contains(modal) && +cs(e).zIndex >= +cs(modal).zIndex));
  const ownText = e => Array.from(e.childNodes).some(c => c.nodeType === 3 && c.textContent.trim());
  const isTap = e => e.matches('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=switch],[role=checkbox],[role=radio],[role=tab],label[for]') && !e.disabled && cs(e).pointerEvents !== 'none';
  const inter = (a, b) => { const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return x > 0 && y > 0 ? {x, y, cx: (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2, cy: (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2} : null; };
  // 스크롤 · 숨김 상자 안에서 보이는 부분만
  const clipRect = e => {
    let r = e.getBoundingClientRect(), o = {left: Math.max(0, r.left), top: Math.max(0, r.top), right: Math.min(W, r.right), bottom: Math.min(H, r.bottom)};
    for (let x = e.parentElement; x && x !== document.documentElement; x = x.parentElement) {
      const s = cs(x); if (s.overflow === 'visible' && s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const q = x.getBoundingClientRect(); o = {left: Math.max(o.left, q.left), top: Math.max(o.top, q.top), right: Math.min(o.right, q.right), bottom: Math.min(o.bottom, q.bottom)};
    }
    return o;
  };
  const top = (x, y, a, b) => { const t = document.elementFromPoint(x, y); return !!t && ((a && (a === t || a.contains(t))) || (b && (b === t || b.contains(t)))); };
  const tapOf = e => { for (let x = e; x && x !== document.body; x = x.parentElement) if (isTap(x)) return x; return null; };

  // ① 누르는 것끼리 겹침(같은 층끼리. 떠 있는 것 밑으로 지나가는 것은 ②에서 본다)
  // 층: 고정 · 붙어 있는 것, 그리고 그 안에 따로 떠 있는 작은 상자(절대 위치 · 그림자, 화면의 45% 미만 — 창 아래 '취소 | 저장' 같은 것)
  const layer = e => { for (let x = e; x && x !== document.body; x = x.parentElement) { const q = cs(x).position; if (q === 'fixed' || q === 'sticky') return x; if (q === 'absolute') { const r = x.getBoundingClientRect(); if (r.width * r.height < W * H * 0.45 && r.width >= 40 && [x].concat(Array.from(x.children)).some(c => cs(c).boxShadow !== 'none')) return x; } } return null; };
  const taps = all.filter(e => isTap(e) && !srOnly(e) && !(e.tagName === 'INPUT' && +cs(e).opacity < 0.1));
  for (let i = 0; i < taps.length; i++) for (let j = i + 1; j < taps.length; j++) {
    const a = taps[i], b = taps[j]; if (a.contains(b) || b.contains(a) || layer(a) !== layer(b)) continue;
    const it = inter(clipRect(a), clipRect(b)); if (!it || it.x <= 1.5 || it.y <= 1.5) continue;
    if (!top(it.cx, it.cy, a, b)) continue;
    out.push({k: 'tap', p: path(a) + ' ⟂ ' + path(b), t: txt(a) + ' ⟂ ' + txt(b), w: Math.round(it.x), h: Math.round(it.y)});
  }
  // ② 떠 있는 것이 가림: 화면 아래쪽에 떠 있는 것(+ 단추 · 취소|저장 · 아래 메뉴)은 맨 아래까지 민 다음, 위쪽에 떠 있는 것(위 막대)은 맨 위에서
  if (opts.bottom || opts.top) {
    const alpha = c => c === 'transparent' ? 0 : +((String(c).match(/rgba?\(([^)]+)\)/) || [0, '0,0,0,0'])[1].split(',')[3] || 1);
    const roots = all.filter(e => {
      const s = cs(e); if (!/^(fixed|sticky|absolute)$/.test(s.position)) return false;
      const r = e.getBoundingClientRect(); if (r.width * r.height > W * H * 0.45 || r.width < 40 || r.height < 16) return false;
      if (s.position === 'absolute') { let fx = false; for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const q = cs(x).position; if (q === 'fixed' || q === 'sticky') { fx = true; break; } if (q === 'absolute' || q === 'relative') break; } if (!fx) return false; }
      return true;
    }).filter((e, i, a) => !a.some(o => o !== e && o.contains(e)));
    // 가리는 모양: 뿌리와 그 안의 칠해진 것 · 그림자 · 단추
    const floats = [];
    roots.forEach(rt => [rt].concat(Array.from(rt.querySelectorAll('*')).filter(x => all.includes(x))).forEach(x => { const s = cs(x); if (alpha(s.backgroundColor) > 0.3 || s.boxShadow !== 'none' || isTap(x)) floats.push({el: x, root: rt}); }));
    const content = all.filter(e => (ownText(e) || isTap(e)) && !srOnly(e) && !roots.some(r => r.contains(e)));
    const seenC = new Set();
    for (const {el: f, root} of floats) {
      const fr = f.getBoundingClientRect(), low = (fr.top + fr.bottom) / 2 > H / 2;
      if (low ? !opts.bottom : !opts.top) continue;
      for (const t of content) {
        if (t.contains(root)) continue;
        const it = inter(fr, clipRect(t)); if (!it || it.x <= 2 || it.y <= 2) continue;
        if (!top(it.cx, it.cy, f, null)) continue;
        const key = path(root) + path(t); if (seenC.has(key)) continue; seenC.add(key);
        out.push({k: 'cover', p: path(f) + ' ▸ ' + path(t), t: txt(f).slice(0, 14) + ' ▸ ' + txt(t), w: Math.round(it.x), h: Math.round(it.y)});
      }
    }
  }
  // ② 덧: 스크롤 상자 바로 아래가 투명한 바닥(떠 보이는 단추만)이면 잘린 줄이 단추 밑으로 들어간 것처럼 보인다(대표 11/4 22:59 '취소|저장이 사진·파일을 가림')
  for (const sc of all.filter(e => /(auto|scroll)/.test(cs(e).overflowY) && e.scrollHeight > e.clientHeight + 4)) {
    const nx = sc.nextElementSibling; if (!nx || !all.includes(nx)) continue;
    const ns = cs(nx), alphaN = ns.backgroundColor === 'transparent' ? 0 : +((ns.backgroundColor.match(/rgba?\(([^)]+)\)/) || [0, '0,0,0,0'])[1].split(',')[3] || 1);
    if (alphaN > 0.3 || parseFloat(ns.borderTopWidth) > 0 || ns.boxShadow !== 'none') continue;
    if (!Array.from(nx.querySelectorAll('*')).some(x => cs(x).boxShadow !== 'none')) continue;
    const sb = sc.getBoundingClientRect().bottom;
    const cut = all.find(e => sc.contains(e) && ownText(e) && e.getBoundingClientRect().top < sb - 2 && e.getBoundingClientRect().bottom > sb + 2);
    if (cut) out.push({k: 'cover', why: '경계 없음', p: path(sc) + ' ▸ ' + path(nx), t: txt(cut) + ' ▸ ' + txt(nx).slice(0, 12)});
  }
  // 상자 안 내용(흐름 안의 글 · 아이콘)의 가로 범위와 안쪽(여백 · 테두리를 뺀) 범위. 떠 있는 것(absolute · fixed — 처리 중 동그라미 등)은 뺀다
  const inner = e => { const r = e.getBoundingClientRect(), s = cs(e); return { L: r.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft), R: r.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight) }; };
  const span = e => {
    let L = Infinity, R = -Infinity;
    for (const c of e.childNodes) {
      let b = null;
      if (c.nodeType === 3) { if (!c.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(c); b = rg.getBoundingClientRect(); }
      else if (c.nodeType === 1) { const q = cs(c); if (/absolute|fixed/.test(q.position) || q.display === 'none' || q.visibility === 'hidden') continue; b = c.getBoundingClientRect(); }
      if (!b || b.width <= 0) continue;
      L = Math.min(L, b.left); R = Math.max(R, b.right);
    }
    return R > L ? { L, R, w: R - L } : null;
  };
  // ③ 글자 잘림(…로 줄인 것 · 줄 수를 정해 …로 끝내는 것 말고)
  for (const e of all) {
    if (srOnly(e)) continue;
    const s = cs(e), r = e.getBoundingClientRect();
    if (ownText(e) && (r.right > W + 1.5 || r.left < -1.5)) {
      let sc = false; for (let x = e.parentElement; x && x !== document.documentElement; x = x.parentElement) { const q = cs(x); if (/(auto|scroll)/.test(q.overflowX)) { sc = true; break; } }
      if (!sc) out.push({k: 'cut', why: '화면 밖', p: path(e), t: txt(e), l: Math.round(r.left), r: Math.round(r.right)});
    }
    if (ownText(e) && /hidden|clip/.test(s.overflowX) && e.scrollWidth > e.clientWidth + 1 && !(s.textOverflow === 'ellipsis' && !/flex|grid/.test(s.display))) out.push({k: 'cut', why: '가로 잘림', p: path(e), t: txt(e), w: e.clientWidth, need: e.scrollWidth});
    if (ownText(e) && /hidden|clip/.test(s.overflowY) && (!s.webkitLineClamp || s.webkitLineClamp === 'none') && e.scrollHeight > e.clientHeight + 2) out.push({k: 'cut', why: '세로 잘림', p: path(e), t: txt(e), h: e.clientHeight, need: e.scrollHeight});
    // 상자 밖으로 넘친 글(겹쳐 보임)
    if (ownText(e) && s.overflowX === 'visible' && !/flex|grid/.test(s.display) && e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && s.whiteSpace !== 'normal') out.push({k: 'cut', why: '상자 밖', p: path(e), t: txt(e), w: e.clientWidth, need: e.scrollWidth});
    // 단추 · 칩처럼 flex · grid로 놓인 상자: 안의 글 · 아이콘이 안쪽 여백을 밀고 들어가거나 밖으로 나감(시험판 55: 폭 360 '오늘 오전 11:00로' 단추 — 위 검사는 flex 상자를 건너뛰어 못 잡았음)
    if (ownText(e) && /flex|grid/.test(s.display) && s.textOverflow !== 'ellipsis') { const q = span(e), m = inner(e); if (q && (q.R > m.R + 1 || q.L < m.L - 1)) out.push({k: 'cut', why: '안쪽 여백 침범', p: path(e), t: txt(e), w: Math.round((m.R - m.L) * 10) / 10, need: Math.round(q.w * 10) / 10}); }
  }
  const cv = document.createElement('canvas').getContext('2d');
  for (const e of all.filter(x => x.matches('input[placeholder]'))) {
    if (e.value || +cs(e).opacity < 0.1) continue;
    const s = cs(e), ps = getComputedStyle(e, '::placeholder');
    cv.font = ps.fontWeight + ' ' + ps.fontSize + ' ' + ps.fontFamily;
    const need = cv.measureText(e.placeholder).width + (parseFloat(ps.letterSpacing) || 0) * e.placeholder.length, room = e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    if (need > room + 1) out.push({k: 'cut', why: '안내 글', p: path(e), t: e.placeholder, w: Math.round(room), need: Math.round(need)});
  }
  // fit: 시각 글자가 든 고정 칸(줄을 바꾸지 않는 칸)은 지금 보이는 시각이 아니라 가장 넓은 시각으로 잰다(시험판 55: 캘린더 목록 '오전 10:00'이
  // 76px 칸을 넘음 — 개발 쪽에선 1.4px라 통과, CI 글자 그리기에선 2px 넘게). 휴대폰마다 글자 폭이 조금씩 달라 2px 남아야 통과.
  // 칸이 글에 맞춰 늘어나는 경우(폭을 정하지 않은 칸)는 넘칠 일이 없으니 넘어간다
  {
    const TM = /(오전|오후) ?\d{1,2}:\d{2}|\d{1,2}:\d{2}/g;
    const WIDE = ['오전 10:00', '오후 12:59', '오후 10:44', '오전 12:00', '오후 12:00'], WIDE24 = ['12:59', '10:44', '20:44', '00:00'];
    const seen = new Set();
    for (const e of all) {
      if (srOnly(e) || e.closest('input,textarea,select,#bx-spec')) continue;
      const tn = Array.from(e.childNodes).filter(c => c.nodeType === 3 && /\d{1,2}:\d{2}/.test(c.textContent));
      if (!tn.length) continue;
      const s = cs(e), box = /^inline$/.test(s.display) ? e.parentElement : e;
      if (!box || seen.has(box)) continue; seen.add(box);
      const bs = cs(box);
      if (!/nowrap|pre$/.test(s.whiteSpace) && !/nowrap|pre$/.test(bs.whiteSpace)) continue;
      // 시각이 글의 거의 전부(시각 칸 · '오늘 오전 11:00로' 단추)면 …로 줄어도 안 된다. 시각이 든 긴 문장은 …면 넘어감
      const isLabel = (box.textContent || '').replace(TM, '').replace(/\s+/g, '').length <= 6;
      if (!isLabel && (s.textOverflow === 'ellipsis' || bs.textOverflow === 'ellipsis')) continue;
      const orig = tn.map(c => c.textContent);
      const room = () => { const m = inner(box); return m.R - m.L; };
      const need = () => { const q = span(box); return q ? q.w : 0; };
      const put = k => tn.forEach((c, i) => { c.textContent = orig[i].replace(TM, m => (/오전|오후/.test(m) ? WIDE[k] : WIDE24[k]) + (k === 9 ? '00' : '')); });
      // 위 상자(4단계까지)가 지금(바꾸기 전) 얼마나 넘쳐 있는지 — 원래 넘쳐 있던 만큼은 시각 탓이 아님(음수 여백으로 넓힌 줄 등)
      const ancs = []; for (let x = box.parentElement, d = 0; x && x !== document.body && d < 4; x = x.parentElement, d++) ancs.push(x);
      const ov = x => { const q = span(x), m = inner(x); return q ? Math.max(0, q.R - m.R) : 0; };
      const ov0 = ancs.map(ov);
      let worst = null;
      try {
        for (let k = 0; k < WIDE.length; k++) {
          if (k >= WIDE24.length && !orig.some(t => /오전|오후/.test(t))) break;
          put(k); const r0 = room(), n0 = need();
          // 칸이 글에 맞춰 늘어나는지: 같은 시각 뒤에 글자 둘을 더 붙여 칸 폭이 커지면 늘어나는 칸
          tn.forEach((c, i) => { c.textContent = c.textContent + '00'; }); const r1 = room();
          if (r1 > r0 + 1) {
            // 칸이 글에 맞춰 늘어남: 그 시각을 넣은 채로 위 상자(4단계까지)가 넘치지 않는지
            put(k);
            for (let d = 0; d < ancs.length; d++) {
              const x = ancs[d], o = ov(x);
              if (o > ov0[d] + 0.5) { const m = inner(x), q = span(x); worst = { over: 99, t: tn.map(c => c.textContent).join('').trim(), w: Math.round((m.R - m.L) * 10) / 10, need: Math.round(q.w * 10) / 10, anc: name(x) }; break; }
            }
            if (worst && worst.anc) break;
            continue;
          }
          if (!worst || n0 - r0 > worst.over) worst = { over: n0 - r0, t: tn.map(c => c.textContent.replace(/00$/, '')).join('').trim(), w: Math.round(r0 * 10) / 10, need: Math.round(n0 * 10) / 10 };
        }
      } finally { tn.forEach((c, i) => { c.textContent = orig[i]; }); }
      if (worst && worst.over > -2) out.push({k: 'fit', why: worst.anc ? '가장 넓은 시각을 넣으면 ' + worst.anc + '이 넘침' : '가장 넓은 시각이 칸에 안 맞음(2px 여유)', p: path(box), t: worst.t, w: worst.w, need: worst.need});
    }
  }
  // ④ ⑤ 목록: 같은 상자 안 줄(두 칸 이상 · 높이 28 넘음)끼리 칸 시작 · 아이콘
  const STATE = /^(done|cur|past|wait|late|blink|on|off|active|sel|selected|today|soon|live|now|next|open|bx-now|bx-next|bx-next-soft|bx-open|bx-one|bx-span|pc|tt-row|lk|bx-off|bx-r49|bx-untimed|bx-tl-rt|arr|bx-im-del|danger|bx-arow-sw|bx-hid)$/;
  const sig = e => e.tagName + '.' + (typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter(c => c && !STATE.test(c)).sort().join('.') : '');
  const textLeft = el => { let m = Infinity; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let x; while ((x = w.nextNode())) { if (!x.textContent.trim()) continue; const p = x.parentElement; if (!p || !vis(p) || p.closest('svg') || srOnly(p)) continue; const rg = document.createRange(); rg.selectNodeContents(x); const b = rg.getBoundingClientRect(); if (b.width > 0) m = Math.min(m, b.left); } return m; };
  // 아이콘 세트: 앱 아이콘(ICON)인지 루틴 아이콘(BX_ICONS)인지(window.BX_ICONSRC, icons.js)
  if (!window.__bxIcSet) {
    const mk = o => new Set(Object.values(o || {}).map(h => { const d = document.createElement('div'); d.innerHTML = String(h); return d.firstElementChild ? d.firstElementChild.outerHTML : ''; }));
    const S = window.BX_ICONSRC || {}; window.__bxIcSet = {app: mk(S.app), rt: mk(S.rt)};
  }
  // 앱 아이콘(ICON)과 루틴 아이콘(BX_ICONS)은 같은 판(24칸 · 같은 선 굵기)에 그린 한 묶음. 어느 쪽에도 없는 것은 'other'(따로 그린 것)
  const iconSet = s => { const h = s.outerHTML; return window.__bxIcSet.app.has(h) ? 'app' : window.__bxIcSet.rt.has(h) ? 'rt' : 'other'; };
  // 그린 크기(24칸 안에서 그림이 차지하는 넓이): 같은 줄 아이콘의 가운데 값보다 많이 작으면 가늘고 작아 보인다(대표 11/4 22:59 '출발·준비 아이콘만 굵기 · 크기가 다름')
  const inkArea = s => { let x0 = 99, y0 = 99, x1 = -99, y1 = -99; s.querySelectorAll('path,circle,rect,line,polyline,polygon,ellipse').forEach(e => { try { const b = e.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); } catch (er) {} }); const vb = s.viewBox && s.viewBox.baseVal; const k = vb && vb.width ? 24 / vb.width : 1; return x1 > x0 ? (x1 - x0) * (y1 - y0) * k * k : 0; };
  const parents = new Set(all.map(e => e.parentElement).filter(Boolean));
  for (const par of parents) {
    if (par.closest('.tt-wrap,.cal,.bx-dcal,.swatches,.picks,.seg,.bx-cchips,.dock,.bx-sum')) continue;
    const rowLike = c => { const ks = Array.from(c.children).filter(x => all.includes(x)); if (ks.length < 2) return false; const m = {}; ks.forEach(x => { m[sig(x)] = (m[sig(x)] || 0) + 1; }); return Math.max(...Object.values(m)) < 3 && c.getBoundingClientRect().height < 140; };
    const kids = Array.from(par.children).filter(c => all.includes(c) && c.getBoundingClientRect().height >= 28 && !/(absolute|fixed)/.test(cs(c).position) && rowLike(c));
    const groups = {}; kids.forEach(c => { (groups[sig(c)] = groups[sig(c)] || []).push(c); });
    for (const g of Object.values(groups)) {
      if (g.length < 2) continue;
      const rs = g.map(c => c.getBoundingClientRect());
      if (!rs.every((r, i) => i === 0 || r.top >= rs[i - 1].bottom - 2)) continue; // 위아래로 쌓인 줄만
      // 칸: 줄의 바로 아래 자식(같은 이름표끼리). 왼쪽 · 글 시작, 맨 끝 칸은 오른쪽
      const cols = {};
      g.forEach((row, ri) => Array.from(row.children).filter(c => all.includes(c) && !srOnly(c)).forEach((c, ci, arr) => {
        const key = sig(c), q = cs(c), mid = q.textAlign === 'center' || (/flex|grid/.test(q.display) && /center/.test(q.justifyContent + q.justifyItems));
        (cols[key] = cols[key] || []).push({ri, l: c.getBoundingClientRect().left, r: c.getBoundingClientRect().right, tl: mid ? NaN : textLeft(c), last: ci === arr.length - 1, el: c});
      }));
      for (const [key, v] of Object.entries(cols)) {
        if (v.length < 2) continue;
        const spread = a => { const f = a.filter(isFinite); return f.length >= 2 ? Math.max(...f) - Math.min(...f) : 0; };
        const dl = spread(v.map(x => x.l)), dt = spread(v.map(x => x.tl)), dr = spread(v.map(x => x.r));
        if (Math.min(dl, dr) > 2 || (dl <= 2 && dt > 2)) out.push({k: 'col', p: path(par) + ' > ' + key.slice(0, 40), t: g.slice(0, 4).map(txt).map(s => s.slice(0, 12)).join(' | '), dl: Math.round(dl), dt: Math.round(dt), dr: Math.round(dr)});
      }
      // ⑤ 아이콘: 줄마다 첫 아이콘
      const ics = g.map(row => Array.from(row.querySelectorAll('svg')).find(s => vis(s) && s.getBoundingClientRect().width >= 10 && !s.closest('.chk,.tog,[role="switch"],[role="checkbox"]'))).filter(Boolean);
      if (ics.length >= 2) {
        const info = ics.map(s => { const b = s.getBoundingClientRect(), sh = s.querySelector('path,circle,rect,line,polyline,polygon') || s; return {w: Math.round(b.width), h: Math.round(b.height), sw: cs(sh).strokeWidth, set: iconSet(s), a: Math.round(inkArea(s))}; });
        const diff = k => new Set(info.map(x => x[k])).size > 1;
        const med = info.map(x => x.a).sort((a, b) => a - b)[Math.floor((info.length - 1) / 2)];
        const small = info.some(x => x.a > 0 && med > 0 && x.a < med * 0.66), other = info.some(x => x.set === 'other');
        if (diff('w') || diff('h') || diff('sw') || other || small) out.push({k: 'icon', p: path(par), t: g.slice(0, 4).map(txt).map(s => s.slice(0, 10)).join(' | '), v: info.map(x => x.set + ' ' + x.w + 'x' + x.h + ' ' + x.sw + ' ' + x.a).join(' / ')});
      }
    }
  }
  // + 이름표가 칸에 붙음: 작은 이름표 바로 아래 칸(테두리 · 바탕이 있는 상자)과 6 미만으로 붙어 있음(대표 11/4 23:19)
  const boxy = x => { const q = cs(x); return parseFloat(q.borderTopWidth) > 0 || (q.backgroundColor !== 'transparent' && !/rgba\([^)]*,\s*0\)/.test(q.backgroundColor)) || q.boxShadow !== 'none'; };
  // 이름표: label · 이름이 '-l' · 'gl' · 'lab'로 끝나는 작은 글. 바로 다음 형제(또는 그 안의 첫 상자)가 칸
  const labelish = e => e.tagName === 'LABEL' || (typeof e.className === 'string' && /(^|\s)(fld-l|fg-l|bx-ep-gl|set-sub|bx-tm-l|[\w-]*-lab(el)?|[\w-]*-l)(\s|$)/.test(e.className));
  for (const e of all) {
    if (!ownText(e) || srOnly(e) || (isTap(e) && e.tagName !== 'LABEL') || !labelish(e)) continue;
    const r = e.getBoundingClientRect(); if (r.height > 34) continue;
    let nx = e.nextElementSibling; while (nx && !all.includes(nx)) nx = nx.nextElementSibling;
    if (!nx) { const pp = e.parentElement; nx = pp && pp.nextElementSibling; }
    if (!nx || !all.includes(nx)) continue;
    const bx = boxy(nx) ? nx : Array.from(nx.querySelectorAll('*')).find(x => all.includes(x) && boxy(x) && (isTap(x) || x.querySelector('input,button')));
    if (!bx) continue;
    const b = bx.getBoundingClientRect(); if (b.top < r.bottom - 1 || Math.min(b.right, r.right) - Math.max(b.left, r.left) <= 4) continue;
    const g = b.top - r.bottom;
    if (g < 6) out.push({k: 'gap', p: path(e), t: txt(e), gap: Math.round(g * 10) / 10});
  }
  // + 안 보이는 글(글자색이 바탕과 거의 같음, 대표 11/4 23:07 '새로')
  // rgb() · rgba() · color(srgb …)(color-mix 결과) 모두 읽는다. 반투명 글자는 바탕 위에 섞어서 잰다
  const rgb = c => {
    c = String(c); let m = c.match(/^rgba?\(([^)]+)\)/);
    if (m) { const v = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return {r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1}; }
    m = c.match(/^color\(srgb\s+([^)]+)\)/);
    if (m) { const v = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat); return {r: v[0] * 255, g: v[1] * 255, b: v[2] * 255, a: v.length > 3 ? v[3] : 1}; }
    return null;
  };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bgOf = e => { let acc = null; for (let x = e; x; x = x.parentElement) { const c = rgb(cs(x).backgroundColor); if (c && c.a > 0.5 && !/gradient|url/.test(cs(x).backgroundImage)) return c; if (x === document.documentElement) break; } const b = rgb(cs(document.body).backgroundColor); return b && b.a > 0.5 ? b : {r: 255, g: 255, b: 255, a: 1}; };
  for (const e of all) {
    if (!ownText(e) || srOnly(e) || e.closest('input,textarea,select')) continue;
    const c = rgb(cs(e).color); if (!c || c.a < 0.2) continue;
    const b = bgOf(e), mix = {r: c.r * c.a + b.r * (1 - c.a), g: c.g * c.a + b.g * (1 - c.a), b: c.b * c.a + b.b * (1 - c.a)};
    const l1 = lum(mix), l2 = lum(b), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < 1.6) out.push({k: 'ink', p: path(e), t: txt(e), ratio: Math.round(ratio * 100) / 100});
  }
  // + 낱말 가운데 줄바꿈('주소 / 는')
  const word = ch => /[가-힣A-Za-z0-9:]/.test(ch);
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const seen = new Set();
  while ((n = tw.nextNode())) {
    const t = n.textContent; if (t.trim().length < 2) continue;
    const pe = n.parentElement; if (!pe || !all.includes(pe) || pe.closest('input,textarea,svg,script,style') || srOnly(pe)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); if (rg.getClientRects().length < 2) continue;
    let prev = null;
    for (let i = 0; i < t.length; i++) {
      rg.setStart(n, i); rg.setEnd(n, i + 1); const rr = rg.getClientRects(); if (!rr.length) continue;
      if (prev != null && rr[0].top > prev + 2 && word(t[i - 1]) && word(t[i]) && (/[가-힣]/.test(t[i - 1] + t[i]) || /\d/.test(t[i - 1]))) {
        // 칸보다 긴 낱말은 쪼개도 된다(D-26)
        let a = i - 1, b = i; while (a > 0 && word(t[a - 1])) a--; while (b < t.length && word(t[b])) b++;
        const wr = document.createRange(); wr.setStart(n, a); wr.setEnd(n, b); const ww = Array.from(wr.getClientRects()).reduce((s, q) => s + q.width, 0);
        if (ww <= pe.getBoundingClientRect().width + 1) { const key = path(pe) + t.slice(a, b); if (!seen.has(key)) { seen.add(key); out.push({k: 'midword', p: path(pe), t: t.slice(Math.max(0, i - 8), i) + ' / ' + t.slice(i, i + 8)}); } }
      }
      prev = rr[0].top;
    }
  }
  // + 오전 · 오후 없는 시각(12시간 표시일 때. 명상 남은 시간 · 시간표 시 칸은 시각이 아님)
  if (!(typeof window.BX_clock24 === 'function' && window.BX_clock24())) {
    const tw2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n2;
    while ((n2 = tw2.nextNode())) {
      const pe = n2.parentElement; if (!pe || !all.includes(pe) || pe.closest('input,textarea,svg,.bx-med-left,.bx-mb-h,.tt-line,.tt-h')) continue;
      const t = n2.textContent, re = /(\d{1,2}):(\d{2})/g; let m;
      while ((m = re.exec(t))) {
        let ctx = t.slice(Math.max(0, m.index - 4), m.index);
        if (m.index < 4) { const pv = n2.previousSibling ? n2.previousSibling.textContent : (pe.previousSibling ? pe.previousSibling.textContent : ''); ctx = String(pv || '').slice(-4) + ctx; }
        if (!/오[전후]\s?$/.test(ctx) && !/[–~\-]\s?$/.test(ctx)) out.push({k: 'time24', p: path(pe), t: t.slice(Math.max(0, m.index - 10), m.index + 10)});
      }
    }
  }
  // ⑥ comp  공통 부품(app.css 맨 앞 '공통 부품')과 다른 모양(대표 11/5 01:30 '완성본을 골라 재활용', 결정 기록 D-28)
  //   화면 규칙이 단추 · 칩 · 나눔 단추 · 글자 단추 · 아이콘 단추 · 체크의 높이 · 너비 · 모서리 · 글자 · 굵기를 다시 정하면 걸린다
  //   기댓값은 :root 공통 값에서 읽는다(대표가 고른 값이 바뀌면 점검도 따라감). 선택자 목록은 app.css 공통 부품과 같게
  {
    const R = getComputedStyle(document.documentElement), tv = k => R.getPropertyValue(k).trim(), px = k => parseFloat(tv(k));
    const C = [
      {n: '큰 단추', sel: ':is(.btn,.bx-rt-new,.bxs-test,.bx-med-stop):not(.sm):not(.sq):not(.icon-btn)', h: px('--b-h'), r: tv('--b-r'), fs: tv('--b-fs'), fw: tv('--b-fw')},
      {n: '작은 단추', sel: ':is(.btn.sm,.bx-ttb,.bx-mic):not(.icon-btn):not(.sq)', h: px('--bs-h'), r: tv('--bs-r'), fs: tv('--bs-fs'), fw: tv('--b-fw')},
      {n: '칩', sel: ':is(.chip,.bx-cchip,.bx-ft-chip)', h: px('--c-h'), r: tv('--c-r'), fs: tv('--c-fs'), fw: tv('--c-fw')},
      {n: '요일 동그라미', sel: ':is(.bx-tt45-days .tt-dbtn,.bx-rt45-days .day-tog)', h: px('--c-day'), w: px('--c-day'), fw: tv('--c-fw')},
      {n: '나눔 단추', sel: '.seg > button', h: px('--sg-h'), fs: tv('--sg-fs'), fw: tv('--sg-fw')},
      {n: '글자 단추', sel: ':is(.link-btn,.sec-link,.bx-rt-tog,.bxs-skip,.bxs-links button,.bxp-later,.bx-del-link,.bx-sum-back):not(.add)', h: px('--tb-h'), fs: tv('--tb-fs'), fw: tv('--tb-fw')},
      {n: '아이콘 단추', sel: ':is(.icon-btn,.nav-btn,.bx-set-back,.bx-sum-nav,.bxs-back-i,.sec-link.add)', w: px('--icb'), h: px('--icb')},
      {n: '체크 칸', sel: '.chk', w: px('--ck'), h: px('--ck'), r: tv('--ck-r')}
    ];
    if (!isNaN(px('--b-h'))) for (const c of C) for (const e of all) {
      if (!e.matches(c.sel)) continue;
      const s = cs(e), q = e.getBoundingClientRect(), why = [];
      if (c.h && Math.abs(q.height - c.h) > 0.6) why.push('높이 ' + Math.round(q.height * 2) / 2 + '≠' + c.h);
      if (c.w && Math.abs(q.width - c.w) > 0.6) why.push('너비 ' + Math.round(q.width * 2) / 2 + '≠' + c.w);
      if (c.r && s.borderTopLeftRadius !== c.r) why.push('모서리 ' + s.borderTopLeftRadius + '≠' + c.r);
      if (c.fs && s.fontSize !== c.fs) why.push('글자 ' + s.fontSize + '≠' + c.fs);
      if (c.fw && s.fontWeight !== c.fw) why.push('굵기 ' + s.fontWeight + '≠' + c.fw);
      if (why.length) out.push({k: 'comp', p: path(e), t: c.n + ' · ' + txt(e), why: why.join(' · ')});
    }
  }
  // mid: 목록 줄(목록 줄 C)의 체크 · 확인 필요 아이콘이 그 줄 글 묶음(종류 아이콘 · 시각 · 이름 · 둘째 줄)의 세로 가운데에서 2px 안
  //   (시험판 57: 홈 줄 높이 60보다 낮은 한 줄짜리 줄은 글이 위에 붙고 체크만 가운데로 내려가 6px 어긋났던 것)
  for (const row of document.querySelectorAll('.row.rowc')) {
    if (!vis(row)) continue;
    // 화면 가장자리에 걸쳐 일부만 보이는 줄도 있으니, 보이는지(vis)가 아니라 그려진 자리(높이 · 숨김 아님)로 잰다
    const drawn = x => { const q = cs(x); return x.getBoundingClientRect().height > 0 && q.visibility !== 'hidden' && q.display !== 'none'; };
    const parts = Array.from(row.querySelectorAll(':scope > .row-main :is(.rc-ic, .row-time b, .row-time small, .row-title, .rc-sub)')).filter(drawn);
    if (!parts.length) continue;
    const t = Math.min(...parts.map(x => x.getBoundingClientRect().top)), b = Math.max(...parts.map(x => x.getBoundingClientRect().bottom)), cy = (t + b) / 2;
    for (const x of row.querySelectorAll(':scope > .chk:not(.chk-sp), :scope > .rc-warn')) {
      if (!drawn(x)) continue;
      const q = x.getBoundingClientRect(), d = (q.top + q.bottom) / 2 - cy;
      if (Math.abs(d) > 2) out.push({k: 'mid', p: path(x), t: txt(row).slice(0, 20), d: Math.round(d * 10) / 10});
    }
  }
  return out;
};
