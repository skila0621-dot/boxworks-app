/* ---------- 시험판 60 ----------
   선택실 5(대표 11/5 21:45 · 22:03 · 22:05 '업데이트 완료', 결정 기록 D-34)
   원칙(대표 11/5 20:35): 길게 누르기는 상세 옵션 — 지금 화면 위에, 다른 페이지로 넘어가지 않는다.
   1번 B '누른 자리 메뉴': 누른 줄 · 칩 · 칸을 비추고, 그 바로 위(자리가 없으면 아래)에 작은 메뉴.
     창(openSheet)을 그대로 쓰고 자리 · 모양만 바꾼다. 고르는 단추 · 닫기(바깥 누르기 · 뒤로)는 창과 같다.
     쓰는 곳: 일정 줄 · 칩(flow.js bxItemMenu) · 루틴 탭(v32.js bxRtMenu) · 캘린더 칩(v39.js bxCalChipMenu) · 아래 넷
   2번 줄마다 옵션: '이대로 정하기'가 눌려 있지 않아 선택실의 추천 칩대로(앱에 이미 있는 기능만)
     홈 루틴 줄: 오늘은 쉬기 · 오늘은 하기 · 수정 / 수업 줄: 휴강(그날만) · 수정 / 메모 줄: 수정 · 일정으로 만들기 · 삭제 /
     캘린더 날짜 칸: 이날 새 일정 · 이날 말로 넣기
   시험판 69(선택실 5 · 2번, 대표가 11/6 오전 2:26 칩을 고쳐 '이대로 정하기' — 그동안 넣지 못했던 것): 날짜 칸은 이날 새 일정 · 이날 메모(말로 넣기 뺌),
     루틴 줄 · 수업 줄에 삭제(맨 끝 빨간 글 · 되돌리기). 메모 "수업줄의 그날만 이라는 표현이 이상합니다" → '휴강'(오른쪽에 날짜) */
let bxCtxObs = null;
/* 시험판 69: 메뉴가 뜨는 사이 화면이 다시 그려져 누른 칸이 새 칸으로 바뀌면(캘린더 날짜 칸에서 가끔) 같은 칸을 다시 찾는다.
   전에는 바뀐 칸을 못 찾아 메뉴가 아래 창으로 떴다(와이어프레임 10판 '날짜 칸 꾹 누르기') */
const BX_CTX_ATTRS = ['data-date', 'data-id', 'data-rid', 'data-bxmm', 'data-tt'];
function bxCtxKey(el){
  if (!el || !el.getAttribute) return null;
  const own = BX_CTX_ATTRS.find(a => el.getAttribute(a));
  if (own) return {a: own, v: el.getAttribute(own), cls: el.classList[0] || ''};
  const d = el.querySelector && el.querySelector(BX_CTX_ATTRS.map(a => '[' + a + ']').join(','));
  const a = d && BX_CTX_ATTRS.find(x => d.getAttribute(x));
  return a ? {a, v: d.getAttribute(a), cls: d.classList[0] || '', up: el.classList[0] || ''} : null;
}
function bxCtxFind(k){
  if (!k || !window.CSS || !CSS.escape) return null;
  const e = Array.from(document.querySelectorAll((k.cls ? '.' + CSS.escape(k.cls) : '') + '[' + k.a + '="' + CSS.escape(k.v) + '"]'))
    .find(x => !x.closest('#sheet-root') && x.getBoundingClientRect().height > 0);
  return e ? (k.up && e.closest('.' + CSS.escape(k.up))) || e : null;
}
function bxCtxPlace(anchor){
  const sc = document.querySelector('#sheet-root > .scrim'), sh = sc && sc.querySelector('.sheet');
  if (!sh || !anchor || !window.BX_APP) return;
  const key = bxCtxKey(anchor);
  if (!anchor.isConnected) anchor = bxCtxFind(key);
  if (!anchor) return;
  sc.classList.add('bx-ctx'); sh.classList.add('bx-ctx');
  const place = () => {
    if (!sh.isConnected) return;
    if (!anchor.isConnected) { const n = bxCtxFind(key); if (!n) return; anchor = n; }
    const r = anchor.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    let sp = sc.querySelector(':scope > .bx-spot');
    if (!sp) { sp = document.createElement('div'); sp.className = 'bx-spot'; sp.setAttribute('aria-hidden', 'true'); sc.prepend(sp); }
    Object.assign(sp.style, {left: (r.left - 4) + 'px', top: (r.top - 4) + 'px', width: (r.width + 8) + 'px', height: (r.height + 8) + 'px'});
    const w = Math.min(320, W - 24); sh.style.width = w + 'px';
    const h = sh.getBoundingClientRect().height, gap = 10, pad = 12;
    // 위에 들어가면 위(손가락에 가리지 않게, 선택실 5 그림), 아니면 아래, 둘 다 안 되면 화면 안에서 가장 가까운 곳
    let top = r.top - 4 - gap - h;
    if (top < pad) top = r.bottom + 4 + gap;
    if (top + h > H - pad) top = Math.max(pad, Math.min(H - h - pad, r.top - 4 - gap - h));
    const left = Math.max(pad, Math.min(W - w - pad, r.right - w));
    sh.style.left = left + 'px'; sh.style.top = top + 'px';
  };
  place();
  if (bxCtxObs) bxCtxObs.disconnect();
  if (window.ResizeObserver) { bxCtxObs = new ResizeObserver(place); bxCtxObs.observe(sh); }
  const onResize = () => { if (!sh.isConnected) { removeEventListener('resize', onResize); return; } place(); };
  addEventListener('resize', onResize);
}
window.BX_ctxPlace = bxCtxPlace;

// 누른 자리 메뉴 하나: rows = [[할 일, 아이콘, 이름, 오른쪽 작은 글, 빨간 글자]] · 고르면 pick(할 일)
// 순서 한 규칙(일정 줄 메뉴와 같게, 기획2팀 R-4): 수정이 맨 앞, 삭제 · 빼기는 맨 끝 빨간 글(되돌리기 있음)
function bxCtxMenu(title, rows, pick, anchor){
  const row = ([act, icon, label, sub, warn]) => '<button type="button" class="menu-row' + (warn ? ' bx-im-del' : '') + '" data-bx-cm="' + act + '"><span class="mi">' + icon + '</span><span class="ml">' + esc(label) + '</span>' + (sub ? '<span class="mv">' + esc(sub) + '</span>' : '') + '</button>';
  openSheet({title, draw: () => setSheet('<div class="menu">' + rows.filter(Boolean).map(row).join('') + '</div>', '')});
  SH.bxCm = pick;
  bxCtxPlace(anchor);
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bx-cm]'); if (!b || !SH || !SH.bxCm) return;
  ev.preventDefault(); ev.stopPropagation();
  const pick = SH.bxCm, act = b.dataset.bxCm;
  closeSheet(); pick(act);
}, true);

// 길게 누르기(0.48초, 10px 넘게 움직이면 취소) — 손을 떼며 생기는 누르기는 flow.js가 삼킨다(bxIlpAt)
function bxLongPress(sel, open){
  let lp = null;
  document.addEventListener('pointerdown', ev => {
    if (!window.BX_APP || (ev.button != null && ev.button > 0) || !ev.target.closest) return;
    const el = ev.target.closest(sel); if (!el || el.closest('#sheet-root')) return;
    if (lp) clearTimeout(lp.t);
    lp = {x: ev.clientX, y: ev.clientY, t: setTimeout(() => {
      lp = null; bxIlpAt = Date.now();
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* 진동 없음 */ }
      open(el);
    }, 480)};
  }, true);
  document.addEventListener('pointermove', ev => { if (lp && (Math.abs(ev.clientX - lp.x) > 10 || Math.abs(ev.clientY - lp.y) > 10)) { clearTimeout(lp.t); lp = null; } }, true);
  ['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { if (lp) { clearTimeout(lp.t); lp = null; } }, true));
}

// 홈 루틴 줄: 오늘은 쉬기(쉬는 중이면 오늘은 하기) · 수정
function bxRtRowMenu(rid, anchor){
  const rt = M.routines.find(r => r.id === rid); if (!rt) return;
  const s = rtToday(rt), hol = typeof bxHolOff === 'function' && bxHolOff(rt, M.today);
  const day = hol || s.skip ? ['run', ICON.playC, '오늘은 하기', hol ? bxHolNote(M.today).replace(/^오늘은 /, '').replace(/\.$/, '') : '알람도 다시 울려요']
    : s.finished ? null : ['skip', ICON.pauseC, '오늘은 쉬기', '오늘 알람이 울리지 않아요'];
  bxCtxMenu(rt.name || '루틴', [['edit', ICON.edit, '수정', ''], day, ['del', ICON.trash, '삭제', '', true]], act => {
    if (act === 'edit') { openRoutine(rid); return; }
    if (act === 'skip') { rtSkip(rid, true); return; }
    if (act === 'run') { if (hol) bxHolRunOn(rt); else rtSkip(rid, false); return; }
    // 루틴 탭의 누른 자리 메뉴 삭제(v32.js)와 같은 일
    if (act === 'del') { record([rid]); removeDoc(rid); M = buildModel(); render(); toast((rt.name || '루틴') + bxJosaUl(rt.name || '루틴') + ' 삭제했어요.', [['되돌리기', doUndo]]); }
  }, anchor);
}
bxLongPress('.row.rowc[data-rid] .row-main', el => { const row = el.closest('.row'); if (row && row.dataset.rid) bxRtRowMenu(row.dataset.rid, row); });

// 수업 줄(홈 · 날짜 창): 휴강(그날만, 휴강이면 휴강 취소) · 수정. 휴강은 시간표 화면과 같은 것(timetable.js ttToggleOff)
function bxTtRowMenu(id, anchor){
  const e = typeof ttList === 'function' && ttList().find(x => x.id === id); if (!e) return;
  const ds = S.view === 'today' ? homeViewDate() : isDate(S.selDate) ? S.selDate : M.today, off = ttSkipped(e, ds);
  bxCtxMenu(e.name || '수업', [['edit', ICON.edit, '수정', ''], ['off', ICON.calOff, off ? '휴강 취소' : '휴강', fmtMD(ds)], ['del', ICON.trash, '삭제', '시간표에서 빼요', true]], act => {
    if (act === 'edit') { ttOpen(id); return; }
    if (act === 'off') { ttToggleOff(e, ds); render(); return; }
    // 수업 고치기 창의 삭제(timetable.js tt-del)와 같은 일
    if (act === 'del') { const keep = getDoc(id); if (!keep) return; removeDoc(id); render(); toast('시간표에서 삭제했어요', [['되돌리기', () => writeDoc(id, keep)]]); }
  }, anchor);
}

// 메모 줄: 수정 · 일정으로 만들기 · 삭제(누르면 열리는 메모 창과 같은 일, v41.js)
function bxMemoMenu(id, anchor){
  const m = getDoc(id); if (!m) return;
  bxCtxMenu(fmtMD(m.date) + ' 메모', [['edit', ICON.edit, '수정', ''], ['item', ICON.cal, '일정으로 만들기', bxMemoMoved(m) ? '일정으로 옮김' : ''], ['del', ICON.trash, '삭제', '', true]], act => {
    if (act === 'edit') bxMemoOpen(id);
    else if (act === 'item') bxMemoToItem(id, m.text);
    else if (act === 'del') bxMemoDel(id);
  }, anchor);
}
bxLongPress('.bx-mm-row[data-bxmm]', el => bxMemoMenu(el.dataset.bxmm, el));

// 캘린더 날짜 칸: 이날 새 일정 · 이날 메모(메모 기능을 켰을 때). 말로 넣기는 새 일정 창 맨 위 마이크(시험판 69, 선택실 5 · 2번)
function bxDayMenu(ds, anchor){
  if (!isDate(ds)) return;
  bxCtxMenu(fmtMD(ds), [['new', ICON.plus, '이날 새 일정', fmtMD(ds)], typeof bxMemoOn === 'function' && bxMemoOn() ? ['memo', ICON.memo, '이날 메모', ''] : null], act => {
    if (act === 'new') window.BX_newOn(ds, false);
    else if (act === 'memo') bxMemoNew({ds});
  }, anchor);
}
bxLongPress('.cal .cell[data-date]', el => bxDayMenu(el.dataset.date, el));
