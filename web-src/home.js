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
  bxMarkNext();
  if (typeof bxStartCheck === 'function') bxStartCheck();
  if (typeof bxFlowDecorate === 'function') bxFlowDecorate();
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
    // '오늘 쉬기'는 단계를 펼친 곳 맨 아래로(정리판 5번). 쉬는 중의 '다시 켜기'는 그대로 위에
    const skip = hd && st && hd.querySelector('[data-act="rt-skip"][data-on="1"]');
    if (skip && !c.querySelector('.bx-rt-foot')) { const f = document.createElement('div'); f.className = 'bx-rt-foot'; f.appendChild(skip); st.after(f); }
    if (!st || !hd || hd.querySelector('.bx-rt-tog')) return;
    const open = !!bxRtOpen[rid];
    c.classList.toggle('bx-open', open);
    const n = st.querySelectorAll('li:not(.arr)').length;
    if (n <= 1) { c.classList.add('bx-open', 'bx-one'); return; }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bx-rt-tog'; b.dataset.rtog = rid;
    b.setAttribute('aria-expanded', String(open));
    b.innerHTML = '<span class="bx-rt-tog-t">' + (open ? '접기' : '자세히') + '</span>' + ICON_FOLD;
    b.setAttribute('aria-label', '단계 ' + n + '개 ' + (open ? '접기' : '펼치기'));
    hd.appendChild(b);
  });
  // 시험판 30: 한 목록, 시각 순서로(web-src/v30.js). 루틴 카드를 다 꾸민 뒤에 옮긴다
  if (typeof bxTimeline === 'function') bxTimeline();
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
    const rtt = rb.querySelector('.bx-rt-tog-t'); if (rtt) rtt.textContent = open ? '접기' : '자세히';
    rb.setAttribute('aria-label', (rb.getAttribute('aria-label') || '').replace(/(접기|펼치기)$/, open ? '접기' : '펼치기'));
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
  // 옆으로 미는 칩 줄(캘린더 · 시간표 고르기) 위에서는 달을 넘기지 않는다(대표 11/4 14:03 "슬라이드가 정상작동하지 않는다")
  if (!t.closest || t.closest('input, textarea, select, .tt-wrap, .seg, .bx-cchips')) return;
  let kind = null;
  if (SH) { if (t.closest('#sheet-root .sheet') && $('#sheet-root [data-act="day-add"]')) kind = 'day'; }
  else if (S.view === 'month' && t.closest('.screen.month')) kind = 'month';
  else if (S.view === 'week' && t.closest('.screen.week')) kind = 'week';
  else if (S.view === 'day' && t.closest('.screen.day')) kind = 'dayv';
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
  const sel = {month: '.screen .page-head [data-act="month-nav"][data-d="' + d + '"]', week: '.screen .page-head [data-act="week-nav"][data-d="' + d + '"]', dayv: '.screen .page-head [data-act="bx-dayv-nav"][data-d="' + d + '"]', hcal: '.hcal-sec [data-act="hcal-nav"][data-d="' + d + '"]'}[s.kind];
  const b = document.querySelector(sel); if (!b) return;
  b.click();
  bxSlide(document.querySelector(s.kind === 'month' ? '.screen.month .month-wrap' : s.kind === 'week' || s.kind === 'dayv' ? '#screen' : '.hcal-sec .hcal'), d);
}, {passive: true});

/* ---------- 홈 개편(대표 요청 2026-10-31) ----------
   첫 상자는 날짜와 요약(예약·완료·확인 필요, 다음 일정)만, 둘째 상자 '오늘 할 일'에 루틴·일정·오늘 수업을 모은다.
   달력은 홈에서 빼고 캘린더 탭에서만 본다. 옆으로 밀어 날짜 넘기기는 두 상자 어디서나 된다. */
// 정리판(대표 결정 11/1): 칸 제목 옆 숫자(위 숫자 줄과 겹침)와 아래 메뉴와 같은 '관리 ›'·'시간표 ›'는 홈에서 뺀다
function bxHomeStrip(h){
  return h.replace(/<span class="sec-sub">[^<]*<\/span>/g, '')
    .replace(/<button type="button" class="sec-link" data-act="go" data-view="routines">[\s\S]*?<\/button>/g, '')
    .replace(/<button type="button" class="sec-link" data-act="tt-go">[\s\S]*?<\/button>/g, '');
}
function bxHomeSplit(head, body, o){
  // 내가 쓸 기능에서 끈 기능은 홈에서도 뺀다(전체 흐름 와이어프레임 19)
  // 공휴일이라 쉬는 루틴도 그 자리에 흐리게 보인다(시험판 31, web-src/v31.js)
  const rtN = o.isT && bxModOn('routines') ? M.routines.filter(r => rtActiveOn(r, M.today) || bxHolOff(r, M.today)).length : 0;
  const rt = rtN ? bxHomeStrip(rtHomeHtml().replace('>오늘의 루틴</h2>', '>루틴</h2>')) : '';
  const ttOk = bxModOn('tt'), ttN = ttOk ? ttCountOn(o.vd) : 0, tt = ttOk ? bxHomeStrip(ttTodayHtml(o.vd, true)) : '';
  const total = rtN + ttN + o.n + (o.ns || 0), late = body.indexOf('id="late-block"') >= 0;
  const name = o.isT ? '오늘 할 일' : o.title.replace(/일정$/, '할 일');
  const items = total || late ? '<div class="bx-sub it-sub">' + secHead('h-today', '일정', '', '') + body + '</div>'
    // 시험판 50(대표 11/4 15:25 "버튼이 굳이 필요할까요? 안내 예시 문구만 표시해 줘도 되는 거 아냐?"): 누르는 예시 칩 대신 예시 글 한 줄
    : o.isT ? '<div class="bx-empty-ex"><p class="empty bx-todo-empty">' + (M.items.length ? '오늘 할 일이 없어요.' : '아직 일정이 없어요.') + '</p>' +
        '<p class="p small bx-ex-txt">오른쪽 아래 <span class="bx-mmp-plus" aria-label="더하기">+</span>를 눌러 ' + BX_EXAMPLES.slice(0, 2).map(x => '<span class="q">“' + esc(x) + '”</span>').join(', ') + '처럼 적거나 말해 보세요.</p></div>'
    : '<p class="empty bx-todo-empty">이 날은 할 일이 없어요.</p>';
  // 요약은 두 줄(대표 결정 10/31): 날짜 한 줄(‹ 날짜 ›), 숫자 한 줄. '확인 필요'는 지난 일정 + 안 한 루틴 단계를 한 숫자로
  const vD = parseYmd(o.vd), miss = o.isT ? bxRtMissed().length : 0, need = (o.lateN || 0) + miss;
  BX_NEXT = o.isT && o.next ? {id: o.next.id, txt: '다음 · ' + untilText(at(M.today, o.next.start) - M.now)} : null;
  const rel = o.isT ? '<span class="bx-sum-rel">오늘</span>' : '<button type="button" class="bx-sum-back" data-act="home-day" data-d="0">' + ICON.undo + '오늘로</button><span class="bx-sum-rel2">' + esc(dayGap(o.vd, M.today)) + '</span>';
  const nav = d => '<button type="button" class="bx-sum-nav" data-act="home-day" data-d="' + d + '" aria-label="' + (d < 0 ? '전날' : '다음 날') + '">' + (d < 0 ? ICON.chevL : ICON.chevR) + '</button>';
  const tile = (act, kind, label, val, cls) => '<button type="button" class="bx-st' + cls + '" data-act="' + act + '"' + (kind ? ' data-kind="' + kind + '"' : '') + ' aria-label="' + label + ' 목록"><span>' + label + '</span><b class="tnum">' + val + '</b></button>';
  const sum = '<div class="bx-sum-date">' + nav(-1) + '<div class="bx-sum-mid"><div class="bx-sum-top">' + rel + (o.hol ? '<span class="bx-sum-hol">' + esc(o.hol) + '</span>' : '') + '</div>' +
      '<h1 class="bx-sum-d">' + (vD.getMonth() + 1) + '월 ' + vD.getDate() + '일 ' + WD[vD.getDay()] + '요일</h1></div>' + nav(1) + '</div>' +
    '<div class="bx-sum-tiles" role="group" aria-label="요약">' +
      tile('tile-list', 'remain', '남은', o.remainN || 0, '') +
      tile('tile-list', 'done', '완료', (o.doneN || 0) + '<small>/' + o.n + '</small>', '') +
      tile('bx-late-open', '', '확인 필요', need, need ? ' warn' : ' zero') + '</div>';
  return '<section class="tcard bx-sumcard" id="tcard" aria-label="' + (o.isT ? '오늘' : esc(o.title.replace(/ 일정$/, ''))) + ' 요약" aria-roledescription="날짜별로 넘겨 보는 일정"><div class="tc-head">' + sum + '</div></section>' +
    '<section class="tcard bx-todo" id="tcard2" aria-labelledby="h-todo"><div class="tc-body"><div class="sec-h bx-todo-h"><h2 id="h-todo">' + name + '</h2></div>' +
    (o.isT ? bxRtNudgeHtml() : '') + rt + items + tt + '</div></section>' +
    // 시험판 41: '오늘 할 일' 아래 따로 '오늘의 메모'(대표 아이디어 11/3 15:17)
    (typeof bxMemoOn === 'function' && bxMemoOn() ? bxMemoCardHtml(o.vd) : '');
}
let BX_NEXT = null;
// '다음 일정'은 따로 카드 대신 목록의 그 줄에 표시
function bxMarkNext(){
  if (S.view !== 'today' || !BX_NEXT) return;
  const b = document.querySelector('.bx-todo [data-act="edit"][data-id="' + CSS.escape(BX_NEXT.id) + '"]'); if (!b) return;
  const row = b.closest('.row'); if (!row || row.classList.contains('bx-next')) return;
  row.classList.add('bx-next');
  const meta = row.querySelector('.row-meta'), tag = document.createElement('span');
  tag.className = 'meta bx-next-tag'; tag.textContent = BX_NEXT.txt;
  if (meta) meta.prepend(tag); else { const t = row.querySelector('.row-title'); if (t) t.after(tag); }
}
// '확인 필요' 창(전체 흐름 와이어프레임 13): 지난 일정과 안 한 루틴 단계. 일정마다 다 했어요 · 오늘로 · 날짜 고르기 · 그대로 두기
// only: 지난 일정 한 개만(목록의 주황 '확인' 단추·고치기 창에서). 옛 '시간이 지난 일정'(지연·연기) 창은 앱에서 쓰지 않는다(정리판 6번)
let BXL_PICK = null;
function bxLateOpen(only){
  const draw = () => {
    const one = only ? M.items.find(i => i.id === only) : null;
    if (only && !(one && isLate(one))) { closeSheet(); return; }
    const its = only ? [one] : M.items.filter(isLate).sort((a, b) => a.date.localeCompare(b.date) || byTime(a, b));
    const miss = only ? [] : bxRtMissed(), byRt = [];
    miss.forEach(m => { let g = byRt.find(x => x.rt.id === m.rt.id); if (!g) byRt.push(g = {rt: m.rt, rows: []}); g.rows.push(m.r); });
    const tmr = ymd(addDays(parseYmd(M.today), 1));
    // 시험판 36(대표 지적 11/3: 지난 일정을 미루려니 안 됐다 · '1시간 뒤로'가 원래 시각 + 1시간인지 헷갈림): 미루는 단추에 옮길 시각을 그대로 쓴다.
    // 완료 · 17:40으로(오늘 일정) / 오늘 15:00으로(지난 날) · 날짜 변경(날짜 · 시각 칸) · 그대로
    const card = i => { const tg = bxLateTarget(i);
      return '<div class="bx-lc"><div class="bx-lc-t"><b>' + (esc(i.title) || '(제목 없음)') + '</b><small>' + esc(relDay(i.date, M.today) + ' ' + timeText(i)) + '</small></div><div class="bx-lc-a">' +
      '<button type="button" class="btn sm primary" data-bx-late="done" data-id="' + esc(i.id) + '">' + ICON.check + '완료</button>' +
      '<button type="button" class="btn sm" data-bx-late="' + (i.date < M.today ? 'today' : 'later') + '" data-id="' + esc(i.id) + '">' + ICON.clock + esc(bxLateLabel(i, tg)) + '</button>' +
      '<button type="button" class="btn sm" data-bx-late="pick" data-id="' + esc(i.id) + '" aria-expanded="' + (BXL_PICK === i.id) + '">' + ICON.cal + '날짜 변경</button>' +
      '<button type="button" class="btn sm" data-bx-late="keep" data-id="' + esc(i.id) + '">그대로</button></div>' +
      (BXL_PICK === i.id ? '<div class="bx-lc-pick"><input type="date" class="inp" id="bx-lc-date" value="' + tmr + '" min="' + esc(M.today) + '" aria-label="옮길 날짜">' +
        '<input type="time" class="inp" id="bx-lc-time" value="' + esc(i.start || '') + '" aria-label="옮길 시각"><button type="button" class="btn sm primary" data-bx-late="move" data-id="' + esc(i.id) + '">변경</button></div>' : '') + '</div>'; };
    if (only) { setSheet(card(its[0]), ''); return; }
    let html = '<p class="p small bx-late-p">지난 일정과 놓친 루틴 단계예요. 그대로 둬도 괜찮아요.</p>';
    html += '<h3 class="bx-late-h">일정 · ' + its.length + '</h3>' + (its.length ? its.map(card).join('') : '<p class="bx-late-ok">' + ICON.check + '지난 일정 없음</p>');
    const rtToday = bxModOn('routines') && M.routines.some(r => rtActiveOn(r, M.today));
    if (byRt.length || rtToday) html += '<h3 class="bx-late-h">루틴 단계 · ' + miss.length + '</h3>' + (byRt.length ? byRt.map(g => '<div class="bx-late-rt"><div><b>' + esc(g.rt.name) + '</b><span>' + esc(g.rows.map(r => r.leave ? '출발' : r.name).join(', ')) + '</span></div><button type="button" class="btn sm" data-act="bx-rt-alldone" data-rid="' + esc(g.rt.id) + '">모두 완료</button></div>').join('') : '<p class="bx-late-ok">' + ICON.check + '놓친 루틴 단계 없음</p>');
    setSheet(html, its.length > 1 ? '<button type="button" class="btn grow" data-bx-late="keepall">모두 그대로</button>' : '');
  };
  BXL_PICK = null;
  openSheet({title: only ? '지난 일정' : '확인 필요', draw, refresh: draw});
}
// ⓘ: 지금 화면 사용법(꾹 누르기·밀기처럼 눌러 보기 전엔 모르는 것들)
const BX_HELP = {
  today: ['옆으로 밀면 어제·내일 할 일을 볼 수 있어요.', '위의 숫자를 누르면 그 목록이 열려요. ‘확인 필요’에는 지난 일정과 안 한 루틴 단계가 모여요.', '네모 칸을 누르면 완료. 일정을 길게 누르면 수정 · 완료 · 내일로 미루기 · 삭제가 바로 나와요.', '오른쪽 아래 +로 새 일정. 길게 누르면 바로 말하기.'],
  month: ['날짜를 누르면 그날 일정이 열리고, 거기서 바로 추가할 수 있어요. 일정을 길게 누르면 수정 · 삭제가 바로 나와요.', '옆으로 밀면 이전·다음 달로 넘어가요.', '위의 ‘주간’을 누르면 한 주를 요일별로 봐요.', '오른쪽 아래 +는 고른 날짜에 일정을 추가해요.'],
  week: ['옆으로 밀면 이전·다음 주로 넘어가요.', '요일 옆 ‘+ 추가’로 그날 일정을 추가해요.', '‘월간’을 누르면 달력으로 돌아가요.'],
  tt: ['아래 ‘빠른 추가’에 말하거나 적으면 시간표가 채워져요. 예) “월수 10시 반 경영학원론 301호”', '블록을 길게 누르면 들어 올려져요. 끌어서 시간·요일을 옮기고, 위·아래 끝을 끌어 길이를 바꿔요.', '길게 누른 뒤 나오는 줄에서 수업 묶기 · 휴강(그날만) · 복제 · 삭제.', '아래 ‘보기 설정’에서 표시 시간과 주말을 바꿔요.'],
  routines: ['루틴은 단계마다 알람이 울리고, 확인을 누를 때까지 다시 알려요.', '템플릿을 고르거나 빠른 추가로 만들 수 있어요.', '스위치를 끄면 그 루틴 알람이 쉬어요.', '홈의 ‘오늘 할 일’에서 오늘 루틴을 확인해요.'],
  med: ['시간을 고르고 시작하면 싱잉볼 소리로 시작을 알려요.', '휴대폰을 내려놓아도 중간 종과 끝 종이 울려요.', '‘소리와 호흡’에서 종소리·중간 종·호흡 안내를 바꿔요. 호흡 안내를 켜면 원이 커질 때 들이쉬고 작아질 때 내쉬어요.']
};
function bxHelpOpen(){
  const tips = BX_HELP[S.view] || BX_HELP.today;
  // 사용법은 화면마다 여기 한 곳(정리판 17: 웹 시절 사용 설명서는 앱에서 뺐다)
  openSheet({title: '도움말', draw: () => setSheet('<ol class="bx-help">' + tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ol>',
    '<button type="button" class="btn primary grow" data-act="sheet-close">닫기</button>')});
}
// ⋯ 메뉴(앱): 아래 메뉴에 없는 기능 + 내가 쓸 기능 · 휴지통 · 다크 모드 · 설정(정리판 15–17, 대표 결정 11/1).
// 캘린더(분류) 관리·백업은 설정에, 사용법은 화면마다 ⓘ에. '처음 안내 다시 보기'는 '내가 쓸 기능'과 같은 일이라 뺐다
function bxMoreMenuHtml(){
  const keys = bxDockKeys();
  const goRow = k => '<button type="button" class="menu-row" data-act="bx-go" data-view="' + k + '"><span class="mi">' + BX_DOCK_ALL[k].icon + '</span><span class="ml">' + BX_DOCK_ALL[k].label + '</span><span class="mv">' + ICON.chevR + '</span></button>';
  // 묶음(시험판 35, 대표 의견 11/3): 시간 · 행동 관리 → 그 밖의 기능 → 앱. 아래 메뉴에 있는 기능은 여기 다시 두지 않는다
  // 시험판 37(대표 지적 11/3 '성격이 다르면 투명도로 나누기'): 묶음마다 반투명 상자 하나(bx-grp)
  const grp = (h, list) => { const rows = list.filter(k => !keys.includes(k) && bxDockOk(k)).map(goRow).join(''); return rows ? '<div class="bx-menu-h">' + h + '</div><div class="bx-grp">' + rows + '</div>' : ''; };
  return '<div class="menu">' + grp('시간 · 행동 관리', BX_GROUP_TIME) + grp('그 밖의 기능', BX_GROUP_ETC) + '<div class="bx-menu-h">앱</div><div class="bx-grp">' +
    '<button type="button" class="menu-row" data-act="bx-feat"><span class="mi">' + BX_HOME_ICON + '</span><span class="ml">기능 · 메뉴 편집</span><span class="mv">' + ICON.chevR + '</span></button>' +
    // 홈 화면 위젯 두기: 설정 › 화면에도 같은 줄(대표 요청 11/3: 더보기에서도 고를 수 있게, 규칙 6 두 곳까지)
    '<button type="button" class="menu-row" data-act="bx-widget-open"><span class="mi">' + BX_WIDGET_ICON + '</span><span class="ml">위젯 추가</span><span class="mv">' + ICON.chevR + '</span></button></div><div class="bx-grp">' +
    menuRow('trash', ICON.trash, '휴지통', M.trash.length + '개') +
    // 다크 모드: 누르면 바로 켜고 끔(대표 지적 11/1 "다크모드 켜고 끄기가 사라졌다"). '휴대폰 따라가기'는 설정 › 화면에
    '<button type="button" class="menu-row bx-dm-row" data-act="theme-toggle" aria-pressed="' + isDark() + '"><span class="mi"><svg class="i" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg></span><span class="ml">다크 모드</span><span class="mv"><span class="tog" aria-hidden="true"><i></i></span></span></button>' +
    menuRow('prefs', ICON.gear, '설정', '알림·화면·캘린더·백업') + '</div></div>';
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-act="bx-late-open"],[data-act="bx-help"],[data-act="bx-help-all"]'); if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  if (t.dataset.act === 'bx-late-open') bxLateOpen();
  else if (t.dataset.act === 'bx-help') bxHelpOpen();
  else { closeSheet(); go('guide'); }
}, true);
// 새 일정 + 단추: 일정을 넣는 화면(홈·캘린더)에서만 보인다. 시간표·루틴에는 각자 넣는 칸이 있다
function bxFabSync(){
  const fab = document.querySelector('.bx-fab'); if (!fab) return;
  const on = S.view === 'today' || S.view === 'month' || S.view === 'week' || S.view === 'day';
  document.documentElement.classList.toggle('bx-fab-on', on);
  const ds = S.view === 'today' ? (S.homeDay ? homeViewDate() : '') : S.view === 'month' || S.view === 'week' || S.view === 'day' ? (S.selDate || '') : '';
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
// 기본 순서는 오른손 엄지 기준(대표 결정 2026-10-31): 자주 여는 캘린더·시간표가 오른쪽.
// 시험판 35(대표 의견 11/3): 아래 메뉴 기본값은 이 앱의 주 목적인 '시간 · 행동 관리'만. 명상 같은 그 밖의 기능은 ⋯ 더보기에 묶고,
// 원하면 '내가 쓸 기능 · 아래 메뉴'에서 넣는다. 오른쪽 끝 '더보기'(위 ⋯와 같은 창)로 홈이 가운데에 온다
// 시험판 38(대표 결정 11/3 18:58): '더보기'는 왼쪽 위 메뉴 단추로 옮겨 아래 메뉴에서 뺀다. 아래 메뉴는 기능만(루틴 · 캘린더 · 홈 · 시간표)
// 시험판 41(대표 요청 11/3 23:38): 명상이 빠진 자리에 '메모'(퀵 메모) → 루틴 · 캘린더 · 홈 · 시간표 · 메모
const BX_DOCK_DEF = ['routines', 'month', 'tt', 'memo'];
// 예전 기본값(명상 · 루틴 · 캘린더 · 시간표)을 그대로 쓰던 휴대폰은 새 기본값으로 바꿔 보인다. 한 번이라도 고치면(bxDockMig) 그대로 둔다
const BX_DOCK_OLD = 'med,routines,month,tt';
// 기능 묶음: 시간 · 행동 관리(주 목적) / 그 밖의 기능(명상 등, 앞으로 늘어날 것)
const BX_GROUP_TIME = ['month', 'routines', 'tt', 'memo'], BX_GROUP_ETC = ['med'];
// 메모 아이콘: 모서리가 접힌 메모지에 두 줄(위젯 ✎ 단추 · 첫 실행 카드와 같은 모양)
const BX_MEMO_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="M14.5 20.5h-8a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v8z"/><path d="M14.5 20.5v-4a2 2 0 0 1 2-2h4"/><path d="M8 8.5h8M8 12h5"/></svg>';
const BX_DOCK_ALL = {
  month: {label: '캘린더', sub: '달력·주간 일정', icon: '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.4h.01M12 17.4h.01" stroke-width="2.6"/></svg>', attr: 'data-act="go" data-view="month"'},
  tt: {label: '시간표', sub: '매주 반복되는 수업·학원·알바', icon: '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16.5" rx="3"/><path d="M3.5 9.5h17M9.5 9.5v11M15 9.5v11"/></svg>', attr: 'data-act="go" data-view="tt"'},
  routines: {label: '루틴', sub: '아침 준비·약 먹기 같은 반복 습관', icon: '<svg class="i" viewBox="0 0 24 24"><path d="M4.5 11a7.5 7.5 0 0 1 13-4.6L19.5 8.5"/><path d="M19.5 4v4.5H15"/><path d="M19.5 13a7.5 7.5 0 0 1-13 4.6L4.5 15.5"/><path d="M4.5 20v-4.5H9"/></svg>', attr: 'data-act="go" data-view="routines"'},
  memo: {label: '메모', sub: '떠오른 것을 바로 적어 두기', icon: BX_MEMO_ICON, attr: 'data-act="go" data-view="memo"'},
  med: {label: '명상', sub: '싱잉볼 소리로 시작과 끝을 알려 줘요', icon: '<svg class="i" viewBox="0 0 24 24"><path d="M12 5c1.8 2 2.8 4 2.8 6.3s-1.2 4.2-2.8 5.2c-1.6-1-2.8-2.9-2.8-5.2S10.2 7 12 5z"/><path d="M12 16.5c-3.5 0-6.5-2-7.5-5.5 2.7-.3 5.2.6 7 2.5"/><path d="M12 16.5c3.5 0 6.5-2 7.5-5.5-2.7-.3-5.2.6-7 2.5"/><path d="M5 19.5h14"/></svg>', attr: 'data-act="go" data-view="med"'},
  more: {label: '더보기', sub: '그 밖의 기능 · 설정을 모아 둔 곳', icon: '<svg class="i" viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>', attr: 'data-act="more"'},
  search: {label: '검색', sub: '지난 일정·루틴 찾기', icon: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>', attr: 'data-menu="search"'},
  prefs: {label: '설정', sub: '알림·화면·캘린더·백업', icon: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>', attr: 'data-menu="prefs"'}
};
const BX_HOME_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9v10.5h12V9"/><path d="M10 19.5v-5h4v5"/></svg>';
function bxDockKeys(){
  const st = M && M.settings, v = st && st.bxDock;
  let keys = Array.isArray(v) && !(!st.bxDockMig && v.join(',') === BX_DOCK_OLD) ? v.filter(k => BX_DOCK_ALL[k] && k !== 'more') : BX_DOCK_DEF;
  // 시험판 41: 아래 메뉴를 고쳐 둔 휴대폰에도 자리가 있으면 '메모'를 한 번 넣는다. 그 뒤 아래 메뉴를 저장하면(bxDockMemo) 고른 대로
  if (keys !== BX_DOCK_DEF && !st.bxDockMemo && !keys.includes('memo') && keys.length < 4) keys = keys.concat(['memo']);
  return keys.filter(bxDockOk).slice(0, 4);
}
// 끈 기능(루틴·시간표·메모·명상)은 아래 메뉴·⋯ 메뉴에서도 뺀다
function bxDockOk(k){ return !(k === 'routines' || k === 'tt' || k === 'med' || k === 'memo') || bxModOn(k); }
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
  const rows = ['month', 'tt'].filter(k => !keys.includes(k) && bxDockOk(k)).map(k => '<button type="button" class="menu-row" data-act="bx-go" data-view="' + k + '"><span class="mi">' + BX_DOCK_ALL[k].icon + '</span><span class="ml">' + BX_DOCK_ALL[k].label + '</span><span class="mv">' + ICON.chevR + '</span></button>').join('');
  return rows + '<button type="button" class="menu-row" data-act="bx-feat"><span class="mi">' + BX_HOME_ICON + '</span><span class="ml">기능 · 메뉴 편집</span><span class="mv">' + ICON.chevR + '</span></button>';
}
let bxDockSel = null;
function bxDockEdit(){
  bxDockSel = bxDockKeys().slice();
  const draw = () => {
    const full = bxDockSel.length >= 4;
    const row = k => { const on = bxDockSel.includes(k), off = !on && full, o = BX_DOCK_ALL[k];
      return '<button type="button" class="ch chk-box bx-dk' + (off ? ' off' : '') + '" role="checkbox" data-bx-dock="' + k + '" aria-checked="' + on + '"' + (off ? ' aria-disabled="true"' : '') + '><i class="cb">' + ICON.check + '</i><span class="bx-dk-ic">' + o.icon + '</span><span><b>' + o.label + '</b><small>' + o.sub + '</small></span>' + (on ? '<em class="bx-dk-n">' + (bxDockSel.indexOf(k) + 1) + '</em>' : '') + '</button>'; };
    setSheet('<p class="p small" style="margin:0 0 12px">자주 쓰는 기능만 아래 메뉴에 두세요. <b>홈</b>은 늘 가운데에 있고, 빼낸 기능은 오른쪽 위 <b>⋯</b> 메뉴에서 열 수 있어요. 고른 순서대로 놓여요(최대 4개).</p>' +
      '<div class="chk-list">' + Object.keys(BX_DOCK_ALL).filter(k => k !== 'more').map(row).join('') + '</div>',
      '<button type="button" class="btn" data-act="bx-dock-reset">기본값</button><button type="button" class="btn primary grow" data-act="bx-dock-save">저장</button>');
  };
  openSheet({title: '아래 메뉴 편집', draw, refresh: draw});
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-bx-dock],[data-act="bx-dock-edit"],[data-act="bx-dock-save"],[data-act="bx-dock-reset"],[data-act="bx-go"]'); if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  const act = t.dataset.act;
  if (act === 'bx-go') { closeSheet(); go(t.dataset.view); return; }
  if (act === 'bx-dock-edit') { closeSheet(); bxDockEdit(); return; }
  if (act === 'bx-dock-reset') { bxDockSel = BX_DOCK_DEF.slice(); if (SH && SH.draw) SH.draw(); return; }
  if (act === 'bx-dock-save') { const v = bxDockSel.slice(); closeSheet(); saveSettings({bxDock: v, bxDockMemo: 1}); toast('아래 메뉴를 바꿨어요'); return; }
  const k = t.dataset.bxDock;
  if (bxDockSel.includes(k)) bxDockSel = bxDockSel.filter(x => x !== k);
  else if (bxDockSel.length < 4) bxDockSel.push(k);
  else { toast('최대 4개까지 고를 수 있어요. 하나를 먼저 빼 주세요'); return; }
  if (SH && SH.draw) SH.draw();
}, true);

/* ---------- 루틴 페이지(대표 결정 10/31, 정리판 11/1) ----------
   내 루틴 목록과 그 끝의 '+ 새 루틴'(템플릿 · 말로 만들기 · 빈 루틴)만. 웹 시절 '오늘 할 일 순서 정하기'(적은 일을 빼먹고 바꿈)와
   명상 칸(아래 메뉴에 명상이 있음)은 뺐다. 파란 단추는 '새 루틴' 하나 */
function bxRoutinesPage(cards){
  const list = cards
    .replace(/(<button type="button" class="tog" role="switch"[^>]*aria-label=")([^"]*) 켜기("[^>]*><i><\/i><\/button>)/g, '<span class="bx-togw">$1$2 알람$3<small>알람</small></span>')
    .replace(/<\/section>$/, '<button type="button" class="bx-rt-new" data-act="bx-rt-new">' + ICON.plus + '새 루틴</button></section>');
  return '<div class="page-head"><div class="ph-t"><h1>루틴</h1></div></div>' + list;
}
/* 말로 만들기(휴대폰 안에서 읽기): "평일 7시에 일어나서 씻고 약 먹고 8시에 나가기"처럼 이어 말한 일을 적은 순서대로 단계로.
   나가는 시각이 있으면 그 시각에 맞춰 거꾸로, 일어나는 시각도 있으면 그 사이에 맞게 시간을 나눈다. 말하지 않은 단계는 넣지 않는다 */
const BX_RT_WORDS = [
  [/일어나|기상|깨/, '기상', 5], [/샤워/, '샤워', 15], [/세수/, '세수', 5], [/양치/, '양치', 5], [/씻/, '씻기', 20], [/머리/, '머리 손질', 10], [/화장/, '화장', 15],
  [/약/, '약 먹기', 2], [/옷|입/, '옷 입기', 10], [/(아침|밥|식사|빵).*(먹)|먹.*(아침|밥)|아침\s*먹|밥\s*먹/, '아침 먹기', 15], [/물/, '물 한 잔', 2], [/커피/, '커피', 10],
  [/스트레칭|체조/, '스트레칭', 5], [/명상/, '명상', 10], [/(짐|가방).*(챙|싸)|챙기/, '짐 챙기기', 5], [/이불|침대/, '이불 정리', 3]
];
const BX_RT_LEAVE = /(나가|나서|나갈|출발|집을 나|출근|등교|외출)/;
function bxRtParse(text){
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  // 도착 시각·이동 시간·준비 시간을 말한 문장("9시까지 출근, 회사까지 45분, 준비 1시간")은 그걸 계산하는 원래 읽기로
  if (/(까지|도착|이동|통근|걸리|걸려|여유)/.test(t) || /준비\D{0,4}\d|\d+\s*(분|시간)\s*(정도\s*)?준비/.test(t)) return null;
  const days = /평일/.test(t) ? RT_WD : /주말/.test(t) ? [0, 6] : /매일|날마다/.test(t) ? RT_ALL : null;
  const evening = /(저녁|밤|자기 전|자기전|취침|잠)/.test(t);
  // "…서 / …고 / …하고 / , / 그리고" 에서 끊는다
  const parts = t.split(/(?<=(?:고|서|며|면서))\s+|\s*[,，·]\s*|\s+(?:그리고|그다음|다음에|그 다음에)\s+/).map(s => s.trim()).filter(Boolean);
  const steps = []; let wake = null, leave = null;
  const timeIn = s => { RT_TIME.lastIndex = 0; const m = RT_TIME.exec(s); return m ? rtHM(m[1], m[2], m[3], m[4], m[5], evening) : null; };
  parts.forEach(p => {
    const tm = timeIn(p), core = p.replace(RT_TIME, ' ').replace(/(평일|주말|매일|날마다|아침마다|에는|에|부터|까지)(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
    const w = BX_RT_WORDS.find(x => x[0].test(core));
    // '일어나서'에도 '나서'가 들어 있으니 일어나는 말을 먼저 본다
    if ((!w || w[1] !== '기상') && BX_RT_LEAVE.test(core)) { if (tm || !leave) leave = tm || leave; return; }
    if (w && w[1] === '기상' && tm) wake = tm;
    if (w) { if (!steps.some(s => s[0] === w[1])) steps.push([w[1], w[2]]); return; }
    // 모르는 일은 적은 말 그대로: "고양이 밥 주고" → "고양이 밥 주기"
    const nm = core.replace(/(하고|하며|해서|하면서)$/, '하기').replace(/(고|며|면서)$/, '기').replace(/(아서|어서|여서)$/, '기').replace(/서$/, '기').trim();
    if (nm && nm.length >= 2 && !/^(그리고|그다음)$/.test(nm)) steps.push([nm.slice(0, 20), 10]);
    if (tm && !wake && !steps.length) wake = tm;
  });
  if (!steps.length) return null;
  // 일어나는 시각과 나가는 시각이 다 있으면: 시간이 남으면 나가기 전 '여유'(알람 없음), 모자라면 단계 시간을 줄여 맞춘다
  if (wake && leave && toMin(leave) > toMin(wake)) {
    const total = toMin(leave) - toMin(wake), sum = steps.reduce((a, s) => a + s[1], 0);
    if (sum < total) steps.push(['여유', total - sum, 'wait']);
    else if (sum > total) { let used = 0; steps.forEach((s, i) => { s[1] = i === steps.length - 1 ? Math.max(1, total - used) : Math.max(1, Math.floor(s[1] * total / sum)); used += s[1]; }); }
  }
  const morning = !evening && (leave ? toMin(leave) < 12 * 60 : wake ? toMin(wake) < 12 * 60 : true);
  if (leave) return {name: morning ? '아침 준비' : '나갈 준비', days: days || RT_WD, mode: 'arrive', target: leave, travel: 0, buffer: 0, every: 5, times: 6, steps};
  return {name: evening ? '저녁 루틴' : morning && wake ? '아침 루틴' : '내 루틴', days: days || RT_ALL, mode: 'start', target: wake || timeIn(t) || '08:00', every: 5, times: 6, steps};
}
function bxRtNewOpen(){
  const tpls = RT_TEMPLATES.map(t => '<button type="button" class="bx-tpl" data-act="rt-tpl" data-key="' + t.key + '"><span class="bx-tpl-i">' + bxIconSpan(bxRtIconKey(t), '') + '</span><b>' + esc(t.name) + '</b><small>' + esc((t.mode === 'arrive' ? t.target + ' 도착' : t.target + ' 시작') + ' · ' + t.steps.length + '단계') + '</small></button>').join('');
  openSheet({title: '새 루틴', draw: () => setSheet(
    '<h3 class="bx-late-h">템플릿 <small>누르면 열려요. 시각만 바꾸고 저장하세요</small></h3><div class="bx-tpls">' + tpls + '</div>' +
    '<h3 class="bx-late-h" style="margin-top:18px">빠른 추가</h3>' +
    '<label class="sr" for="bx-rt-say">어떤 루틴인지 한 문장으로</label><div class="bx-inrow"><textarea id="bx-rt-say" class="inp" rows="2" maxlength="300" placeholder="예: 평일 7시에 일어나서 씻고 약 먹고 8시에 나가기"></textarea>' + bxMic('bx-rt-say', '어떤 루틴인지 말해 보세요') + '</div>' +
    '<div class="rt-make-a"><span class="sp"></span><button type="button" class="btn" data-act="bx-rt-say-go">' + ICON.spark + '만들기</button></div>' +
    '<button type="button" class="bx-rt-blank" data-act="bx-rt-blank">' + ICON.edit + '<span><b>빈 루틴</b><small>이름 · 시각 · 단계 직접 입력</small></span>' + ICON.chevR + '</button>', '')});
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const t = ev.target.closest('[data-act="bx-rt-new"],[data-act="bx-rt-say-go"],[data-act="bx-rt-blank"]'); if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  const act = t.dataset.act;
  if (act === 'bx-rt-new') { bxRtNewOpen(); return; }
  if (act === 'bx-rt-blank') { closeSheet(); openRoutine(null, {name: '', days: RT_ALL, mode: 'start', target: '08:00', steps: [['', 10]]}); return; }
  const say = ($('#bx-rt-say') || {}).value || '';
  if (!say.trim()) { toast('어떤 루틴인지 한 문장으로 적거나 말해 주세요'); return; }
  const o = bxRtParse(say) || rtParseLocal(say);
  closeSheet();
  openRoutine(null, Object.assign(o, {note: '적은 순서대로 단계를 만들었어요. 시각과 시간을 확인하고 저장하세요.'}));
}, true);
