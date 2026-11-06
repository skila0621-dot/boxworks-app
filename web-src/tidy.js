/* ---------- 정리판(대표 결정 2026-11-01) ----------
   대표 지적: "새로운 것을 추가하고 수정하게 되면서 사용자의 시점에서 생각한 관점들이 사라졌다.
   단순하게 접근이 가능해야 한다는 점이 점점 희미해지고 있다."
   웹 시절 화면 위에 앱 화면을 얹어 온 것을 치운다. 기능마다 자리는 한 곳(+ 바로가기 한 곳). 목록은 프로젝트 문서 개편_검토 7절 */

// 설정 › 정보의 앱 버전: 대표에게 알리는 시험판 번호(빌드할 때 함께 올린다)
const BX_TRIAL = 69;

/* 설정(앱): 첫 화면은 묶음 목록(화면 · 휴대폰 캘린더 · 알림 · 분류·데이터), 누르면 그 묶음만 보이는 화면.
   뒤로 가기(‹ 또는 휴대폰 뒤로)로 목록에 돌아온다. 휴대폰 설정과 같은 방식(대표 결정 11/3: 한 페이지가 너무 길어 메뉴를 다시 찾기 불편).
   묶음 줄 오른쪽에는 지금 고른 값(규칙 11). 정보(저장 위치·앱 버전)는 목록 맨 아래 한 줄.
   뺀 것: 메인 색(색은 파랑 하나, 10/31 결정), 분류 색 표시(늘 켬), 공휴일 데이터, 사용 설명서(웹 시절 내용), 웹의 연동·아침 일정 보고 칸 */
let BX_SET = null;
const BX_SET_PHONE = '<svg class="i" viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>';
ICON.phone = BX_SET_PHONE; // 앱 아이콘 한 세트(ICON, 시험판 54)
function bxSetGroups(){
  const st = M.settings, th = lsGet('bx:theme') || '', rep = bxRepCfg();
  const pre = st.defaultRemind == null || st.defaultRemind === '' || remAbs(String(st.defaultRemind)) ? null : +st.defaultRemind;
  const preT = pre == null ? '미리 알림 끔' : pre === 0 ? '정시에' : pre % 1440 === 0 ? pre / 1440 + '일 전' : pre % 60 === 0 ? pre / 60 + '시간 전' : pre + '분 전';
  const g = [['view', BX_SET_PHONE, '화면', '다크 모드 ' + (th === 'dark' ? '켬' : th === 'light' ? '끔' : '자동') + ' · ' + (+st.weekStart === 0 ? '일요일' : '월요일') + ' 시작']];
  if (pcPlug()) g.push(['pcal', ICON.cal, '휴대폰 캘린더', pcCfg().on ? '함께 보기' : '꺼짐']);
  g.push(['alarm', ICON.bell, '알림', (rep.on ? '아침 요약 ' + bxT(rep.at) : '아침 요약 꺼짐') + ' · ' + preT]);
  g.push(['data', ICON.save, '캘린더·데이터', '캘린더 ' + M.cats.length + '개 · 휴지통 ' + M.trash.length + '개']);
  // 시험판 69: 시험 기록(휴대폰 쪽 기록이 있는 설치 파일에서만)
  if (bxTlPl()) g.push(['test', ICON.log, '시험 기록', '이 휴대폰에만 · 보내기는 직접']);
  return g;
}
function bxSettingsHtml(){
  // 시험판 38(대표 결정 11/3 18:58): 첫 화면은 묶음 목록(지금 값과 함께) → 묶음 화면은 줄 목록(이름 + 그 아래 지금 값, 삼성 캘린더 설정 방식)
  // → 줄을 누르면 그 설정만 바꾸는 자세한 화면. "한 화면에 너무 많은 정보를 주면 무엇을 바꿔야 할지 이해가 어렵다. 기능 설정이 많아질수록 삼성 쪽 방향이 옳다"
  const g = bxSetGroups(), parts = String(BX_SET || '').split('/'), cur = parts[0] && g.find(x => x[0] === parts[0]);
  if (!cur) {
    BX_SET = null;
    return '<div class="page-head"><div class="ph-t"><h1>설정</h1></div></div>' +
      '<section class="set-sec bx-set-home" aria-label="설정 묶음"><div class="set-menu">' +
      g.map(x => '<button type="button" class="menu-row" data-bxset="' + x[0] + '"><span class="mi">' + x[1] + '</span><span class="ml">' + x[2] + '</span><span class="mv"><span class="bx-mvt">' + esc(x[3]) + '</span>' + ICON.chevR + '</span></button>').join('') +
      '</div></section>' +
      '<p class="p small bx-set-foot">이 휴대폰에만 저장 · 시험판 ' + BX_TRIAL + '</p>';
  }
  const head = (title, back, aria) => '<div class="page-head bx-set-subh"><button type="button" class="bx-set-back" data-bxset="' + back + '" aria-label="' + aria + '">' + ICON.chevL + '</button><div class="ph-t"><h1>' + title + '</h1></div></div>';
  const d = parts[1] && bxSetDetail(parts[0], parts[1]);
  if (d) return head(d.title, parts[0], cur[2] + '(으)로') + '<div class="bx-setd">' + d.html + '</div>';
  BX_SET = parts[0];
  return head(cur[2], '', '설정 목록으로') + bxSetGroupHtml(parts[0]);
}
// 묶음 화면의 줄 하나: 이름 + 그 아래 파란 글씨로 지금 값. go = 들어갈 자세한 화면(data-bxset), act = 바로 하는 일
function bxSetLine(name, val, o){
  return '<button type="button" class="bx-arow"' + (o.act ? ' data-act="' + o.act + '"' : ' data-bxset="' + o.go + '"') + '>' +
    '<span class="bx-at"><b>' + name + '</b>' + (val ? '<small>' + esc(val) + '</small>' : '') + '</span>' + ICON.chevR + '</button>';
}
// 스위치 하나로 켜고 끄는 줄(삼성: 이름을 누르면 자세히, 스위치는 바로)
function bxSetLineSw(name, val, sw, go){
  return '<div class="bx-arow bx-arow-sw"><button type="button" class="bx-at" data-bxset="' + go + '"><b>' + name + '</b>' + (val ? '<small>' + esc(val) + '</small>' : '') + '</button><i class="bx-adiv" aria-hidden="true"></i>' + sw + '</div>';
}
function bxSetGroupHtml(k){
  const st = M.settings, box = (label, rows) => '<section class="set-sec bx-all" aria-label="' + label + '">' + rows + '</section>';
  if (k === 'view') {
    const th = lsGet('bx:theme') || '', w = window.BX_WPLACED || {}, nw = (w.now ? 1 : 0) + (w.list ? 1 : 0);
    return box('화면', bxSetLine('다크 모드', th === 'dark' ? '켬' : th === 'light' ? '끔' : '자동 · 휴대폰 설정을 따라요', {go: 'view/theme'}) +
        bxSetLine('시각 표시', bxClock24() ? '24시간 (15:00)' : '오전 · 오후 (오후 3:00)', {go: 'view/clock'}) +
        bxSetLine('한 주 시작 요일', +st.weekStart === 0 ? '일요일' : '월요일', {go: 'view/wk'})) +
      box('위젯', bxSetLine('위젯 추가', nw ? nw + '개 추가됨' : '앱을 열지 않아도 홈 화면에서 봐요', {act: 'bx-widget-open'}));
  }
  // 휴대폰 캘린더 묶음은 제 칸 제목을 빼고(위 제목과 겹침) 그대로
  if (k === 'pcal') return pcSetHtml().replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '');
  if (k === 'alarm') {
    const rep = bxRepCfg(), pre = st.defaultRemind == null || st.defaultRemind === '' || remAbs(String(st.defaultRemind)) ? null : +st.defaultRemind;
    const preT = pre == null ? '꺼짐' : pre === 0 ? '정시' : pre % 1440 === 0 ? pre / 1440 + '일 전' : pre % 60 === 0 ? pre / 60 + '시간 전' : pre + '분 전';
    const dayA = remAbs(remNorm(st.defaultRemindDay, false));
    const lv = kk => ({alarm: '알람', notice: '알림', quiet: '조용히'})[bxLevel(kk)];
    const lock = (BX_LOCK.find(o => o[0] === bxLockMode()) || BX_LOCK[0])[1];
    return box('알람 테스트', bxSetLine('알람 테스트', '10초 뒤 울려요', {act: 'bx-alarm-test'})) +
      box('알림', bxSetLineSw('아침 요약', rep.on ? '매일 ' + bxT(rep.at) + ' · 오늘 할 일 한눈에' : '꺼짐', bxSwitch('data-bxrep', rep.on, '아침 요약'), 'alarm/rep') +
        bxSetLine('울리는 방식', '루틴 ' + lv('routine') + ' · 일정 ' + lv('item') + ' · 시간표 ' + lv('tt'), {go: 'alarm/lv'}) +
        bxSetLine('일정 알림 기본값', '시간 있는 일정 ' + preT + ' · 종일 일정 ' + (dayA ? hmText(dayA.t) : '꺼짐'), {go: 'alarm/rem'}) +
        bxSetLine('잠금 화면 표시', lock, {go: 'alarm/lock'}));
  }
  if (k === 'test') return bxTlHtml();
  return box('캘린더·데이터', bxSetLine('캘린더', M.cats.length + '개 · 이름 · 색 · 홈에 보이기', {act: 'bx-set-cats'}) +
      bxSetLine('백업·복원', '이 휴대폰에만 저장', {act: 'bx-set-data'}) +
      bxSetLine('휴지통', M.trash.length + '개 · 30일 동안 보관', {act: 'bx-set-trash'})) +
    box('데이터 초기화', bxSetLine('<span class="bx-adanger">데이터 초기화</span>', '모든 일정 삭제 · 처음 상태로', {go: 'data/reset'}));
}
// 자세한 화면: 그 설정 하나만(제목은 위 머리 줄, 상자 안에는 고르는 칸, 상자 밑에 설명 한 줄)
function bxSetDetail(k, sub){
  const st = M.settings, card = (html, note) => '<section class="set-sec">' + html + '</section>' + (note ? '<p class="p small bx-setd-note">' + note + '</p>' : '');
  if (k === 'view' && sub === 'theme') return {title: '다크 모드', html: card(setRow('다크 모드', segHtml('data-theme-set', [['', '자동'], ['light', '끔'], ['dark', '켬']], lsGet('bx:theme') || '', '다크 모드', 240)), '자동은 휴대폰의 다크 모드를 따라요. ⋯ 메뉴의 다크 모드 스위치는 켬 · 끔만 바꿔요.')};
  // 시험판 58(대표 11/4 22:20): 오전 · 오후(기본) | 24시간. 앱 · 알림 · 잠금 화면 · 위젯이 같이 바뀐다
  if (k === 'view' && sub === 'clock') return {title: '시각 표시', html: card(setRow('시각 표시', segHtml('data-clock-set', [['', '오전 · 오후'], ['24', '24시간']], bxClock24() ? '24' : '', '시각 표시', 240)),
    '앱 화면 · 알림 · 잠금 화면 알람 · 위젯의 시각이 함께 바뀌어요. 오전 · 오후는 ‘오후 3시’, 24시간은 ‘15시’처럼 보여요. 시각 칸을 누르면 열리는 휴대폰 시계 창은 휴대폰 설정을 따라요.')};
  if (k === 'view' && sub === 'wk') return {title: '한 주 시작 요일', html: card(setRow('시작 요일', segHtml('data-wk', [['1', '월요일'], ['0', '일요일']], +st.weekStart === 0 ? '0' : '1', '주 시작 요일')), '캘린더 · 주간 · 시간표의 첫 요일이에요.')};
  if (k === 'alarm' && sub === 'rep') return {title: '아침 요약', html: card(bxReportSetHtml(), '켜 두면 매일 아침 오늘 일정이 휴대폰 알림창으로 와요.')};
  if (k === 'alarm' && sub === 'lv') return {title: '울리는 방식', html: card(bxLevelSetHtml())};
  if (k === 'alarm' && sub === 'lock') return {title: '잠금 화면 표시', html: card(bxLockSetHtml())};
  if (k === 'alarm' && sub === 'rem') {
    const pre = st.defaultRemind == null || st.defaultRemind === '' || remAbs(String(st.defaultRemind)) ? null : +st.defaultRemind, nu = minToNU(pre == null ? 10 : pre);
    const dayA = remAbs(remNorm(st.defaultRemindDay, false));
    // 켜고 끄기는 스위치(대표 의견 11/2 밤). 켜면 그 바로 아래 오른쪽에 값이 나온다(대표 지적 11/2, 규칙 12)
    return {title: '일정 알림 기본값', html: card(setRow('일정 알림(기본)', bxSwitch('data-pre-on', pre != null, '일정 알림')) +
      (pre != null ? '<div class="bx-setsub"><span class="p small">시간을 정한 일정. 0분은 정시</span><span class="bx-setsub-c">' + stepperHtml('set-pre-n', nu[0], 0, 999, 'set-pre-u') + unitSel('set-pre-u', nu[1]) + '</span></div>' : '')) +
      card(setRow('종일 일정 알림 시각', bxSwitch('data-day-on', !!dayA, '종일 일정 알림 시각')) +
      (dayA ? '<div class="bx-setsub"><span class="p small">종일 일정은 그날 이 시각에 알려요</span>' + bxTimeChip('set-day-t', dayA.t, '종일 일정 알림 시각') + '</div>' : ''), '새 일정을 만들 때 처음 들어가는 값이에요. 일정마다 새 일정 창의 알림 칩에서 바꾸거나 끌 수 있어요.')};
  }
  if (k === 'data' && sub === 'reset') {
    const nItems = M.items.filter(i => !i.pc).length + M.trash.length;
    return {title: '데이터 초기화', html: '<section class="set-sec danger-zone bx-reset">' +
      '<div class="reset-row"><div><b>모든 일정 삭제</b><span>일정 ' + nItems + '개(휴지통 포함)를 모두 삭제해요. 캘린더와 설정은 그대로예요.</span></div><button type="button" class="btn sm danger-line" data-act="reset" data-kind="items">삭제</button></div>' +
      '<div class="reset-row"><div><b>초기화</b><span>일정 · 캘린더 · 설정을 모두 삭제하고 처음 상태로 돌아가요.</span></div><button type="button" class="btn sm danger-line" data-act="reset" data-kind="all">초기화</button></div></section>' +
      '<p class="p small bx-setd-note">삭제하면 되돌릴 수 없어요.</p>'};
  }
  return null;
}
// 들어가기 · 나오기. 들어가면 맨 위부터 보인다. 뒤로(‹ · 휴대폰 뒤로)는 한 단계씩: 자세한 화면 → 묶음 화면 → 설정 목록
function bxSetOpen(k){ BX_SET = k || null; if (S.view !== 'settings') go('settings'); else render(); try { window.scrollTo(0, 0); } catch (e) { /* 그대로 */ } }
function bxSetBack(){ const k = String(BX_SET || ''), i = k.indexOf('/'); bxSetOpen(i > 0 ? k.slice(0, i) : null); }
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('[data-bxset]');
  if (b) { ev.preventDefault(); ev.stopPropagation(); if (SH) closeSheet(); if (b.dataset.bxset === 'test') bxTlLoad(); bxSetOpen(b.dataset.bxset); return; }
  if (ev.target.closest('[data-act="bx-tl-send"]')) { ev.preventDefault(); ev.stopPropagation(); bxTlAsk(); return; }
  if (ev.target.closest('[data-act="bx-tl-yes"]')) { ev.preventDefault(); ev.stopPropagation(); try { localStorage.setItem(BX_TL_OK, '1'); } catch (e) { /* 다음에 다시 여쭘 */ } closeSheet(); bxTlSend(); return; }
  const ck = ev.target.closest('[data-clock-set]');
  if (ck) { ev.preventDefault(); ev.stopPropagation(); saveSettings({clock: ck.dataset.clockSet === '24' ? '24' : ''}); render(); return; }
  // ⋯ 메뉴에서 설정을 열면 늘 목록부터
  if (ev.target.closest('[data-menu="prefs"]')) BX_SET = null;
}, true);

// 뺀 설정의 값은 처음 모양으로: 메인 색은 파랑, 분류 색은 늘 보이게(전에 바꿔 둔 사람도 되돌릴 곳이 없어지므로)
let bxTidyDone = false;
function bxTidyBoot(){
  if (!window.BX_APP || bxTidyDone || !M || !M.settings || !S.firstServer) return;
  bxTidyDone = true;
  const fix = {};
  if (M.settings.accent && M.settings.accent !== 'blue') fix.accent = 'blue';
  if (M.settings.catColors === false) fix.catColors = true;
  if (Object.keys(fix).length) { saveSettings(fix); M = buildModel(); }
  try { if ((lsGet('bx:accent') || 'blue') !== 'blue') applyAccent('blue'); } catch (e) { /* 저장 공간 없음 */ }
}

// 찾기 결과 없음의 조사: 받침이 있으면 '과', 없으면 '와'(‘아침’과 / ‘치과’와)
function bxJosaWa(q){
  const c = String(q || '').trim().slice(-1).charCodeAt(0);
  return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '과' : '와';
}
// 일정을 넣은 날로 홈을 넘겨 보여 준다(알림의 '보기')
function bxShowDay(ds){
  if (!isDate(ds)) return;
  S.homeDay = Math.round((parseYmd(ds) - parseYmd(M.today)) / 864e5);
  if (S.view !== 'today') go('today'); else render();
}
const BX_UP_ICON = '<svg class="i" viewBox="0 0 24 24"><path d="M12 15V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></svg>';

/* 시험판 69(결정 사안 s10 '넣기(휴대폰 안에만, 테스터가 직접 보냄)', 개발 요청함 R-5 · 사용자 조사 3절 '다'): 시험 기록.
   휴대폰 쪽(BxTestLog)이 알람 울림(예약 시각과 어긋난 정도) · '확인' · '5분 뒤' · 꺼진 동안 지나간 알람 수를 남기고,
   앱은 연 날(bx:days)을 남긴다. 단계를 '했어요'로 표시한 시각은 루틴 기록(rlog)에 이미 있다. 일정 · 루틴 이름, 장소, 메모는 넣지 않는다.
   설정 › 시험 기록: 요약 줄 + '시험 기록 보내기'(휴대폰 공유 창 — 보낼 곳은 테스터가 고름). 서버로 보내지 않는다(D-02).
   잴 숫자(리서치 11/6): 준비 시작 알람 → 시작까지 · 5분 뒤(주별) · 3일 넘게 쉬고 돌아온 날 · 첫 일정 · 첫 루틴까지 · 놓친 알람 */
ICON.log = '<svg class="i" viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V2.8h6V4"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/></svg>';
const BX_TL_DAYS = 'bx:days';
let BX_TL = null;
function bxTlPl(){ const a = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.BxAlarm; return window.BX_APP && a && typeof a.testLog === 'function' ? a : null; }
function bxTlDays(){ try { const v = JSON.parse(localStorage.getItem(BX_TL_DAYS) || '[]'); return Array.isArray(v) ? v.filter(isDate) : []; } catch (e) { return []; } }
// 화면이 보일 때 그날을 '연 날'로(하루 한 번, 120일까지)
function bxTlSeen(){
  if (!window.BX_APP || document.hidden || !M || !M.today) return;
  const d = bxTlDays(); if (d.includes(M.today)) return;
  d.push(M.today); d.sort();
  try { localStorage.setItem(BX_TL_DAYS, JSON.stringify(d.slice(-120))); } catch (e) { /* 저장 공간 없음 */ }
}
document.addEventListener('visibilitychange', bxTlSeen);
setTimeout(bxTlSeen, 1500); setInterval(bxTlSeen, 10 * 60000);
// 휴대폰 쪽과 같은 짧은 값(Java String.hashCode → 16진수): 알람 묶음과 루틴 기록의 단계를 이름 없이 맞춰 본다
function bxTlHash(s){ let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16); }
function bxTlDone(){
  const out = [];
  (M.rlogs || new Map()).forEach((lg, key) => {
    const i = String(key).lastIndexOf('|'), rid = String(key).slice(0, i), ds = String(key).slice(i + 1);
    Object.entries((lg && lg.done) || {}).forEach(([sid, v]) => { const t = Date.parse(v); if (!isNaN(t)) out.push({t, e: 'done', s: bxTlHash('r_' + rid + '_' + ds + '_' + sid)}); });
  });
  return out.sort((a, b) => a.t - b.t);
}
async function bxTlLoad(){
  const pl = bxTlPl(); if (!pl) return;
  let r = null;
  try { r = await pl.testLog(); } catch (e) { r = null; }
  BX_TL = {events: r && Array.isArray(r.events) ? r.events.filter(x => x && x.t) : [], installedAt: r && +r.installedAt || 0, ok: !!r};
  if (S.view === 'settings' && String(BX_SET || '') === 'test') render();
}
function bxTlHM(t){ const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function bxTlDur(ms){
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return m + '분';
  if (m < 1440) return Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + m % 60 + '분' : '');
  return Math.round(m / 1440) + '일';
}
function bxTlSummary(){
  const L = BX_TL || {events: [], installedAt: 0}, ev = L.events, inst = L.installedAt;
  const fire = ev.filter(x => x.e === 'fire' && x.k !== 'nag' && x.k !== 'report' && x.at), late = fire.filter(x => x.t - x.at > 60000);
  const snz = ev.filter(x => x.e === 'snooze'), wk = Date.now() - 7 * 864e5;
  const acts = ev.filter(x => x.e === 'ok' || x.e === 'snooze').concat(bxTlDone());
  // 준비 시작: 루틴 첫 꼭 울림 단계 · 일정 준비 첫 단계의 첫 알람(다시 알림 아님) → 같은 묶음의 확인 · 5분 뒤 · 했어요 가운데 가장 이른 것
  const starts = fire.filter(x => x.f && !x.r && x.s).map(x => { const a = acts.filter(y => y.s === x.s && y.t >= x.t - 60000).sort((p, q) => p.t - q.t)[0]; return a ? Math.max(0, a.t - x.t) : null; }).filter(v => v != null).sort((a, b) => a - b);
  const after = t => !inst || t >= inst - 60000;
  const items = M.items.filter(i => !i.pc && i.createdAt).map(i => Date.parse(i.createdAt)).filter(t => !isNaN(t) && after(t)).sort((a, b) => a - b);
  const rts = M.routines.map(r => { const d = getDoc(r.id); return d && d.createdAt ? Date.parse(d.createdAt) : NaN; }).filter(t => !isNaN(t) && after(t)).sort((a, b) => a - b);
  const days = bxTlDays(); let back = 0;
  for (let i = 1; i < days.length; i++) if (Math.round((parseYmd(days[i]) - parseYmd(days[i - 1])) / 864e5) >= BX_RET_DAYS) back++;
  return {inst, firstItem: items[0] || 0, firstRt: rts[0] || 0, fire: fire.length, late: late.length, worst: late.reduce((a, x) => Math.max(a, x.t - x.at), 0),
    missed: ev.filter(x => x.e === 'missed').reduce((a, x) => a + (+x.n || 0), 0), ok: ev.filter(x => x.e === 'ok').length, snooze: snz.length, snoozeWeek: snz.filter(x => x.t >= wk).length,
    starts: starts.length, startMed: starts.length ? starts[Math.floor(starts.length / 2)] : null, days: days.length, back};
}
function bxTlLines(){
  const v = bxTlSummary(), when = t => fmtMD(ymd(new Date(t)), true) + ' ' + bxT(bxTlHM(t));
  const first = (t, none) => t && v.inst ? bxTlDur(t - v.inst) : t ? '있음' : none;
  return [
    ['설치한 때', v.inst ? when(v.inst) : '알 수 없음'],
    ['첫 일정 · 첫 루틴까지', first(v.firstItem, '아직') + ' · ' + first(v.firstRt, '아직')],
    ['알람이 울린 횟수', v.fire + '번' + (v.late ? ' · 1분 넘게 늦음 ' + v.late + '번(가장 늦음 ' + bxTlDur(v.worst) + ')' : ' · 늦게 울린 것 없음')],
    ['휴대폰이 꺼진 동안 지나간 알람', v.missed + '개'],
    ['확인 · 5분 뒤', v.ok + '번 · ' + v.snooze + '번(최근 7일 ' + v.snoozeWeek + '번)'],
    ['준비 시작 알람 → 시작까지', v.starts ? '가운데 ' + bxTlDur(v.startMed) + ' · ' + v.starts + '번' : '아직 없음'],
    ['앱을 연 날', v.days + '일 · ' + BX_RET_DAYS + '일 넘게 쉬고 돌아옴 ' + v.back + '번']
  ];
}
function bxTlHtml(){
  const box = (label, rows) => '<section class="set-sec bx-all" aria-label="' + label + '">' + rows + '</section>';
  const rows = BX_TL ? bxTlLines().map(([a, b]) => '<div class="bx-arow bx-tl-row"><span class="bx-at"><b>' + esc(a) + '</b><small>' + esc(b) + '</small></span></div>').join('')
    : '<div class="bx-arow bx-tl-row"><span class="bx-at"><b>기록을 불러오는 중이에요</b></span></div>';
  // 보내기가 맨 위(이 화면에 오는 까닭 — 스크롤 없이 보이게), 요약은 그 아래
  return box('보내기', bxSetLine('시험 기록 보내기', '휴대폰 공유 창에서 보낼 곳을 골라요', {act: 'bx-tl-send'})) +
    box('시험 기록', rows) +
    '<p class="p small bx-setd-note">알람이 울린 시각 · 누른 단추 · 앱을 연 날 · 일정 · 루틴을 만든 시각만 들어 있어요. 일정 · 루틴 이름, 장소, 메모는 들어가지 않아요. 기록은 이 휴대폰에만 30일 동안 남고, 보내기를 누를 때만 밖으로 나가요.</p>';
}
// 처음 보낼 때 한 번: 무엇이 들어 있는지 보여 주고 '보내기'(개발 요청함 R-5). 그다음부터는 바로 공유 창
const BX_TL_OK = 'bx:tlok';
function bxTlAsk(){
  let ok = false; try { ok = localStorage.getItem(BX_TL_OK) === '1'; } catch (e) { ok = false; }
  if (ok) { bxTlSend(); return; }
  const row = (a, b) => '<div class="bx-arow"><span class="bx-at"><b>' + a + '</b><small>' + b + '</small></span></div>';
  openSheet({title: '시험 기록 보내기', draw: () => setSheet('<p class="p small bx-tl-lead">처음 한 번만 보여 드려요. 보낼 곳은 다음에 뜨는 휴대폰 공유 창에서 직접 골라요.</p>' +
    '<div class="bx-all">' + row('들어 있는 것', '알람이 울린 시각 · 누른 단추(확인 · 5분 뒤 · 했어요) · 휴대폰이 꺼진 동안 지나간 알람 수 · 앱을 연 날 · 설치한 때 · 일정 · 루틴을 만든 시각') +
    row('들어가지 않는 것', '일정 · 루틴 이름, 장소, 메모') + '</div>',
    '<button type="button" class="btn grow" data-act="sheet-close">취소</button><button type="button" class="btn primary grow" data-act="bx-tl-yes">보내기</button>')});
}
async function bxTlSend(){
  if (!BX_TL) await bxTlLoad();
  const L = BX_TL || {events: [], installedAt: 0}, nm = window.BX_NAME || '스케줄러';
  const head = nm + ' 시험 기록 · 시험판 ' + BX_TRIAL + ' · 보낸 때 ' + M.today + ' ' + bxT(bxTlHM(Date.now()));
  const sum = [head].concat(bxTlLines().map(([a, b]) => a + ': ' + b)).join('\n');
  const data = {v: 1, app: nm, trial: BX_TRIAL, sentAt: nowIso(), installedAt: L.installedAt, events: L.events, done: bxTlDone(), days: bxTlDays(),
    items: M.items.filter(i => !i.pc && i.createdAt).map(i => i.createdAt).sort(), routines: M.routines.map(r => (getDoc(r.id) || {}).createdAt).filter(Boolean).sort()};
  const text = sum + '\n\n--- 자세한 기록(JSON) ---\n' + JSON.stringify(data);
  const C = window.Capacitor && Capacitor.Plugins, share = C && C.Share, fs = C && C.Filesystem;
  if (!share) { offerFile(nm + '-시험기록-' + M.today.replace(/-/g, '') + '.txt', text); return; }
  let uri = '';
  if (fs) { try { uri = (await fs.writeFile({path: 'testlog/' + nm + '-시험기록-' + M.today.replace(/-/g, '') + '.txt', data: text, directory: 'CACHE', encoding: 'utf8', recursive: true})).uri || ''; } catch (e) { uri = ''; } }
  try { await share.share(Object.assign({title: nm + ' 시험 기록', text: sum, dialogTitle: '시험 기록 보낼 곳 고르기'}, uri ? {files: [uri]} : {text})); }
  catch (e) { /* 공유 창을 닫음 */ }
}

/* 자동 시험(tests/)이 쓰는 고리. 화면에서는 쓰지 않는다 */
window.BX_T = {
  backup: () => bxBackupText(),
  restore: text => importJson({text: async () => text}),
  docs: () => Array.from(allDocs().entries()),
  write: (id, doc) => writeDoc(id, doc),
  reset: kind => doReset(kind || 'all'),
  day: ds => openDay(ds),
  banner: () => { const b = document.getElementById('banner'); return b && !b.hidden ? b.textContent : ''; },
  // 시험판 58: 시각 글자 · 루틴 아이콘 규칙 · 휴대폰 캘린더 상태를 시험에서 본다
  fn: {bxT: v => bxT(v), bxTR: (a, b) => bxTR(a, b), bxH: h => bxH(h), bxHR: (a, b) => bxHR(a, b), hmText: v => hmText(v), icon: n => bxIconFor(n),
    pcTitles: ds => M.items.filter(i => i.pc && i.date === ds).map(i => i.title).sort(), calSel: () => bxCalSel, alarms: d => window.BX_alarmPlan(d),
    // 시험판 59: 날짜 · 시각이 없거나 깨졌을 때 글('미지정' · '--:--')
    md: (s, wd) => fmtMD(s, wd), edDay: s => bxEdDay(s), bxMD: s => bxMD(s), range: (a, b) => bxRangeLabel(a, b), rel: s => relDay(s, M.today),
    // 시험판 62: 아래 메뉴 · 일정 창 값(바퀴 · 출발·준비)
    dock: () => bxDockKeys(), form: () => F ? JSON.parse(JSON.stringify(F)) : null,
    // 시험판 63: 색 막대 글자색(명암 대비)
    onColor: c => bxOnColor(c), hexOf: c => bxHexOf(c), lockHtml: () => bxLockSetHtml(),
    // 시험판 66: 지금 보는 화면
    view: () => S.view,
    // 시험판 68: 말로 루틴 만들기 읽기(약을 따로 알아듣지 않음) · 루틴 템플릿 이름
    rtParse: t => bxRtParse(t), rtTpls: () => RT_TEMPLATES.map(t => t.name),
    // 시험판 69: 시험 기록 요약 · 짧은 값(휴대폰 쪽과 같아야 함)
    tlLines: () => bxTlLines(), tlHash: s => bxTlHash(s), tlDays: () => bxTlDays()}
};
