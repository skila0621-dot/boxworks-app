/* ---------- 시험판 45: 다른 입력 창도 시험판 44 일정 창과 같은 삼성 방식으로 ----------
   대표 11/4 1:24 · 1:51: 삼성 앱 사진의 정렬 · 여백 · 배치를 앱 전체 기본 기준으로(결정 기록 D-19, 제품 원칙 규칙 14).
   대표 11/4 1:34: 메뉴를 누르면 그 아래로 펼치지 말고 입력 창을 띄워 고르거나 적고 '완료'(메뉴 자리가 움직이면 혼란, 규칙 16).
   대표 11/4 1:50 · 1:53: 삼성 캘린더 입력 방식(줄 목록, 길면 …, 알림은 다른 페이지에서 고르기), 메뉴 순서도 삼성을 따른다.
   1) 수업 추가 · 수정: 이름 → 요일 → 시작 → 끝 → 장소 → 시간표 → 알림 → 색. 장소 · 시간표 · 알림은 페이지(‹ 이름 · 완료)
   2) 휴대폰 캘린더 일정 창: 알림 · 출발·준비를 줄로, 누르면 페이지(바로 바뀌고 ‹ 는 되돌림)
   3) 루틴 고치기: 알림 방식 · 기준을 줄로, 누르면 페이지. 상자와 줄은 삼성 잰 값 */

const BX_PALETTE_I = '<svg class="i" viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.8-.7 1.8-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2.1a4.4 4.4 0 0 0 4.4-4.4C21 6.9 17 3.5 12 3.5z"/><circle cx="7.6" cy="11.6" r="1.25" fill="currentColor" stroke="none"/><circle cx="10.2" cy="7.6" r="1.25" fill="currentColor" stroke="none"/><circle cx="14.8" cy="7.6" r="1.25" fill="currentColor" stroke="none"/></svg>';
const BX_CHECK_MASK = 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272.6%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E") center/contain no-repeat';

/* 페이지를 닫은 뒤(완료 · ‹ · 뒤로) 창의 줄을 다시 쓴다 */
const bxPgClose45 = bxPgClose;
bxPgClose = function(undo){
  const o = bxPg;
  const r = bxPgClose45.apply(this, arguments);
  if (o && window.BX_APP) {
    if (typeof TT !== 'undefined' && TT && document.getElementById('bx-tt45-rows')) { if (!undo) bxTt45Apply(o.node); bxTt45Refresh(); }
    if (typeof R !== 'undefined' && R && document.getElementById('bx-rt45') && typeof bxRt45Refresh === 'function') bxRt45Refresh();
  }
  return r;
};

/* 1) 수업 추가 · 수정 */
let bxTt45Place0 = '';
function bxTt45SetCur(){ const sets = typeof bxTtSets === 'function' ? bxTtSets() : []; if (sets.length < 2) return null; const cur = TT.set && bxTtSetDoc(TT.set) ? TT.set : BX_TTS_MAIN; return sets.find(s => s.id === cur) || sets[0]; }
// 지금 고른 알림(직접 입력 칸에 적는 중이면 그 값)
function bxTt45RemVal(){
  let v = String(TT.remind == null ? '' : TT.remind);
  const c = document.getElementById('tt-rem-c');
  if (c && v !== '') v = String(Math.max(1, Math.min(240, Math.round(+c.value) || 15)));
  return v;
}
function bxTt45RemText(){
  const v = bxTt45RemVal(); if (v === '') return '';
  const r = TT_REMS.find(x => x[0] === v);
  return r ? r[1] : +v > 0 ? v + '분 전' : '';
}
function bxTt45Row(k){
  const row = (icon, text, set, label) => '<button type="button" class="bx-er" data-bxtt45="' + k + '" aria-label="' + esc(label + ', ' + (set ? text : '없음')) + '"><span class="bx-er-ic" aria-hidden="true">' + icon + '</span><span class="bx-er-t' + (set ? '' : ' ph') + '">' + esc(text) + '</span></button>';
  if (k === 'place') return row(ICON.pin, TT.place || '장소', !!TT.place, '장소');
  if (k === 'set') { const s = bxTt45SetCur(); if (!s) return ''; return row('<span class="bx-er-cal">' + BX_DOCK_ALL.tt.icon + '<i class="dot" style="--c:' + bxTtSetColor(s) + '"></i></span>', s.name, true, '시간표'); }
  if (k === 'rem') { const t = bxTt45RemText(); return row(ICON.bell, t || '알림', !!t, '알림'); }
  return '';
}
function bxTt45Refresh(){
  const rows = document.getElementById('bx-tt45-rows'); if (!rows || !TT) return;
  ['place', 'set', 'rem'].forEach(k => { const el = rows.querySelector('[data-bxtt45="' + k + '"]'); if (el) el.outerHTML = bxTt45Row(k); });
}
// '완료': 장소는 적은 글자를, 알림은 직접 입력한 분을 넣는다(시간표 · 알림 고르기는 누를 때 바로 바뀜)
function bxTt45Apply(node){
  if (!node || !TT) return;
  if (node.id === 'bx-tt45-pplace') { const i = document.getElementById('tt-place'); if (i) TT.place = i.value.trim().slice(0, 40); }
  if (node.id === 'bx-tt45-prem') { const c = document.getElementById('tt-rem-c'); if (c && TT.remind !== '') TT.remind = String(Math.max(1, Math.min(240, Math.round(+c.value) || 15))); }
}
function bxTt45Recent(q){
  const cur = String(q == null ? '' : q).trim(), typed = cur && cur !== bxTt45Place0, seen = new Set(), out = [];
  for (const e of ttList()) {
    const l = String(e.place || '').trim(), key = l.toLowerCase();
    if (!l || seen.has(key)) continue;
    seen.add(key);
    if (l === cur) continue;
    if (typed && !key.includes(cur.toLowerCase())) continue;
    out.push(l);
    if (out.length >= 6) break;
  }
  return out;
}
function bxTt45Places(q){
  const box = document.getElementById('bx-tt45-recent'); if (!box) return;
  const rec = bxTt45Recent(q);
  box.innerHTML = rec.length ? '<div class="bx-ep-gl">다른 수업 장소</div><div class="bx-ep-box">' + rec.map(l => '<button type="button" class="bx-ep-row" data-bxtt45place="' + esc(l) + '"><span class="bx-er-ic" aria-hidden="true">' + ICON.pin + '</span><span class="bx-er-t">' + esc(l) + '</span></button>').join('') + '</div>' : '';
}
// 알림 칸(페이지 안): 삼성 알림 설정처럼 '사용 중' 스위치 + 동그라미 목록. 직접 입력은 그 줄이 적는 칸이 된다
const bxTtRems45 = ttRemsHtml;
ttRemsHtml = function(){
  if (!window.BX_APP || !TT) return bxTtRems45.apply(this, arguments);
  const v = String(TT.remind == null ? '' : TT.remind), on = v !== '' || !!TT.remCust, std = TT_REMS.some(r => v === r[0]), cust = TT.remCust || (on && !std);
  return '<div class="tt-remw"><div class="bx-swrow' + (on ? ' on' : '') + '"><span>' + (on ? '사용 중' : '사용 안 함') + '</span><button type="button" class="tog" role="switch" aria-checked="' + on + '" aria-label="수업 알림" data-act="tt-remsw"><i></i></button></div>' +
    (on ? '<div class="tt-pills" role="radiogroup" aria-label="알림">' + TT_REMS.map(r => '<button type="button" class="tt-pill" role="radio" data-act="tt-rem" data-v="' + r[0] + '" aria-pressed="' + (!cust && v === r[0]) + '" aria-checked="' + (!cust && v === r[0]) + '">' + r[1] + '</button>').join('') +
      (cust ? '<span class="tt-pill bx-cpick" aria-pressed="true"><input id="tt-rem-c" type="number" inputmode="numeric" min="1" max="240" value="' + (+v > 0 ? +v : 15) + '" aria-label="몇 분 전에 알릴지"><span>분 전</span></span>'
        : '<button type="button" class="tt-pill" role="radio" data-act="tt-rem" data-v="custom" aria-pressed="false" aria-checked="false">직접 입력</button>') + '</div>' : '') +
    '<p class="p small bx-ep-note">수업 시작 전에 알려 줘요. 휴강으로 둔 날은 울리지 않아요.</p></div>';
};
const bxTtDraw45 = ttDraw;
ttDraw = function(){
  if (!window.BX_APP || !TT) return bxTtDraw45.apply(this, arguments);
  const dayBtns = TT_ORDER.map(d => '<button type="button" class="tt-dbtn' + (d === 0 ? ' sun' : d === 6 ? ' sat' : '') + '" data-act="tt-day" data-d="' + d + '" aria-pressed="' + TT.days.includes(d) + '" aria-label="' + WD[d] + '요일">' + WD[d] + '</button>').join('');
  const colors = TT_COLORS.map(c => '<button type="button" class="tt-sw" data-act="tt-color" data-c="' + c + '" style="--c:' + c + '" aria-pressed="' + (TT.color === c) + '" aria-label="색"></button>').join('');
  const set = bxTt45SetCur(), sets = set ? bxTtSets() : [];
  setSheet(
    '<div class="tt-form bx-tt45">' +
      (TT.hint ? '<p class="p small tt-hint">' + esc(TT.hint) + '</p>' : '') +
      '<label class="sr" for="tt-name">이름</label><input id="tt-name" class="title-in" type="text" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="수업 이름 예) 경영학원론" value="' + esc(TT.name) + '">' +
      '<div class="bx-ed bx-tt45-rows" id="bx-tt45-rows" role="group" aria-label="수업 내용">' +
        '<div class="bx-er bx-tt45-days"><span class="bx-er-ic" aria-hidden="true">' + BX_DOCK_ALL.routines.icon + '</span><div class="tt-days" role="group" aria-label="요일">' + dayBtns + '</div></div>' +
        '<div class="bx-edt bx-tt45-t"><div class="bx-edt-c"><input id="tt-start" class="bx-tt45-time" type="time" value="' + esc(TT.start) + '" aria-label="시작 시각"></div><span class="bx-edt-arr" aria-hidden="true">' + BX_ARROW + '</span>' +
          '<div class="bx-edt-c"><input id="tt-end" class="bx-tt45-time" type="time" value="' + esc(TT.end) + '" aria-label="끝 시각"></div></div>' +
        bxTt45Row('place') + bxTt45Row('set') + bxTt45Row('rem') +
        '<div class="bx-er bx-tt45-col"><span class="bx-er-ic" aria-hidden="true">' + BX_PALETTE_I + '</span><div class="tt-sws" role="group" aria-label="색">' + colors + '</div></div>' +
      '</div>' +
      // 페이지에 옮겨 쓰는 칸(평소에는 숨김). 저장은 여기 칸의 값을 읽는다
      '<div class="bx-tt45-hold" hidden>' +
        '<div id="bx-tt45-pplace" class="bx-tt45-pg"><div class="bx-ep-box bx-tt45-in"><label class="sr" for="tt-place">장소</label><input id="tt-place" class="inp" type="text" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="예) 301호" value="' + esc(TT.place || '') + '"></div><div id="bx-tt45-recent" class="bx-tt45-pg"></div></div>' +
        '<div id="bx-tt45-prem" class="bx-tt45-pg">' + ttRemsHtml() + '</div>' +
        (set ? '<div id="bx-tt45-pset" class="bx-tt45-pg"><div class="bx-ep-box bx-tt45-list" role="radiogroup" aria-label="시간표">' + sets.map(s => '<button type="button" class="bx-ep-row bx-tt45-opt" role="radio" data-bxttpick="' + esc(s.id) + '" aria-pressed="' + (s.id === set.id) + '"><i class="dot" style="--c:' + bxTtSetColor(s) + '"></i><span class="bx-er-t">' + esc(s.name) + '</span></button>').join('') + '</div>' +
          '<p class="p small bx-ep-note">시간표마다 학기 기간 · 홈에 보이기를 따로 정해요.</p></div>' : '') +
      '</div>' +
    '</div>',
    (TT.id ? '<button type="button" class="btn bx-del-btn" data-act="tt-del">' + ICON.trash + '삭제</button>' : '') + '<button type="button" class="btn primary grow" data-act="tt-save">저장</button>'
  );
};
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest || typeof TT === 'undefined' || !TT) return;
  const r = ev.target.closest('[data-bxtt45]');
  if (r) {
    ev.preventDefault(); ev.stopPropagation();
    const k = r.dataset.bxtt45;
    if (k === 'place') {
      const i = document.getElementById('tt-place'), snap = i ? i.value : '';
      bxTt45Place0 = snap.trim();
      bxPgOpen('장소', document.getElementById('bx-tt45-pplace'), () => { const x = document.getElementById('tt-place'); if (x) x.value = snap; });
      bxTt45Places(snap);
      setTimeout(() => { const x = document.getElementById('tt-place'); if (x && document.getElementById('bx-pg')) { try { x.focus(); const n = x.value.length; x.setSelectionRange(n, n); } catch (e) { /* 그대로 */ } } }, 60);
    } else if (k === 'rem') {
      const c = document.getElementById('tt-rem-c'), snap = {remind: TT.remind, remCust: TT.remCust, remLast: TT.remLast, cv: c ? c.value : null};
      bxPgOpen('알림', document.getElementById('bx-tt45-prem'), () => {
        TT.remind = snap.remind; TT.remCust = snap.remCust; TT.remLast = snap.remLast;
        const w = document.querySelector('.tt-remw'); if (w) w.outerHTML = ttRemsHtml();
        const x = document.getElementById('tt-rem-c'); if (x && snap.cv != null) x.value = snap.cv;
      });
    } else if (k === 'set') {
      const snap = TT.set;
      bxPgOpen('시간표', document.getElementById('bx-tt45-pset'), () => {
        TT.set = snap; const s = bxTt45SetCur();
        document.querySelectorAll('[data-bxttpick]').forEach(b => b.setAttribute('aria-pressed', String(!!s && b.dataset.bxttpick === s.id)));
      });
    }
    return;
  }
  const pl = ev.target.closest('[data-bxtt45place]');
  if (pl) {
    ev.preventDefault(); ev.stopPropagation();
    const i = document.getElementById('tt-place'); if (i) i.value = pl.dataset.bxtt45place;
    bxTt45Places(i ? i.value : '');
  }
}, true);
document.addEventListener('input', ev => {
  if (!window.BX_APP || !ev.target || ev.target.id !== 'tt-place' || !document.getElementById('bx-pg')) return;
  bxTt45Places(ev.target.value);
});
// 페이지 안 적는 칸에서 키보드 '완료'(Enter)는 페이지의 완료
document.addEventListener('keydown', ev => {
  if (!window.BX_APP || ev.key !== 'Enter' || ev.isComposing || !ev.target || !/^(tt-place|tt-rem-c)$/.test(ev.target.id || '') || !document.getElementById('bx-pg')) return;
  ev.preventDefault();
  try { ev.target.blur(); } catch (e) { /* 그대로 */ }
  bxPgClose(false);
});
// 시작을 바꾸면 끝도 같은 길이만큼 따라간다(삼성 캘린더처럼). 끝을 시작보다 앞으로 두면 저장할 때처럼 1시간
document.addEventListener('change', ev => {
  if (!window.BX_APP || typeof TT === 'undefined' || !TT || !ev.target || !/^tt-(start|end)$/.test(ev.target.id || '')) return;
  const s = document.getElementById('tt-start'), e = document.getElementById('tt-end'); if (!s || !e) return;
  if (ev.target === s && isHM(s.value)) {
    const dur = isHM(TT.start) && isHM(TT.end) ? Math.max(5, toMin(TT.end) - toMin(TT.start)) : 60;
    TT.start = s.value; TT.end = fromMin(Math.min(toMin(s.value) + dur, 1439)); e.value = TT.end;
  } else if (ev.target === e && isHM(e.value)) {
    TT.end = toMin(e.value) > toMin(TT.start) ? e.value : fromMin(Math.min(toMin(TT.start) + 60, 1439));
    if (TT.end !== e.value) e.value = TT.end;
  }
});

// 시간표 보기 설정: 표시 시간은 상자 안 두 줄(처음 · 끝), 표시 요일은 동그라미 목록(칩 두 개 대신)
const bxTtRange45 = ttRangeOpen;
ttRangeOpen = function(){
  if (!window.BX_APP) return bxTtRange45.apply(this, arguments);
  const rg = ttRange(), opt = (a, b, cur) => Array.from({length: b - a + 1}, (_, i) => a + i).map(h => '<option value="' + h + '"' + (h === cur ? ' selected' : '') + '>' + h + '시</option>').join('');
  const wk = (M.settings && M.settings.ttWeek) === 'all' ? 'all' : 'wd';
  openSheet({title: '시간표 보기 설정', draw: () => setSheet(
    '<div class="bx-tt45-rg"><div class="bx-tt45-gl">표시 시간</div><div class="bx-grp">' +
      '<div class="bx-er bx-rt45-v"><span class="bx-er-ic" aria-hidden="true">' + ICON.clock + '</span><label class="bx-er-t" for="tt-rg-f">처음</label><select id="tt-rg-f" class="bx-tt45-sel">' + opt(0, 12, rg.from) + '</select></div>' +
      '<div class="bx-er bx-rt45-v"><span class="bx-er-ic" aria-hidden="true">' + ICON.clock + '</span><label class="bx-er-t" for="tt-rg-t">끝</label><select id="tt-rg-t" class="bx-tt45-sel">' + opt(12, 24, rg.to) + '</select></div></div>' +
      '<p class="p small bx-tt45-note">이른 아침 · 늦은 밤 수업이 있으면 넓혀 주세요. 범위 밖에 넣은 수업은 저절로 넓혀서 보여요.</p>' +
      '<div class="bx-tt45-gl">표시 요일</div><div class="bx-grp" role="radiogroup" aria-label="표시 요일">' +
      [['wd', '월–금'], ['all', '월–일']].map(o => '<button type="button" class="bx-er bx-tt45-ro" role="radio" data-act="tt-wk" data-v="' + o[0] + '" aria-pressed="' + (wk === o[0]) + '"><span class="bx-er-t">' + o[1] + '</span></button>').join('') + '</div>' +
      '<p class="p small bx-tt45-note">월–금으로 두어도 토 · 일 수업을 넣으면 그 요일은 저절로 보여요.</p></div>',
    '<button type="button" class="btn primary grow" data-act="tt-rg-save">저장</button>')});
};

/* 2) 휴대폰 캘린더 일정 창: 알림 · 출발·준비를 줄로(누르면 페이지, 고르면 바로 바뀌고 ‹ 는 되돌림) */
function bxPc45Go(it){
  const p = it.start ? tvPlan(it) : null;
  return p ? (p.travel ? hm(p.leave) + ' 출발' : '준비 ' + hm(p.start) + '부터') : +it.travel ? '이동 ' + tvMinText(+it.travel) : '';
}
function bxPc45Rem(it){ const r = remList(it.remind)[0] || ''; return r ? remLabel(r) : ''; }
function bxPc45PageHtml(k, it){
  const timed = !!it.start;
  const pick = (attr, v, cur, label) => '<button type="button" class="pick" ' + attr + '="' + esc(v) + '" aria-pressed="' + (cur === v) + '">' + label + '</button>';
  if (k === 'rem') {
    const remCur = remList(it.remind)[0] || '';
    const opts = (timed ? REMIND_TIMED : REMIND_DAY).slice(0, timed ? 6 : 5);
    if (remCur && !opts.some(o => o[0] === remCur)) opts.push([remCur, remLabel(remCur)]);
    return '<div class="picks bx-pc45-list" role="radiogroup" aria-label="알림">' + opts.map(o => pick('data-pcrem', o[0], remCur, o[1])).join('') + '</div>' +
      '<p class="p small bx-ep-note">휴대폰 캘린더 앱의 알림과는 따로 울려요. ' + esc(window.BX_NAME) + '에서만 바뀌어요.</p>';
  }
  const tvv = +it.travel || 0, tvs = [0].concat(TV_PICKS.includes(tvv) || !tvv ? [] : [tvv]).concat(TV_PICKS);
  const curPrep = it.prep || (it.prepOut ? 'new' : '');
  const p = tvPlan(it);
  return '<div class="fg-l">이동 시간</div><div class="picks bx-pc45-tv">' + tvs.map(v => pick('data-pctv', String(v), String(tvv), v ? tvMinText(v) : '없음')).join('') + '</div>' +
    '<div class="fg-l">준비 루틴 <small>출발 시각에 끝나게 거꾸로 놓여요</small></div><div class="picks bx-pc45-list" role="radiogroup" aria-label="준비 루틴">' + pick('data-pcprep', '', curPrep, '없음') +
    tvPrepNames().map(r => pick('data-pcprep', r.id || 'new', curPrep, esc(r.name) + (r.id ? '' : ' <small>새로</small>'))).join('') + '</div>' +
    (p ? tvLineHtml(p, it.start, it.title) : '');
}
const bxPcDraw45 = pcDraw;
pcDraw = function(id){
  if (!window.BX_APP) return bxPcDraw45.apply(this, arguments);
  const it = M.items.find(i => i.id === id); if (!it) { bxPgClose(false); closeSheet(); return; }
  const e = it.pcEv || {}, timed = !!it.start, rem = bxPc45Rem(it), go = timed ? bxPc45Go(it) : '';
  const row = (k, icon, text, set, label) => '<button type="button" class="bx-er" data-bxpc45="' + k + '" aria-label="' + esc(label + ', ' + (set ? text : '없음')) + '"><span class="bx-er-ic" aria-hidden="true">' + icon + '</span><span class="bx-er-t' + (set ? '' : ' ph') + '">' + esc(text) + '</span></button>';
  const body = '<div class="pc-cal-name"><i class="dot" style="--c:' + pcColor(e.color) + '"></i>' + esc(e.calendar || '휴대폰 캘린더') + '</div>' +
    '<h3 class="pc-title">' + esc(it.title) + '</h3>' +
    '<p class="pc-when tnum">' + (it.endDate && it.endDate > it.date ? esc(bxRangeLabel(it.date, it.endDate)) + ' · ' + (timed ? esc(it.start) + ' 시작' + (it.end ? ' · ' + esc(it.end) + ' 끝' : '') : bxSpanN(it) + '일간') : esc(fmtMD(it.date)) + ' · ' + (timed ? esc(it.start) + (it.end ? '–' + esc(it.end) : '') : '종일')) + '</p>' +
    (it.location ? '<p class="pc-loc">' + ICON.pin + esc(it.location) + '</p>' : '') +
    (it.note ? '<p class="pc-note">' + esc(it.note.slice(0, 300)) + (it.note.length > 300 ? '…' : '') + '</p>' : '') +
    '<div class="bx-ed bx-pc45" role="group" aria-label="' + esc(window.BX_NAME) + '에서 정하는 것">' + row('rem', ICON.bell, rem || '알림', !!rem, '알림') +
      (timed ? row('go', BX_ICONS.walk, go || '출발·준비', !!go, '출발·준비') : '') + '</div>' +
    '<p class="p small pc-ro">제목·날짜·시간은 휴대폰 캘린더 앱에서 고쳐요. ' + esc(window.BX_NAME) + '에서는 읽기만 해요.</p>';
  setSheet(body, '<button type="button" class="btn grow" data-act="pc-open-app" data-id="' + esc(id) + '">' + ICON.cal + '캘린더 앱에서 열기</button>' +
    '<button type="button" class="btn grow' + (it.done ? '' : ' primary') + '" data-act="pc-done" data-id="' + esc(id) + '">' + (it.done ? '완료 취소' : ICON.check + '완료') + '</button>');
  // 열린 페이지는 그 자리에서 새로(고른 표시 · 출발 줄)
  if (bxPg && bxPg.node && bxPg.node.dataset.pc45) bxPg.node.innerHTML = bxPc45PageHtml(bxPg.node.dataset.pc45, it);
};
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const r = ev.target.closest('[data-bxpc45]'); if (!r) return;
  ev.preventDefault(); ev.stopPropagation();
  const idEl = document.querySelector('#sheet-f [data-act="pc-done"]'), id = idEl ? idEl.dataset.id : null;
  const it = id ? M.items.find(i => i.id === id) : null; if (!it) return;
  const k = r.dataset.bxpc45, key = 'px_' + it.pcKey, cur = getDoc(key), snap = cur ? bxEpClone(cur) : null;
  // ‹ 로 되돌릴 때: 이 일정의 값 · 이동 시간 기억(같은 장소 · 제목에 다시 씀) · '외출 준비 새로'로 막 만든 루틴까지
  const mem = getDoc(TV_MEM), memSnap = mem ? bxEpClone(mem) : null, rtIds = new Set(M.routines.map(x => x.id));
  const sb = document.getElementById('sheet-b'); if (!sb) return;
  const node = document.createElement('div');
  node.className = 'bx-tt45-pg bx-pc45-pg'; node.dataset.pc45 = k; node.hidden = true;
  sb.appendChild(node);
  node.innerHTML = bxPc45PageHtml(k, it);
  bxPgOpen(k === 'rem' ? '알림' : '출발·준비', node, () => {
    if (snap) writeDoc(key, snap); else if (getDoc(key)) removeDoc(key);
    if (JSON.stringify(getDoc(TV_MEM)) !== JSON.stringify(memSnap)) { if (memSnap) writeDoc(TV_MEM, memSnap); else removeDoc(TV_MEM); }
    M.routines.filter(x => !rtIds.has(x.id) && tvKey(x.name) === tvKey(TV_OUT.name)).forEach(x => removeDoc(x.id));
    M = buildModel(); pcDraw(id);
  });
  node.hidden = false;
}, true);

/* 3) 루틴 고치기: 이름 → 알림 방식 → 요일 · 공휴일 제외 → 기준 → 시각 → 미리 보기 → 단계 → 아이콘(대표 결정 10/31 · 11/1의 순서 그대로).
   알림 방식 · 기준은 줄을 누르면 페이지(그 자리에서 간격 · 횟수나 시각 칸이 펼쳐지지 않게). 공휴일 제외 안내는 줄 아래 한 줄로 늘 보임 */
const BX_SAND_I = '<svg class="i" viewBox="0 0 24 24"><path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M7.5 3.5c0 4.5 4.5 5.5 4.5 8.5s-4.5 4-4.5 8.5M16.5 3.5c0 4.5-4.5 5.5-4.5 8.5s4.5 4 4.5 8.5"/></svg>';
function bxRt45NtfText(){
  if (R.sound === 'bowl') { const b = BX_BOWLS.find(x => x[0] === (R.bowl || bxBowlType())); return '싱잉볼 · ' + (b ? b[1] : '맑은 볼'); }
  return '알람 · ' + (+R.times ? R.every + '분마다 ' + R.times + '번 더' : '한 번만');
}
function bxRt45Row(k){
  const row = (icon, title, val) => '<button type="button" class="bx-er bx-rt45-r" data-bxrt45="' + k + '" aria-label="' + esc(title + ', ' + val) + '"><span class="bx-er-ic" aria-hidden="true">' + icon + '</span><span class="bx-er-tt"><span class="bx-er-t">' + esc(title) + '</span><small>' + esc(val) + '</small></span></button>';
  if (k === 'ntf') return row(ICON.bell, '알림 방식', bxRt45NtfText());
  if (k === 'mode') return row(ICON.flag || ICON.clock, '기준', R.mode === 'arrive' ? '도착 시각에 맞추기' : '시작 시각부터');
  return '';
}
function bxRt45DaysSum(){ return R.days.length ? daysText(R.days) : '요일을 골라요'; }
function bxRt45HolSum(){ return R.skipHol ? '공휴일 · 대체공휴일에는 울리지 않아요' : '공휴일에도 울려요'; }
function bxRt45Refresh(){
  const box = document.getElementById('bx-rt45'); if (!box || !R) return;
  ['ntf', 'mode'].forEach(k => { const el = box.querySelector('[data-bxrt45="' + k + '"]'); if (el) el.outerHTML = bxRt45Row(k); });
  const ds = document.getElementById('bx-rt45-dsum'); if (ds) { ds.textContent = bxRt45DaysSum(); ds.classList.toggle('ph', !R.days.length); }
  const hs = document.getElementById('bx-rt45-hsum'); if (hs) { hs.textContent = bxRt45HolSum(); hs.classList.toggle('on', !!R.skipHol); }
}
function bxRt45ModeHtml(){
  const o = (v, t, s) => '<button type="button" class="bx-ep-row bx-rt45-opt" role="radio" data-rmode="' + v + '" aria-pressed="' + (R.mode === v) + '"><span class="bx-er-tt"><span class="bx-er-t">' + t + '</span><small>' + s + '</small></span></button>';
  return '<div class="bx-ep-box bx-rt45-list" role="radiogroup" aria-label="시간 기준">' + o('start', '시작 시각부터', '정한 시각에 첫 단계를 시작해요') +
    o('arrive', '도착 시각에 맞추기', '도착할 시각에서 이동 시간 · 단계 시간을 거꾸로 빼서 시작해요') + '</div>';
}
// 시각 칸: 줄마다 이름 왼쪽 · 값 오른쪽(시각을 누르면 휴대폰 시계 창)
const bxRtTimes45 = rtTimesHtml;
rtTimesHtml = function(){
  if (!window.BX_APP || !R) return bxRtTimes45.apply(this, arguments);
  const tm = (label, icon) => '<div class="bx-er bx-rt45-v"><span class="bx-er-ic" aria-hidden="true">' + icon + '</span><label class="bx-er-t" for="r-target">' + label + '</label><input type="time" id="r-target" class="bx-rt45-time" value="' + esc(R.target) + '"></div>';
  const st = (id, label, icon, v, max) => '<div class="bx-er bx-rt45-v"><span class="bx-er-ic" aria-hidden="true">' + icon + '</span><span class="bx-er-t">' + label + '</span>' + stepperHtml(id, v, 0, max, null, 5) + '<span class="bx-rt45-u">분</span></div>';
  if (R.mode === 'arrive') return tm('도착 시각', ICON.flag || ICON.clock) + st('r-travel', '이동 시간', BX_ICONS.walk, R.travel, 300) + st('r-buffer', '여유', BX_SAND_I, R.buffer, 120);
  return tm('시작 시각', ICON.clock);
};
const bxDrawRoutine45 = bxDrawRoutine;
bxDrawRoutine = function(){
  if (!window.BX_APP || !R) return bxDrawRoutine45.apply(this, arguments);
  const days = [1, 2, 3, 4, 5, 6, 0].map(d => '<button type="button" class="day-tog' + (d === 0 ? ' sun' : d === 6 ? ' sat' : '') + '" data-rday="' + d + '" aria-pressed="' + R.days.includes(d) + '" aria-label="' + WD[d] + '요일">' + WD[d] + '</button>').join('');
  const when = R.once
    ? '<div class="bx-er bx-rt45-once"><span class="bx-er-ic" aria-hidden="true">' + ICON.clock + '</span><span class="bx-er-tt"><span class="bx-er-t">' + esc(rtWhenText(R)) + '</span><small>끝나면 목록에서 사라져요</small></span></div><div id="r-timebox">' + rtTimesHtml() + '</div>'
    : '<div class="bx-er bx-rt45-days"><div class="bx-rt45-dh"><span class="bx-er-ic" aria-hidden="true">' + BX_DOCK_ALL.routines.icon + '</span><span class="bx-er-t' + (R.days.length ? '' : ' ph') + '" id="bx-rt45-dsum">' + esc(bxRt45DaysSum()) + '</span>' +
        '<span class="rdays-q"><button type="button" class="sec-link" data-rdays="wd">평일</button><button type="button" class="sec-link" data-rdays="all">매일</button></span></div>' +
        '<div class="rdays" role="group" aria-label="요일">' + days + '</div></div>' +
      '<div class="bx-er bx-rt45-hol"><span class="bx-er-ic" aria-hidden="true">' + TT_OFF + '</span><span class="bx-er-tt"><span class="bx-er-t">공휴일 제외</span><small id="bx-rt45-hsum"' + (R.skipHol ? ' class="on"' : '') + '>' + esc(bxRt45HolSum()) + '</small></span>' + bxSwitch('data-rhol', !!R.skipHol, '공휴일 제외') + '</div>' +
      bxRt45Row('mode') + '<div id="r-timebox">' + rtTimesHtml() + '</div>';
  setSheet((R.note ? '<div class="hint">' + ICON.spark + '<span>' + esc(R.note) + '</span></div>' : '') +
    '<div class="bx-rt45-form">' +
      '<label class="sr" for="r-name">이름</label><input id="r-name" class="title-in" value="' + esc(R.name) + '" maxlength="30" autocomplete="off" enterkeyhint="done" placeholder="루틴 이름 예) 아침 준비">' +
      '<div class="bx-ed" id="bx-rt45" role="group" aria-label="루틴 내용">' + bxRt45Row('ntf') + when + '</div>' +
      '<div id="r-prev" class="rt-prev">' + rtPreviewHtml() + '</div>' +
      '<div class="bx-rt45-sh"><span class="fg-l">단계 <small>이름 · 시간(분) · 알람</small></span><p class="p small bx-rs-note">알람을 끄면 그 단계는 울리지 않고 시간만 지나가요. 세탁기 돌리기처럼 기다리는 단계에 써요.</p></div>' +
      '<div id="r-steps">' + rtStepsHtml() + '</div><div class="bx-rt45-add"><button type="button" class="btn sm" data-act="rs-add">' + ICON.plus + '단계 추가</button></div>' +
      '<div class="bx-ed bx-rt45-icr"><button type="button" class="bx-er bx-icsum" id="bx-icsum">' + bxIconSumHtml() + '</button></div>' +
      (R.id ? '<div class="bx-rdel"><button type="button" class="bx-del-link" data-act="rt-del">루틴 삭제</button></div>' : '') +
      // 페이지에 옮겨 쓰는 칸(평소에는 숨김)
      '<div class="bx-rt45-hold" hidden><div id="bx-rt45-pntf" class="bx-tt45-pg">' + bxNotifyHtml() + '</div><div id="bx-rt45-pmode" class="bx-tt45-pg">' + bxRt45ModeHtml() + '</div>' +
        '<div id="bx-icdet"><div class="bx-icpick" id="bx-icpick" role="group" aria-label="아이콘">' + bxIconGridHtml() + '</div></div></div>' +
    '</div>',
    '<button type="button" class="btn grow primary" data-act="rt-save">저장</button>');
};
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest || typeof R === 'undefined' || !R || !document.getElementById('bx-rt45')) return;
  const r = ev.target.closest('[data-bxrt45]');
  if (r) {
    ev.preventDefault(); ev.stopPropagation();
    if (r.dataset.bxrt45 === 'ntf') {
      const node = document.getElementById('bx-rt45-pntf'), snap = {sound: R.sound, bowl: R.bowl, every: R.every, times: R.times};
      bxPgOpen('알림 방식', node, () => { Object.assign(R, snap); node.innerHTML = bxNotifyHtml(); });
    } else if (r.dataset.bxrt45 === 'mode') {
      const snap = R.mode;
      bxPgOpen('기준', document.getElementById('bx-rt45-pmode'), () => {
        if (R.mode === snap) return;
        R.mode = snap; document.querySelectorAll('[data-rmode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rmode === snap)));
        rtRedrawParts('times'); rtRedrawParts('prev');
      });
    }
    return;
  }
  // 요일 · 평일 · 매일 · 공휴일 제외를 누르면 줄의 한 줄 글도 바로(바탕 처리기 다음에)
  if (ev.target.closest('[data-rday],[data-rdays],[data-rhol]')) setTimeout(bxRt45Refresh, 0);
}, true);

/* 모양(삼성 잰 값: 줄 56 · 글자 16 · 상자 모서리 26 · 상자 안 20) */
(function bxV45Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v45';
  const box = 'background:var(--card-bg);border-radius:26px;padding:0 20px';
  st.textContent = [
    // 수업 창
    'html.bx-app .bx-tt45{display:flex;flex-direction:column;gap:0}',
    'html.bx-app .bx-tt45 .tt-hint{margin:0 0 8px}',
    'html.bx-app .bx-tt45 #tt-name{margin:0 0 6px}',
    'html.bx-app .bx-tt45-rows{display:block;margin:0;padding:0}',
    'html.bx-app .bx-tt45-rows > :last-child{border-bottom:0}',
    'html.bx-app .bx-tt45-days .tt-days,html.bx-app .bx-tt45-col .tt-sws{flex:1;min-width:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:0;justify-items:center;align-items:center;padding:0}',
    'html.bx-app .bx-tt45-days .tt-dbtn{position:relative;flex:none;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:transparent;font-size:15px;font-weight:500}',
    'html.bx-app .bx-tt45-days .tt-dbtn::after{content:"";position:absolute;inset:-4px}',
    'html.bx-app .bx-tt45-days .tt-dbtn[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);font-weight:700}',
    'html.bx-app .bx-tt45-col .tt-sw{width:28px;height:28px;border-radius:50%}',
    'html.bx-app .bx-tt45-t{padding:6px 0}',
    'html.bx-app .bx-tt45-time{width:100%;max-width:160px;min-height:44px;margin:0;padding:4px 6px;border:0;border-radius:12px;background:transparent;box-shadow:none;color:var(--ink);font:inherit;font-size:17px;font-weight:500;text-align:center;-webkit-appearance:none;appearance:none}',
    'html.bx-app .bx-tt45-time:focus{outline:none;background:color-mix(in srgb,var(--ink) 6%,transparent)}',
    'html.bx-app .bx-tt45-time::-webkit-datetime-edit{display:inline-flex;justify-content:center;padding:0}',
    'html.bx-app .bx-tt45-time::-webkit-calendar-picker-indicator{display:none}',
    // 페이지 안(장소 · 알림 · 시간표, 휴대폰 캘린더 알림 · 출발·준비)
    'html.bx-app .bx-ep .bx-tt45-pg{display:flex;flex-direction:column;gap:14px}',
    'html.bx-app .bx-ep .bx-tt45-pg:empty{display:none}',
    'html.bx-app .bx-ep .bx-tt45-in{padding:6px 20px}',
    'html.bx-app .bx-ep .bx-tt45-in .inp{width:100%;min-height:52px;border:0;background:transparent;box-shadow:none;padding:0;font-size:17px;color:var(--ink)}',
    'html.bx-app .bx-ep .tt-remw{display:flex;flex-direction:column;gap:14px}',
    'html.bx-app .bx-ep .tt-remw .tt-pills,html.bx-app .bx-ep .bx-pc45-list{display:flex!important;flex-direction:column;flex-wrap:nowrap;gap:0;margin:0;' + box + '}',
    'html.bx-app .bx-ep .tt-remw .tt-pill,html.bx-app .bx-ep .bx-pc45-list .pick{display:flex;align-items:center;justify-content:flex-start;gap:14px;flex:none;width:100%;height:auto;min-height:56px;margin:0;padding:12px 0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent!important;box-shadow:none!important;color:var(--ink)!important;font-size:16px;font-weight:400;line-height:1.35;text-align:left;white-space:normal;word-break:keep-all}',
    'html.bx-app .bx-ep .tt-remw .tt-pill:last-child,html.bx-app .bx-ep .bx-pc45-list .pick:last-child{border-bottom:0}',
    'html.bx-app .bx-ep .tt-remw .tt-pill::before,html.bx-app .bx-ep .bx-pc45-list .pick::before{content:"";flex:none;width:20px;height:20px;box-sizing:border-box;border:2px solid var(--ink-3);border-radius:50%}',
    'html.bx-app .bx-ep .tt-remw .tt-pill[aria-pressed="true"]::before,html.bx-app .bx-ep .bx-pc45-list .pick[aria-pressed="true"]::before{border:6px solid var(--accent)}',
    'html.bx-app .bx-ep .tt-remw .tt-pill[data-v="custom"]::before{content:"+";border:0;color:var(--accent);font-size:24px;font-weight:400;line-height:19px;text-align:center}',
    'html.bx-app .bx-ep .tt-remw .bx-cpick{min-height:56px;padding:8px 0}',
    'html.bx-app .bx-ep .tt-remw .bx-cpick input{outline:none;flex:none;width:4.2em;height:40px;padding:0 8px;border:0;border-bottom:2px solid var(--accent);border-radius:0;background:transparent;color:var(--ink);font:inherit;font-size:17px;font-weight:500;text-align:center}',
    'html.bx-app .bx-ep .tt-remw .bx-cpick span{font-size:16px}',
    'html.bx-app .bx-ep .bx-pc45-list .pick small{color:var(--ink-3);font-size:13px}',
    // 시간표 고르기: 색 점 · 이름 · 고른 것은 ✓
    'html.bx-app .bx-ep .bx-tt45-opt i.dot{flex:none;width:14px;height:14px;margin:0 3px;border-radius:50%;background:var(--c)}',
    'html.bx-app .bx-ep .bx-tt45-opt[aria-pressed="true"]{font-weight:700}',
    'html.bx-app .bx-ep .bx-tt45-opt[aria-pressed="true"]::after{content:"";flex:none;margin-left:auto;width:20px;height:20px;background:var(--accent);-webkit-mask:' + BX_CHECK_MASK + ';mask:' + BX_CHECK_MASK + '}',
    // 휴대폰 캘린더: 이동 시간 4칸, 출발 줄은 상자
    'html.bx-app .bx-ep .bx-pc45-pg > .fg-l{margin:6px 20px -6px;padding:0;font-size:13px;font-weight:500;color:var(--ink-2)}',
    'html.bx-app .bx-ep .bx-pc45-pg > .fg-l small{font-weight:400;color:var(--ink-3);margin-left:4px}',
    'html.bx-app .bx-ep .bx-pc45-tv{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0}',
    'html.bx-app .bx-ep .bx-pc45-tv .pick{width:auto;min-width:0;min-height:48px;margin:0;padding:0 4px;border:0;border-radius:16px;background:var(--card-bg)!important;color:var(--ink)!important;font-size:15px;font-weight:600;white-space:nowrap;justify-content:center}',
    'html.bx-app .bx-ep .bx-pc45-tv .pick[aria-pressed="true"]{background:var(--accent-soft)!important;box-shadow:inset 0 0 0 2px var(--accent)!important}',
    'html.bx-app .bx-ep .bx-pc45-pg > .tv-line{margin:0;' + box + ';padding:16px 20px}',
    // 시간표 보기 설정
    'html.bx-app .bx-tt45-rg{display:flex;flex-direction:column}',
    'html.bx-app .bx-tt45-gl{margin:18px 0 8px;font-size:13px;font-weight:500;color:var(--ink-2)}',
    'html.bx-app .bx-tt45-gl:first-child{margin-top:2px}',
    'html.bx-app .bx-tt45-rg .bx-grp > :last-child{border-bottom:0}',
    'html.bx-app .bx-tt45-sel{flex:none;min-height:44px;margin:0 -8px 0 0;padding:0 8px;border:0;border-radius:12px;background:transparent;color:var(--ink);font:inherit;font-size:17px;font-weight:500;text-align:right}',
    'html.bx-app .bx-tt45-sel:focus{outline:none;background:color-mix(in srgb,var(--ink) 6%,transparent)}',
    'html.bx-app .bx-tt45-ro{gap:14px}',
    'html.bx-app .bx-tt45-ro::before{content:"";flex:none;width:20px;height:20px;box-sizing:border-box;border:2px solid var(--ink-3);border-radius:50%}',
    'html.bx-app .bx-tt45-ro[aria-pressed="true"]::before{border:6px solid var(--accent)}',
    'html.bx-app .bx-tt45-note{margin:10px 0 0;color:var(--ink-3)}',
    // 휴대폰 캘린더 일정 창의 줄
    'html.bx-app .bx-pc45{display:block;margin:6px 0 0;border-top:1px solid var(--line)}',
    'html.bx-app .bx-pc45 > :last-child{border-bottom:0}',
    // 두 줄 줄(이름 + 파란 한 줄, 삼성 설정 줄처럼)
    'html.bx-app .bx-er-tt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;padding:9px 0}',
    'html.bx-app .bx-er-tt > small{font-size:13.5px;font-weight:400;line-height:1.35;color:var(--accent);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    // 루틴 창
    'html.bx-app .bx-rt45-form{display:flex;flex-direction:column;gap:0}',
    'html.bx-app .bx-rt45-form #r-name{margin:0 0 6px}',
    'html.bx-app #bx-rt45{display:block;margin:0;padding:0}',
    'html.bx-app #bx-rt45 > :last-child,html.bx-app #bx-rt45 #r-timebox > :last-child{border-bottom:0}',
    'html.bx-app #bx-rt45 #r-timebox{display:block;margin:0}',
    'html.bx-app .bx-rt45-hol .bx-er-tt > small,html.bx-app .bx-rt45-once .bx-er-tt > small{color:var(--ink-3)}',
    'html.bx-app .bx-rt45-hol .bx-er-tt > small.on{color:var(--accent)}',
    'html.bx-app .bx-rt45-hol .tog{flex:none}',
    'html.bx-app .bx-rt45-days{display:block;padding:6px 0 12px}',
    'html.bx-app .bx-rt45-dh{display:flex;align-items:center;gap:16px;min-height:44px}',
    'html.bx-app .bx-rt45-dh .rdays-q{display:flex;gap:2px;margin-left:auto}',
    'html.bx-app .bx-rt45-dh .rdays-q .sec-link{min-height:36px;padding:0 10px;font-size:14px}',
    'html.bx-app .bx-rt45-days .rdays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));justify-items:center;gap:0;margin:2px 0 0 30px}',
    'html.bx-app .bx-rt45-days .day-tog{position:relative;width:36px;height:36px;border:0;background:transparent;font-size:15px;font-weight:500;color:var(--ink)}',
    'html.bx-app .bx-rt45-days .day-tog::after{content:"";position:absolute;inset:-4px}',
    'html.bx-app .bx-rt45-days .day-tog.sun{color:var(--sun)}html.bx-app .bx-rt45-days .day-tog.sat{color:var(--sat)}',
    'html.bx-app .bx-rt45-days .day-tog[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink);font-weight:700}',
    'html.bx-app .bx-rt45-v{gap:12px}',
    'html.bx-app .bx-rt45-v .bx-er-ic{margin-right:4px}',
    'html.bx-app .bx-rt45-v .bx-er-t{flex:1}',
    'html.bx-app .bx-rt45-time{flex:none;min-height:44px;margin:0 -8px 0 0;padding:4px 8px;border:0;border-radius:12px;background:transparent;box-shadow:none;color:var(--ink);font:inherit;font-size:17px;font-weight:500;text-align:right;-webkit-appearance:none;appearance:none}',
    'html.bx-app .bx-rt45-time:focus{outline:none;background:color-mix(in srgb,var(--ink) 6%,transparent)}',
    'html.bx-app .bx-rt45-time::-webkit-calendar-picker-indicator{display:none}',
    'html.bx-app .bx-rt45-v .stepper{flex:none}',
    'html.bx-app .bx-rt45-u{flex:none;font-size:15px;color:var(--ink-2)}',
    'html.bx-app .bx-rt45-form > #r-prev{margin:12px 0 0}',
    'html.bx-app .bx-rt45-sh{margin:22px 0 8px}',
    'html.bx-app .bx-rt45-sh .fg-l{font-size:13px;font-weight:500;color:var(--ink-2)}',
    'html.bx-app .bx-rt45-sh .fg-l small{font-weight:400;color:var(--ink-3);margin-left:4px}',
    'html.bx-app .bx-rt45-sh .bx-rs-note{margin:4px 0 0}',
    'html.bx-app .bx-rt45-add{margin:2px 0 0}',
    // 단계: 이름은 제목처럼 밑줄 칸, 단계 사이는 줄(상자 테두리 대신)
    'html.bx-app .bx-rt45-form #r-steps .rs-row{margin:0 0 4px;padding:2px 0 10px;border-bottom:1px solid var(--line)}',
    'html.bx-app .bx-rt45-form #r-steps .rs-name{height:46px;padding:0 2px;border:0;border-bottom:1.5px solid var(--line);border-radius:0;background:transparent;box-shadow:none;font-size:16px;font-weight:500;color:var(--ink)}',
    'html.bx-app .bx-rt45-form #r-steps .rs-name:focus{outline:none;border-bottom-color:var(--accent)}',
    'html.bx-app .bx-rt45-icr{display:block;margin:18px 0 0;border-top:1px solid var(--line)}',
    'html.bx-app .bx-rt45-icr .bx-icsum{display:flex;align-items:center;gap:16px;border-bottom:0}',
    'html.bx-app .bx-rt45-icr .bx-icsum-i{flex:none;width:22px;height:22px;display:flex;align-items:center;justify-content:center;color:var(--ink-2)}',
    'html.bx-app .bx-rt45-icr .bx-icsum-i svg{width:21px;height:21px}',
    'html.bx-app .bx-rt45-icr .bx-icsum-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;padding:9px 0;font-size:16px;font-weight:400;color:var(--ink)}',
    'html.bx-app .bx-rt45-icr .bx-icsum-t small{font-size:13.5px;color:var(--accent)}',
    'html.bx-app .bx-rt45-icr .bx-icsum-c{display:none}',
    // 루틴 페이지: 알림 방식(알람 · 싱잉볼 동그라미, 간격 · 횟수 상자, 종소리 목록) · 기준
    'html.bx-app .bx-ep .bx-notify{display:flex;flex-direction:column;gap:14px;margin:0}',
    'html.bx-app .bx-ep .bx-notify > .fg-l{display:none}',
    'html.bx-app .bx-ep .bx-notify .bx-lockset{margin:0;padding:0 20px;border-top:0;background:var(--card-bg);border-radius:26px}',
    'html.bx-app .bx-ep .bx-notify .bx-lock-o{min-height:64px}',
    'html.bx-app .bx-ep .bx-notify .bx-lock-o b{font-size:16px;font-weight:400}',
    'html.bx-app .bx-ep .bx-notify .bx-lock-o span > small{font-size:13px;color:var(--ink-3)}',
    'html.bx-app .bx-ep #bx-rrep,html.bx-app .bx-ep #bx-rbowl{display:block;margin:0}',
    'html.bx-app .bx-ep #bx-rrep[hidden],html.bx-app .bx-ep #bx-rbowl[hidden]{display:none}',
    'html.bx-app .bx-ep #bx-rrep .bx-rrow{display:flex;align-items:center;gap:12px;min-height:64px;margin:0;padding:0 20px;background:var(--card-bg)}',
    'html.bx-app .bx-ep #bx-rrep .bx-rrow:first-child{border-radius:26px 26px 0 0;border-bottom:1px solid var(--line)}',
    'html.bx-app .bx-ep #bx-rrep .bx-rrow:nth-child(2){border-radius:0 0 26px 26px}',
    'html.bx-app .bx-ep #bx-rrep .bx-rl{flex:1;font-size:16px;font-weight:400;color:var(--ink)}',
    'html.bx-app .bx-ep #bx-rrep .bx-ru{font-size:15px;font-weight:400;color:var(--ink-2);min-width:3.2em}',
    'html.bx-app .bx-ep #bx-rrep .bx-rnote,html.bx-app .bx-ep #bx-rbowl > .p{margin:12px 20px 0;color:var(--ink-3)}',
    'html.bx-app .bx-ep #bx-rbowl .bx-sndrow{display:block}',
    'html.bx-app .bx-ep #bx-rbowl .bx-bowl-picks{display:flex!important;flex-direction:column;flex-wrap:nowrap;gap:0;margin:0;' + box + '}',
    'html.bx-app .bx-ep #bx-rbowl .bx-bowl-picks .pick{display:flex;align-items:center;justify-content:flex-start;gap:14px;flex:none;width:100%;height:auto;min-height:56px;margin:0;padding:12px 0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent!important;box-shadow:none!important;color:var(--ink)!important;font-size:16px;font-weight:400;text-align:left}',
    'html.bx-app .bx-ep #bx-rbowl .bx-bowl-picks .pick:last-child{border-bottom:0}',
    'html.bx-app .bx-ep #bx-rbowl .bx-bowl-picks .pick::before,html.bx-app .bx-ep .bx-rt45-opt::before{content:"";flex:none;width:20px;height:20px;box-sizing:border-box;border:2px solid var(--ink-3);border-radius:50%}',
    'html.bx-app .bx-ep #bx-rbowl .bx-bowl-picks .pick[aria-pressed="true"]::before,html.bx-app .bx-ep .bx-rt45-opt[aria-pressed="true"]::before{border:6px solid var(--accent)}',
    'html.bx-app .bx-ep .bx-rt45-opt{gap:14px;min-height:64px}',
    'html.bx-app .bx-ep .bx-rt45-opt .bx-er-tt > small{color:var(--ink-3);white-space:normal}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
