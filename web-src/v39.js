/* ---------- 시험판 39: 여러 날 일정 · 분류를 캘린더로(대표 결정 2026-11-03 21:4x~21:51, 정할 것 13 · 14번, 결정 기록 D-15) ----------
   1) 여러 날 일정(대표 18:08 "연속되는 일정 표현 부분이 약했다", 타임트리 사진)
      - 일정에 끝나는 날(endDate)을 둔다. 날짜(date)는 첫날이다.
      - 달력: 날짜를 잇는 색 막대. 주가 바뀌면 다음 줄에서 '↳ 제목'으로 이어 그린다. 칸이 넘치면 '+N'.
      - 홈 · 주간 · 날짜 창: '2/3일째 · ~11/8 (일)' 줄. 시간이 있으면 첫날은 그 시각 자리에, 다른 날은 맨 위에.
      - 알림은 첫날 시작에만. 기간이라서 끝나도 '확인 필요'로 묻지 않는다(체크는 할 수 있음).
   2) 캘린더(대표 21:4x "처음에 배정되는 색은 지정해 두고 원할 때만 바꾸게 하면 고를 것이 두 배라는 느낌이 아니라
      커스터마이징을 하는 부분이구나 생각하지 않을까")
      - 지금의 '분류'를 캘린더로 부른다. 캘린더마다 이름 · 색(만들 때 쓰지 않은 색부터 저절로) · 홈에 보이기 · 새 일정의 기본.
      - 일정 색은 캘린더 색이 기본이고, 새 일정 창의 캘린더 칸에서 그 일정만 다른 색으로 바꿀 수 있다.
   3) '홈에 보이기'(대표 21:51 "별도 동작이지요?"): 끄면 홈 · 위젯 · 아침 요약의 그날 목록에서만 빠진다.
      캘린더 화면 · 알림 · 놓친 일정(확인 필요)은 그대로.
   4) 캘린더 화면 위 칩: [전체] [캘린더…] [휴대폰 캘린더…] [＋]. 하나를 누르면 그 캘린더만 보인다. 앱을 다시 열면 전체. */

var bxCalSel = '';

/* ---------- 여러 날 ---------- */
function bxSpan(it){ return !!(it && it.endDate && it.endDate > it.date && isDate(it.endDate)); }
function bxSpanN(it){ return bxSpan(it) ? diffDays(it.endDate, it.date) + 1 : 1; }
// 같은 날 안에서는 여러 날 일정이 먼저(목록 맨 위 줄)
function bxByDay(a, b){ return (bxSpan(b) ? 1 : 0) - (bxSpan(a) ? 1 : 0) || byTime(a, b); }
function bxMDw(ds){ const d = parseYmd(ds); return (d.getMonth() + 1) + '/' + d.getDate() + ' (' + WD[d.getDay()] + ')'; }
// '2/3일째 · ~11/8 (일)', 마지막 날은 '3/3일째 · 마지막 날'
function bxSpanLabel(it, ds){
  const n = bxSpanN(it), k = Math.max(1, Math.min(n, diffDays(ds || M.today, it.date) + 1));
  return k + '/' + n + '일째 · ' + (k === n ? '마지막 날' + (it.end ? ' ~' + it.end : '') : '~' + bxMDw(it.endDate));
}
// '11월 6일 ~ 8일', 달이 다르면 '11월 30일 ~ 12월 2일'
function bxRangeLabel(a, b){
  const x = parseYmd(a), y = parseYmd(b), now = new Date();
  return (x.getFullYear() !== now.getFullYear() ? x.getFullYear() + '년 ' : '') + (x.getMonth() + 1) + '월 ' + x.getDate() + '일 ~ ' +
    (y.getFullYear() !== x.getFullYear() ? y.getFullYear() + '년 ' + (y.getMonth() + 1) + '월 ' : y.getMonth() !== x.getMonth() ? (y.getMonth() + 1) + '월 ' : '') + y.getDate() + '일';
}
function bxRangeShort(it){ return bxRangeLabel(it.date, it.endDate); }
// 알림 글 · 아침 요약: '10:00 시작 · ~11/8 (일) 15:00'
function bxSpanTime(it){ return (it.start ? it.start + ' 시작' : '종일') + ' · ~' + bxMDw(it.endDate) + (it.end ? ' ' + it.end : ''); }
// 목록 줄의 시각 칸: 첫날 시작 · 가운데 날 종일 · 마지막 날 끝
function bxSpanTimeCol(it, ds){
  ds = ds || M.today;
  if (it.start && ds === it.date) return '<b>' + it.start + '</b><small>시작</small>';
  if (it.end && ds === it.endDate) return '<b class="allday">~' + it.end + '</b>';
  return '<b class="allday">종일</b>';
}

/* ---------- 색 ---------- */
function bxColorVar(hex){ const t = COLOR_TOKEN[String(hex || '').toLowerCase()]; return t ? 'var(' + t + ')' : hex; }
// 일정 색 = 고른 색, 없으면 캘린더 색
function bxItemColor(it){ return it && it.color && !it.pc ? bxColorVar(it.color) : catColor(it && it.categoryId); }
function bxItemHex(it){
  if (!it) return '';
  if (it.color && !it.pc) return it.color;
  const c = M.catMap.get(it.categoryId); return c ? c.color : (typeof PC !== 'undefined' && PC.colors.get(it.categoryId)) || '';
}
// 막대 글자색: 밝은 색(노랑)은 진한 글자
function bxInkOn(hex){
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return '#fff';
  const n = parseInt(m[1], 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) > 160 ? '#1d2127' : '#fff';
}

/* ---------- 캘린더 ---------- */
function bxPcHomeOff(){ return typeof pcCfg === 'function' ? (pcCfg().homeOff || []) : []; }
function bxCalHome(id){
  if (!id) return true;
  if (/^pcc_/.test(id)) return !bxPcHomeOff().includes(String(id).slice(4));
  const c = M.catMap.get(id); return !c || c.home !== false;
}
// 홈 · 위젯 · 아침 요약에 넣을지. 놓친 일정은 늘 보인다
function bxHomeOk(it){ return !it || bxCalHome(it.categoryId) || isLate(it); }
function bxHomeItems(list){ return list.filter(bxHomeOk); }
function bxCalOk(it){ return !bxCalSel || (it.categoryId || '') === bxCalSel; }
function bxCalFilter(list){ return bxCalSel && (S.view === 'month' || S.view === 'week' || S.view === 'day') ? list.filter(bxCalOk) : list; }
// 읽고 있는 휴대폰 캘린더(칩 · 캘린더 목록). 고른 캘린더 목록이 있으면 그것, 없으면 읽은 일정에서
function bxPcCals(){
  if (typeof pcCfg !== 'function' || !pcCfg().on) return [];
  const cfg = pcCfg(), map = new Map();
  (PC.cals || []).forEach(c => { if (cfg.ids && !cfg.ids.includes(String(c.id))) return; const id = 'pcc_' + c.id; map.set(id, {id, name: c.name || '휴대폰 캘린더', color: pcColor(c.color)}); });
  M.items.forEach(i => { if (!i.pc || map.has(i.categoryId)) return; const e = i.pcEv || {}; map.set(i.categoryId, {id: i.categoryId, name: e.calendar || '휴대폰 캘린더', color: PC.colors.get(i.categoryId) || pcColor(e.color)}); });
  return Array.from(map.values());
}
function bxCalName(id){ const c = M.catMap.get(id); if (c) return c.name; const p = bxPcCals().find(x => x.id === id); return p ? p.name : ''; }
// 새 일정의 캘린더: 캘린더 화면에서 칩을 골라 두었으면 그 캘린더, 아니면 '새 일정의 기본', 그것도 없으면 캘린더 없음(전과 같음)
function bxDefCal(){
  if (bxCalSel && M.catMap.has(bxCalSel) && (S.view === 'month' || S.view === 'week' || S.view === 'day')) return bxCalSel;
  const d = M.settings.defCal; return d && M.catMap.has(d) ? d : null;
}

/* ---------- 월간 칸: 여러 날 막대 + 하루 일정 ----------
   주마다 자리(줄)를 나눈다. 여러 날 일정이 먼저(일찍 시작 · 긴 것부터) 가장 위 빈 줄을 잡고, 하루 일정이 남은 줄을 채운다.
   막대는 그 주에서 시작하는 칸에 그리고 이어지는 칸 너비만큼 넓힌다(누르기는 아래 칸으로 지나감). 보이는 줄은 휴대폰 2 · 넓은 화면 3 */
function bxChipHtml(i){
  const lt = isLate(i), c = lt ? 'var(--warn)' : i.done ? 'var(--done)' : bxItemColor(i);
  return '<span class="c-chip' + (i.done ? ' done' : '') + (lt ? ' late' : '') + '" style="--c:' + c + '" data-item="' + esc(i.id) + '" title="두 번 누르면 수정"><i class="dot" style="--c:' + c + '"></i><span>' + (i.start ? '<b class="c-t">' + i.start + ' </b>' : '') + (esc(i.title) || '(제목 없음)') + '</span></span>';
}
function bxBarHtml(g){
  const it = g.it, n = g.e - g.s + 1;
  return '<span class="c-bar' + (g.head ? ' h' : '') + (g.tail ? ' t' : '') + (it.pc ? ' pc' : '') + (it.done ? ' done' : '') + '" style="--c:' + (it.done ? 'var(--done)' : bxItemColor(it)) + ';--n:' + n + ';--on:' + (it.done ? '#fff' : bxInkOn(bxItemHex(it))) + '" data-item="' + esc(it.id) + '"><span>' + (g.head ? '' : '↳ ') + (esc(it.title) || '(제목 없음)') + '</span></span>';
}
function bxMonthCellsHtml(y, m){
  // 시험판 43: 칸 높이에 맞춰 2~4줄(web-src/v43.js bxCalFit이 잰 값). 넓은 화면은 3줄
  const days = monthCells(y, m), cmax = window.innerWidth < 720 ? (typeof bxCalLanes === 'number' && bxCalLanes >= 2 ? bxCalLanes : 2) : 3, out = [];
  for (let w = 0; w < days.length; w += 7) {
    const wk = days.slice(w, w + 7).map(d => ymd(d)), w0 = wk[0], w6 = wk[6], seen = new Set(), segs = [];
    wk.forEach((ds, col) => bxCalFilter(dayItems(ds)).forEach(it => {
      if (seen.has(it.id)) return; seen.add(it.id);
      if (bxSpan(it)) segs.push({it, span: true, s: it.date < w0 ? 0 : wk.indexOf(it.date), e: it.endDate > w6 ? 6 : wk.indexOf(it.endDate), head: it.date >= w0, tail: it.endDate <= w6});
      else segs.push({it, span: false, s: col, e: col});
    }));
    segs.sort((a, b) => (b.span ? 1 : 0) - (a.span ? 1 : 0) || a.s - b.s || (b.e - b.s) - (a.e - a.s) || bySummary(a.it, b.it));
    const lv = [];
    segs.forEach(g => {
      for (let L = 0; ; L++) {
        const row = lv[L] || (lv[L] = Array(7).fill(null));
        let free = true; for (let c = g.s; c <= g.e; c++) if (row[c]) { free = false; break; }
        if (free) { for (let c = g.s; c <= g.e; c++) row[c] = g; g.L = L; break; }
      }
    });
    wk.forEach((ds, col) => {
      const d = parseYmd(ds), hol = HOLIDAYS[ds], mine = segs.filter(g => g.s <= col && g.e >= col);
      const vis = mine.filter(g => g.L < cmax), hid = mine.length - vis.length, top = vis.reduce((a, g) => Math.max(a, g.L), -1);
      let lanes = '';
      for (let L = 0; L <= top; L++) {
        const g = vis.find(x => x.L === L);
        lanes += !g ? '<span class="c-gap"></span>' : g.span ? (col === g.s ? bxBarHtml(g) : '<span class="c-gap"></span>') : bxChipHtml(g.it);
      }
      const mmN = typeof bxMemoOn === 'function' && bxMemoOn() ? bxMemos(ds).length : 0;
      out.push('<button type="button" class="cell ' + dayClass(ds) + (d.getMonth() !== m ? ' other' : '') + (ds === M.today ? ' today' : '') + (ds === S.selDate ? ' sel' : '') + '" data-act="day-open" data-date="' + ds + '" title="두 번 누르면 이 날 일정 추가" aria-pressed="' + (ds === S.selDate) + '" aria-label="' + esc(fmtMD(ds)) + ' 일정 ' + mine.length + '개' + (mmN ? ' · 메모 ' + mmN + '개' : '') + '">' + (mmN ? '<i class="bx-mm-mark" aria-hidden="true"></i>' : '') +
        '<span class="c-top"><span class="c-num">' + d.getDate() + '</span>' + (hol ? '<span class="c-hol">' + esc(hol) + '</span>' : '') + '</span><span class="c-dots"></span><span class="c-chips">' + lanes + (hid ? '<span class="c-more">+' + hid + '</span>' : '') + '</span></button>');
    });
  }
  return out.join('');
}
// 월간 위 개수 줄도 고른 캘린더만
function bxMonthPick(i){ return !bxCalSel || S.view !== 'month' || bxCalOk(i); }

/* ---------- 캘린더 화면 위 칩 ---------- */
function bxCalChipsHtml(){
  const pcs = bxPcCals();
  if (bxCalSel && !M.catMap.has(bxCalSel) && !pcs.some(p => p.id === bxCalSel)) bxCalSel = '';
  const chip = (id, color, label, cls) => '<button type="button" class="bx-cchip' + (cls || '') + '" data-bxcsel="' + esc(id) + '" aria-pressed="' + (bxCalSel === id) + '">' + (color ? '<i class="bx-cdot" style="--c:' + color + '"></i>' : '') + '<span>' + esc(label) + '</span></button>';
  return '<div class="bx-cchips" role="group" aria-label="캘린더 고르기">' + chip('', '', '전체') +
    M.cats.map(c => chip(c.id, catColorRaw(c.id), c.name)).join('') + pcs.map(p => chip(p.id, p.color, p.name, ' pc')).join('') +
    '<button type="button" class="bx-cchip bx-cchip-add" data-act="bx-cals" aria-label="캘린더 만들기 · 관리">' + ICON.plus + '<span>캘린더</span></button></div>';
}
// 날짜 창(캘린더 화면에서 연 것)도 고른 캘린더만. 맨 위에 한 줄로 알린다
function bxCalFilterNote(){
  if (!bxCalSel || (S.view !== 'month' && S.view !== 'week')) return '';
  return '<p class="bx-cf-note"><i class="bx-cdot" style="--c:' + (/^pcc_/.test(bxCalSel) ? (PC.colors.get(bxCalSel) || 'var(--ink-3)') : catColorRaw(bxCalSel)) + '"></i><span>' + esc(bxCalName(bxCalSel)) + '만 보는 중</span><button type="button" class="btn sm" data-bxcsel="">전체 보기</button></p>';
}

/* ---------- 캘린더 목록 · 자세히(바텀 시트) ----------
   목록: 캘린더마다 색 · 이름 · 일정 수 · 홈에 보이기 스위치. 이름을 누르면 자세히(이름 · 색 · 홈에 보이기 · 새 일정의 기본 · 삭제) */
function bxCalCount(id){ return M.items.filter(i => i.categoryId === id).length; }
function bxCalRowHtml(id, color, name, sub, home, attr, ro){
  return '<div class="bx-arow bx-arow-sw bx-calrow" data-cal="' + esc(id) + '">' +
    (ro ? '<span class="bx-at">' : '<button type="button" class="bx-at" data-bxcal="' + esc(id) + '">') +
    '<b><i class="bx-cdot" style="--c:' + color + '"></i>' + esc(name) + '</b><small>' + esc(sub) + '</small>' + (ro ? '</span>' : '</button>') +
    '<i class="bx-adiv" aria-hidden="true"></i><span class="bx-calrow-sw">' + bxSwitch(attr, home, name + ' 홈에 보이기') + '<small>홈에 보이기</small></span></div>';
}
function bxCalsOpen(back){ openSheet({title: '캘린더', back: back || null, draw: bxCalsDraw, refresh: bxCalsDraw}); }
function bxCalsDraw(){
  const def = M.settings.defCal;
  let h = '<div class="bx-grp bx-cals">' + M.cats.map(c => bxCalRowHtml(c.id, catColorRaw(c.id), c.name, '일정 ' + bxCalCount(c.id) + '개' + (def === c.id ? ' · 새 일정의 기본' : ''), c.home !== false, 'data-bxcalhome')).join('') +
    '<button type="button" class="bx-cal-add" data-act="bx-cal-add">' + ICON.plus + '<span>캘린더 만들기</span></button></div>' +
    '<p class="p small bx-cal-note">홈에 보이기를 끄면 홈 · 위젯 · 아침 요약의 그날 목록에서만 빠져요. 캘린더 화면 · 알림 · 놓친 일정은 그대로예요.</p>';
  // 시험판 40: 시간표도 같은 목록에(캘린더 보완 안 ③ '캘린더 · 시간표 목록 · 홈에 보이기')
  if (typeof bxTtsRowsHtml === 'function' && bxModOn('tt')) h += '<h3 class="bx-ft-hd">시간표</h3><div class="bx-grp bx-cals">' + bxTtsRowsHtml() + '</div>';
  const pcs = bxPcCals();
  if (pcs.length) h += '<h3 class="bx-ft-hd">휴대폰 캘린더</h3><div class="bx-grp bx-cals">' + pcs.map(p => bxCalRowHtml(p.id, p.color, p.name, '읽기만 · 일정 ' + bxCalCount(p.id) + '개', bxCalHome(p.id), 'data-bxpchome', true)).join('') + '</div>' +
    '<p class="p small bx-cal-note">어느 휴대폰 캘린더를 읽을지는 설정 › 휴대폰 캘린더에서 골라요.</p>';
  setSheet(h, '');
}
function bxCalOpen(id, focus){
  openSheet({title: '캘린더', back: () => bxCalsOpen(), draw: () => bxCalDraw(id)});
  SH.bxCal = id;
  if (focus) { const i = document.getElementById('bx-cal-name'); if (i) { i.focus(); i.select(); } }
}
function bxCalDraw(id){
  const c = M.catMap.get(id); if (!c) { bxCalsOpen(); return; }
  const n = bxCalCount(id), def = M.settings.defCal === id, home = c.home !== false;
  const sw = COLORS.map(x => '<button type="button" class="swatch" style="--c:var(' + x[1] + ')" data-bxcalcol="' + x[0] + '" aria-label="' + x[2] + '" aria-pressed="' + (String(c.color).toLowerCase() === x[0]) + '"></button>').join('');
  setSheet('<div class="bx-grp bx-cald"><div class="fld"><label class="fld-l" for="bx-cal-name">이름</label><input id="bx-cal-name" class="inp full" data-bxcalname="' + esc(id) + '" value="' + esc(c.name) + '" maxlength="20" autocomplete="off" enterkeyhint="done"></div>' +
      '<div class="fld"><span class="fld-l">색</span><div class="swatches" role="group" aria-label="캘린더 색">' + sw + '</div></div></div>' +
    '<div class="bx-grp bx-cals"><div class="bx-arow bx-arow-sw"><span class="bx-at"><b>홈에 보이기</b><small>' + (home ? '홈 · 위젯 · 아침 요약에 보여요' : '홈에서 뺐어요 · 캘린더 화면에는 보여요') + '</small></span>' + bxSwitch('data-bxcalhome', home, '홈에 보이기') + '</div>' +
      '<div class="bx-arow bx-arow-sw"><span class="bx-at"><b>새 일정의 기본</b><small>' + (def ? '새 일정이 이 캘린더로 들어가요' : '켜면 새 일정이 이 캘린더로 들어가요') + '</small></span>' + bxSwitch('data-bxcaldef', def, '새 일정의 기본') + '</div></div>' +
    '<p class="p small bx-cal-note">일정 색은 처음에 이 캘린더 색을 따라요. 일정마다 새 일정 창의 캘린더 칸에서 바꿀 수 있어요.</p>' +
    '<div class="bx-grp bx-cals"><button type="button" class="bx-arow" data-act="bx-cal-del"><span class="bx-at"><b><span class="bx-adanger">캘린더 삭제</span></b><small>' + (n ? '일정 ' + n + '개 · 다른 캘린더로 옮기거나 함께 삭제' : '일정 없음') + '</small></span></button></div>', '');
}
// 삭제: 일정이 있으면 옮길 곳을 고르거나 함께 삭제(휴지통 30일). 되돌리기로 한 번에 되살린다
function bxCalDelDraw(id){
  const c = M.catMap.get(id); if (!c) { bxCalsOpen(); return; }
  const n = bxCalCount(id), others = M.cats.filter(x => x.id !== id);
  if (SH.bxTo === undefined) SH.bxTo = others.length ? others[0].id : '';
  setSheet('<p class="p bx-cal-delq">‘' + esc(c.name) + '’ 캘린더에 일정 ' + n + '개가 있어요.</p>' +
    '<div class="bx-grp bx-cald"><div class="fld"><span class="fld-l">일정을 옮길 캘린더</span><div class="picks">' +
      others.map(x => '<button type="button" class="pick" data-bxcalto="' + esc(x.id) + '" aria-pressed="' + (SH.bxTo === x.id) + '"><i class="dot" style="--c:' + catColorRaw(x.id) + '"></i>' + esc(x.name) + '</button>').join('') +
      '<button type="button" class="pick" data-bxcalto="" aria-pressed="' + (SH.bxTo === '') + '">캘린더 없음</button></div></div>' +
      '<button type="button" class="btn primary full" data-act="bx-cal-del-move">일정을 옮기고 캘린더 삭제</button></div>' +
    '<div class="bx-grp bx-cald"><button type="button" class="btn danger-line full" data-act="bx-cal-del-all">일정도 함께 삭제</button><p class="p small">삭제한 일정은 휴지통에 30일 동안 남아요.</p></div>', '');
}
function bxCalRemove(id, how){
  const c = M.catMap.get(id); if (!c) return;
  const its = M.items.filter(i => i.categoryId === id && !i.pc), def = M.settings.defCal === id;
  record([id].concat(its.map(i => i.id)).concat(def ? ['settings'] : []));
  its.forEach(i => patchDoc(i.id, how === 'all' ? {deletedAt: nowIso()} : {categoryId: how || null}));
  if (def) saveSettings({defCal: null});
  removeDoc(id);
  if (bxCalSel === id) bxCalSel = '';
  M = buildModel();
  bxCalsOpen();
  toast('‘' + c.name + '’ 캘린더를 삭제했어요' + (its.length ? (how === 'all' ? ' · 일정 ' + its.length + '개는 휴지통으로' : ' · 일정 ' + its.length + '개를 옮겼어요') : ''), [['되돌리기', doUndo]]);
}
function bxCalAdd(){
  const id = rid('c_'), used = new Set(M.cats.map(c => String(c.color).toLowerCase()));
  const color = (COLORS.find(c => !used.has(c[0])) || COLORS[M.cats.length % COLORS.length])[0];
  writeDoc(id, {type: 'category', name: '새 캘린더', color, order: (M.cats.length ? Math.max.apply(null, M.cats.map(c => c.order || 0)) : 0) + 1, createdAt: nowIso()});
  M = buildModel();
  bxCalOpen(id, true);
}

/* ---------- 새 일정 창: 여러 날 · 캘린더 · 이 일정 색 ---------- */
function bxFMulti(){ return !!(F && F.multi && isDate(F.endDate) && F.endDate > F.date); }
function bxFColor(){ return F.color ? bxColorVar(F.color) : F.categoryId ? catColor(F.categoryId) : 'var(--ink-3)'; }
function bxFFields(fields){ fields.endDate = bxFMulti() ? F.endDate : null; fields.color = F.color || null; }
function bxFRangeLabel(){ return bxRangeLabel(F.date, F.endDate); }
function bxFMultiHtml(){
  const on = !!F.multi;
  if (on) {
    // 시작 날을 옮기면 끝나는 날도 같은 길이로 따라간다
    if (F.bxD0 && F.bxD0 !== F.date && F.spanN > 1) F.endDate = ymd(addDays(parseYmd(F.date), F.spanN - 1));
    if (!(isDate(F.endDate) && F.endDate > F.date)) F.endDate = ymd(addDays(parseYmd(F.date), 1));
    F.spanN = diffDays(F.endDate, F.date) + 1;
  }
  F.bxD0 = F.date;
  const n = on ? F.spanN : 0;
  return '<div class="bx-fmulti">' + setRow('여러 날', bxSwitch('data-fmulti', on, '여러 날')) +
    (on ? '<div class="bx-fend"><label class="fg-l" for="f-end-in">끝나는 날</label><div class="inline"><input type="date" id="f-end-in" class="inp" min="' + esc(ymd(addDays(parseYmd(F.date), 1))) + '" value="' + esc(F.endDate) + '"><span class="p small" id="f-end-txt">' + esc(fmtMD(F.endDate)) + ' · <b>' + n + '일간</b></span></div>' +
      '<div class="picks bx-fspan">' + [2, 3, 7].map(k => '<button type="button" class="pick" data-fspan="' + k + '" aria-pressed="' + (n === k) + '">' + (k === 7 ? '1주' : k + '일간') + '</button>').join('') + '</div></div>' : '') + '</div>';
}
function bxFMultiSync(){
  const el = document.querySelector('#f-date .bx-fmulti'); if (el) el.outerHTML = bxFMultiHtml();
  drawFChips(); if (typeof updRemWhen === 'function') updRemWhen();
}
const bxDrawEdit39 = drawEdit;
drawEdit = function(){
  if (window.BX_APP && F && F.multi === undefined) {
    const it = F.mode === 'edit' ? getDoc(F.id) : null;
    F.multi = !!(it && it.endDate && it.endDate > it.date); F.endDate = (it && it.endDate) || ''; F.color = (it && it.color) || null;
    F.spanN = F.multi ? diffDays(F.endDate, F.date) + 1 : 0; F.bxD0 = F.date;
    if (F.mode === 'new' && !F.categoryId) F.categoryId = bxDefCal();
  }
  return bxDrawEdit39.apply(this, arguments);
};
const bxDrawFDate39 = drawFDate;
drawFDate = function(){
  const r = bxDrawFDate39.apply(this, arguments);
  if (window.BX_APP && F) { const el = document.getElementById('f-date'); if (el) { el.insertAdjacentHTML('beforeend', bxFMultiHtml()); drawFChips(); } }
  return r;
};
// 여러 날 + 시간: '첫날 시작 ~ 마지막 날 끝', 소요 시간 칸은 뺀다(날이 바뀌어서)
const bxDrawFTime39 = drawFTime;
drawFTime = function(){
  const r = bxDrawFTime39.apply(this, arguments);
  if (window.BX_APP && F && F.timed && bxFMulti()) {
    const el = document.getElementById('f-time');
    if (el) { el.querySelectorAll('.fg-lr, #f-dur, .dgrid').forEach(x => x.remove()); const l = el.querySelector('label.fg-l[for="f-start"]'); if (l) l.textContent = '첫날 시작 ~ 마지막 날 끝'; }
  }
  return r;
};
// 캘린더 칸: 캘린더 고르기 + 이 일정 색(처음엔 캘린더 색, 원할 때만)
const bxDrawFCat39 = drawFCat;
drawFCat = function(){
  if (!window.BX_APP) return bxDrawFCat39.apply(this, arguments);
  drawFChips();
  const el = document.getElementById('f-cat'); if (!el) return;
  const cal = F.categoryId ? M.catMap.get(F.categoryId) : null;
  el.innerHTML = '<div class="picks" role="group" aria-label="캘린더">' + M.cats.map(c => '<button type="button" class="pick" data-fcat="' + esc(c.id) + '" aria-pressed="' + (F.categoryId === c.id) + '"><i class="dot" style="--c:' + catColorRaw(c.id) + '"></i>' + esc(c.name) + '</button>').join('') +
      '<button type="button" class="pick" data-fcat="" aria-pressed="' + !F.categoryId + '">없음</button></div>' +
    '<div class="bx-fcol"><span class="fg-l">이 일정 색</span><div class="bx-fcol-row" role="group" aria-label="이 일정 색">' +
      '<button type="button" class="pick bx-fcol-def" data-fcolor="" aria-pressed="' + !F.color + '"><i class="dot" style="--c:' + (cal ? catColorRaw(cal.id) : 'var(--ink-3)') + '"></i>캘린더 색</button>' +
      COLORS.map(x => '<button type="button" class="swatch" style="--c:var(' + x[1] + ')" data-fcolor="' + x[0] + '" aria-label="' + x[2] + '" aria-pressed="' + (String(F.color || '').toLowerCase() === x[0]) + '"></button>').join('') +
    '</div></div><p class="p small bx-fcol-note">처음에는 캘린더 색이에요. 이 일정만 다른 색으로 바꿀 수 있어요.</p>';
};
// 말로 넣기 '6일부터 8일까지 부산 여행' → 여러 날을 켠다(손으로 고른 날짜가 있으면 그대로)
const bxTitleIn39 = onTitleInput;
onTitleInput = function(v){
  const r = bxTitleIn39.apply(this, arguments);
  if (window.BX_APP && F && F.mode === 'new' && !F.touchedDate) {
    const p = F.parsed;
    if (p && p.endDate && p.endDate > F.date) { F.multi = true; F.endDate = p.endDate; F.spanN = diffDays(F.endDate, F.date) + 1; F.bxD0 = F.date; F.multiParsed = true; }
    else if (F.multiParsed) { F.multi = false; F.endDate = ''; F.spanN = 0; F.multiParsed = false; }
    drawFChips(); if (F.panel === 'date') drawFDate(); drawFHint();
  }
  return r;
};
const bxHint39 = drawFHint;
drawFHint = function(){
  const r = bxHint39.apply(this, arguments);
  if (window.BX_APP && F && bxFMulti()) { const b = document.querySelector('#f-hint .hint:not(.bx-dn) b'); if (b) b.textContent = bxFRangeLabel() + (F.timed && isHM(F.start) ? ' ' + F.start + ' 시작' : ''); }
  return r;
};
// 분류 관리 → 캘린더 목록(⋯ · 설정 › 캘린더 · 데이터)
openCats = function(back){ bxCalsOpen(back ? openMore : null); };

/* ---------- 말로 넣기: 날짜 범위 ----------
   '6일부터 8일까지' · '6일~8일' · '11월 6~8일' · '11/6~11/8' · '금요일부터 일요일까지' · '내일부터 3일간' · '6일부터 2박 3일'.
   시작 말은 한 날짜 해석(parseQuick0, 시험판 36의 'N일' 규칙 그대로)을 쓴다. 달이 없는 끝 날은 시작한 달 기준(작으면 다음 달) */
function bxRangeExtract(s, now){
  s = String(s || '');
  const D1 = '(?:\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일|\\d{1,2}\\s*[./]\\s*\\d{1,2}(?![\\d./])|\\d{1,2}\\s*일(?!\\s*(?:간|동안|차|뒤|후|째|에\\s*한))|(?:(?:다다음|다음|담|이번)\\s*주\\s*)?[월화수목금토일]요일|오늘|내일|모레|글피)';
  const DASH = '\\s*(?:~|∼|〜|-|–)\\s*';
  const norm = x => String(x).replace(/(\d{1,2})\s*[./]\s*(\d{1,2})/, '$1월 $2일');
  const one = x => { try { const r = parseQuick0(bxQuickPre(norm(x), now), now); return r && isDate(r.date) ? r.date : null; } catch (e) { return null; } };
  const after = (a, x) => {
    // 끝 날: 달 · 연도가 없으면 시작 날 기준으로
    x = norm(x).trim();
    let m = /^(\d{1,2})\s*일$/.exec(x);
    const A = parseYmd(a);
    if (m) { let d = new Date(A.getFullYear(), A.getMonth(), +m[1]); if (d.getDate() !== +m[1]) return null; if (ymd(d) <= a) d = new Date(A.getFullYear(), A.getMonth() + 1, +m[1]); return d.getDate() === +m[1] ? ymd(d) : null; }
    m = /^(\d{1,2})\s*월\s*(\d{1,2})\s*일$/.exec(x);
    if (m) { let d = new Date(A.getFullYear(), +m[1] - 1, +m[2]); if (ymd(d) <= a) d = new Date(A.getFullYear() + 1, +m[1] - 1, +m[2]); return ymd(d); }
    m = /^(?:(?:다다음|다음|담|이번)\s*주\s*)?([월화수목금토일])요일$/.exec(x);
    if (m && !/주/.test(x)) { const dow = '일월화수목금토'.indexOf(m[1]); for (let k = 1; k <= 7; k++) { const d = addDays(A, k); if (d.getDay() === dow) return ymd(d); } }
    return one(x);
  };
  const pick = (re, fn) => { const m = re.exec(s); if (!m) return null; const r = fn(m); if (!r || !r.start || !r.end || r.end <= r.start || diffDays(r.end, r.start) > 92) return null; return {text: (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim(), start: r.start, end: r.end}; };
  return pick(new RegExp('(\\d{1,2})\\s*월\\s*(\\d{1,2})' + DASH + '(\\d{1,2})\\s*일(?:\\s*까지)?'), m => { const a = one(m[1] + '월 ' + m[2] + '일'); return a && {start: a, end: after(a, m[1] + '월 ' + m[3] + '일')}; }) ||
    pick(new RegExp('(?<![\\d월/.])(\\d{1,2})' + DASH + '(\\d{1,2})\\s*일(?:\\s*까지)?'), m => { const a = one(m[1] + '일'); return a && {start: a, end: after(a, m[2] + '일')}; }) ||
    pick(new RegExp('(' + D1 + ')\\s*(?:부터\\s*)?(\\d{1,2})\\s*박\\s*(\\d{1,2})\\s*일'), m => { const a = one(m[1]); return a && +m[2] >= 1 && {start: a, end: ymd(addDays(parseYmd(a), +m[2]))}; }) ||
    pick(new RegExp('(' + D1 + ')\\s*부터\\s*(\\d{1,2})\\s*일\\s*(?:간|동안)'), m => { const a = one(m[1]); return a && +m[2] >= 2 && {start: a, end: ymd(addDays(parseYmd(a), +m[2] - 1))}; }) ||
    pick(new RegExp('(' + D1 + ')\\s*(?:부터|' + DASH.trim() + ')\\s*(' + D1 + ')(?:\\s*까지)?'), m => { const a = one(m[1]); return a && {start: a, end: after(a, m[2])}; });
}

/* ---------- 누르기 ---------- */
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target;
  const cs = t.closest('[data-bxcsel]');
  if (cs) { ev.preventDefault(); ev.stopPropagation(); bxCalSel = cs.dataset.bxcsel || ''; render(); return; }
  if (t.closest('[data-act="bx-cals"]')) { ev.preventDefault(); ev.stopPropagation(); bxCalsOpen(); return; }
  if (!SH) return;
  const fm = t.closest('[data-fmulti]');
  if (fm && F) { ev.preventDefault(); ev.stopPropagation(); F.multi = fm.dataset.fmulti === '1'; F.touchedDate = true; F.multiParsed = false; if (!F.multi) { F.endDate = ''; F.spanN = 0; } drawFDate(); drawFHint(); if (F.timed) drawFTime(); return; }
  const fs = t.closest('[data-fspan]');
  if (fs && F) { ev.preventDefault(); ev.stopPropagation(); F.endDate = ymd(addDays(parseYmd(F.date), +fs.dataset.fspan - 1)); F.spanN = +fs.dataset.fspan; F.touchedDate = true; bxFMultiSync(); drawFHint(); return; }
  const fc = t.closest('[data-fcolor]');
  if (fc && F) { ev.preventDefault(); ev.stopPropagation(); F.color = fc.dataset.fcolor || null; drawFCat(); return; }
  const oc = t.closest('[data-bxcal]');
  if (oc) { ev.preventDefault(); ev.stopPropagation(); bxCalOpen(oc.dataset.bxcal); return; }
  const hm = t.closest('[data-bxcalhome]');
  if (hm) {
    ev.preventDefault(); ev.stopPropagation();
    const row = hm.closest('[data-cal]'), id = row ? row.dataset.cal : SH.bxCal; if (!id || !M.catMap.has(id)) return;
    patchDoc(id, {home: hm.dataset.bxcalhome === '1'}); M = buildModel();
    if (SH.bxCal) bxCalDraw(id); else bxCalsDraw();
    return;
  }
  const ph = t.closest('[data-bxpchome]');
  if (ph) {
    ev.preventDefault(); ev.stopPropagation();
    const row = ph.closest('[data-cal]'), id = row ? String(row.dataset.cal).slice(4) : ''; if (!id) return;
    const off = bxPcHomeOff().filter(x => x !== id); if (ph.dataset.bxpchome !== '1') off.push(id);
    pcSetCfg({homeOff: off}); M = buildModel(); bxCalsDraw(); scheduleRender();
    return;
  }
  const df = t.closest('[data-bxcaldef]');
  if (df && SH.bxCal) { ev.preventDefault(); ev.stopPropagation(); saveSettings({defCal: df.dataset.bxcaldef === '1' ? SH.bxCal : null}); M = buildModel(); bxCalDraw(SH.bxCal); return; }
  const cc = t.closest('[data-bxcalcol]');
  if (cc && SH.bxCal) { ev.preventDefault(); ev.stopPropagation(); patchDoc(SH.bxCal, {color: cc.dataset.bxcalcol}); M = buildModel(); bxCalDraw(SH.bxCal); return; }
  if (t.closest('[data-act="bx-cal-add"]')) { ev.preventDefault(); ev.stopPropagation(); bxCalAdd(); return; }
  if (t.closest('[data-act="bx-cal-del"]') && SH.bxCal) {
    ev.preventDefault(); ev.stopPropagation();
    const id = SH.bxCal; if (!bxCalCount(id)) { bxCalRemove(id, null); return; }
    const nm = bxCalName(id);
    openSheet({title: '‘' + nm + '’ 삭제', back: () => bxCalOpen(id), draw: () => bxCalDelDraw(id)}); SH.bxDel = id;
    return;
  }
  const to = t.closest('[data-bxcalto]');
  if (to && SH.bxDel) { ev.preventDefault(); ev.stopPropagation(); SH.bxTo = to.dataset.bxcalto || ''; bxCalDelDraw(SH.bxDel); return; }
  if (t.closest('[data-act="bx-cal-del-move"]') && SH.bxDel) { ev.preventDefault(); ev.stopPropagation(); bxCalRemove(SH.bxDel, SH.bxTo || null); return; }
  if (t.closest('[data-act="bx-cal-del-all"]') && SH.bxDel) { ev.preventDefault(); ev.stopPropagation(); bxCalRemove(SH.bxDel, 'all'); return; }
}, true);
document.addEventListener('input', ev => {
  const t = ev.target; if (!window.BX_APP || !t || !t.dataset) return;
  if (t.dataset.bxcalname) patchLater(t.dataset.bxcalname, {name: t.value.trim() || '이름 없음'}, 500);
}, true);
document.addEventListener('change', ev => {
  const t = ev.target; if (!window.BX_APP || !t || !F) return;
  if (t.id === 'f-end-in' && isDate(t.value)) { F.endDate = t.value > F.date ? t.value : ymd(addDays(parseYmd(F.date), 1)); F.spanN = diffDays(F.endDate, F.date) + 1; F.touchedDate = true; bxFMultiSync(); drawFHint(); }
  // 시작 날을 직접 고르면(원래 처리 뒤에) 끝나는 날도 따라간다
  else if (t.id === 'f-date-in' && F.multi) setTimeout(() => { if (F && F.multi) { bxFMultiSync(); drawFHint(); } }, 0);
}, true);
// 칩 줄을 다시 그린 뒤에도 고른 칩이 보이게
const bxRender39 = render;
render = function(){
  const r = bxRender39.apply(this, arguments);
  try {
    const row = document.querySelector('.screen .bx-cchips'), on = row && row.querySelector('.bx-cchip[aria-pressed="true"]');
    if (row && on && on.dataset.bxcsel) row.scrollLeft = Math.max(0, on.offsetLeft - row.clientWidth / 2 + on.offsetWidth / 2);
  } catch (e) { /* 그대로 */ }
  return r;
};

(function bxV39Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v39';
  st.textContent = [
    // 월간 칸: 줄 높이를 맞춘다(막대 · 하루 일정 · 빈 자리)
    'html.bx-app .cell .c-chips>.c-chip,html.bx-app .cell .c-chips>.c-bar,html.bx-app .cell .c-chips>.c-gap{display:block;flex:none;height:16px;box-sizing:border-box}',
    'html.bx-app .cell .c-chips>.c-chip{line-height:14px}',
    'html.bx-app .c-bar{position:relative;z-index:1;width:calc(var(--n) * 100% + (var(--n) - 1) * 2px);pointer-events:none;background:var(--c);color:var(--on,#fff);font-size:10.5px;font-weight:700;line-height:16px;padding:0 4px;border-radius:0;text-align:left;white-space:nowrap;overflow:hidden}',
    'html.bx-app .c-bar>span{display:block;overflow:hidden;text-overflow:ellipsis}',
    'html.bx-app .c-bar.h{border-top-left-radius:4px;border-bottom-left-radius:4px}',
    'html.bx-app .c-bar.t{border-top-right-radius:4px;border-bottom-right-radius:4px}',
    'html.bx-app .c-bar.pc{background:transparent;border:1px solid var(--ink-3);color:var(--ink);line-height:14px}',
    'html.bx-app .c-bar.done{opacity:.6}html.bx-app .c-bar.done>span{text-decoration:line-through}',
    // 목록의 여러 날 줄: 캘린더 색으로 옅게 칠하고 왼쪽에 색 줄
    // 상자는 글자 줄보다 10px 바깥까지(글자 · 체크 칸 자리는 다른 줄과 같음)
    'html.bx-app .list > .row.bx-span{background:color-mix(in srgb,var(--c) 10%,transparent);border-radius:12px;box-shadow:inset 3px 0 0 var(--c);margin:3px -10px!important;padding-left:10px!important;padding-right:10px!important;border-bottom-color:transparent}',
    'html.bx-app .row.bx-span .row-title{font-weight:700}',
    'html.bx-app .row.bx-span .bx-span-d{color:var(--ink-2);font-weight:600}',
    'html.bx-app .row-time small{white-space:nowrap}',
    // 캘린더 칩 줄(달 넘기기 · 개수 줄 아래, 옆으로 밀어 봄)
    'html.bx-app .page-head.bx-ch>.bx-cchips{display:flex;gap:8px;margin:12px calc(-1 * var(--gut)) 0;padding:2px var(--gut) 4px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}',
    'html.bx-app .bx-cchips::-webkit-scrollbar{display:none}',
    'html.bx-app .bx-cchip{flex:none;display:inline-flex;align-items:center;gap:6px;height:34px;max-width:168px;padding:0 14px;border-radius:17px;background:var(--bx-card);color:var(--ink);font-size:13.5px;font-weight:700;white-space:nowrap}',
    'html.bx-app .bx-cchip span{overflow:hidden;text-overflow:ellipsis}',
    'html.bx-app .bx-cchip[aria-pressed="true"]{background:var(--ink);color:var(--bg)}',
    'html.bx-app .bx-cchip.pc{background:transparent;box-shadow:inset 0 0 0 1px var(--line-2)}html.bx-app .bx-cchip.pc[aria-pressed="true"]{background:var(--ink);box-shadow:none}',
    'html.bx-app .bx-cchip-add{background:transparent;box-shadow:inset 0 0 0 1.5px var(--line-2);color:var(--ink-2);padding:0 13px 0 10px;gap:4px}html.bx-app .bx-cchip-add .i{width:16px;height:16px}',
    'html.bx-app .bx-cdot{display:inline-block;flex:none;width:10px;height:10px;border-radius:50%;background:var(--c)}',
    'html.bx-app .bx-cf-note{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:13.5px;font-weight:600;color:var(--ink-2)}html.bx-app .bx-cf-note span{flex:1}',
    // 캘린더 목록 · 자세히
    'html.bx-app .bx-cals{padding-top:0;padding-bottom:0}html.bx-app .bx-cals>.bx-arow:last-child{border-bottom:0}',
    'html.bx-app .bx-calrow .bx-at b{display:flex;align-items:center;gap:9px}',
    'html.bx-app .bx-calrow .bx-at small{padding-left:19px}',
    'html.bx-app .bx-calrow-sw{display:flex;flex-direction:column;align-items:center;gap:3px;flex:none}html.bx-app .bx-calrow-sw small{font-size:11px;color:var(--ink-3);white-space:nowrap}',
    'html.bx-app .bx-cal-add{display:flex;align-items:center;gap:8px;width:100%;min-height:56px;color:var(--accent);font-size:15.5px;font-weight:700}html.bx-app .bx-cal-add .i{width:18px;height:18px}',
    'html.bx-app .bx-cal-note{margin:-6px 4px 0;color:var(--ink-3);line-height:1.5}',
    'html.bx-app .bx-cald{display:flex;flex-direction:column;gap:16px;padding-top:16px;padding-bottom:18px}',
    'html.bx-app .bx-cald .swatches{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}',
    'html.bx-app .bx-cal-delq{margin:0 4px 12px;font-weight:600}',
    // 새 일정 창: 여러 날 · 이 일정 색
    'html.bx-app .bx-fmulti{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}',
    'html.bx-app .bx-fmulti .set-row{padding:0;min-height:40px;border:0}',
    'html.bx-app .bx-fend{display:flex;flex-direction:column;gap:8px;margin-top:8px}html.bx-app .bx-fend .inline{display:flex;align-items:center;gap:10px}',
    'html.bx-app .bx-fspan{margin-top:2px}',
    'html.bx-app .bx-fcol{margin-top:14px}html.bx-app .bx-fcol-row{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-top:8px}',
    'html.bx-app .bx-fcol-row .swatch{width:30px;height:30px}',
    'html.bx-app .bx-fcol-note{margin-top:8px;color:var(--ink-3)}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
