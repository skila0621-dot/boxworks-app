/* ---------- 오늘 화면 정리 (대표 요청 2026-10-31) ----------
   루틴이 늘어날수록 아래 달력이 밀려서: 칸마다 접기(오늘의 루틴·오늘의 일정·오늘 시간표·달력),
   루틴 카드는 '지금 할 일'만 보이고 단계 목록은 눌러서 펼친다. 접은 상태는 이 휴대폰에 기억한다. */
const BX_FOLD_KEY = 'bx:fold', BX_RTOPEN_KEY = 'bx:rtopen';
const BX_FOLDS = [['rt', 'h-rt'], ['today', 'h-today'], ['tt', 'h-tt-today'], ['cal', 'h-hcal']];
const ICON_FOLD = '<svg class="i" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
function bxLoadJson(k){ try { return JSON.parse(lsGet(k) || '{}') || {}; } catch (e) { return {}; } }
let bxFold = bxLoadJson(BX_FOLD_KEY), bxRtOpen = bxLoadJson(BX_RTOPEN_KEY);
function bxSaveJson(k, v){ try { lsSet(k, JSON.stringify(v)); } catch (e) { /* 저장 공간이 없으면 이번만 */ } }
function bxFoldApply(){ BX_FOLDS.forEach(([k]) => document.documentElement.classList.toggle('bx-f-' + k, !!bxFold[k])); }
// 화면을 다시 그릴 때마다 접기 단추를 붙인다(render 끝에서 부름)
function bxFoldDecorate(){
  bxFoldApply();
  bxDockBuild();
  bxFabSync();
  if (S.view === 'tt' && typeof ttPlaceBar === 'function') ttPlaceBar();
  if (S.view !== 'today') return;
  bxRtMissDecorate();
  BX_FOLDS.forEach(([k, hid]) => {
    const h = document.getElementById(hid); if (!h) return;
    const sh = h.closest('.sec-h'); if (!sh || sh.querySelector('.bx-fold-btn')) return;
    sh.classList.add('bx-foldable');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bx-fold-btn'; b.dataset.fold = k;
    b.setAttribute('aria-expanded', String(!bxFold[k]));
    b.setAttribute('aria-label', h.textContent + (bxFold[k] ? ' 펼치기' : ' 접기'));
    b.innerHTML = ICON_FOLD;
    const sub = h.nextElementSibling && h.nextElementSibling.classList.contains('sec-sub') ? h.nextElementSibling : h;
    sub.after(b);
  });
  $$('.rt-sec .rt-card[data-rid]').forEach(c => {
    const rid = c.dataset.rid, st = c.querySelector('.rt-steps'), hd = c.querySelector('.rt-h');
    if (!st || !hd || hd.querySelector('.bx-rt-tog')) return;
    const open = !!bxRtOpen[rid];
    c.classList.toggle('bx-open', open);
    const n = st.querySelectorAll('li:not(.arr)').length;
    if (n <= 1) { c.classList.add('bx-open', 'bx-one'); return; }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bx-rt-tog'; b.dataset.rtog = rid;
    b.setAttribute('aria-expanded', String(open));
    b.innerHTML = '단계 ' + n + ICON_FOLD;
    hd.appendChild(b);
  });
}
function bxToggleFold(k){
  bxFold[k] = !bxFold[k]; bxSaveJson(BX_FOLD_KEY, bxFold); bxFoldApply();
  const b = document.querySelector('.bx-fold-btn[data-fold="' + k + '"]');
  if (b) { b.setAttribute('aria-expanded', String(!bxFold[k])); const h = document.getElementById((BX_FOLDS.find(x => x[0] === k) || [])[1]); if (h) b.setAttribute('aria-label', h.textContent + (bxFold[k] ? ' 펼치기' : ' 접기')); }
}
document.addEventListener('click', ev => {
  if (!window.BX_APP) return;
  const t = ev.target;
  const fb = t.closest('.bx-fold-btn') || (t.closest('.sec-h.bx-foldable h2') && t.closest('.sec-h').querySelector('.bx-fold-btn'));
  if (fb) { ev.preventDefault(); ev.stopPropagation(); bxToggleFold(fb.dataset.fold); return; }
  const rb = t.closest('.bx-rt-tog') || (t.closest('.rt-sec .rt-h b, .rt-sec .rt-h .rt-meta') && t.closest('.rt-card') && t.closest('.rt-card').querySelector('.bx-rt-tog'));
  if (rb) {
    ev.preventDefault(); ev.stopPropagation();
    const rid = rb.dataset.rtog, c = rb.closest('.rt-card'), open = !c.classList.contains('bx-open');
    c.classList.toggle('bx-open', open); rb.setAttribute('aria-expanded', String(open));
    if (open) bxRtOpen[rid] = true; else delete bxRtOpen[rid];
    bxSaveJson(BX_RTOPEN_KEY, bxRtOpen);
  }
}, true);

/* 옆으로 밀어 넘기기(대표 요청): 월간·주간·오늘 화면 달력은 이전·다음 달(주), 날짜 창은 전날·다음 날.
   단추로 넘기는 것과 똑같이 동작하고, 넘어간 쪽에서 살짝 밀려 들어온다. 오늘 카드는 원래부터 밀어서 날짜를 넘긴다 */
let bxSw = null;
function bxSlide(el, d){
  if (!el) return;
  el.classList.remove('bx-sl-n', 'bx-sl-p'); void el.offsetWidth;
  el.classList.add(d > 0 ? 'bx-sl-n' : 'bx-sl-p');
  el.addEventListener('animationend', () => el.classList.remove('bx-sl-n', 'bx-sl-p'), {once: true});
}
document.addEventListener('touchstart', ev => {
  bxSw = null;
  if (!window.BX_APP || ev.touches.length !== 1) return;
  const t = ev.target;
  if (!t.closest || t.closest('input, textarea, select, .tt-wrap, .seg')) return;
  let kind = null;
  if (SH) { if (t.closest('#sheet-root .sheet') && $('#sheet-root [data-act="day-add"]')) kind = 'day'; }
  else if (S.view === 'month' && t.closest('.screen.month')) kind = 'month';
  else if (S.view === 'week' && t.closest('.screen.week')) kind = 'week';
  else if (S.view === 'today' && t.closest('.hcal-sec')) kind = 'hcal';
  if (kind) bxSw = {kind, x: ev.touches[0].clientX, y: ev.touches[0].clientY, t: Date.now()};
}, {passive: true});
document.addEventListener('touchend', ev => {
  if (!bxSw) return;
  const s = bxSw; bxSw = null;
  const p = ev.changedTouches[0], dx = p.clientX - s.x, dy = p.clientY - s.y;
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - s.t > 900) return;
  const d = dx < 0 ? 1 : -1;
  if (s.kind === 'day') {
    const b = $('#sheet-root [data-act="day-add"]'); if (!b || !isDate(b.dataset.date)) return;
    openDay(ymd(addDays(parseYmd(b.dataset.date), d)));
    bxSlide($('#sheet-b'), d);
    return;
  }
  const sel = {month: '.screen .page-head [data-act="month-nav"][data-d="' + d + '"]', week: '.screen .page-head [data-act="week-nav"][data-d="' + d + '"]', hcal: '.hcal-sec [data-act="hcal-nav"][data-d="' + d + '"]'}[s.kind];
  const b = document.querySelector(sel); if (!b) return;
  b.click();
  bxSlide(document.querySelector(s.kind === 'month' ? '.screen.month .month-wrap' : s.kind === 'week' ? '#screen' : '.hcal-sec .hcal'), d);
}, {passive: true});

/* ---------- 홈 개편(대표 요청 2026-10-31) ----------
   첫 상자는 날짜와 요약(예약·완료·확인 필요, 다음 일정)만, 둘째 상자 '오늘 할 일'에 루틴·일정·오늘 수업을 모은다.
   달력은 홈에서 빼고 캘린더 탭에서만 본다. 옆으로 밀어 날짜 넘기기는 두 상자 어디서나 된다. */
function bxHomeSplit(head, body, o){
  const rtN = o.isT ? M.routines.filter(r => rtActiveOn(r, M.today)).length : 0;
  const rt = rtN ? rtHomeHtml().replace('>오늘의 루틴</h2>', '>루틴</h2>') : '';
  const ttN = ttCountOn(o.vd), tt = ttTodayHtml(o.vd, true);
  const total = rtN + ttN + o.n, late = body.indexOf('id="late-block"') >= 0;
  const name = o.isT ? '오늘 할 일' : o.title.replace(/일정$/, '할 일');
  const items = total || late ? '<div class="bx-sub it-sub">' + secHead('h-today', '일정', o.n ? o.n + '개' : '', '') + body + '</div>'
    : '<p class="empty bx-todo-empty">' + (o.isT ? '오늘 할 일이 없어요. 오른쪽 아래 + 단추로 넣어 보세요.' : '이 날은 할 일이 없어요.') + '</p>';
  return '<section class="tcard bx-sumcard" id="tcard" aria-label="' + (o.isT ? '오늘' : esc(o.title.replace(/ 일정$/, ''))) + ' 요약" aria-roledescription="날짜별로 넘겨 보는 일정">' + head + '</section>' +
    '<section class="tcard bx-todo" id="tcard2" aria-labelledby="h-todo"><div class="tc-body"><div class="sec-h bx-todo-h"><h2 id="h-todo">' + name + '</h2>' + (total ? '<span class="sec-sub">' + total + '개</span>' : '') + '</div>' +
    rt + items + tt + '</div></section>';
}
// 새 일정 + 단추: 일정을 넣는 화면(홈·캘린더)에서만 보인다. 시간표·루틴에는 각자 넣는 칸이 있다
function bxFabSync(){
  const fab = document.querySelector('.bx-fab'); if (!fab) return;
  const on = S.view === 'today' || S.view === 'month' || S.view === 'week';
  document.documentElement.classList.toggle('bx-fab-on', on);
  const ds = S.view === 'today' ? (S.homeDay ? homeViewDate() : '') : S.view === 'month' || S.view === 'week' ? (S.selDate || '') : '';
  if (ds) fab.dataset.date = ds; else delete fab.dataset.date;
}
// + 단추를 꾹 누르면 새 일정 창을 열고 바로 마이크를 켠다(말로 넣기)
let bxFabLp = null, bxFabSwallow = 0;
document.addEventListener('pointerdown', ev => {
  const f = ev.target.closest && ev.target.closest('.bx-fab'); if (!f) return;
  clearTimeout(bxFabLp);
  bxFabLp = setTimeout(() => {
    bxFabLp = null; bxFabSwallow = Date.now();
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* 진동 없음 */ }
    f.click();
    setTimeout(() => { const m = document.querySelector('[data-act="bx-mic"][data-for="f-title"]'); if (m) m.click(); }, 350);
  }, 500);
}, true);
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => document.addEventListener(t, () => { if (bxFabLp) { clearTimeout(bxFabLp); bxFabLp = null; } }, true));
window.addEventListener('click', ev => {
  if (ev.isTrusted && Date.now() - bxFabSwallow < 900 && ev.target.closest && ev.target.closest('.bx-fab')) { ev.preventDefault(); ev.stopPropagation(); }
}, true);
document.addEventListener('contextmenu', ev => { if (ev.target.closest && ev.target.closest('.bx-fab')) ev.preventDefault(); }, true);

/* ---------- 아래 메뉴 고르기(대표 요청 2026-10-31: 쓰고 싶은 기능만 툴바에) ----------
   홈은 늘 가운데. 나머지 자리(최대 4개)는 사용자가 고른다. 빠진 기능은 오른쪽 위 ⋯ 메뉴에서 연다. 설정 문서 bxDock에 저장(백업에 들어감) */
const BX_DOCK_DEF = ['month', 'tt', 'routines', 'med'];
const BX_DOCK_ALL = {
  month: {label: '캘린더', sub: '달력·주간 일정', icon: '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.4h.01M12 17.4h.01" stroke-width="2.6"/></svg>', attr: 'data-act="go" data-view="month"'},
  tt: {label: '시간표', sub: '매주 반복되는 수업·학원·알바', icon: '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16.5" rx="3"/><path d="M3.5 9.5h17M9.5 9.5v11M15 9.5v11"/></svg>', attr: 'data-act="go" data-view="tt"'},
  routines: {label: '루틴', sub: '아침 준비·약 먹기 같은 반복 습관', icon: '<svg class="i" viewBox="0 0 24 24"><path d="M4.5 11a7.5 7.5 0 0 1 13-4.6L19.5 8.5"/><path d="M19.5 4v4.5H15"/><path d="M19.5 13a7.5 7.5 0 0 1-13 4.6L4.5 15.5"/><path d="M4.5 20v-4.5H9"/></svg>', attr: 'data-act="go" data-view="routines"'},
  med: {label: '명상', sub: '싱잉볼 소리로 시작과 끝을 알려 줘요', icon: '<svg class="i" viewBox="0 0 24 24"><path d="M12 5c1.8 2 2.8 4 2.8 6.3s-1.2 4.2-2.8 5.2c-1.6-1-2.8-2.9-2.8-5.2S10.2 7 12 5z"/><path d="M12 16.5c-3.5 0-6.5-2-7.5-5.5 2.7-.3 5.2.6 7 2.5"/><path d="M12 16.5c3.5 0 6.5-2 7.5-5.5-2.7-.3-5.2.6-7 2.5"/><path d="M5 19.5h14"/></svg>', attr: 'data-act="go" data-view="med"'},
  search: {label: '검색', sub: '지난 일정·루틴 찾기', icon: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>', attr: 'data-menu="search"'},
  prefs: {label: '설정', sub: '알림·화면·아침 보고·백업', icon: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>', attr: 'data-menu="prefs"'}
};
const BX_HOME_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9v10.5h12V9"/><path d="M10 19.5v-5h4v5"/></svg>';
function bxDockKeys(){ const v = M && M.settings && M.settings.bxDock; return Array.isArray(v) ? v.filter(k => BX_DOCK_ALL[k]).slice(0, 4) : BX_DOCK_DEF; }
let bxDockSig = '';
function bxDockBuild(){
  const keys = bxDockKeys(), sig = keys.join(','); if (sig === bxDockSig) return;
  const inn = document.querySelector('.dock-in'); if (!inn) return;
  const badge = document.getElementById('dock-badge'), bh = badge ? badge.outerHTML : '<span class="dock-badge" id="dock-badge" hidden></span>';
  const btn = k => '<button type="button" class="dock-btn" ' + BX_DOCK_ALL[k].attr + '>' + BX_DOCK_ALL[k].icon + BX_DOCK_ALL[k].label + '</button>';
  const half = Math.ceil(keys.length / 2);
  inn.innerHTML = keys.slice(0, half).map(btn).join('') + '<button type="button" class="dock-btn dock-home" data-act="go" data-view="today">' + BX_HOME_ICON + '홈' + bh + '</button>' + keys.slice(half).map(btn).join('');
  inn.style.gridTemplateColumns = 'repeat(' + (keys.length + 1) + ',minmax(0,1fr))';
  bxDockSig = sig;
  try { renderNav(); } catch (e) { /* 첫 그리기 전 */ }
}
// ⋯ 메뉴: 아래 메뉴에 없는 기능으로 가는 줄 + 아래 메뉴 고르기
function bxMoreRows(){
  const keys = bxDockKeys();
  const rows = ['month', 'tt'].filter(k => !keys.includes(k)).map(k => '<button type="button" class="menu-row" data-act="bx-go" data-view="' + k + '"><span class="mi">' + BX_DOCK_ALL[k].icon + '</span><span class="ml">' + BX_DOCK_ALL[k].label + '</span><span class="mv">' + ICON.chevR + '</span></button>').join('');
  return rows + '<button type="button" class="menu-row" data-act="bx-dock-edit"><span class="mi">' + BX_HOME_ICON + '</span><span class="ml">아래 메뉴 고르기</span><span class="mv">' + keys.length + '개' + ICON.chevR + '</span></button>';
}
let bxDockSel = null;
function bxDockEdit(){
  bxDockSel = bxDockKeys().slice();
  const draw = () => {
    const full = bxDockSel.length >= 4;
    const row = k => { const on = bxDockSel.includes(k), off = !on && full, o = BX_DOCK_ALL[k];
      return '<button type="button" class="ch chk-box bx-dk' + (off ? ' off' : '') + '" role="checkbox" data-bx-dock="' + k + '" aria-checked="' + on + '"' + (off ? ' aria-disabled="true"' : '') + '><i class="cb">' + ICON.check + '</i><span class="bx-dk-ic">' + o.icon + '</span><span><b>' + o.label + '</b><small>' + o.sub + '</small></span>' + (on ? '<em class="bx-dk-n">' + (bxDockSel.indexOf(k) + 1) + '</em>' : '') + '</button>'; };
    setSheet('<p class="p small" style="margin:0 0 12px">자주 쓰는 기능만 아래 메뉴에 두세요. <b>홈</b>은 늘 가운데에 있고, 빼낸 기능은 오른쪽 위 <b>⋯</b> 메뉴에서 열 수 있어요. 고른 순서대로 놓여요(최대 4개).</p>' +
      '<div class="chk-list">' + Object.keys(BX_DOCK_ALL).map(row).join('') + '</div>',
      '<button type="button" class="btn" data-act="bx-dock-reset">처음대로</button><button type="button" class="btn primary grow" data-act="bx-dock-save">저장</button>');
  };
  openSheet({title: '아래 메뉴 고르기', draw, refresh: draw});
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-bx-dock],[data-act="bx-dock-edit"],[data-act="bx-dock-save"],[data-act="bx-dock-reset"],[data-act="bx-go"]'); if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  const act = t.dataset.act;
  if (act === 'bx-go') { closeSheet(); go(t.dataset.view); return; }
  if (act === 'bx-dock-edit') { closeSheet(); bxDockEdit(); return; }
  if (act === 'bx-dock-reset') { bxDockSel = BX_DOCK_DEF.slice(); if (SH && SH.draw) SH.draw(); return; }
  if (act === 'bx-dock-save') { const v = bxDockSel.slice(); closeSheet(); saveSettings({bxDock: v}); toast('아래 메뉴를 바꿨어요'); return; }
  const k = t.dataset.bxDock;
  if (bxDockSel.includes(k)) bxDockSel = bxDockSel.filter(x => x !== k);
  else if (bxDockSel.length < 4) bxDockSel.push(k);
  else { toast('최대 4개까지 고를 수 있어요. 하나를 먼저 빼 주세요'); return; }
  if (SH && SH.draw) SH.draw();
}, true);
