/* ---------- 시험판 44: 일정 창을 삼성 캘린더 방식으로 · 캘린더 + 단추 · 일 · 주 · 월 · 칩 작게 ----------
   대표 11/4 1:18: + 단추의 번지는 그림자가 너무 강하다 · 불투명도 70%. 일 · 주 · 월은 70%로, 캘린더 칩도 작게.
   대표 11/4 1:24 · 1:51: 삼성 앱 사진의 정렬 · 여백을 앱 전체 기본 기준으로(결정 기록 D-19, 제품 원칙 규칙 14).
   대표 11/4 1:34: 메뉴를 누르면 그 아래로 펼치지 말고 입력 창을 띄워 고르거나 적고 '완료'(메뉴 자리가 움직이면 혼란, 규칙 16).
   대표 11/4 1:50 · 1:53: 삼성 캘린더 입력 방식이 더 안정적이다(길어져도 뒤를 '…'로 줄이면 된다).
     선택지가 있는 알림은 다른 페이지에서 고르거나 직접 입력, 장소는 찾는 창으로. 메뉴 순서도 삼성을 따른다.
   - 일정 창: 제목 → 하루 종일 · 시작 → 끝 → 장소 → 캘린더 → 알림 → 출발·준비(삼성의 '반복' 자리) → 메모 → 사진·파일.
     줄마다 아이콘 + 값 한 줄(길면 …), 비어 있으면 회색으로 이름. 삼성 일정 편집처럼 줄 높이 56 · 줄 사이 선.
   - 줄을 누르면 그 자리에서 펼치지 않고 페이지가 열린다(‹ 이름 · 완료). '완료'를 눌러야 바뀌고, ‹ · 휴대폰 뒤로는 바꾼 것을 되돌린다.
     페이지 안의 고르는 칸은 삼성 알림 설정처럼 상자 안 줄 목록(동그라미 · 글자 · 줄 사이 선).
   - 장소 페이지: 적는 칸 + 최근 장소 + '지도 앱에서 찾기'(휴대폰 지도 앱, 지도 API는 쓰지 않음 · D-02). 주소 검색은 정할 것 23 */

/* 1) 캘린더 화면: + 단추 · 일 · 주 · 월 · 캘린더 칩 */
(function bxV44CalStyle(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v44-cal';
  st.textContent = [
    // + 단추: 번지는 파란 그림자를 빼고 옅은 그림자만, 불투명도 70%(+ 표시는 또렷하게). 누르는 동안은 진하게
    'html.bx-app .bx-fab{background:color-mix(in srgb,var(--accent) 70%,transparent);box-shadow:0 2px 8px rgba(0,0,0,.18)}',
    'html.bx-app .bx-fab:active{background:var(--accent)}',
    // 일 · 주 · 월: 70%(높이 44 → 31, 단추 40×36 → 28×25). 손가락으로 누르는 범위는 위아래로 넓혀 44 그대로. + 단추와 가운데 높이를 맞춘다
    'html.bx-app .bx-vsw{height:31px;padding:2px;gap:1px;border-radius:16px;bottom:calc(var(--dock-h) + env(safe-area-inset-bottom,0px) + 30px);box-shadow:0 2px 8px rgba(0,0,0,.18)}',
    'html.bx-app .bx-vsw button{position:relative;width:28px;height:25px;border-radius:13px;font-size:11.5px;font-weight:700}',
    'html.bx-app .bx-vsw button::after{content:"";position:absolute;left:0;right:0;top:-10px;bottom:-10px}',
    // 캘린더 칩: 높이 34 → 28, 글자 13.5 → 12.5, 고른 칩만 굵게
    'html.bx-app .bx-cchips{gap:6px}',
    'html.bx-app .bx-cchip{height:28px;padding:0 11px;border-radius:14px;font-size:12.5px;font-weight:500;gap:5px}',
    'html.bx-app .bx-cchip[aria-pressed="true"]{font-weight:700}',
    'html.bx-app .bx-cchip .dot{width:7px;height:7px}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();

/* 2) 일정 창 줄 목록 */
const BX_EP_T = {date: '날짜', time: '시간', rem: '알림', cat: '캘린더', go: '출발·준비', att: '사진·파일', loc: '장소', note: '메모'};
const BX_ARROW = '<svg class="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
function bxEdDay(ds){ const d = parseYmd(ds); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + WD[d.getDay()] + ')'; }
function bxEdRow(k, icon, text, set, label, sub){
  return '<button type="button" class="bx-er" data-fpanel="' + k + '"' + (sub ? ' data-bxsub="' + sub + '"' : '') + ' aria-label="' + esc(label + ', ' + text) + '">' +
    '<span class="bx-er-ic" aria-hidden="true">' + icon + '</span><span class="bx-er-t' + (set ? '' : ' ph') + '">' + esc(text) + '</span></button>';
}
function bxEdList(){
  const el = document.getElementById('f-chips'); if (!el || !F) return;
  const chip = k => el.querySelector('.fchip[data-fpanel="' + k + '"]');
  const txt = k => { const c = chip(k), s = c && c.querySelector('span'); return s ? s.textContent : ''; };
  const set = k => { const c = chip(k); return !!(c && c.classList.contains('set')); };
  const ico = k => { const c = chip(k), s = c && c.querySelector('svg'); return s ? s.outerHTML : ''; };
  const hasGo = !!chip('go'), hasAtt = !!chip('att');
  // 하루 종일 · 시작 → 끝(삼성 일정 편집처럼 두 칸, 가운데 화살표). 날짜를 누르면 날짜, 시각을 누르면 시간 페이지
  const multi = typeof bxFMulti === 'function' && bxFMulti();
  const d1 = multi ? F.endDate : F.date;
  const t0 = F.timed && isHM(F.start) ? F.start : '', t1 = F.timed && isHM(F.end) ? F.end : '';
  const col = (ds, t, end) => '<div class="bx-edt-c">' +
    '<button type="button" class="bx-edt-d" data-fpanel="date" aria-label="' + (end ? '끝나는 날 ' : '날짜 ') + esc(bxEdDay(ds)) + '">' + esc(bxEdDay(ds)) + '</button>' +
    (F.timed ? '<button type="button" class="bx-edt-t' + (t ? '' : ' ph') + '" data-fpanel="time" aria-label="' + (end ? '끝 시각 ' : '시작 시각 ') + (t || '없음') + '">' + (t || (end ? '끝 시각 없음' : '시각')) + '</button>' : '') + '</div>';
  const cat = F.categoryId ? M.catMap.get(F.categoryId) : null;
  const catDot = cat ? '<i class="dot" style="--c:' + (F.color || catColor(cat.id)) + '"></i>' : '';
  const note = (F.note || '').split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
  const n = (F.att || []).length;
  el.classList.add('bx-ed');
  el.setAttribute('role', 'group'); el.setAttribute('aria-label', '일정 내용');
  el.innerHTML =
    '<div class="bx-er bx-er-sw"><span class="bx-er-ic" aria-hidden="true">' + ICON.clock + '</span><span class="bx-er-t">하루 종일</span>' + bxSwitch('data-bxallday', !F.timed, '하루 종일') + '</div>' +
    '<div class="bx-edt">' + col(F.date, t0) + '<span class="bx-edt-arr" aria-hidden="true">' + BX_ARROW + '</span>' + col(d1, t1, true) + '</div>' +
    bxEdRow('more', ICON.pin, F.location || '장소', !!F.location, '장소', 'loc') +
    // 비어 있으면 회색으로 이름만(삼성 '장소' · '메모'처럼). '알림 없음'은 이미 고른 것처럼 보인다(대표 11/3 18:12)
    bxEdRow('cat', '<span class="bx-er-cal">' + ICON.cal + catDot + '</span>', cat ? cat.name : '캘린더', !!cat, '캘린더') +
    bxEdRow('rem', ico('rem') || ICON.bell, set('rem') ? txt('rem') : '알림', set('rem'), '알림') +
    (hasGo ? bxEdRow('go', BX_ICONS.walk, set('go') ? txt('go') : '출발·준비', set('go'), '출발·준비') : '') +
    bxEdRow('more', BX_MEMO_ICON, note || '메모', !!note, '메모', 'note') +
    (hasAtt ? bxEdRow('att', BX_CLIP_ICON, n ? '사진·파일 ' + n + '개' : '사진·파일', n > 0, '사진·파일') : '');
}
const bxChips44 = drawFChips;
drawFChips = function(){
  const r = bxChips44.apply(this, arguments);
  if (window.BX_APP) bxEdList();
  return r;
};
// 하루 종일 스위치(지금 앱의 '종일 / 시간 지정'과 같은 일)
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('[data-bxallday]'); if (!b || !F) return;
  ev.preventDefault(); ev.stopPropagation();
  F.timed = !F.timed; F.touchedTime = true;
  if (F.timed) {
    if (!isHM(F.start)) F.start = defStart(F.date);
    if (!F.end) F.end = fromMin(Math.min(toMin(F.start) + 60, 1439));
  }
  drawFChips(); drawFHint();
  if (typeof updRemWhen === 'function') updRemWhen();
}, true);

/* 3) 줄을 누르면 페이지(펼치지 않음). '완료'로 바꾸고, ‹ · 뒤로는 되돌림 */
let bxEpSnap = null;
function bxEpClone(o){ try { return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)); } catch (e) { return JSON.parse(JSON.stringify(o)); } }
function bxEpKey(){ return F && F.panel ? (F.panel === 'more' ? (F.bxSub === 'note' ? 'note' : 'loc') : F.panel) : null; }
// 줄을 누르는 순간(바탕 처리기가 F.panel을 바꾸기 전)의 값을 둔다. 장소 · 메모는 같은 칸을 반씩 쓴다
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest || !F) return;
  const fp = ev.target.closest('#f-chips [data-fpanel]'); if (!fp) return;
  if (!F.panel) bxEpSnap = bxEpClone(F);
  F.bxSub = fp.dataset.bxsub || null;
  // 이미 열린 칸을 한 번 더 눌러도 닫히지 않게(페이지가 덮고 있어 보통은 못 누름)
  if (F.panel === fp.dataset.fpanel) F.panel = null;
}, true);
function bxEpSync(){
  const root = document.getElementById('sheet-root');
  const k = window.BX_APP && SH && SH.draw === drawEdit ? bxEpKey() : null;
  let pg = document.getElementById('bx-ep');
  const pan = document.getElementById('f-panel');
  if (!k) {
    if (pan && pg && pg.contains(pan)) { const home = document.getElementById('f-chips'); if (home) home.insertAdjacentElement('afterend', pan); pan.hidden = true; }
    if (pg) pg.remove();
    document.documentElement.classList.remove('bx-ep-on');
    return;
  }
  if (!root || !pan) return;
  if (!pg) {
    pg = document.createElement('div');
    pg.id = 'bx-ep'; pg.className = 'bx-ep'; pg.setAttribute('role', 'dialog'); pg.setAttribute('aria-modal', 'true'); pg.setAttribute('aria-labelledby', 'bx-ep-t');
    pg.innerHTML = '<div class="bx-ep-h"><button type="button" class="icon-btn" data-bxep="back" aria-label="취소하고 돌아가기">' + ICON.chevL + '</button>' +
      '<h2 id="bx-ep-t"></h2><button type="button" class="bx-ep-ok" data-bxep="done">완료</button></div><div class="bx-ep-b"></div>';
    root.appendChild(pg);
  }
  pg.dataset.k = k;
  pg.querySelector('#bx-ep-t').textContent = BX_EP_T[k] || '';
  const body = pg.querySelector('.bx-ep-b');
  // 일정 창을 다시 그렸으면 전의 칸은 버린다(같은 id가 둘이 되지 않게)
  body.querySelectorAll('#f-panel').forEach(x => { if (x !== pan) x.remove(); });
  if (pan.parentNode !== body) body.appendChild(pan);
  pan.hidden = false;
  document.documentElement.classList.add('bx-ep-on');
  if (k === 'loc') { if (pg.dataset.loc0 !== '1') { bxEpLoc0 = (F.location || '').trim(); pg.dataset.loc0 = '1'; } bxEpPlaces(); }
  // 알림 페이지: 스위치 줄은 삼성처럼 '사용 중 · 사용 안 함'(위 제목이 이미 '알림')
  if (k === 'rem') { const sw = pan.querySelector('.bx-swrow'), sp = sw && sw.querySelector('span'), tg = sw && sw.querySelector('.tog'); if (sp && tg) { const on = tg.getAttribute('aria-checked') === 'true'; sp.textContent = on ? '사용 중' : '사용 안 함'; sw.classList.toggle('on', on); } }
  // 캘린더 페이지: '없음' → '캘린더 없음'
  if (k === 'cat') { const nb = pan.querySelector('#f-cat > .picks .pick[data-fcat=""]'); if (nb && nb.textContent.trim() === '없음') nb.textContent = '캘린더 없음'; }
}
const bxPanel44 = drawFPanel;
drawFPanel = function(){
  const prev = document.getElementById('bx-ep'), was = prev ? prev.dataset.k : null;
  const r = bxPanel44.apply(this, arguments);
  if (window.BX_APP) {
    bxEpSync();
    const k = bxEpKey();
    if (!k) bxEpSnap = null;
    // 장소 · 메모는 열 때 적는 칸에 바로(키보드)
    else if (k !== was && (k === 'loc' || k === 'note')) setTimeout(() => { const i = document.getElementById(k === 'loc' ? 'f-loc' : 'f-note'); if (i && document.getElementById('bx-ep')) { try { i.focus(); const n = i.value.length; i.setSelectionRange(n, n); } catch (e) { /* 그대로 */ } } }, 60);
  }
  return r;
};
function bxEpClose(undo){
  if (!F) return;
  if (undo && bxEpSnap) {
    const s = bxEpSnap;
    Object.keys(F).forEach(x => { if (!(x in s)) delete F[x]; });
    Object.assign(F, s);
  }
  bxEpSnap = null;
  F.panel = null; F.bxSub = null;
  drawFChips(); drawFPanel(); drawFHint();
  if (typeof updRemWhen === 'function') updRemWhen();
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('[data-bxep]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  bxEpClose(b.dataset.bxep === 'back');
}, true);
// 휴대폰 뒤로: 페이지가 열려 있으면 바꾼 것을 되돌리고 일정 창으로(창은 닫지 않음)
setTimeout(() => {
  const back = window.BX_back; if (typeof back !== 'function' || back.bx44) return;
  window.BX_back = function(){
    if (window.BX_APP && document.getElementById('bx-ep') && !document.getElementById('bx-att-view')) { bxEpClose(true); return true; }
    return back.apply(this, arguments);
  };
  window.BX_back.bx44 = true;
}, 0);

/* 처음 열 때 사진·파일 칸을 저절로 열지 않는다(시험판 42는 첨부가 있으면 열었음). 줄에 '사진·파일 N개'가 보인다 */
const bxEdit44 = drawEdit;
drawEdit = function(){
  if (window.BX_APP && F && F.att === undefined && typeof bxAttOf === 'function') {
    const it = F.mode === 'edit' ? getDoc(F.id) : null;
    F.att = bxAttOf(it).map(x => Object.assign({}, x));
  }
  if (window.BX_APP && F && !F.panel) bxEpSnap = null;
  return bxEdit44.apply(this, arguments);
};

/* 장소 페이지: 최근 장소(적은 글자가 들어간 것만) + 휴대폰 지도 앱에서 찾기 */
let bxEpLoc0 = null;
function bxEpRecent(now){
  const cur = (now != null ? now : (F && F.location) || '').trim(), seen = new Set(), out = [];
  const typed = cur && cur !== bxEpLoc0;
  const list = M.items.filter(i => i.location && !i.deletedAt).slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  for (const i of list) {
    const l = String(i.location).trim(), key = l.toLowerCase();
    if (!l || seen.has(key)) continue;
    seen.add(key);
    if (cur && l === cur) continue;
    if (typed && !key.includes(cur.toLowerCase())) continue;
    out.push(l);
    if (out.length >= 5) break;
  }
  return out;
}
function bxEpPlaces(now){
  const ex = document.getElementById('f-extra'); if (!ex) return;
  let box = document.getElementById('bx-ep-places');
  if (!box) { box = document.createElement('div'); box.id = 'bx-ep-places'; ex.appendChild(box); }
  // 적는 중에는 칸의 글자로(바탕 처리기가 F.location을 바꾸기 전에 불릴 수 있다)
  const rec = bxEpRecent(now), q = (now != null ? now : F.location || '').trim();
  box.innerHTML = (rec.length ? '<div class="bx-ep-gl">최근 장소</div><div class="bx-ep-box">' + rec.map(l => '<button type="button" class="bx-ep-row" data-bxplace="' + esc(l) + '"><span class="bx-er-ic" aria-hidden="true">' + ICON.pin + '</span><span class="bx-er-t">' + esc(l) + '</span></button>').join('') + '</div>' : '') +
    '<div class="bx-ep-box"><button type="button" class="bx-ep-row" data-bxmap="1"><span class="bx-er-ic" aria-hidden="true">' + ICON.search + '</span><span class="bx-er-t">' + (q ? '지도 앱에서 ‘' + esc(q) + '’ 찾기' : '지도 앱에서 찾기') + '</span>' + ICON.chevR + '</button></div>' +
    '<p class="p small bx-ep-note">주소는 휴대폰 지도 앱에서 찾아 복사해 붙여 넣을 수 있어요.</p>';
}
document.addEventListener('input', ev => {
  if (!window.BX_APP || !ev.target || ev.target.id !== 'f-loc' || !document.getElementById('bx-ep')) return;
  bxEpPlaces(ev.target.value);
});
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest || !F) return;
  const pl = ev.target.closest('[data-bxplace]');
  if (pl) {
    ev.preventDefault(); ev.stopPropagation();
    F.location = pl.dataset.bxplace;
    const i = document.getElementById('f-loc'); if (i) i.value = F.location;
    drawFChips(); bxEpPlaces();
    if (typeof tvOnParse === 'function' && F.mode === 'new' && !F.touchedTravel && typeof tvRecall === 'function') {
      const r = tvRecall(F.title, F.location); if (r) { F.travel = r.min; F.tvSrc = 'mem'; F.tvKey = r.key; drawFChips(); }
    }
    return;
  }
  const mp = ev.target.closest('[data-bxmap]');
  if (mp) {
    ev.preventDefault(); ev.stopPropagation();
    const q = (F.location || F.title || '').trim();
    // geo: 주소를 휴대폰에 넘기면 깔린 지도 앱(구글 지도 · 네이버 지도 등)이 고르라고 뜬다. 지도 API는 쓰지 않는다(D-02)
    const a = document.createElement('a'); a.href = 'geo:0,0?q=' + encodeURIComponent(q || '장소'); a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }
}, true);

/* 4) 모양: 일정 창 줄 목록과 페이지(삼성 일정 편집 · 알림 설정을 잰 값: 줄 56, 글자 16, 아이콘 21, 상자 모서리 26, 상자 안 20) */
(function bxV44Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v44';
  const box = 'background:var(--card-bg);border-radius:26px;padding:0 20px';
  st.textContent = [
    // 줄 목록
    'html.bx-app #f-chips.bx-ed{display:block;margin:0;padding:0}',
    'html.bx-app .bx-er{display:flex;align-items:center;gap:16px;width:100%;min-height:56px;margin:0;padding:0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;color:var(--ink);font:inherit;font-size:16px;font-weight:400;line-height:1.3;text-align:left;-webkit-tap-highlight-color:transparent}',
    'html.bx-app #f-chips.bx-ed > .bx-er:last-child{border-bottom:0}',
    'html.bx-app button.bx-er:active{background:color-mix(in srgb,var(--ink) 5%,transparent)}',
    'html.bx-app .bx-er-ic{flex:none;position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;color:var(--ink-2)}',
    'html.bx-app .bx-er-ic svg.i{width:21px;height:21px}',
    'html.bx-app .bx-er-cal{position:relative;display:flex}',
    'html.bx-app .bx-er-cal .dot{position:absolute;right:-3px;bottom:-2px;width:10px;height:10px;border-radius:50%;background:var(--c);box-shadow:0 0 0 2px var(--bg)}',
    'html.bx-app .bx-er-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    'html.bx-app .bx-er-t.ph{color:var(--ink-3)}',
    'html.bx-app .bx-er-sw .tog{flex:none}',
    // 시작 → 끝
    'html.bx-app .bx-edt{display:grid;grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr);align-items:center;padding:2px 0 10px;border-bottom:1px solid var(--line)}',
    'html.bx-app .bx-edt-c{display:flex;flex-direction:column;align-items:center;gap:0;min-width:0}',
    'html.bx-app .bx-edt-c button{max-width:100%;min-height:40px;padding:6px 8px;border:0;border-radius:12px;background:transparent;color:var(--ink);font:inherit;font-size:16px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    'html.bx-app .bx-edt-c button:active{background:color-mix(in srgb,var(--ink) 6%,transparent)}',
    'html.bx-app .bx-edt-c .bx-edt-t{font-size:17px;font-weight:500}',
    'html.bx-app .bx-edt-c .ph{color:var(--ink-3);font-size:15px;font-weight:400}',
    'html.bx-app .bx-edt-arr{display:flex;justify-content:center;color:var(--ink-3)}html.bx-app .bx-edt-arr svg.i{width:18px;height:18px}',
    'html.bx-app .bx-esheet #f-panel[hidden]{display:none!important}',
    // 페이지(일정 창 위를 덮음): ‹ 이름 · 완료
    'html.bx-app .bx-ep{position:fixed;inset:0;z-index:85;display:flex;flex-direction:column;background:var(--bg);padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);animation:bxEpIn .2s ease-out}',
    '@keyframes bxEpIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){html.bx-app .bx-ep{animation:none}}',
    'html.bx-app .bx-ep-h{flex:none;display:flex;align-items:center;gap:2px;height:60px;padding:0 8px 0 6px}',
    'html.bx-app .bx-ep-h h2{flex:1;min-width:0;margin:0;font-size:20px;font-weight:700;color:var(--ink)}',
    'html.bx-app .bx-ep-ok{flex:none;height:44px;padding:0 16px;border:0;border-radius:22px;background:transparent;color:var(--accent);font:inherit;font-size:16px;font-weight:700}',
    'html.bx-app .bx-ep-ok:active{background:var(--accent-soft)}',
    'html.bx-app .bx-ep-b{flex:1;overflow-y:auto;padding:4px 12px 32px;-webkit-overflow-scrolling:touch;--sunk:var(--bx-card-in,var(--sunk))}',
    'html.bx-app .bx-ep #f-panel{display:block;margin:0;padding:0;background:transparent;border:0;border-radius:0;box-shadow:none}',
    'html.bx-app .bx-ep #f-panel > div{display:flex;flex-direction:column;gap:14px}',
    'html.bx-app .bx-ep .bx-ep-gl,html.bx-app .bx-ep .fg-l{margin:6px 20px -6px;padding:0;font-size:13px;font-weight:500;color:var(--ink-2)}',
    'html.bx-app .bx-ep .fg-l small{font-weight:400;color:var(--ink-3);margin-left:4px}',
    'html.bx-app .bx-ep .bx-ep-box{display:flex;flex-direction:column;' + box + '}',
    'html.bx-app .bx-ep .bx-ep-row{display:flex;align-items:center;gap:16px;width:100%;min-height:56px;padding:0;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-size:16px;text-align:left}',
    'html.bx-app .bx-ep .bx-ep-row:last-child{border-bottom:0}',
    'html.bx-app .bx-ep .bx-ep-row > svg.i{flex:none;width:18px;height:18px;color:var(--ink-3)}',
    'html.bx-app .bx-ep .bx-ep-note,html.bx-app .bx-ep .bx-fcol-note,html.bx-app .bx-ep .bx-rem-def,html.bx-app .bx-ep .bx-att-note,html.bx-app .bx-ep .tv-mem{margin:-4px 20px 0;color:var(--ink-3);line-height:1.5}',
    // 고르는 칸 = 상자 안 줄 목록
    'html.bx-app .bx-ep .bx-rem-q,html.bx-app .bx-ep #f-cat > .picks,html.bx-app .bx-ep #f-go > .picks:has([data-fprep]){display:flex!important;flex-direction:column;flex-wrap:nowrap;gap:0;margin:0;' + box + '}',
    'html.bx-app .bx-ep .bx-rem-q .pick,html.bx-app .bx-ep #f-cat > .picks .pick,html.bx-app .bx-ep #f-go > .picks:has([data-fprep]) .pick{display:flex;align-items:center;justify-content:flex-start;gap:14px;width:100%;height:auto;min-height:56px;margin:0;padding:12px 0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent!important;box-shadow:none!important;color:var(--ink)!important;font-size:16px;font-weight:400;line-height:1.35;text-align:left;white-space:normal;word-break:keep-all}',
    'html.bx-app .bx-ep .bx-rem-q .pick:last-child,html.bx-app .bx-ep #f-cat > .picks .pick:last-child,html.bx-app .bx-ep #f-go > .picks:has([data-fprep]) .pick:last-child{border-bottom:0}',
    // 동그라미(알림 · 준비 루틴). 고른 것은 파란 동그라미, '직접 입력'은 +
    'html.bx-app .bx-ep .bx-rem-q .pick::before,html.bx-app .bx-ep #f-go > .picks:has([data-fprep]) .pick::before{content:"";flex:none;width:20px;height:20px;box-sizing:border-box;border:2px solid var(--ink-3);border-radius:50%}',
    'html.bx-app .bx-ep .bx-rem-q .pick[aria-pressed="true"]::before,html.bx-app .bx-ep #f-go > .picks:has([data-fprep]) .pick[aria-pressed="true"]::before{border:6px solid var(--accent)}',
    'html.bx-app .bx-ep .bx-rem-q .pick[data-bx-rem="adv"][aria-pressed="false"]::before{content:"+";border:0;color:var(--accent);font-size:24px;font-weight:400;line-height:19px;text-align:center}',
    // 캘린더: 색 점 · 이름(길면 줄을 바꿔 다 보임) · 고른 것은 ✓
    'html.bx-app .bx-ep #f-cat > .picks .pick i.dot{flex:none;width:14px;height:14px;margin:0 3px}',
    'html.bx-app .bx-ep #f-cat > .picks .pick[data-fcat=""]{padding-left:36px;color:var(--ink-2)!important}',
    'html.bx-app .bx-ep #f-cat > .picks .pick[aria-pressed="true"]{font-weight:700}',
    'html.bx-app .bx-ep #f-cat > .picks .pick[aria-pressed="true"]::after{content:"";flex:none;margin-left:auto;width:20px;height:20px;background:var(--accent);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272.6%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272.6%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M5 12.5l4.5 4.5L19 7.5%27/%3E%3C/svg%3E") center/contain no-repeat}',
    'html.bx-app .bx-ep .bx-fcol{display:flex;flex-direction:column;gap:14px;margin:0;padding:0;border:0}',
    'html.bx-app .bx-ep .bx-fcol > .fg-l{margin:6px 20px -6px}',
    'html.bx-app .bx-ep .bx-fcol-row{display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr));justify-items:center;align-items:center;row-gap:12px;margin:0;padding:16px 14px}',
    'html.bx-app .bx-ep .bx-fcol-row{' + box + ';padding:16px 14px}',
    'html.bx-app .bx-ep .bx-fcol-row .bx-fcol-def{grid-column:1/-1;justify-self:start;margin-left:6px}',
    // 알림 스위치 줄 · 여러 날 스위치 줄 = 상자 한 줄
    'html.bx-app .bx-ep .bx-swrow,html.bx-app .bx-ep .bx-fmulti{margin:0;' + box + '}',
    'html.bx-app .bx-ep .bx-swrow{display:flex;align-items:center;justify-content:space-between;min-height:60px;font-size:16.5px;font-weight:500}',
    'html.bx-app .bx-ep .bx-swrow.on > span{color:var(--accent)}',
    'html.bx-app .bx-ep .bx-fmulti .set-row{min-height:60px;padding:0;font-size:16.5px;font-weight:500}',
    'html.bx-app .bx-ep .bx-fend{padding:0 0 16px}',
    // 알림 '직접 입력'(여러 개 · 정한 시각)
    'html.bx-app .bx-ep #f-rem > .rem-picks,html.bx-app .bx-ep #f-rem > .rem-ctl{margin:0;' + box + ';padding:16px 20px}',
    'html.bx-app .bx-ep #f-rem > .rem-when{margin:-4px 20px 0;color:var(--ink-3)}',
    // 날짜: 오늘 · 내일 · 모레 · 다음 주 월을 4칸(이름 위 · 날짜 아래), 달력에서 고르기는 상자 한 줄
    'html.bx-app .bx-ep #f-date > .picks,html.bx-app .bx-ep .bx-fspan{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0}',
    'html.bx-app .bx-ep .bx-fspan{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:12px}',
    'html.bx-app .bx-ep #f-date > .picks .pick{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:auto;height:auto;min-height:68px;margin:0;padding:10px 4px;border:0;border-radius:18px;background:var(--card-bg)!important;color:var(--ink)!important;font-size:15px;font-weight:700;white-space:nowrap}',
    'html.bx-app .bx-ep #f-date > .picks .pick small{margin:0;font-size:13px;font-weight:500;color:var(--ink-2)}',
    'html.bx-app .bx-ep #f-date > .picks .pick[aria-pressed="true"],html.bx-app .bx-ep #f-go > .picks:has([data-ftv]) .pick[aria-pressed="true"]{background:var(--accent-soft)!important;box-shadow:inset 0 0 0 2px var(--accent)!important}',
    'html.bx-app .bx-ep #f-date > .inline{display:flex;align-items:center;gap:12px;min-height:60px;margin:0!important;' + box + '}',
    // 시간: '종일 / 시간 지정'은 일정 창의 하루 종일 스위치로 하므로 숨김
    'html.bx-app .bx-ep #f-time > .seg{display:none}',
    'html.bx-app .bx-ep #f-time > .fgrid,html.bx-app .bx-ep #f-time > p{margin:0;' + box + ';padding:18px 20px}',
    // 출발·준비: 이동 시간 4칸, 직접 · 준비 루틴은 상자
    'html.bx-app .bx-ep #f-go > .picks:has([data-ftv]){display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0}',
    'html.bx-app .bx-ep #f-go > .picks:has([data-ftv]) .pick{width:auto;min-height:48px;margin:0;border:0;border-radius:16px;background:var(--card-bg)!important;color:var(--ink)!important;font-size:15px;font-weight:600;white-space:nowrap;justify-content:center}',
    'html.bx-app .bx-ep #f-go > .tv-cus{display:flex;align-items:center;gap:12px;min-height:60px;margin:0;' + box + '}',
    'html.bx-app .bx-ep #f-go > .tv-line{margin:0;' + box + ';padding:16px 20px}',
    // 장소 · 메모: 같은 칸을 반씩(장소 페이지는 장소만, 메모 페이지는 메모만)
    'html.bx-app .bx-ep[data-k="loc"] #f-extra > .fld:has(#f-note),html.bx-app .bx-ep[data-k="note"] #f-extra > .fld:has(#f-loc),html.bx-app .bx-ep[data-k="note"] #bx-ep-places{display:none}',
    'html.bx-app .bx-ep #f-extra > .fld{margin:0!important;' + box + ';padding:6px 20px}',
    'html.bx-app .bx-ep #f-extra .fld-l{display:none}',
    'html.bx-app .bx-ep #f-extra .inp{width:100%;min-height:52px;border:0;background:transparent;box-shadow:none;padding:0;font-size:17px;color:var(--ink)}',
    'html.bx-app .bx-ep #f-extra textarea.inp{min-height:180px;padding:12px 0;line-height:1.55;resize:none}',
    'html.bx-app .bx-ep #bx-ep-places{display:flex;flex-direction:column;gap:14px}',
    // 사진 · 파일: 단추 3칸은 그대로, 사진 칸은 상자 없이
    'html.bx-app .bx-ep #f-att{gap:14px}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
