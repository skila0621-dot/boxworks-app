/* ---------- 시험판 41: 오늘의 메모(대표 아이디어 11/3 15:17 · 정할 것 10번, 그림 11/3 23:35) ----------
   대표: "홈이나 캘린더의 당일 일정 화면 맨 아래에 '오늘의 메모'로 쌓아 두기. 캘린더에는 메모 표시만 달아 그날 메모했다는 걸 알게 하기.
   내가 한 메모를 찾기로 찾아보기."
   - 날짜마다 메모 줄을 쌓는다(적은 시각과 함께). 홈은 '오늘 할 일' 아래 따로 상자(성격이 달라서, 대표 11/3 17:25), 날짜 창은 일정 아래.
   - 달력 칸에는 메모한 날에 작은 표시만. 찾기에서 메모도 나온다.
   - 메모 줄을 누르면 고치기 · 삭제 · '일정으로 만들기'(새 일정 창을 그 글로 연다. 메모는 '일정으로 옮김'으로 남김).
   - 새 일정 창에 '메모 …'로 시작해 적거나 말하면 그날 메모로 들어간다(위젯 말하기도 같은 길).
   - 일정의 '메모' 칸(장소·메모)은 그 일정에 붙는 글이고, 이것은 날짜에 붙는 메모다. 화면에서는 늘 날짜와 함께('오늘의 메모', '11월 7일 메모')
   문서 {type:'memo', date, text, at:'HH:MM', toItem, createdAt, updatedAt}. 서버 없이 이 휴대폰에, 백업에 들어간다 */
const BX_MM_RE = /^\s*메모\s*(?:[:：,.]\s*|\s+)/;
// bxMmFocus: 다시 그린 뒤 커서를 둘 칸 · bxMmSkip: 방금 넣은 메모는 상자만 고쳤으니 이어지는 다시 그리기를 건너뜀(키보드가 내려가지 않게)
// bxMmStale: 적는 동안 미룬 다시 그리기가 있음(칸을 떠나면 그린다)
var bxMmFocus = null, bxMmSkip = false, bxMmStale = false;

const bxBuild41 = buildModel;
buildModel = function(){
  const m = bxBuild41.apply(this, arguments);
  const by = new Map();
  allDocs().forEach((d, id) => { if (d && d.type === 'memo' && isDate(d.date) && d.text) { if (!by.has(d.date)) by.set(d.date, []); by.get(d.date).push(Object.assign({}, d, {id})); } });
  // 적은 순서대로(앞날 메모를 미리 적으면 시각만으로는 순서가 틀림)
  by.forEach(a => a.sort((x, y) => String(x.createdAt || '').localeCompare(String(y.createdAt || '')) || String(x.at || '').localeCompare(String(y.at || ''))));
  m.memos = by;
  return m;
};
function bxMemos(ds){ return (M && M.memos && M.memos.get(ds)) || []; }
function bxMemoMoved(m){ const it = m && m.toItem ? getDoc(m.toItem) : null; return !!(it && !it.deletedAt); }
// '기능 · 메뉴 편집'에서 메모를 끄면 홈 상자 · 날짜 창 · 달력 표시 · 아래 메뉴 · 위젯 ✎에서 빠진다(적어 둔 메모와 찾기는 남음)
function bxMemoOn(){ return typeof bxModOn !== 'function' || bxModOn('memo'); }
// 첫 실행 카드의 메모 아이콘(루틴 아이콘 모음에는 넣지 않는다)
const bxIcon41 = bxIconSpan;
bxIconSpan = function(key, cls){ return key === 'note' ? '<span class="bx-ic ' + (cls || '') + '" aria-hidden="true">' + BX_MEMO_ICON + '</span>' : bxIcon41.apply(this, arguments); };

// 왼쪽 칸: 그날 적었으면 적은 시각, 앞날 메모처럼 다른 날 적었으면 적은 날(11/1) — 그날의 시각으로 읽히지 않게
function bxMemoWhen(m){
  const c = m.createdAt ? new Date(m.createdAt) : null;
  if (c && !isNaN(c.getTime()) && ymd(c) !== m.date) return (c.getMonth() + 1) + '/' + c.getDate();
  return m.at || '';
}
function bxMemoRowsHtml(list){
  return list.map(m => '<button type="button" class="bx-mm-row' + (bxMemoMoved(m) ? ' moved' : '') + '" data-bxmm="' + esc(m.id) + '"><span class="bx-mm-t tnum">' + esc(bxMemoWhen(m)) + '</span>' +
    '<span class="bx-mm-x">' + esc(m.text) + (bxMemoMoved(m) ? '<small class="bx-mm-tag">일정으로 옮김</small>' : '') + '</span></button>').join('');
}
// 메모 상자: 칸에서 넣으면 상자 안 목록만 바로 고친다(data-bxmmbox="asc|desc" · data-bxmmds). 칸은 그대로라 키보드가 내려가지 않는다
function bxMemoListHtml(list){ return '<div class="bx-mm-list">' + bxMemoRowsHtml(list) + '</div>'; }
function bxMemoNHtml(n){ return '<span class="n"' + (n ? '' : ' hidden') + '>' + n + '</span>'; }
function bxMemoBox(ds, order){ return ' data-bxmmbox="' + order + '" data-bxmmds="' + ds + '"'; }
function bxMemoBoxSync(box){
  const l = bxMemos(box.dataset.bxmmds).slice(); if (box.dataset.bxmmbox === 'desc') l.reverse();
  const list = box.querySelector('.bx-mm-list'); if (list) list.innerHTML = bxMemoRowsHtml(l);
  const n = box.querySelector('.bx-mm-h .n'); if (n) { n.textContent = String(l.length); n.hidden = !l.length; }
  const tip = box.querySelector('.bx-mmp-tip'); if (tip && l.length) tip.remove();
  const sub = document.querySelector('.screen.memo .page-head p'); if (sub) sub.textContent = bxMemoPageSub();
}
function bxMemoInHtml(ds, ph, key){
  const id = 'bx-mm-in-' + (key || '') + ds.replace(/-/g, '');
  return '<div class="bx-mm-in"><label class="sr" for="' + id + '">메모</label><input id="' + id + '" class="bx-mm-inp" data-bxmmdate="' + ds + '" type="text" autocomplete="off" enterkeyhint="done" maxlength="300" placeholder="' + esc(ph) + '">' +
    bxMic(id, '메모할 것을 말해 보세요') + '<button type="button" class="btn sm primary bx-mm-add" data-act="bx-mm-add" data-for="' + id + '">추가</button></div>';
}
// 홈: '오늘 할 일' 아래 따로 상자(보는 날짜를 따라감)
function bxMemoCardHtml(ds){
  const list = bxMemos(ds), d = parseYmd(ds), isT = ds === M.today;
  return '<section class="tcard bx-mm-card" id="bx-mm-card" aria-labelledby="h-memo"' + bxMemoBox(ds, 'asc') + '><div class="tc-body"><div class="bx-mm-h"><h2 id="h-memo">' + (isT ? '오늘의 메모' : (d.getMonth() + 1) + '월 ' + d.getDate() + '일 메모') + '</h2>' +
    bxMemoNHtml(list.length) + '</div>' + bxMemoListHtml(list) + bxMemoInHtml(ds, isT ? '떠오른 것을 적거나 말해 보세요' : '이날 메모 추가') + '</div></section>';
}
// 날짜 창: 일정 아래
function bxMemoSecHtml(ds){
  const list = bxMemos(ds);
  return '<div class="bx-mm-sec"' + bxMemoBox(ds, 'asc') + '><div class="bx-mm-h"><h2>메모</h2>' + bxMemoNHtml(list.length) + '</div>' + bxMemoListHtml(list) + bxMemoInHtml(ds, '이날 메모 추가') + '</div>';
}
/* 메모 화면(대표 요청 11/3 23:38: 아래 메뉴 '메모' · 휴대폰 위젯 ✎ 단추로 바로 적기).
   맨 위가 오늘 적는 칸(위젯에서 열면 커서가 여기에). 칸 바로 아래에 방금 적은 것부터(새 것이 칸 옆에 — 홈 상자와 같은 원칙),
   그 아래 '다가오는 날'(날짜 창에서 앞날에 적은 메모) · '지난 메모'(최근 날부터). 오래된 것은 찾기로 */
const BX_MMP_DAYS = 60;
function bxMemoDayName(ds){ const r = relDay(ds, M.today), f = fmtMD(ds); return r === f ? f : r + ' · ' + f; }
function bxMemoCount(){ let n = 0; if (M && M.memos) M.memos.forEach(l => { n += l.length; }); return n; }
function bxMemoPageSub(){ const n = bxMemoCount(); return n ? '모두 ' + n + '개 · 누르면 고치기 · 일정으로 만들기' : '떠오른 것을 바로 적어 두세요'; }
function bxMemoPageHtml(){
  const t = M.today, other = [], n = bxMemoCount();
  if (M.memos) M.memos.forEach((l, ds) => { if (ds !== t) other.push(ds); });
  const fut = other.filter(d => d > t).sort(), past = other.filter(d => d < t).sort().reverse();
  const today = bxMemos(t).slice().reverse();
  const day = (ds, newFirst) => { const l = bxMemos(ds).slice(); if (newFirst) l.reverse();
    return '<div class="bx-mmp-day"><div class="bx-mmp-dh"><b>' + esc(bxMemoDayName(ds)) + '</b><span class="n">' + l.length + '</span></div>' + bxMemoRowsHtml(l) + '</div>'; };
  return '<div class="page-head"><div class="ph-t"><h1>메모</h1><p>' + esc(bxMemoPageSub()) + '</p></div></div>' +
    '<section class="tcard bx-mm-card bx-mmp-quick" aria-label="오늘 메모"' + bxMemoBox(t, 'desc') + '><div class="tc-body">' +
      '<div class="bx-mm-h"><h2>' + esc(bxMemoDayName(t)) + '</h2>' + bxMemoNHtml(today.length) + '</div>' +
      bxMemoInHtml(t, '떠오른 것을 적거나 말해 보세요', 'p') + bxMemoListHtml(today) +
      (n ? '' : '<p class="p small bx-mmp-tip">적은 날짜에 쌓이고 홈 · 캘린더의 그날에도 보여요. 일정이 될 것은 눌러서 ‘일정으로 만들기’.</p>') +
    '</div></section>' +
    (fut.length ? '<section class="tcard bx-mm-card bx-mmp-grp" aria-labelledby="h-mmp-fut"><div class="tc-body"><div class="bx-mm-h"><h2 id="h-mmp-fut">다가오는 날</h2></div>' + fut.map(d => day(d, false)).join('') + '</div></section>' : '') +
    (past.length ? '<section class="tcard bx-mm-card bx-mmp-grp" aria-labelledby="h-mmp-past"><div class="tc-body"><div class="bx-mm-h"><h2 id="h-mmp-past">지난 메모</h2></div>' + past.slice(0, BX_MMP_DAYS).map(d => day(d, true)).join('') +
      (past.length > BX_MMP_DAYS ? '<p class="p small bx-mmp-tip">더 지난 메모는 위의 돋보기(찾기)에서 찾아요.</p>' : '') + '</div></section>' : '');
}
if (typeof BX_HELP === 'object') BX_HELP.memo = [
  '떠오른 것을 바로 적거나 말해요. 적은 날짜에 쌓이고, 홈과 캘린더의 그날에도 보여요.',
  '메모를 누르면 고치기 · 삭제 · 일정으로 만들기.',
  '새 일정 창에 “메모 …”로 시작해 적거나 말해도 메모로 들어가요.',
  '휴대폰 홈 화면 위젯의 ✎ 단추를 누르면 이 화면이 열리고 바로 적을 수 있어요.',
  '위의 돋보기(찾기)에서 메모도 찾아요.'
];
// 위젯 ✎ 단추(app-shim.js): 메모 화면을 열고 맨 위 칸에 커서 + 키보드
window.BX_memoQuick = function(tries){
  tries = tries || 0;
  if (!M || !S.firstServer || document.getElementById('bx-start')) { if (tries < 20 && !document.getElementById('bx-start')) setTimeout(() => window.BX_memoQuick(tries + 1), 250); return; }
  if (SH) closeSheet();
  if (S.view !== 'memo') go('memo'); else render();
  setTimeout(() => {
    const i = document.querySelector('.bx-mmp-quick .bx-mm-inp'); if (!i) return;
    try { i.focus({preventScroll: true}); } catch (e) { i.focus(); }
    if (typeof window.BX_keyboard === 'function') window.BX_keyboard();
  }, 260);
};
function bxMemoAdd(ds, text){
  text = String(text || '').trim().slice(0, 300); if (!text || !isDate(ds)) return null;
  const id = rid('mm_');
  record([id]);
  writeDoc(id, {type: 'memo', date: ds, text, at: hm(new Date()), createdAt: nowIso(), updatedAt: nowIso()});
  M = buildModel();
  return id;
}
function bxMemoAddFrom(inp){
  if (!inp) return;
  const ds = inp.dataset.bxmmdate, id = bxMemoAdd(ds, inp.value);
  if (!id) { inp.focus(); return; }
  inp.value = '';
  // 칸에 커서가 있으면(Enter · 추가) 상자 목록만 고치고 화면 전체는 칸을 떠날 때 그린다 → 키보드가 그대로, 연달아 적기
  const box = inp.closest('[data-bxmmbox]');
  if (box && document.activeElement === inp) { bxMemoBoxSync(box); bxMmSkip = true; bxMmStale = true; }
  else bxMmFocus = inp.id;
  toast('메모했어요' + (ds === M.today ? '' : ' · ' + fmtMD(ds)), [['되돌리기', doUndo]]);
}
function bxMmTyping(){ const a = document.activeElement; return !!(a && a.classList && a.classList.contains('bx-mm-inp')); }
// 30초마다 다시 그리기(지금 시각 표시)는 메모를 적는 동안 미룬다. 칸을 떠나면 그린다
function bxMmHold(){ if (window.BX_APP && bxMmTyping()) { bxMmStale = true; return true; } return false; }
function bxMemoOpen(id){
  const m = getDoc(id); if (!m) return;
  openSheet({title: fmtMD(m.date) + ' 메모', draw: () => setSheet(
    '<div class="fld"><label class="sr" for="bx-mm-edit">메모</label><textarea id="bx-mm-edit" class="inp bx-mm-ta" maxlength="300">' + esc(m.text) + '</textarea>' +
      (m.at ? '<p class="p small bx-mm-when">' + esc(m.at) + '에 적음</p>' : '') + '</div>' +
    '<div class="bx-grp bx-cals"><button type="button" class="bx-arow" data-act="bx-mm-toitem"><span class="bx-at"><b>일정으로 만들기</b><small>이 글로 새 일정 창을 열어요. 메모는 남아요</small></span>' + ICON.chevR + '</button></div>',
    '<button type="button" class="btn bx-del-btn" data-act="bx-mm-del">' + ICON.trash + '삭제</button><button type="button" class="btn primary grow" data-act="bx-mm-save">저장</button>')});
  SH.bxMm = id;
}
// 일정 창에서 '일정으로 만들기'로 만든 일정을 저장하면 메모에 그 일정을 적어 둔다
const bxSave41 = saveEdit;
saveEdit = function(){
  // 사진 · 파일을 붙였으면(시험판 42) 메모가 아니라 일정으로 저장한다(메모에는 첨부가 없음)
  if (window.BX_APP && F && F.mode === 'new' && bxMemoOn() && !(F.att && F.att.length)) {
    // '메모 …'로 시작하면 그날 메모로(새 일정 창 · 위젯 말하기)
    const m = BX_MM_RE.exec(F.title || '');
    if (m) {
      const rest = F.title.slice(m[0].length).trim();
      if (rest) {
        const ds = isDate(F.date) ? F.date : M.today, id = bxMemoAdd(ds, rest);
        if (id) { closeSheet(); toast('메모에 넣었어요 · ' + relDay(ds, ymd(new Date())), [['되돌리기', doUndo]]); return; }
      }
    }
  }
  const fm = F && F.bxFromMemo;
  const r = bxSave41.apply(this, arguments);
  if (fm && S.undo && S.undo[0]) { const it = getDoc(S.undo[0].id); if (it && it.type === 'item' && getDoc(fm)) patchDoc(fm, {toItem: S.undo[0].id}); }
  return r;
};
const bxHint41 = drawFHint;
drawFHint = function(){
  const r = bxHint41.apply(this, arguments);
  if (window.BX_APP && F && F.mode === 'new' && bxMemoOn() && !(F.att && F.att.length)) {
    const m = BX_MM_RE.exec(F.title || ''), el = document.getElementById('f-hint');
    if (m && el && F.title.slice(m[0].length).trim()) el.innerHTML = '<div class="hint bx-mm-hint">' + ICON.check + '<span><b>메모로 넣어요</b> · ' + esc(relDay(isDate(F.date) ? F.date : M.today, ymd(new Date()))) + ' · ‘' + esc(F.title.slice(m[0].length).trim()) + '’</span></div>';
  }
  return r;
};
// 찾기에 메모도
const bxSearch41 = drawSearch;
drawSearch = function(q){
  const r = bxSearch41.apply(this, arguments);
  const el = document.getElementById('q-res'), k = String(q || '').trim().toLowerCase();
  if (!window.BX_APP || !el || !k) return r;
  const hits = [];
  allDocs().forEach((d, id) => { if (d && d.type === 'memo' && d.text && String(d.text).toLowerCase().includes(k)) hits.push(Object.assign({}, d, {id})); });
  if (!hits.length) return r;
  hits.sort((a, b) => b.date.localeCompare(a.date) || String(b.at || '').localeCompare(String(a.at || '')));
  const sec = '<div class="bx-mm-sres"><div class="grp-h">메모 ' + hits.length + '</div>' + hits.slice(0, 40).map(m => '<button type="button" class="bx-mm-row" data-bxmm="' + esc(m.id) + '"><span class="bx-mm-t">' + esc(relDay(m.date, M.today)) + '</span><span class="bx-mm-x">' + esc(m.text) + '</span></button>').join('') + '</div>';
  if (el.querySelector('.sres')) el.insertAdjacentHTML('beforeend', sec); else el.innerHTML = sec;
  return r;
};

document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target;
  const add = t.closest('[data-act="bx-mm-add"]');
  if (add) { ev.preventDefault(); ev.stopPropagation(); bxMemoAddFrom(document.getElementById(add.dataset.for)); return; }
  const row = t.closest('[data-bxmm]');
  if (row) { ev.preventDefault(); ev.stopPropagation(); bxMemoOpen(row.dataset.bxmm); return; }
  if (!SH || !SH.bxMm) return;
  const id = SH.bxMm, m = getDoc(id);
  if (t.closest('[data-act="bx-mm-save"]')) {
    ev.preventDefault(); ev.stopPropagation();
    const v = String((document.getElementById('bx-mm-edit') || {}).value || '').trim().slice(0, 300);
    closeSheet();
    if (!m) return;
    record([id]);
    if (v) { patchDoc(id, {text: v}); toast('메모를 고쳤어요', [['되돌리기', doUndo]]); } else { removeDoc(id); toast('메모를 삭제했어요', [['되돌리기', doUndo]]); }
    return;
  }
  if (t.closest('[data-act="bx-mm-del"]')) { ev.preventDefault(); ev.stopPropagation(); closeSheet(); if (!m) return; record([id]); removeDoc(id); toast('메모를 삭제했어요', [['되돌리기', doUndo]]); return; }
  if (t.closest('[data-act="bx-mm-toitem"]')) {
    ev.preventDefault(); ev.stopPropagation(); if (!m) return;
    const text = String((document.getElementById('bx-mm-edit') || {}).value || m.text).trim();
    closeSheet();
    openEdit(null, {date: m.date});
    if (F) F.bxFromMemo = id;
    const tf = document.getElementById('f-title');
    if (tf) { tf.value = text; tf.dispatchEvent(new Event('input', {bubbles: true})); }
  }
}, true);
document.addEventListener('keydown', ev => {
  const t = ev.target;
  if (!window.BX_APP || ev.key !== 'Enter' || ev.isComposing || !t || !t.classList || !t.classList.contains('bx-mm-inp')) return;
  ev.preventDefault(); bxMemoAddFrom(t);
}, true);
// 다시 그려도 적던 메모 글 · 커서를 그대로(칸이 새로 그려지면 글이 지워지고 키보드가 내려갔다)
const bxRender41 = render;
render = function(){
  const typing = bxMmTyping();
  // 방금 넣은 메모: 상자는 이미 고쳤으니 칸에 커서가 있는 동안은 건너뛴다(모델만 새로)
  if (bxMmSkip) { bxMmSkip = false; if (typing) { M = buildModel(); return; } }
  const keep = {}, a = document.activeElement;
  document.querySelectorAll('.bx-mm-inp').forEach(i => { if (i.id && i.value) keep[i.id] = i.value; });
  let foc = typing && a.id ? {id: a.id, s: a.selectionStart, e: a.selectionEnd} : null;
  if (!foc && bxMmFocus) foc = {id: bxMmFocus};
  bxMmFocus = null;
  if (!typing) bxMmStale = false;
  const r = bxRender41.apply(this, arguments);
  Object.keys(keep).forEach(id => { const i = document.getElementById(id); if (i && !i.value) i.value = keep[id]; });
  if (foc) {
    const i = document.getElementById(foc.id);
    if (i && document.activeElement !== i) {
      try { i.focus({preventScroll: true}); } catch (e) { i.focus(); }
      if (foc.s != null) { try { i.setSelectionRange(foc.s, foc.e); } catch (e) { /* 지원 안 함 */ } }
      if (typing && typeof window.BX_keyboard === 'function') window.BX_keyboard();
    }
  }
  return r;
};
// 칸을 떠나면 미뤄 둔 화면 그리기(달력 표시 · 다른 상자)
document.addEventListener('focusout', ev => {
  if (!bxMmStale || !ev.target || !ev.target.classList || !ev.target.classList.contains('bx-mm-inp')) return;
  setTimeout(() => { if (bxMmStale && !bxMmTyping()) { bxMmStale = false; scheduleRender(); } }, 150);
}, true);
// '추가'를 눌러도 칸에서 커서가 빠지지 않게(키보드가 내려가지 않음)
document.addEventListener('mousedown', ev => { if (window.BX_APP && ev.target.closest && ev.target.closest('.bx-mm-add')) ev.preventDefault(); }, true);
// 날짜 창에서 메모를 넣으면 창의 목록만 다시 그린다(render가 SH.refresh로 부름) → 위 render 감싸기가 칸을 다시 잡는다

(function bxV41Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v41';
  st.textContent = [
    'html.bx-app .bx-mm-card{margin-top:14px}html.bx-app .bx-mm-card .tc-body{padding-top:16px;padding-bottom:14px}',
    'html.bx-app .bx-mm-h{display:flex;align-items:baseline;gap:8px;margin:0 0 2px}',
    'html.bx-app .bx-mm-h h2{margin:0;font-size:19px;font-weight:800;letter-spacing:-.02em}html.bx-app .bx-mm-sec .bx-mm-h h2{font-size:15px}',
    'html.bx-app .bx-mm-h .n{font-size:13px;font-weight:700;color:var(--ink-3)}',
    'html.bx-app .bx-mm-row{display:flex;gap:12px;width:100%;padding:11px 0;border-bottom:1px solid var(--line);align-items:flex-start;text-align:left;color:var(--ink)}',
    'html.bx-app .bx-mm-t{flex:none;min-width:44px;font-size:13px;font-weight:700;color:var(--ink-3);line-height:22px}',
    'html.bx-app .bx-mm-x{flex:1;min-width:0;font-size:15.5px;line-height:22px;font-weight:500;white-space:pre-wrap;overflow-wrap:anywhere}',
    'html.bx-app .bx-mm-row.moved .bx-mm-x{color:var(--ink-3)}html.bx-app .bx-mm-tag{display:inline-block;margin-left:8px;font-size:12px;font-weight:700;color:var(--accent)}',
    'html.bx-app .bx-mm-in{display:flex;align-items:center;gap:8px;margin-top:10px;padding:5px 5px 5px 14px;border-radius:16px;background:var(--bx-card-in)}',
    'html.bx-app .bx-mm-in .bx-mm-inp{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:15.5px;color:var(--ink);height:40px}',
    'html.bx-app .bx-mm-in .bx-mic{width:40px;min-width:40px;height:40px;padding:0;border-radius:20px;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);justify-content:center}',
    'html.bx-app .bx-mm-in .bx-mic span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    'html.bx-app .bx-mm-in .bx-mm-add{height:40px;padding:0 14px;border-radius:12px}',
    'html.bx-app .bx-mm-sec{margin-top:8px;padding-top:12px;border-top:1px solid var(--line)}',
    'html.bx-app .bx-mm-ta{min-height:120px;width:100%;font-size:16px;line-height:1.6}html.bx-app .bx-mm-when{margin:6px 2px 0;color:var(--ink-3)}',
    'html.bx-app .bx-mm-sres{margin-top:12px}html.bx-app .bx-mm-sres .bx-mm-t{min-width:54px}',
    // 메모 화면: 맨 위 오늘 칸, 그 아래 다가오는 날 · 지난 메모 상자(날짜마다 작은 제목)
    // 메모 화면의 상자: 홈 상자와 같은 반투명 상자(성격이 다른 묶음은 상자로 나눔, 시험판 37)
    'html.bx-app .screen.memo{row-gap:14px}html.bx-app .screen.memo .page-head{margin-bottom:10px}',
    'html.bx-app .screen.memo .bx-mm-card{margin:0 calc(-1 * var(--card-pad)) 0;padding:0;border:0;border-radius:24px;background:var(--card-bg);box-shadow:var(--card-sh);--sunk:var(--bx-card-in)}',
    'html.bx-app .screen.memo .bx-mm-card .tc-body{padding:16px var(--card-pad) 8px}',
    'html.bx-app .bx-mmp-quick{margin-top:4px}html.bx-app .bx-mmp-quick .bx-mm-in{margin:12px 0 4px}',
    'html.bx-app .bx-mmp-day{padding-top:12px}html.bx-app .bx-mmp-day + .bx-mmp-day{margin-top:4px}',
    'html.bx-app .bx-mmp-dh{display:flex;align-items:baseline;gap:8px;padding:2px 0 2px}html.bx-app .bx-mmp-dh b{font-size:14.5px;font-weight:800;color:var(--ink-2)}html.bx-app .bx-mmp-dh .n{font-size:12.5px;font-weight:700;color:var(--ink-3)}',
    'html.bx-app .bx-mmp-day .bx-mm-row:last-child,html.bx-app .bx-mmp-quick .bx-mm-row:last-child{border-bottom:0}',
    'html.bx-app .bx-mmp-tip{margin:10px 2px 0;color:var(--ink-3)}',
    // 달력 칸: 메모한 날 오른쪽 위에 작은 표시
    'html.bx-app .cal .cell{position:relative}',
    'html.bx-app .bx-mm-mark{position:absolute;top:4px;right:4px;width:8px;height:10px;border-radius:2px;background:color-mix(in srgb,var(--warn) 85%,#fff);box-shadow:inset 0 -3px 0 rgba(0,0,0,.14);pointer-events:none}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
