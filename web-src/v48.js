/* ---------- 시험판 48 (대표 11/4 13:45 ~ 14:07) ----------
   1) 명상 끝내기: 명상하는 동안 알림창 · 잠금 화면에 '명상 중 · 남은 시간 · 명상 끝내기'(휴대폰 쪽 MedOngoing),
      앱 안에서도 명상 화면이 아닌 곳이면 아래쪽에 '명상 중 · 남은 시간 · 끝내기' 줄(13:45 "앱 밖으로 나와도 계속 진행, 어디에도 정지 버튼이 없다")
   2) 호흡에 맞춘 움직임: 들이쉴 때(4초) 꽃잎이 피고 내쉴 때(6초) 오므린다(13:45 "게이지 움직임이 너무 단순", 13:50 "디자인이 단순")
   3) '소리와 호흡' 줄 정렬(13:50), + 단추는 100% · 둘레 빛만 70%(13:51)
   4) 일정 알림 페이지: 글자 시작 · 간격을 한 줄로, '직접 입력'이 '10분 전'으로 두 번 보이던 것(13:56)
   5) 시간표: 위 여백을 줄이고 빈 시간표 설명은 시간표 칸 안에(13:58)
   6) 메모 화면: 적은 메모만, 오른쪽 아래 + 단추 → '새 메모' 페이지(14:00)
   7) 캘린더: 휴대폰 캘린더 일정도 그 캘린더 색으로, 칩 줄을 밀어도 고른 칩으로 되돌아가지 않게(14:03)
   8) 위젯 단추로 들어오면 먼저 홈 화면으로(14:07, app-shim.js가 부름) */

/* 1) 명상 끝내기 ---------------------------------------------------------- */
function bxMedLive(){ return !!(MED.run && MED.run.endAt > Date.now()); }
// 휴대폰 알림('명상 중 · 남은 시간 · 명상 끝내기'). run이 없으면 지운다
function bxMedNotify(run){
  const p = bgPlug(); if (!p || !p.medOngoing) return;
  try {
    const q = run ? {startAt: run.startAt, endAt: run.endAt, min: run.min, bg: run.bg ? bgName(run.bg) : '', bell: !run.silent} : {clear: true};
    p.medOngoing(q).catch(() => {});
  } catch (e) { /* 알림을 붙일 수 없음 */ }
}
const bxMedStart48 = medStart;
medStart = function(){
  // 알림을 배경 소리보다 먼저 건다: 휴대폰이 배경 소리 알림을 따로 띄우지 않고 명상 알림 하나로 보여 준다
  if (window.BX_APP) { const st = Date.now() + MED_LEAD; bxMedNotify({startAt: st, endAt: st + MED.min * 60000, min: MED.min, bg: bgPlug() ? bgCur() : '', silent: !bxMedBellOn()}); }
  const r = bxMedStart48.apply(this, arguments);
  bxMedBar();
  return r;
};
const bxMedStop48 = medStop;
medStop = function(){
  const r = bxMedStop48.apply(this, arguments);
  bxMedNotify(null);
  bxMedBar();
  return r;
};
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest || !ev.target.closest('[data-act="bx-med-close"]')) return;
  bxMedNotify(null);
}, true);
// 알림의 '명상 끝내기'(휴대폰이 알려 줌) · 앱을 닫아 휴대폰이 멈춘 명상: '명상 중' 화면을 치우고, 한 만큼은 기록
function bxMedEndedAt(at){
  const run = MED.run; if (!run) return;
  const m = Math.floor((Math.min(at || Date.now(), run.endAt) - run.startAt) / 60000);
  if (m >= 1) medAddLog(m);
  medStop(false);
}
(function bxMedStopWatch(){
  const p = bgPlug(); if (!p || !p.addListener) return;
  try {
    p.addListener('medStop', d => {
      if (!bxMedLive()) return;
      bxMedEndedAt(d && +d.at);
      toast('명상을 끝냈어요');
    });
  } catch (e) { /* 알림을 받을 수 없음 */ }
})();
bxMedCancelCheck = function(){
  const p = bgPlug(); if (!p || !p.status) return;
  p.status().then(st => {
    const at = st && +st.medCancel;
    if (at && MED.run && at >= (MED.run.leadAt || MED.run.startAt || 0) - 1000 && !MED.run.cancelSeen) bxMedEndedAt(at);
    else bxMedBar();
  }).catch(() => {});
};

// 앱 안의 '명상 중' 줄: 명상 화면이 아닌 곳에서 아래 메뉴 바로 위(시간표는 아래 도구 줄 위). 누르면 명상 화면, '끝내기'
let bxMbT = 0;
function bxMedBar(){
  const show = !!window.BX_APP && bxMedLive() && S.view !== 'med' && !document.getElementById('bx-start');
  let bar = document.getElementById('bx-medbar');
  document.documentElement.classList.toggle('bx-mb-on', show);
  if (!show) { if (bar) bar.remove(); clearInterval(bxMbT); bxMbT = 0; return; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'bx-medbar'; bar.className = 'bx-medbar';
    bar.innerHTML = '<button type="button" class="bx-mb-open" data-bxmb="open"><span class="bx-mb-ic" aria-hidden="true">' + bxIconSpan('lotus', '') + '</span>' +
      '<span class="bx-mb-t" role="timer" aria-live="off"><b id="bx-mb-h"></b><small id="bx-mb-s"></small></span></button>' +
      '<button type="button" class="bx-mb-stop" data-bxmb="stop">끝내기</button>';
    document.body.appendChild(bar);
  }
  const run = MED.run;
  bar.style.setProperty('--bx-bd', MED.breath ? bxMedPhase(run) : '0ms');
  bar.classList.toggle('br', !!MED.breath);
  bxMedBarTick();
  if (!bxMbT) bxMbT = setInterval(bxMedBarTick, 1000);
}
function bxMedBarTick(){
  const bar = document.getElementById('bx-medbar');
  if (!bar || !bxMedLive() || S.view === 'med') { bxMedBar(); return; }
  const run = MED.run, now = Date.now(), lead = now < run.startAt;
  const h = bar.querySelector('#bx-mb-h'), s = bar.querySelector('#bx-mb-s');
  const ht = lead ? '곧 시작해요 · ' + Math.ceil((run.startAt - now) / 1000) : '명상 중 · ' + medMinText(Math.min((run.endAt - now) / 1000, run.min * 60)) + ' 남음';
  if (h.textContent !== ht) h.textContent = ht;
  const st = [run.min + '분', run.bg && bgName(run.bg) ? bgName(run.bg) : '', run.silent ? '종소리 끔' : ''].filter(Boolean).join(' · ');
  if (s.textContent !== st) s.textContent = st;
  bar.querySelector('[data-bxmb="open"]').setAttribute('aria-label', ht + ' · 명상 화면 열기');
  // 시간표의 아래 도구 줄 위에 놓는다
  const tb = document.querySelector('.bx-ttbar');
  bar.style.setProperty('--bx-mb-lift', tb && tb.offsetHeight && getComputedStyle(tb).display !== 'none' ? tb.offsetHeight + 'px' : '0px');
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('[data-bxmb]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  if (b.dataset.bxmb === 'stop') { if (bxMedLive()) { medStop(true); toast('명상을 끝냈어요'); } bxMedBar(); return; }
  if (SH) closeSheet();
  go('med');
}, true);
document.addEventListener('visibilitychange', () => { if (!document.hidden) bxMedBar(); });

/* 2) 호흡에 맞춘 움직임 -------------------------------------------------- */
// 지금 호흡의 어디쯤인지(애니메이션 시작 지연). 시작 전 5초는 첫 종 때 피기 시작하도록 그만큼 늦춘다
function bxMedPhase(run){
  if (!run) return '0ms';
  const now = Date.now();
  return now < run.startAt ? Math.round(run.startAt - now) + 'ms' : '-' + Math.round((now - run.startAt) % 10000) + 'ms';
}
const BX_MED_FLOWER = '<div class="bx-med-fl" aria-hidden="true">' + [0, 1, 2, 3, 4, 5].map(i => '<i style="--i:' + i + '"></i>').join('') + '</div>';
const bxMedHtml48 = medHtml;
medHtml = function(){
  let h = bxMedHtml48.apply(this, arguments);
  if (!window.BX_APP) return h;
  const run = MED.run, live = bxMedLive();
  // 진행 중 · 끝: 원 뒤에 꽃잎. 원이 그 위에서 같이 숨 쉰다(원에 직접 걸던 지연은 꽃 전체 값으로)
  h = h.replace(/<div class="bx-med-circle" style="animation-delay:-?\d+ms">/, '<div class="bx-med-circle">');
  if (run && (live || run.endAt <= Date.now())) {
    h = h.replace('<section class="bx-med-run', '<section class="bx-med-run' + (MED.breath ? ' bx-br-on' : ''));
    h = h.replace('<div class="bx-med-dial">', '<div class="bx-med-dial" style="--bx-bd:' + (live ? bxMedPhase(run) : '0ms') + '">' + BX_MED_FLOWER);
  } else {
    // 고르는 화면: 반쯤 핀 꽃 위에 고른 시간
    h = h.replace('<div class="bx-med-dial idle" aria-hidden="true">', '<div class="bx-med-dial idle" aria-hidden="true">' + BX_MED_FLOWER);
  }
  return h;
};

/* 4) 일정 알림 페이지: '직접 입력' 줄은 늘 '직접 입력'. 정한 값은 아래 목록에(목록이 닫혀 있으면 줄 오른쪽에 파란 글자) */
const bxRemQuick48 = bxRemQuick;
bxRemQuick = function(){
  let h = bxRemQuick48.apply(this, arguments);
  if (!window.BX_APP || !F) return h;
  const cur = remList(fRem());
  return h.replace(/(<button type="button" class="pick" data-bx-rem="adv" aria-pressed="(true|false)">)[\s\S]*?(<\/button>)/, (m, a, p, z) =>
    a + '<span class="bx-rq-t">직접 입력</span>' + (p === 'true' && !F.remAdv && cur.length ? '<small class="bx-rq-v">' + esc(cur.map(remLabel).join(' · ')) + '</small>' : '') + z);
};
// 직접 입력을 열면: '정한 알림' 이름 · 목록(줄마다 ×), '사전 알림' · '정한 시각' 상자. 글자는 모두 화면 끝에서 32
const bxDrawFRem48 = drawFRem;
drawFRem = function(){
  const r = bxDrawFRem48.apply(this, arguments);
  if (window.BX_APP && F && F.remAdv) {
    const adv = document.querySelector('#f-rem .bx-rem-adv'), pk = adv && adv.querySelector(':scope > .rem-picks');
    if (pk && !adv.querySelector(':scope > .bx-rq-gl')) { const gl = document.createElement('div'); gl.className = 'fg-l bx-rq-gl'; gl.textContent = '정한 알림'; adv.insertBefore(gl, pk); }
  }
  return r;
};

/* 5) 시간표: 빈 시간표 설명은 시간표 칸 안 위쪽에 작게(시간표가 밀려나지 않게) */
const bxTtHtml48 = ttHtml;
ttHtml = function(){
  let h = bxTtHtml48.apply(this, arguments);
  if (!window.BX_APP) return h;
  const m = h.match(/<p class="empty tt-empty">[\s\S]*?<\/p>/);
  if (m) {
    const i = h.indexOf('<div class="tt-lines">');
    if (i > 0) { h = h.replace(m[0], ''); const j = h.indexOf('<div class="tt-lines">'); h = h.slice(0, j) + m[0].replace('class="empty tt-empty"', 'class="tt-empty bx-tt-e48"') + h.slice(j); }
  }
  return h;
};

/* 6) 메모 화면: 적은 메모만(오늘 · 다가오는 날 · 지난 메모), 적기는 오른쪽 아래 + → '새 메모' 페이지 */
bxMemoPageHtml = function(){
  const t = M.today, other = [], n = bxMemoCount();
  if (M.memos) M.memos.forEach((l, ds) => { if (ds !== t) other.push(ds); });
  const fut = other.filter(d => d > t).sort(), past = other.filter(d => d < t).sort().reverse();
  const today = bxMemos(t).slice().reverse();
  const day = (ds, newFirst) => { const l = bxMemos(ds).slice(); if (newFirst) l.reverse();
    return '<div class="bx-mmp-day"><div class="bx-mmp-dh"><b>' + esc(bxMemoDayName(ds)) + '</b><span class="n">' + l.length + '</span></div>' + bxMemoRowsHtml(l) + '</div>'; };
  const head = '<div class="page-head"><div class="ph-t"><h1>메모</h1><p>' + esc(bxMemoPageSub()) + '</p></div></div>';
  if (!n) return head + '<section class="tcard bx-mm-card bx-mmp-empty" aria-label="메모 없음"><div class="tc-body"><b>아직 메모가 없어요</b>' +
    '<p class="p small">오른쪽 아래 <span class="bx-mmp-plus" aria-label="더하기">+</span>를 눌러 떠오른 것을 적거나 말해 보세요. 적은 날짜에 쌓이고 홈 · 캘린더의 그날에도 보여요.</p></div></section>';
  return head +
    (today.length ? '<section class="tcard bx-mm-card bx-mmp-quick" aria-label="오늘 메모"' + bxMemoBox(t, 'desc') + '><div class="tc-body">' +
      '<div class="bx-mm-h"><h2>' + esc(bxMemoDayName(t)) + '</h2>' + bxMemoNHtml(today.length) + '</div>' + bxMemoListHtml(today) + '</div></section>' : '') +
    (fut.length ? '<section class="tcard bx-mm-card bx-mmp-grp" aria-labelledby="h-mmp-fut"><div class="tc-body"><div class="bx-mm-h"><h2 id="h-mmp-fut">다가오는 날</h2></div>' + fut.map(d => day(d, false)).join('') + '</div></section>' : '') +
    (past.length ? '<section class="tcard bx-mm-card bx-mmp-grp" aria-labelledby="h-mmp-past"><div class="tc-body"><div class="bx-mm-h"><h2 id="h-mmp-past">지난 메모</h2></div>' + past.slice(0, BX_MMP_DAYS).map(d => day(d, true)).join('') +
      (past.length > BX_MMP_DAYS ? '<p class="p small bx-mmp-tip">더 지난 메모는 위의 돋보기(찾기)에서 찾아요.</p>' : '') + '</div></section>' : '');
};
if (typeof BX_HELP === 'object' && Array.isArray(BX_HELP.memo)) BX_HELP.memo = [
  '오른쪽 아래 + 를 눌러 떠오른 것을 바로 적거나 말해요. 적은 날짜에 쌓이고, 홈과 캘린더의 그날에도 보여요.',
  '메모를 누르면 고치기 · 삭제 · 일정으로 만들기.',
  '새 일정 창에 “메모 …”로 시작해 적거나 말해도 메모로 들어가요.',
  '휴대폰 홈 화면 위젯의 ✎ 단추를 누르면 홈 화면에서 새 메모 페이지가 열려 바로 적을 수 있어요.',
  '위의 돋보기(찾기)에서 메모도 찾아요.'
];
// '새 메모' 페이지(‹ 는 적지 않고 닫기, 완료는 저장). ds가 없으면 오늘
function bxMemoNew(o){
  o = o || {};
  if (!M || !window.BX_APP) return;
  const ds = isDate(o.ds) ? o.ds : M.today;
  bxMemoNewClose(false);
  const pg = document.createElement('div');
  pg.id = 'bx-mmn'; pg.className = 'bx-ep bx-mmn'; pg.dataset.ds = ds;
  pg.setAttribute('role', 'dialog'); pg.setAttribute('aria-modal', 'true'); pg.setAttribute('aria-labelledby', 'bx-mmn-t');
  const when = ds === M.today ? '오늘(' + fmtMD(ds) + ')' : bxMemoDayName(ds);
  pg.innerHTML = '<div class="bx-ep-h"><button type="button" class="icon-btn" data-bxmmn="back" aria-label="적지 않고 돌아가기">' + ICON.chevL + '</button><h2 id="bx-mmn-t">새 메모</h2><button type="button" class="bx-ep-ok" data-bxmmn="done">완료</button></div>' +
    '<div class="bx-ep-b"><div class="bx-ep-box bx-mmn-box"><label class="sr" for="bx-mmn-ta">메모</label><textarea id="bx-mmn-ta" class="bx-mmn-ta" maxlength="300" placeholder="떠오른 것을 적거나 말해 보세요"></textarea>' +
      '<div class="bx-mmn-bar"><span class="bx-mmn-n tnum" id="bx-mmn-n">0 / 300</span>' + bxMic('bx-mmn-ta', '메모할 것을 말해 보세요') + '</div></div>' +
      '<p class="p small bx-ep-note">' + esc(when) + ' 메모로 저장돼요. 홈 · 캘린더의 그날에도 보여요.</p></div>';
  document.body.appendChild(pg);
  document.documentElement.classList.add('bx-mmn-on');
  const ta = pg.querySelector('#bx-mmn-ta');
  setTimeout(() => {
    try { ta.focus({preventScroll: true}); } catch (e) { ta.focus(); }
    if (o.kb && typeof window.BX_keyboard === 'function') window.BX_keyboard();
    if (o.mic) { const m = pg.querySelector('[data-act="bx-mic"]'); if (m) m.click(); }
  }, 60);
}
function bxMemoNewClose(save){
  const pg = document.getElementById('bx-mmn'); if (!pg) return false;
  const ta = pg.querySelector('#bx-mmn-ta'), text = ta ? ta.value.trim() : '', ds = pg.dataset.ds;
  pg.remove();
  document.documentElement.classList.remove('bx-mmn-on');
  if (save && text && M) {
    const id = bxMemoAdd(ds, text);
    if (id) { render(); toast('메모했어요' + (ds === M.today ? '' : ' · ' + fmtMD(ds)), [['되돌리기', doUndo]]); }
  }
  return true;
}
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('[data-bxmmn]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  bxMemoNewClose(b.dataset.bxmmn === 'done');
}, true);
document.addEventListener('input', ev => {
  if (!ev.target || ev.target.id !== 'bx-mmn-ta') return;
  const n = document.getElementById('bx-mmn-n'); if (n) n.textContent = ev.target.value.length + ' / 300';
});
// + 단추: 메모 화면에서는 '새 메모'(꾹 누르면 바로 말하기)
const bxFabSync48 = bxFabSync;
bxFabSync = function(){
  const r = bxFabSync48.apply(this, arguments);
  const fab = document.querySelector('.bx-fab'); if (!fab) return r;
  const memo = !!window.BX_APP && S.view === 'memo' && bxMemoOn();
  if (memo) { document.documentElement.classList.add('bx-fab-on'); fab.dataset.bxmemo = '1'; fab.setAttribute('aria-label', '새 메모 (길게 누르면 말하기)'); delete fab.dataset.date; }
  else if (fab.dataset.bxmemo) { delete fab.dataset.bxmemo; fab.setAttribute('aria-label', '새 일정 (길게 누르면 말하기)'); }
  return r;
};
window.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const f = ev.target.closest('.bx-fab'); if (!f || !f.dataset.bxmemo || S.view !== 'memo') return;
  ev.preventDefault(); ev.stopPropagation();
  const lp = typeof bxFabSwallow === 'number' && Date.now() - bxFabSwallow < 600;
  bxMemoNew({mic: lp});
}, true);
// 위젯 ✎: 홈 화면에서 '새 메모' 페이지 + 키보드
window.BX_memoQuick = function(tries){
  tries = tries || 0;
  if (!M || !S.firstServer || document.getElementById('bx-start')) { if (tries < 20 && !document.getElementById('bx-start')) setTimeout(() => window.BX_memoQuick(tries + 1), 250); return; }
  window.BX_goHome();
  setTimeout(() => bxMemoNew({kb: true}), 260);
};

/* 7) 캘린더 칩 줄: 다시 그려도(30초마다 · 달 넘기기) 밀어 둔 자리 그대로. 고른 칩이 바뀌었을 때만 그 칩을 가운데로 */
const bxRender48 = render;
render = function(){
  const row0 = document.querySelector('.screen .bx-cchips'), on0 = row0 && row0.querySelector('.bx-cchip[aria-pressed="true"]');
  const keep = row0 ? {left: row0.scrollLeft, sel: on0 ? on0.dataset.bxcsel : null, view: S.view} : null;
  const r = bxRender48.apply(this, arguments);
  try {
    const row = document.querySelector('.screen .bx-cchips'), on = row && row.querySelector('.bx-cchip[aria-pressed="true"]');
    if (row && keep && keep.view === S.view && (on ? on.dataset.bxcsel : null) === keep.sel) row.scrollLeft = keep.left;
  } catch (e) { /* 그대로 */ }
  if (window.BX_APP) bxMedBar();
  return r;
};

/* 8) 위젯 단추로 들어오면 먼저 홈 화면(ds: 위젯이 보던 날, 오늘이 아니면 홈도 그날) */
window.BX_goHome = function(ds){
  if (!M || !window.BX_APP) return;
  try {
    bxMemoNewClose(false);
    if (typeof bxPg !== 'undefined' && bxPg) bxPgClose(true);
    if (document.getElementById('bx-ep') && typeof bxEpClose === 'function') bxEpClose(true);
    if (document.getElementById('bx-mp') && typeof bxMedPage === 'function') bxMedPage(false);
    if (SH) closeSheet();
  } catch (e) { /* 그대로 */ }
  if (isDate(ds) && ds !== M.today) { bxShowDay(ds); return; }
  S.homeDay = 0;
  if (S.view !== 'today') go('today'); else render();
};
// 위젯의 일정 줄: 홈에서 고치기 창(app-shim.js가 먼저 BX_goHome)
// 휴대폰 뒤로: 새 메모 페이지를 먼저 닫는다(적지 않음)
setTimeout(() => {
  const back = window.BX_back; if (typeof back !== 'function' || back.bx48) return;
  window.BX_back = function(){
    if (window.BX_APP && document.getElementById('bx-mmn')) { bxMemoNewClose(false); return true; }
    return back.apply(this, arguments);
  };
  window.BX_back.bx48 = true;
}, 0);

/* 모양 */
// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
