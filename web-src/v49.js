/* ---------- 시험판 49 (대표 11/4 14:12 ~ 14:30) ----------
   1) 홈 '오늘 할 일' 줄은 ② '두 줄 + 오른쪽 출발 칸'(대표 결정 14:2x "일정이 여러 개가 된다면 저 방식이 효과적일 것 같다"):
      시작 · 끝 | 제목, 그 밑에 장소 한 줄(길면 …) | 오른쪽 칸에 출발 시각. 캘린더 이름 · 알림 시각 · '다음 · N분 뒤'는 뺀다
      (줄을 누르면 일정 창에서 다 보임). 지남 · 진행 중 · 곧 시작은 그대로(때를 놓치지 않게)
   2) 날짜 페이지 안에 삼성 캘린더 같은 달력: 한 번 누르면 그날, 이어서 뒤의 날을 누르면 그날까지(여러 날). 페이지 안이라 창의 줄은 움직이지 않는다
   3) 일정 창: 제목 오른쪽에 이 일정 색 동그라미(누르면 캘린더 · 색), 아래에는 떠 있는 '취소 | 저장'(삼성), 고치기에서 '삭제'는 줄 목록 맨 아래
   (2 · 3은 대표가 고르지 않아 통합관리실 추천안, 14:12 삼성 캘린더 사진 "일정 등록 방식과 디자인 참고") */

/* 1) 홈 줄 ② ------------------------------------------------------------- */
function bxR49Go(it){
  if (!it || it.done || !it.start || isLate(it) || typeof tvPlan !== 'function') return null;
  const p = tvPlan(it); if (!p) return null;
  if (p.travel && p.leave) return {t: bxT(p.leave), s: '출발'};
  if (p.rt && p.start) return {t: bxT(p.start), s: '준비'};
  return null;
}
// 줄 정리: 남길 것만(날짜 · 여러 날 · 지남 · 진행 중 · 곧 시작 · 장소 · 📎 첨부 수), 장소는 글자만
function bxR49Tidy(row, it, o){
  const meta = row.querySelector('.row-meta');
  if (meta) {
    const keep = [], rel = it && it.date && typeof relDay === 'function' ? relDay(it.date, M.today) : null;
    let place = null;
    Array.from(meta.children).forEach((m, i) => {
      const c = m.classList;
      if (c.contains('late') || m.querySelector('.pulse') || c.contains('bx-span-d') || c.contains('bx-off-tag') || (o && o.showDate && i === 0)) keep.push(m);
      else if (!place && it && it.location && m.querySelector('svg') && m.textContent.trim() === String(it.location).trim()) place = m;
      else if (c.contains('bx-att-m')) keep.push(m);
    });
    if (place) { place.querySelectorAll('svg').forEach(s => s.remove()); place.className = 'meta bx-r49-pl'; place.textContent = String(it ? it.location : place.textContent).trim(); keep.splice(keep.length && keep[keep.length - 1].classList.contains('bx-att-m') ? keep.length - 1 : keep.length, 0, place); }
    meta.textContent = '';
    keep.forEach(k => meta.appendChild(k));
    if (!keep.length) meta.remove();
  }
}
const bxRowHtml49 = rowHtml;
rowHtml = function(it, o){
  const h = bxRowHtml49.apply(this, arguments);
  if (!window.BX_APP || !it) return h;
  try {
    const tp = document.createElement('template'); tp.innerHTML = h;
    const row = tp.content.firstElementChild; if (!row || !row.classList.contains('row')) return h;
    row.classList.add('bx-r49');
    bxR49Tidy(row, it, o);
    const go = bxR49Go(it), main = row.querySelector('.row-main');
    if (go && main) main.insertAdjacentHTML('beforeend', '<span class="bx-r49-go" aria-label="' + go.t + ' ' + go.s + '"><b class="tnum">' + go.t + '</b><small>' + go.s + '</small></span>');
    return row.outerHTML;
  } catch (e) { return h; }
};
// 오늘 할 일 안의 수업 줄도 같은 모양(장소는 글자만, 알림 · 시간표 이름은 뺌)
const bxTtToday49 = ttTodayHtml;
ttTodayHtml = function(){
  const h = bxTtToday49.apply(this, arguments);
  if (!window.BX_APP || !h) return h;
  try {
    const tp = document.createElement('template'); tp.innerHTML = h;
    tp.content.querySelectorAll('.row.tt-row').forEach(row => {
      row.classList.add('bx-r49');
      const meta = row.querySelector('.row-meta'); if (!meta) return;
      Array.from(meta.children).forEach(m => {
        if (m.classList.contains('bx-off-tag')) return;
        if (m.querySelector('svg') && !m.classList.contains('bx-rem') && !m.classList.contains('bx-tts-m')) { m.querySelectorAll('svg').forEach(s => s.remove()); m.className = 'meta bx-r49-pl'; return; }
        m.remove();
      });
      if (!meta.children.length) meta.remove();
    });
    return tp.innerHTML;
  } catch (e) { return h; }
};

/* 2) 날짜 페이지 안 달력 --------------------------------------------------- */
let bxDcalYM = null, bxDcalNext = 'start', bxDcalPanel = null, bxDcalLast = null;
function bxDcalHtml(){
  const s0 = F.date, s1 = bxFMulti() ? F.endDate : F.date;
  if (!bxDcalYM || bxDcalLast !== s0) { const d0 = parseYmd(isDate(s0) ? s0 : M.today); if (!bxDcalYM || bxDcalLast !== s0) bxDcalYM = [d0.getFullYear(), d0.getMonth()]; }
  bxDcalLast = s0;
  const y = bxDcalYM[0], m = bxDcalYM[1], ws = +M.settings.weekStart || 0;
  const first = new Date(y, m, 1), off = (first.getDay() - ws + 7) % 7, days = new Date(y, m + 1, 0).getDate(), n = Math.ceil((off + days) / 7) * 7;
  const wd = ['일', '월', '화', '수', '목', '금', '토'], multi = s1 > s0;
  let cells = '';
  for (let i = 0; i < n; i++) {
    const d = addDays(first, i - off), ds = ymd(d), dow = d.getDay();
    const cls = ['bx-dc'];
    if (d.getMonth() !== m) cls.push('other');
    if (ds === M.today) cls.push('today');
    if (dow === 0 || HOLIDAYS[ds]) cls.push('sun'); else if (dow === 6) cls.push('sat');
    if (ds === s0) cls.push('s');
    if (multi && ds === s1) cls.push('e');
    if (multi && ds > s0 && ds < s1) cls.push('in');
    if (multi && (ds === s0 || ds === s1)) cls.push('rng');
    cells += '<button type="button" class="' + cls.join(' ') + '" data-bxdcd="' + ds + '" aria-pressed="' + (ds >= s0 && ds <= s1) + '" aria-label="' + esc(fmtMD(ds)) + (HOLIDAYS[ds] ? ' ' + esc(HOLIDAYS[ds]) : '') + '"><span>' + d.getDate() + '</span></button>';
  }
  const note = multi ? '<b>' + esc(bxRangeLabel(s0, s1)) + '</b> · ' + (diffDays(s1, s0) + 1) + '일간' : bxDcalNext === 'end' ? '<b>' + esc(fmtMD(s0)) + '</b> · 이어서 뒤의 날을 누르면 그날까지(여러 날)' : '<b>' + esc(fmtMD(s0)) + '</b> · 한 번 누르면 그날, 이어서 뒤의 날을 누르면 그날까지';
  return '<div class="bx-dcal" role="group" aria-label="달력에서 날짜 고르기"><div class="bx-dcal-h"><button type="button" class="icon-btn" data-bxdcal="-1" aria-label="지난달">' + ICON.chevL + '</button>' +
    '<b>' + y + '년 ' + (m + 1) + '월</b><button type="button" class="icon-btn" data-bxdcal="1" aria-label="다음 달">' + ICON.chevR + '</button></div>' +
    '<div class="bx-dcal-w" aria-hidden="true">' + Array.from({length: 7}, (_, i) => { const k = (ws + i) % 7; return '<span class="' + (k === 0 ? 'sun' : k === 6 ? 'sat' : '') + '">' + wd[k] + '</span>'; }).join('') + '</div>' +
    '<div class="bx-dcal-g">' + cells + '</div></div><p class="p small bx-ep-note bx-dcal-n" id="bx-dcal-n">' + note + '</p>';
}
function bxDcalPut(){
  const fd = document.getElementById('f-date'); if (!fd || !window.BX_APP || !F) return;
  const old = fd.querySelector('.bx-dcal'), oldN = fd.querySelector('.bx-dcal-n');
  if (old) old.remove(); if (oldN) oldN.remove();
  const pk = fd.querySelector(':scope > .picks');
  if (pk) pk.insertAdjacentHTML('afterend', bxDcalHtml()); else fd.insertAdjacentHTML('afterbegin', bxDcalHtml());
}
const bxDrawFDate49 = drawFDate;
drawFDate = function(){
  const r = bxDrawFDate49.apply(this, arguments);
  bxDcalPut();
  return r;
};
const bxDrawFPanel49 = drawFPanel;
drawFPanel = function(){
  // 날짜 페이지를 새로 열 때: 첫 누름은 '그날'
  if (F && F.panel === 'date' && bxDcalPanel !== 'date') { bxDcalNext = 'start'; bxDcalYM = null; }
  bxDcalPanel = F ? F.panel : null;
  return bxDrawFPanel49.apply(this, arguments);
};
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest || !F) return;
  const nav = ev.target.closest('[data-bxdcal]');
  if (nav) {
    ev.preventDefault(); ev.stopPropagation();
    const d = new Date(bxDcalYM[0], bxDcalYM[1] + (+nav.dataset.bxdcal), 1); bxDcalYM = [d.getFullYear(), d.getMonth()];
    bxDcalPut(); return;
  }
  const c = ev.target.closest('[data-bxdcd]'); if (!c) return;
  ev.preventDefault(); ev.stopPropagation();
  const ds = c.dataset.bxdcd;
  if (bxDcalNext === 'end' && ds > F.date) { F.multi = true; F.endDate = ds; F.spanN = diffDays(ds, F.date) + 1; bxDcalNext = 'start'; }
  else { F.date = ds; F.multi = false; F.endDate = ''; F.spanN = 0; bxDcalNext = 'end'; const d = parseYmd(ds); bxDcalYM = [d.getFullYear(), d.getMonth()]; }
  F.bxD0 = F.date; F.touchedDate = true; F.multiParsed = false;
  bxDcalLast = F.date;
  drawFDate(); drawFHint(); if (typeof updRemWhen === 'function') updRemWhen();
}, true);

/* 3) 일정 창: 제목 옆 색 동그라미 · 아래 '취소 | 저장' · '삭제'는 줄 목록 맨 아래 */
function bxEd49(){
  // 일정 창(새 일정 · 일정 수정)만. 처음 그릴 때는 아직 bx-esheet 이름표가 없어서 칸으로 찾는다
  const sh = document.querySelector('#sheet-root .sheet'); if (!sh || !F || !sh.querySelector('#f-title') || !sh.querySelector('#f-chips')) return;
  const tin = document.getElementById('f-title'), row = tin && tin.parentNode;
  if (row && !row.querySelector('.bx-tdot')) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bx-tdot'; b.dataset.bxtdot = '1';
    tin.insertAdjacentElement('afterend', b);
  }
  const dot = row && row.querySelector('.bx-tdot');
  if (dot) { dot.style.setProperty('--c', bxFColor()); dot.setAttribute('aria-label', '이 일정 색 · 캘린더 ' + (bxCalName(F.categoryId) || '없음')); }
  const f = document.getElementById('sheet-f');
  if (f && !f.querySelector('.bx-pill49')) {
    const save = f.querySelector('[data-act="save"]');
    if (save) {
      const pill = document.createElement('div'); pill.className = 'bx-pill49';
      pill.innerHTML = '<button type="button" class="bx-pl-b" data-act="sheet-close">취소</button><i aria-hidden="true"></i>';
      save.className = 'bx-pl-b bx-pl-save'; pill.appendChild(save);
      f.appendChild(pill);
    }
    const del = f.querySelector('[data-act="delete"]'), list = document.getElementById('f-chips');
    if (del && list && !list.querySelector('.bx-er-del')) {
      del.className = 'bx-er bx-er-del';
      del.innerHTML = '<span class="bx-er-ic" aria-hidden="true">' + ICON.trash + '</span><span class="bx-er-t">일정 삭제</span>';
      list.appendChild(del);
    }
    f.classList.add('bx-f49');
  }
}
const bxDrawEdit49 = drawEdit;
drawEdit = function(){
  const r = bxDrawEdit49.apply(this, arguments);
  if (window.BX_APP) { bxEd49(); setTimeout(bxEd49, 0); }
  return r;
};
const bxDrawFChips49 = drawFChips;
drawFChips = function(){
  const r = bxDrawFChips49.apply(this, arguments);
  if (window.BX_APP && F) {
    const dot = document.querySelector('#sheet-root .bx-tdot'); if (dot) dot.style.setProperty('--c', bxFColor());
    // 줄 목록을 다시 그리면 '삭제' 줄을 맨 아래에 다시 붙인다
    const list = document.getElementById('f-chips');
    if (list && F.mode === 'edit' && !list.querySelector('.bx-er-del')) {
      list.insertAdjacentHTML('beforeend', '<button type="button" class="bx-er bx-er-del" data-act="delete"><span class="bx-er-ic" aria-hidden="true">' + ICON.trash + '</span><span class="bx-er-t">일정 삭제</span></button>');
    }
  }
  return r;
};
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest || !F) return;
  const d = ev.target.closest('[data-bxtdot]'); if (!d) return;
  ev.preventDefault(); ev.stopPropagation();
  const r = document.querySelector('#f-chips [data-fpanel="cat"]'); if (r) r.click();
}, true);

// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
