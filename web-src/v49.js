/* ---------- 시험판 49 (대표 11/4 14:12 ~ 14:30) ----------
   1) 홈 '오늘 할 일' 줄은 ② '두 줄 + 오른쪽 출발 칸'(대표 결정 14:2x "일정이 여러 개가 된다면 저 방식이 효과적일 것 같다"):
      시작 · 끝 | 제목, 그 밑에 장소 한 줄(길면 …) | 오른쪽 칸에 출발 시각. 캘린더 이름 · 알림 시각 · '다음 · N분 뒤'는 뺀다
      (줄을 누르면 일정 창에서 다 보임). 지남 · 진행 중 · 곧 시작은 그대로(때를 놓치지 않게)
   2) 날짜 페이지 안에 삼성 캘린더 같은 달력: 한 번 누르면 그날, 이어서 뒤의 날을 누르면 그날까지(여러 날). 페이지 안이라 창의 줄은 움직이지 않는다
   3) 일정 창: 제목 오른쪽에 이 일정 색 동그라미(누르면 캘린더 · 색), 아래에는 떠 있는 '취소 | 저장'(삼성), 고치기에서 '삭제'는 줄 목록 맨 아래
   (2 · 3은 대표가 고르지 않아 통합관리실 추천안, 14:12 삼성 캘린더 사진 "일정 등록 방식과 디자인 참고") */

/* 1) 목록 줄 C(시험판 56 · 대표 11/5 선택실 2에서 'C 종류 아이콘 · 체크 오른쪽', 결정 기록 D-29) -----------------------
   일정 줄(홈 · 캘린더 주 · 일 · 날짜 창 · 찾기 · 목록 창), 홈의 수업 줄 · 루틴 줄이 모두 같은 줄 하나를 쓴다:
     [종류 아이콘 | 시각(시작, 아래에 끝) | 이름 + 둘째 줄 하나 | 체크]
   - 종류 아이콘 한 세트: 일정 달력 · 루틴 되풀이 · 수업 책. 같은 크기 · 굵기
   - 둘째 줄은 하나만. 때를 놓치지 않게 상태(지남 · 쉼 · 진행 중 · 곧 시작 · 여러 날)가 있으면 그것, 없으면 출발 → 장소 → 남은 시간(다음 일정)
   - 오른쪽은 늘 체크(하면 이름에 가로줄). '자세히 ⌄' · 오른쪽 출발 칸 · '확인' 단추는 없다. 줄을 누르면 열린다
   - 다음 일정 하나만 연보라 바탕(v30.js) · 모양은 app.css '목록 줄' 한 곳
   시험판 57(대표 11/5 선택실 3 '다' · 메모): 체크한 일정은 시각 · 이름 가로줄 + 줄 흐리게. 시간이 지났는데 체크하지 않은 일정(확인 필요)은
   조금 연하게 + 체크 왼쪽에 확인 필요 아이콘(동그라미 안 느낌표, 깜박임). 체크 · 아이콘은 줄 세로 가운데 */
function bxRcIcon(kind){ return kind === 'rt' ? ICON.loop : kind === 'tt' ? BX_ICONS.book : ICON.cal; }
function bxR49Go(it){
  if (!it || it.done || !it.start || isLate(it) || typeof tvPlan !== 'function') return null;
  const p = tvPlan(it); if (!p) return null;
  if (p.travel && p.leave) return {t: bxT(p.leave), s: '출발'};
  if (p.rt && p.start) return {t: bxT(p.start), s: '준비'};
  return null;
}
// 확인 필요 아이콘(체크 왼쪽). 앱 아이콘 세트의 alertc
function bxRcWarnHtml(){ return '<span class="rc-warn" role="img" aria-label="확인 필요">' + ICON.alertc + '</span>'; }
// 줄을 C 모양으로: 아이콘은 누르는 칸 맨 앞, 체크는 맨 뒤, 둘째 줄은 하나(sub: 이미 이스케이프한 글). warn = 확인 필요
function bxRcShape(row, kind, sub, subCls, tail, warn){
  row.classList.add('rowc'); row.dataset.kind = kind;
  const main = row.querySelector(':scope > .row-main'); if (!main) return;
  if (!main.querySelector(':scope > .rc-ic')) main.insertAdjacentHTML('afterbegin', '<span class="rc-ic" aria-hidden="true">' + bxRcIcon(kind) + '</span>');
  row.querySelectorAll(':scope > .lamp, :scope > .tt-dot').forEach(x => x.remove());
  const chk = row.querySelector(':scope > .chk'); if (chk) row.appendChild(chk);
  row.classList.toggle('bx-ckw', !!warn);
  if (warn && !row.querySelector(':scope > .rc-warn')) (chk ? chk : main).insertAdjacentHTML(chk ? 'beforebegin' : 'afterend', bxRcWarnHtml());
  const body = main.querySelector('.row-body'); if (!body) return;
  const old = body.querySelector(':scope > .row-meta'); if (old) old.remove();
  if (sub || tail) body.insertAdjacentHTML('beforeend', '<span class="row-meta"><span class="meta rc-sub' + (subCls ? ' ' + subCls : '') + '">' + (sub || '') + '</span>' + (tail || '') + '</span>');
}
// 일정 줄의 둘째 줄: 날짜(지난 일 · 찾기) + [지남 · 쉼 · 진행 중 · 곧 시작 · 출발 · 여러 날 · 장소] 가운데 먼저 있는 것 하나
function bxRcItem(row, it, o){
  const meta = row.querySelector('.row-meta'), kids = meta ? Array.from(meta.children) : [];
  const txt = m => m ? m.textContent.replace(/\s+/g, ' ').trim() : '';
  const late = kids.find(m => m.classList.contains('late')), off = kids.find(m => m.classList.contains('bx-off-tag'));
  const pulse = kids.find(m => m.querySelector('.pulse')), span = kids.find(m => m.classList.contains('bx-span-d'));
  const att = kids.find(m => m.classList.contains('bx-att-m'));
  const date = o && o.showDate && it.date ? relDay(it.date, M.today) : '';
  const go = bxR49Go(it);
  let sub = '', cls = '';
  if (late) { sub = esc(txt(late)); cls = 'warn'; }
  else if (off) { sub = esc(txt(off)); }
  else if (pulse) { sub = esc(txt(pulse)); cls = 'live'; }
  else if (go) { sub = esc(go.t + ' ' + go.s); cls = 'go'; }
  else if (span) { sub = esc(txt(span)); }
  // 시험판 72(결정 사안 d20261106-maplook B · 선택실 9 · 2번 B): 장소가 있으면 둘째 줄 맨 앞에 장소(보라 밑줄) + 상태 하나.
  // 장소 글자를 누르면 휴대폰 지도 앱(v44.js bxOpenMap · data-bxmapq), 줄의 나머지를 누르면 지금처럼 일정 창. 끝낸 일정은 글자만(누르지 않음).
  // 자리가 모자라면 장소가 먼저 줄어든다(…) — 상태(출발 시각 등)는 끝까지 보이게(rc-ls · rc-st, app.css).
  // 상태가 없으면 rc-lo(장소만) — 다음 일정이면 v30.js가 그 뒤에 남은 시간을 붙인다
  const loc = String(it.location || '').replace(/\s+/g, ' ').trim();
  if (loc && !it.done) {
    const l = esc(loc), only = !sub;
    sub = (date ? '<span class="rc-st">' + esc(date) + ' · </span>' : '') + '<span class="rc-loc" role="link" data-bxmapq="' + l + '" aria-label="지도 앱에서 ' + l + ' 찾기">' + l + '</span>' +
      (sub ? '<span class="rc-st"> · ' + sub + '</span>' : '');
    cls = (cls ? cls + ' ' : '') + 'rc-ls' + (only ? ' rc-lo' : '');
  } else {
    if (loc && !sub) sub = '<span class="rc-loc0">' + esc(loc) + '</span>';
    if (date) sub = esc(date) + (sub ? ' · ' + sub : '');
  }
  bxRcShape(row, 'it', sub, cls, att ? '<span class="meta rc-att bx-att-m">' + att.innerHTML + '</span>' : '', !!late && !it.done);
}
const bxRowHtml49 = rowHtml;
rowHtml = function(it, o){
  const h = bxRowHtml49.apply(this, arguments);
  if (!window.BX_APP || !it) return h;
  try {
    const tp = document.createElement('template'); tp.innerHTML = h;
    const row = tp.content.firstElementChild; if (!row || !row.classList.contains('row')) return h;
    bxRcItem(row, it, o);
    return row.outerHTML;
  } catch (e) { return h; }
};
// 오늘 할 일 안의 수업 줄: 책 아이콘 · 장소 한 줄(휴강이면 '휴강 · 알람 쉼') · 체크(그날 다녀왔어요, timetable.js bx-tt-done)
// 끝난 수업은 흐리게(past)만, 가로줄은 체크했을 때만
const bxTtToday49 = ttTodayHtml;
ttTodayHtml = function(ds){
  const h = bxTtToday49.apply(this, arguments);
  if (!window.BX_APP || !h) return h;
  ds = ds || M.today;
  try {
    const tp = document.createElement('template'); tp.innerHTML = h;
    tp.content.querySelectorAll('.row.tt-row').forEach(row => {
      const main = row.querySelector('.row-main'), id = main ? main.dataset.id : '', e = id ? ttList().find(x => x.id === id) : null;
      const off = row.classList.contains('bx-off'), past = row.classList.contains('done'), done = !!(e && e.doneOn && e.doneOn[ds]);
      row.classList.remove('done'); if (past) row.classList.add('past'); if (done) row.classList.add('done');
      const offTag = row.querySelector('.bx-off-tag');
      bxRcShape(row, 'tt', off ? esc(offTag ? offTag.textContent : '휴강') : e && e.place ? esc(e.place) : '', '');
      row.insertAdjacentHTML('beforeend', off ? '<span class="chk chk-sp" aria-hidden="true"></span>'
        : '<button type="button" class="chk" data-act="bx-tt-done" data-id="' + esc(id) + '" data-date="' + esc(ds) + '" aria-pressed="' + done + '" aria-label="' + (done ? '다녀옴 취소: ' : '다녀왔어요: ') + esc(e ? e.name : '') + '">' + ICON.check + '</button>');
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

/* 3) 일정 창: 아래 '취소 | 저장' · '삭제'는 줄 목록 맨 아래
   시험판 60(대표 11/5 22:03 "생상선택 버튼은 자세히에 들어가있어도 되는거 아닐까? 어짜피 기본값으로 설정된 캘린더에 저장되는것이 기본"):
   제목 옆 색 동그라미는 뺐다. 캘린더 · 색은 '자세히'의 캘린더 줄에서 */
function bxEd49(){
  // 일정 창(새 일정 · 일정 수정)만. 처음 그릴 때는 아직 bx-esheet 이름표가 없어서 칸으로 찾는다
  const sh = document.querySelector('#sheet-root .sheet'); if (!sh || !F || !sh.querySelector('#f-title') || !sh.querySelector('#f-chips')) return;
  const tin = document.getElementById('f-title'), row = tin && tin.parentNode;
  // 시험판 56(일정 넣기 나): 꼭 적을 것은 제목 칸 하나. 위에 이름표, 칸은 보라 테(app.css). 날짜 · 시간 · 장소는 적은 말에서 채워진다
  if (row && !sh.querySelector('.bx-must')) row.insertAdjacentHTML('beforebegin', '<p class="bx-must">꼭 적을 것 <em>무엇을</em></p>');
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
    // 줄 목록을 다시 그리면 '삭제' 줄을 맨 아래에 다시 붙인다
    const list = document.getElementById('f-chips');
    if (list && F.mode === 'edit' && !list.querySelector('.bx-er-del')) {
      list.insertAdjacentHTML('beforeend', '<button type="button" class="bx-er bx-er-del" data-act="delete"><span class="bx-er-ic" aria-hidden="true">' + ICON.trash + '</span><span class="bx-er-t">일정 삭제</span></button>');
    }
  }
  return r;
};
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
