/* ---------- 시험판 40: 시간표 여러 개(대표 요청 11/3 17:39 · 결정 21:51, 정할 것 13번, 결정 기록 D-15) ----------
   대표 17:39: "사람마다 병원 치료 시간표, 학교 수업 시간표, 학원 시간표가 따로 구분되길 원할 수도 있다. 그것들을 시간별로 정리해서
   모아 주는 것이 홈 화면이라면, 새로 만들 캘린더나 스케줄표가 홈 일정표에서 제외될 수도 있게 선택이 가능해야겠다."
   대표 21:51: "학기가 종료되고 다음 학기를 준비할 때나 초기화를 할 가능성이 높다. 그래서 미리 기간을 설정하면 알람을 받지 않는
   것이고, 설정을 안 해 두면 본인들이 꺼야 하는 것이다."
   - 시간표마다 이름 · 홈에 보이기 · 기간(고를 때만: 시작 날 ~ 끝나는 날).
   - 시간표 화면 위 칩으로 하나씩 본다(겹쳐 그리면 칸이 복잡해짐). 새 수업은 보고 있는 시간표로 들어간다.
   - 홈 · 위젯 · 아침 요약에는 홈에 보이기를 켠 시간표만. 알림은 홈에 보이기와 따로 그대로 울린다(대표 "별도 동작").
   - 기간 밖이면(끝났거나 아직 시작 전) 홈 · 위젯 · 아침 요약 · 알림에서 모두 빠진다. 끝난 시간표는 지우지 않고 '끝남'으로
     남겨, 다음 학기에 날짜만 바꿔 다시 쓴다.
   - 처음 쓰던 시간표(id 'tts_main')는 문서가 없어도 있는 것으로 본다. 이름 · 홈 · 기간을 바꾸면 그때 문서를 만든다.
   문서 {type:'ttset', name, home, from, to, order}. 수업(tt)의 set이 비어 있으면 처음 시간표 */
const BX_TTS_MAIN = 'tts_main';
var bxTtSel = lsGet('bx:ttSel') || '';

function bxTtSetDoc(id){
  id = id || BX_TTS_MAIN;
  const d = getDoc(id);
  if (d && d.type === 'ttset' && !d.deletedAt) return Object.assign({}, d, {id});
  return id === BX_TTS_MAIN ? {id, type: 'ttset', name: '시간표', home: true, from: null, to: null, order: 0, virt: true} : null;
}
function bxTtSets(){
  const out = [];
  allDocs().forEach((d, id) => { if (d && d.type === 'ttset' && !d.deletedAt && id !== BX_TTS_MAIN) out.push(Object.assign({}, d, {id})); });
  out.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  return [bxTtSetDoc(BX_TTS_MAIN)].concat(out);
}
function bxTtSetOf(e){ return e && e.set && bxTtSetDoc(e.set) ? e.set : BX_TTS_MAIN; }
function bxTtCur(){ return bxTtSel && bxTtSetDoc(bxTtSel) ? bxTtSel : BX_TTS_MAIN; }
function bxTtActiveSet(s, ds){ return !s || ((!s.from || ds >= s.from) && (!s.to || ds <= s.to)); }
// 그날 그 수업이 살아 있는지(기간). ttOn이 부른다 → 알림 · 위젯 · 아침 요약 · 홈이 모두 따른다
function bxTtActive(e, ds){ return bxTtActiveSet(bxTtSetDoc(bxTtSetOf(e)), ds); }
function bxTtHome(e){ const s = bxTtSetDoc(bxTtSetOf(e)); return !s || s.home !== false; }
function bxTtOf(id){ return ttList().filter(e => bxTtSetOf(e) === id); }
// 'now' 쓰는 중 · 'ended' 끝남 · 'before' 시작 전 · '' 기간 없음
function bxTtState(s, ds){ ds = ds || M.today; if (!s || (!s.from && !s.to)) return ''; if (s.to && ds > s.to) return 'ended'; if (s.from && ds < s.from) return 'before'; return 'now'; }
function bxTtPeriodText(s){
  const st = bxTtState(s), md = d => (parseYmd(d).getMonth() + 1) + '월 ' + parseYmd(d).getDate() + '일';
  if (!st) return '기간 없음 · 계속 반복';
  const rng = s.from && s.to ? md(s.from) + ' ~ ' + md(s.to) : s.to ? md(s.to) + '까지' : md(s.from) + '부터';
  return st === 'ended' ? '끝남 · ' + rng : st === 'before' ? (s.from ? md(s.from) + '부터 시작' : rng) : rng;
}
function bxTtColor(id){ const e = bxTtOf(id)[0]; return (e && e.color) || 'var(--ink-3)'; }

/* ---------- 시간표 화면 위: 칩 줄 · 기간 한 줄 ---------- */
function bxTtChipsHtml(){
  const cur = bxTtCur();
  return '<div class="bx-cchips bx-ttchips" role="group" aria-label="시간표 고르기">' + bxTtSets().map(s => {
    const st = bxTtState(s);
    return '<button type="button" class="bx-cchip' + (st === 'ended' ? ' bx-ended' : '') + '" data-bxtts="' + esc(s.id) + '" aria-pressed="' + (s.id === cur) + '"><span>' + esc(s.name) + (st === 'ended' ? ' · 끝남' : '') + '</span></button>';
  }).join('') + '<button type="button" class="bx-cchip bx-cchip-add" data-act="bx-ttsets" aria-label="시간표 만들기 · 관리">' + ICON.plus + '<span>시간표</span></button></div>';
}
function bxTtNoteHtml(){
  const s = bxTtSetDoc(bxTtCur()), st = bxTtState(s), parts = [];
  if (st === 'ended') parts.push('<b>끝난 시간표</b> · 홈과 알림에 나오지 않아요');
  else if (st === 'before') parts.push('<b>' + esc(bxTtPeriodText(s)) + '</b> · 그 전에는 홈과 알림에 나오지 않아요');
  else if (st === 'now') parts.push(esc(bxTtPeriodText(s)));
  if (s.home === false) parts.push('홈에 안 보임 · 알림은 울려요');
  return parts.length ? '<button type="button" class="bx-tt-note' + (st === 'ended' || st === 'before' ? ' warn' : '') + '" data-bxttsopen="' + esc(s.id) + '"><span>' + parts.join(' · ') + '</span>' + ICON.chevR + '</button>' : '';
}
// 수업 창: 시간표가 둘 이상이면 어느 시간표인지 고른다
function bxTtPickHtml(){
  const sets = bxTtSets(); if (sets.length < 2 || !TT) return '';
  const cur = TT.set && bxTtSetDoc(TT.set) ? TT.set : BX_TTS_MAIN;
  return '<span class="tt-l">시간표</span><div class="tt-pills" role="group" aria-label="시간표">' + sets.map(s => '<button type="button" class="tt-pill" data-bxttpick="' + esc(s.id) + '" aria-pressed="' + (s.id === cur) + '">' + esc(s.name) + '</button>').join('') + '</div>';
}

/* ---------- 시간표 목록 · 자세히(바텀 시트). 캘린더 목록에도 같은 줄(캘린더 · 시간표 목록, 캘린더 보완 안 ③) ---------- */
function bxTtsRowsHtml(){
  return bxTtSets().map(s => {
    const n = bxTtOf(s.id).length;
    return '<div class="bx-arow bx-arow-sw bx-calrow" data-tts="' + esc(s.id) + '"><button type="button" class="bx-at" data-bxttsopen="' + esc(s.id) + '">' +
      '<b><i class="bx-cdot" style="--c:' + bxTtColor(s.id) + '"></i>' + esc(s.name) + '</b><small' + (bxTtState(s) === 'ended' ? ' class="bx-tt-end"' : '') + '>수업 ' + n + '개 · ' + esc(bxTtPeriodText(s)) + '</small></button>' +
      '<i class="bx-adiv" aria-hidden="true"></i><span class="bx-calrow-sw">' + bxSwitch('data-bxttshome', s.home !== false, s.name + ' 홈에 보이기') + '<small>홈에 보이기</small></span></div>';
  }).join('') + '<button type="button" class="bx-cal-add" data-act="bx-tts-add">' + ICON.plus + '<span>시간표 만들기</span></button>';
}
function bxTtsOpen(){ openSheet({title: '시간표', draw: bxTtsDraw, refresh: bxTtsDraw}); }
function bxTtsDraw(){
  setSheet('<div class="bx-grp bx-cals">' + bxTtsRowsHtml() + '</div>' +
    '<p class="p small bx-cal-note">홈에 보이기를 끄면 홈 · 위젯 · 아침 요약에서만 빠지고 알림은 그대로예요. 기간이 끝난 시간표는 홈과 알림에서 저절로 빠지고 목록에는 남아요.</p>', '');
}
function bxTtsDetailOpen(id, focus){
  openSheet({title: '시간표', back: () => bxTtsOpen(), draw: () => bxTtsDetailDraw(id)});
  SH.bxTts = id;
  if (focus) { const i = document.getElementById('bx-tts-name'); if (i) { i.focus(); i.select(); } }
}
function bxTtsDetailDraw(id){
  const s = bxTtSetDoc(id); if (!s) { bxTtsOpen(); return; }
  const n = bxTtOf(id).length, home = s.home !== false, per = !!(s.from || s.to);
  setSheet('<div class="bx-grp bx-cald"><div class="fld"><label class="fld-l" for="bx-tts-name">이름</label><input id="bx-tts-name" class="inp full" data-bxttsname="' + esc(id) + '" value="' + esc(s.name) + '" maxlength="20" autocomplete="off" enterkeyhint="done" placeholder="예) 학교 · 학원 · 치료"></div></div>' +
    '<div class="bx-grp bx-cals"><div class="bx-arow bx-arow-sw"><span class="bx-at"><b>홈에 보이기</b><small>' + (home ? '홈 · 위젯 · 아침 요약에 보여요' : '홈에서 뺐어요 · 알림은 울려요') + '</small></span>' + bxSwitch('data-bxttshome', home, '홈에 보이기') + '</div>' +
      '<div class="bx-arow bx-arow-sw"><span class="bx-at"><b>기간</b><small>' + (per ? esc(bxTtPeriodText(s)) : '정하지 않으면 계속 반복돼요') + '</small></span>' + bxSwitch('data-bxttsper', per, '기간') + '</div>' +
      (per ? '<div class="bx-ttper"><div class="fld"><label class="fld-l" for="bx-tts-from">시작 날</label><input type="date" id="bx-tts-from" class="inp" value="' + esc(s.from || '') + '"></div>' +
        '<div class="fld"><label class="fld-l" for="bx-tts-to">끝나는 날</label><input type="date" id="bx-tts-to" class="inp" value="' + esc(s.to || '') + '"' + (s.from ? ' min="' + esc(s.from) + '"' : '') + '></div></div>' : '') + '</div>' +
    '<p class="p small bx-cal-note">기간이 끝나면 홈과 알림에서 저절로 빠져요. 지우지 않고 남겨 두니 다음 학기에 날짜만 바꿔 다시 쓸 수 있어요.</p>' +
    (id !== BX_TTS_MAIN ? '<div class="bx-grp bx-cals"><button type="button" class="bx-arow" data-act="bx-tts-del"><span class="bx-at"><b><span class="bx-adanger">시간표 삭제</span></b><small>' + (n ? '수업 ' + n + '개도 함께 삭제' : '수업 없음') + '</small></span></button></div>' : ''), '');
}
// 처음 시간표는 문서가 없을 수 있다(바꿀 때 만든다)
function bxTtsPatch(id, patch){
  const cur = getDoc(id);
  if (cur && cur.type === 'ttset') patchDoc(id, patch);
  else writeDoc(id, Object.assign({type: 'ttset', name: '시간표', home: true, from: null, to: null, order: 0, createdAt: nowIso()}, patch, {updatedAt: nowIso()}));
}
function bxTtsAdd(){
  const sets = bxTtSets(), id = rid('tts_');
  writeDoc(id, {type: 'ttset', name: '새 시간표', home: true, from: null, to: null, order: Math.max.apply(null, sets.map(s => s.order || 0)) + 1, createdAt: nowIso()});
  bxTtSel = id; lsSet('bx:ttSel', id);
  bxTtsDetailOpen(id, true);
}
function bxTtsRemove(id){
  const s = bxTtSetDoc(id); if (!s || id === BX_TTS_MAIN) return;
  const cls = bxTtOf(id);
  record([id].concat(cls.map(e => e.id)));
  cls.forEach(e => removeDoc(e.id)); removeDoc(id);
  if (bxTtSel === id) { bxTtSel = ''; lsSet('bx:ttSel', ''); }
  bxTtsOpen();
  toast('‘' + s.name + '’ 시간표를 삭제했어요' + (cls.length ? ' · 수업 ' + cls.length + '개' : ''), [['되돌리기', doUndo]]);
}

document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target;
  const ch = t.closest('[data-bxtts]');
  if (ch) {
    ev.preventDefault(); ev.stopPropagation();
    const id = ch.dataset.bxtts;
    // 고른 칩을 한 번 더 누르면 그 시간표 설정
    if (id === bxTtCur()) { bxTtsDetailOpen(id); return; }
    bxTtSel = id; lsSet('bx:ttSel', id); if (typeof TTSEL !== 'undefined') TTSEL = null; render(); return;
  }
  if (t.closest('[data-act="bx-ttsets"]')) { ev.preventDefault(); ev.stopPropagation(); bxTtsOpen(); return; }
  const op = t.closest('[data-bxttsopen]');
  if (op) { ev.preventDefault(); ev.stopPropagation(); bxTtsDetailOpen(op.dataset.bxttsopen); return; }
  const pk = t.closest('[data-bxttpick]');
  if (pk && TT) { ev.preventDefault(); ev.stopPropagation(); TT.set = pk.dataset.bxttpick; document.querySelectorAll('[data-bxttpick]').forEach(b => b.setAttribute('aria-pressed', String(b === pk))); return; }
  if (!SH) return;
  const hm = t.closest('[data-bxttshome]');
  if (hm) {
    ev.preventDefault(); ev.stopPropagation();
    const row = hm.closest('[data-tts]'), id = row ? row.dataset.tts : SH.bxTts; if (!id || !bxTtSetDoc(id)) return;
    bxTtsPatch(id, {home: hm.dataset.bxttshome === '1'}); M = buildModel();
    if (SH.bxTts && !row) bxTtsDetailDraw(id); else if (SH.refresh) SH.refresh();
    return;
  }
  const pr = t.closest('[data-bxttsper]');
  if (pr && SH.bxTts) {
    ev.preventDefault(); ev.stopPropagation();
    // 켜면 오늘부터 시작, 끝나는 날은 고르게 비워 둔다(저절로 정한 날에 알림이 멈추지 않게)
    bxTtsPatch(SH.bxTts, pr.dataset.bxttsper === '1' ? {from: M.today, to: null} : {from: null, to: null}); M = buildModel(); bxTtsDetailDraw(SH.bxTts);
    if (pr.dataset.bxttsper === '1') { const i = document.getElementById('bx-tts-to'); if (i) i.focus(); }
    return;
  }
  if (t.closest('[data-act="bx-tts-add"]')) { ev.preventDefault(); ev.stopPropagation(); bxTtsAdd(); return; }
  if (t.closest('[data-act="bx-tts-del"]') && SH.bxTts) { ev.preventDefault(); ev.stopPropagation(); bxTtsRemove(SH.bxTts); return; }
}, true);
document.addEventListener('input', ev => {
  const t = ev.target; if (!window.BX_APP || !t || !t.dataset || !t.dataset.bxttsname) return;
  const id = t.dataset.bxttsname, name = t.value.trim() || '이름 없음';
  if (getDoc(id)) patchLater(id, {name}, 500); else bxTtsPatch(id, {name});
}, true);
document.addEventListener('change', ev => {
  const t = ev.target; if (!window.BX_APP || !t || !SH || !SH.bxTts) return;
  if (t.id !== 'bx-tts-from' && t.id !== 'bx-tts-to') return;
  const s = bxTtSetDoc(SH.bxTts); if (!s) return;
  let from = t.id === 'bx-tts-from' ? (isDate(t.value) ? t.value : null) : s.from || null, to = t.id === 'bx-tts-to' ? (isDate(t.value) ? t.value : null) : s.to || null;
  if (from && to && to < from) { if (t.id === 'bx-tts-from') to = from; else to = from; toast('끝나는 날은 시작 날보다 앞일 수 없어요'); }
  bxTtsPatch(SH.bxTts, {from, to}); M = buildModel(); bxTtsDetailDraw(SH.bxTts);
}, true);

(function bxV40Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v40';
  st.textContent = [
    'html.bx-app .bx-ttchips{display:flex;gap:8px;margin:2px calc(-1 * var(--gut)) 10px;padding:2px var(--gut) 4px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}',
    'html.bx-app .bx-ttchips::-webkit-scrollbar{display:none}',
    'html.bx-app .bx-cchip.bx-ended:not([aria-pressed="true"]){color:var(--ink-3)}',
    'html.bx-app .bx-tt-note{display:flex;align-items:center;gap:6px;width:100%;margin:0 0 10px;padding:9px 12px;border-radius:12px;background:var(--bx-card);color:var(--ink-2);font-size:13px;font-weight:600;text-align:left}',
    'html.bx-app .bx-tt-note span{flex:1;min-width:0}html.bx-app .bx-tt-note .i{width:16px;height:16px;color:var(--ink-3);flex:none}',
    'html.bx-app .bx-tt-note.warn{background:color-mix(in srgb,var(--warn) 12%,transparent);color:var(--ink)}',
    'html.bx-app .bx-tt-end{color:var(--ink-3)!important}',
    'html.bx-app .bx-ttper{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:4px 0 16px}html.bx-app .bx-ttper .inp{width:100%;min-width:0}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
