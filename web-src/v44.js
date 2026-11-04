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
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)

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
    (F.timed ? '<button type="button" class="bx-edt-t' + (t ? '' : ' ph') + '" data-fpanel="time" aria-label="' + (end ? '끝 시각 ' : '시작 시각 ') + (t ? bxT(t) : '없음') + '">' + (t ? bxT(t) : (end ? '끝 시각 없음' : '시각')) + '</button>' : '') + '</div>';
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
    (hasGo ? bxEdRow('go', ICON.walk, set('go') ? txt('go') : '출발·준비', set('go'), '출발·준비') : '') +
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
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)

/* 5) 명상 소리(대표 11/4 2:09): "종소리도 강제로 선택하고 있어야 한다 · 앱을 종료했다가 다시 실행해도 소리가 나온다 ·
   명상이 끝나도 또 실행된다 · 원하는 소리만, 소리마다 크기를 조절해 원하는 환경에서 명상"
   - 종소리 스위치(끄면 첫 종 · 중간 종 없이, 끝은 소리 없는 알림만), 종소리 크기 · 배경 소리 크기(0~100%)
   - '소리와 호흡'은 그 자리에서 펼치지 않고 페이지(규칙 16, 설정처럼 바로 바뀜)
   - 앱을 최근 목록에서 지우면 휴대폰 쪽에서 배경 소리와 남은 종을 멈춘다(BxSoundService · MainActivity). 다시 열면 '명상 중' 화면도 치운다
   - 끝 화면은 '닫기'가 주 단추('한 번 더'를 잘못 눌러 다시 시작되지 않게) */
function bxMedVol(k){ const v = MED[k === 'bell' ? 'bellVol' : 'bgVol']; return Number.isFinite(+v) && v !== null && v !== '' ? Math.max(0, Math.min(100, Math.round(+v))) : 100; }
function bxMedBellOn(){ return MED.bellOn !== false; }
let bxMedVolT = 0;
function bxMedVolSync(cb){
  const p = bgPlug();
  if (!p || !p.setVolume) { if (cb) cb(); return; }
  p.setVolume({bell: bxMedVol('bell') / 100, bg: bxMedVol('bg') / 100}).catch(() => {}).then(() => { if (cb) cb(); });
}
// 앱을 닫아 휴대폰이 멈춘 명상이면 '명상 중' 화면을 치운다(앱을 다시 열 때 · 돌아올 때)
function bxMedCancelCheck(){
  const p = bgPlug(); if (!p || !p.status) return;
  p.status().then(st => {
    const at = st && +st.medCancel;
    if (at && MED.run && at >= (MED.run.leadAt || MED.run.startAt || 0) - 1000 && !MED.run.cancelSeen) {
      MED.run = null; medSave();
      if (typeof medTimer !== 'undefined' && medTimer) { clearInterval(medTimer); medTimer = null; }
      if (S.view === 'med' && !SH) render();
    }
  }).catch(() => {});
}
if (window.BX_APP) {
  setTimeout(() => { bxMedVolSync(); bxMedCancelCheck(); }, 900);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) bxMedCancelCheck(); });
}
// 종소리를 끈 명상(첫 종 · 중간 종 없이, 끝은 소리 없는 알림 글만)은 meditation.js medStart · medBellList에서(시험판 54)
function bxMedSumText(){
  const bowl = (BX_BOWLS.find(b => b[0] === bxBowlType()) || BX_BOWLS[0])[1];
  const bell = bxMedBellOn() ? bowl + (MED.startBell === false ? '(시작 종 없음)' : '') + (bxMedVol('bell') < 100 ? ' ' + bxMedVol('bell') + '%' : '') : '종소리 끔';
  const bg = bgPlug() ? ' · 배경 소리 ' + (bgCur() ? bgName(bgCur()) + (bxMedVol('bg') < 100 ? ' ' + bxMedVol('bg') + '%' : '') : '없음') : '';
  return bell + (bxMedBellOn() && MED.bellS ? ' · 중간 종 ' + medBellText(MED.bellS) + '마다' : '') + bg + ' · 호흡 안내 ' + (MED.breath ? '켬' : '끔');
}
const bxMedHtml44 = medHtml;
medHtml = function(){
  let h = bxMedHtml44.apply(this, arguments);
  if (!window.BX_APP) return h;
  // '소리와 호흡'은 줄 하나 → 누르면 페이지
  const i = h.indexOf('<details class="bx-med-more"'), j = h.indexOf('</details>', i);
  if (i >= 0 && j > i) h = h.slice(0, i) + '<button type="button" class="bx-med-row" data-act="bx-med-sound"><span class="bx-mm-t"><b>소리와 호흡</b><small>' + esc(bxMedSumText()) + '</small></span>' + ICON.chevR + '</button>' + h.slice(j + 10);
  // 끝 화면: 주 단추는 '닫기'(오른쪽), '한 번 더'는 옆에
  h = h.replace('<div class="bx-med-acts"><button type="button" class="btn grow" data-act="bx-med-close">닫기</button><button type="button" class="btn primary grow" data-act="bx-med-again">한 번 더</button></div>',
    '<div class="bx-med-acts"><button type="button" class="btn grow" data-act="bx-med-again">한 번 더</button><button type="button" class="btn primary grow" data-act="bx-med-close">닫기</button></div>');
  // 종소리를 끈 명상의 안내
  if (MED.run && MED.run.silent) h = h.replace(/<p class="p small bx-med-note">휴대폰을 내려놓아도 [^<]*<\/p>/, '<p class="p small bx-med-note">종소리 없이 진행해요. 끝나면 소리 없이 알림만 와요.' + (MED.run.bg && bgName(MED.run.bg) ? ' ' + esc(bgName(MED.run.bg)) + (bxBatchim(bgName(MED.run.bg)) ? '은' : '는') + ' 끝나기 전에 줄어들어요.' : '') + '</p>');
  return h;
};
// 소리와 호흡 페이지(‹ 만, 바꾸면 바로 저장 · 설정 화면처럼)
function bxMedSoundHtml(){
  const on = bxMedBellOn(), bowl = bxBowlType(), startOn = MED.startBell !== false;
  const radio = (attr, v, cur, label, extra) => '<button type="button" class="bx-mp-r pick" ' + attr + '="' + v + '" aria-pressed="' + (cur === v) + '">' + '<span class="bx-er-t">' + esc(label) + '</span>' + (extra || '') + '</button>';
  const sw = (label, html, cls) => '<div class="bx-mp-sw' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span>' + html + '</div>';
  const vol = (k, label) => '<label class="bx-mp-vol"><span>' + label + '</span><input type="range" min="0" max="100" step="5" value="' + bxMedVol(k) + '" data-bxmed-vol="' + k + '" aria-label="' + label + '"><b>' + bxMedVol(k) + '%</b></label>';
  const bellCust = !!MED.bellS && (MED.bellCust || MED.bellOpen || !MED_BELLS.some(b => b[0] === MED.bellS));
  let h = '<div class="bx-ep-gl">종소리</div><div class="bx-ep-box">' + sw('종소리', bxSwitch('data-bxmed-bellon', on, '종소리'), on ? 'on' : '');
  if (on) {
    h += '<div class="bx-bowl-picks">' + BX_BOWLS.map(b => radio('data-bxbowl', b[0], bowl, b[1])).join('') + '</div>' + vol('bell', '크기') +
      sw('시작 종', bxSwitch('data-med-startbell', startOn, '시작 종')) +
      '<div class="bx-mp-sw"><span>중간 종</span><button type="button" class="tog" role="switch" aria-checked="' + !!MED.bellS + '" aria-label="중간 종" data-med-bellsw="1"><i></i></button></div>' +
      (MED.bellS ? '<div class="bx-mp-grid">' + MED_BELLS.filter(b => b[0] < MED.min * 60).map(b => '<button type="button" class="pick" data-med-bell="' + b[0] + '" aria-pressed="' + (!bellCust && MED.bellS === b[0]) + '">' + b[1] + '마다</button>').join('') +
        (bellCust ? '<span class="bx-cpick"><input id="bx-med-cbell" type="number" inputmode="numeric" min="1" max="60" value="' + (MED.bellS ? Math.max(1, Math.round(MED.bellS / 60)) : 5) + '" aria-label="중간 종 간격(분)"><span>분마다</span></span>' : '<button type="button" class="pick" data-med-bellc="1" aria-pressed="false">직접 입력</button>') + '</div>' : '');
  }
  h += '</div><p class="p small bx-ep-note">' + (on ? '고르면 들려요. 끝날 때는 세 번 울려요.' + (startOn ? '' : ' 첫 종 없이 시작해요.') : '종소리 없이 시작하고, 끝나면 소리 없이 알림만 와요.') + '</p>';
  if (bgPlug()) {
    const cur = bgCur();
    h += '<div class="bx-ep-gl">배경 소리</div><div class="bx-ep-box"><div class="bx-bg-picks">' + BX_BGS.map(b => radio('data-bxbg', b[0] || 'none', cur || 'none', b[1])).join('') + '</div>' + (cur ? vol('bg', '크기') : '') + '</div>' +
      '<p class="p small bx-ep-note">' + (medLive() ? '명상하는 동안에는 고르면 바로 그 소리로 바뀌어요. ‘없음’을 고르면 꺼져요.' : '고르면 잠깐 들려요. 명상하는 동안 이어지다가 끝날 때 함께 꺼져요.') + '</p>' +
      (cur && !medLive() ? '<div class="bx-ep-box bx-bg-only">' + (BG.sound && BG.mode === 'only' ? '<button type="button" class="bx-ep-row btn" data-act="bx-med-bgstop"><span class="bx-er-ic" aria-hidden="true">' + bxIconSpan('music', '') + '</span><span class="bx-er-t">소리 끄기</span></button>' : '<button type="button" class="bx-ep-row btn" data-act="bx-med-bgonly"><span class="bx-er-ic" aria-hidden="true">' + bxIconSpan('music', '') + '</span><span class="bx-er-t">소리만 틀기</span></button>') + '</div>' +
        '<p class="p small bx-ep-note">명상 없이 소리만 틀어요(공부할 때). 화면을 꺼도 나오고, 앱을 닫으면 꺼져요.</p>' : '');
  }
  h += '<div class="bx-ep-gl">호흡</div><div class="bx-ep-box">' + sw('호흡 안내', bxSwitch('data-med-breath', MED.breath, '호흡 안내')) + '</div>' +
    '<p class="p small bx-ep-note">켜면 원이 커질 때 들이쉬고(4초), 작아질 때 내쉬어요(6초).</p>' +
    (bgPlug() ? '<p class="p small bx-ep-note bx-bg-credit">배경 소리 녹음: BigSoundBank · Freesound의 공개 녹음(CC0)</p>' : '');
  return h;
}
function bxMedPage(open){
  let pg = document.getElementById('bx-mp');
  if (open === false || (S.view !== 'med' && pg)) { if (pg) pg.remove(); document.documentElement.classList.remove('bx-mp-on'); return; }
  if (!pg) {
    if (!open) return;
    pg = document.createElement('div');
    pg.id = 'bx-mp'; pg.className = 'bx-ep bx-mp'; pg.setAttribute('role', 'dialog'); pg.setAttribute('aria-modal', 'true'); pg.setAttribute('aria-labelledby', 'bx-mp-t');
    pg.innerHTML = '<div class="bx-ep-h"><button type="button" class="icon-btn" data-bxmp="back" aria-label="뒤로">' + ICON.chevL + '</button><h2 id="bx-mp-t">소리와 호흡</h2></div><div class="bx-ep-b"></div>';
    document.body.appendChild(pg);
  }
  const b = pg.querySelector('.bx-ep-b'), y = b.scrollTop;
  // 칸에 적는 중이면(중간 종 직접 입력) 다시 그리지 않는다
  if (document.activeElement && document.activeElement.id === 'bx-med-cbell' && pg.contains(document.activeElement) && !open) return;
  b.innerHTML = bxMedSoundHtml(); b.scrollTop = y;
  document.documentElement.classList.add('bx-mp-on');
}
const bxRender44 = render;
render = function(){
  const r = bxRender44.apply(this, arguments);
  if (window.BX_APP && document.getElementById('bx-mp')) bxMedPage();
  return r;
};
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-act="bx-med-sound"],[data-bxmp],[data-bxmed-bellon]'); if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  if (t.dataset.act === 'bx-med-sound') { bxMedPage(true); return; }
  if (t.dataset.bxmp != null) { bxMedPage(false); render(); return; }
  if (t.dataset.bxmedBellon != null) { MED.bellOn = !bxMedBellOn(); medSave(); render(); medResched(); }
}, true);
// 소리 크기: 끄는 동안 바로 저장, 손을 떼면 그 크기로 한 번 들려 준다(배경 소리는 틀고 있으면 바로 따름)
document.addEventListener('input', ev => {
  const t = ev.target; if (!window.BX_APP || !t || !t.dataset || !t.dataset.bxmedVol) return;
  const k = t.dataset.bxmedVol, v = Math.max(0, Math.min(100, Math.round(+t.value) || 0));
  MED[k === 'bell' ? 'bellVol' : 'bgVol'] = v; medSave();
  const lb = t.parentNode && t.parentNode.querySelector('b'); if (lb) lb.textContent = v + '%';
  clearTimeout(bxMedVolT); bxMedVolT = setTimeout(() => bxMedVolSync(), 120);
});
document.addEventListener('change', ev => {
  const t = ev.target; if (!window.BX_APP || !t || !t.dataset || !t.dataset.bxmedVol) return;
  const k = t.dataset.bxmedVol;
  bxMedVolSync(() => {
    if (k === 'bell') medPlay('bowl', bxBowlType());
    else { const p = bgPlug(); if (p && !BG.sound && bgCur()) p.preview({sound: bgCur()}).catch(() => {}); }
  });
});
// 휴대폰 뒤로: 소리와 호흡 페이지를 먼저 닫는다
setTimeout(() => {
  const back = window.BX_back; if (typeof back !== 'function' || back.bx44m) return;
  window.BX_back = function(){
    if (window.BX_APP && document.getElementById('bx-mp')) { bxMedPage(false); render(); return true; }
    return back.apply(this, arguments);
  };
  window.BX_back.bx44m = true;
}, 0);
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)

/* 6) 앱의 다른 곳도 같은 기준(대표 11/4 1:24 · 1:51 · 1:34)
   - 루틴 고치기 창의 '아이콘 변경'은 그 자리에서 펼치지 않고 '아이콘' 페이지(고르면 바로, ‹ 는 되돌림)
   - 기능 · 메뉴 편집의 '아래 메뉴' 칩은 흐르는 줄 대신 4칸 맞춤(규칙 15)
   - 홈 요약 상자 안 20 · 주간 '오늘' 상자 모서리 24(삼성 잰 값) */
let bxPg = null;
function bxPgClose(undo){
  if (!bxPg) return;
  const o = bxPg; bxPg = null;
  if (undo && o.onUndo) o.onUndo();
  if (o.ph && o.ph.parentNode) { o.ph.parentNode.insertBefore(o.node, o.ph); o.ph.remove(); }
  const pg = document.getElementById('bx-pg'); if (pg) pg.remove();
}
function bxPgOpen(title, node, onUndo){
  if (!node || !node.parentNode) return;
  bxPgClose(false);
  const root = document.getElementById('sheet-root') || document.body;
  const ph = document.createComment('bx-pg');
  node.parentNode.insertBefore(ph, node);
  const pg = document.createElement('div');
  pg.id = 'bx-pg'; pg.className = 'bx-ep'; pg.setAttribute('role', 'dialog'); pg.setAttribute('aria-modal', 'true'); pg.setAttribute('aria-labelledby', 'bx-pg-t');
  pg.innerHTML = '<div class="bx-ep-h"><button type="button" class="icon-btn" data-bxpg="back" aria-label="취소하고 돌아가기">' + ICON.chevL + '</button><h2 id="bx-pg-t">' + esc(title) + '</h2><button type="button" class="bx-ep-ok" data-bxpg="done">완료</button></div><div class="bx-ep-b"></div>';
  pg.querySelector('.bx-ep-b').appendChild(node);
  root.appendChild(pg);
  bxPg = {node, ph, onUndo};
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const sm = ev.target.closest('#bx-icsum');
  if (sm && typeof R !== 'undefined' && R) {
    ev.preventDefault(); ev.stopPropagation();
    const snap = R.icon || null;
    bxPgOpen('아이콘', document.getElementById('bx-icpick'), () => { if (R) { R.icon = snap; bxIconPickRefresh(); } });
    return;
  }
  const b = ev.target.closest('[data-bxpg]');
  if (b) { ev.preventDefault(); ev.stopPropagation(); bxPgClose(b.dataset.bxpg === 'back'); }
}, true);
setTimeout(() => {
  const back = window.BX_back; if (typeof back !== 'function' || back.bx44p) return;
  window.BX_back = function(){
    if (window.BX_APP && document.getElementById('bx-pg')) { bxPgClose(true); return true; }
    return back.apply(this, arguments);
  };
  window.BX_back.bx44p = true;
}, 0);
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
