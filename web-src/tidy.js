/* ---------- 정리판(대표 결정 2026-11-01) ----------
   대표 지적: "새로운 것을 추가하고 수정하게 되면서 사용자의 시점에서 생각한 관점들이 사라졌다.
   단순하게 접근이 가능해야 한다는 점이 점점 희미해지고 있다."
   웹 시절 화면 위에 앱 화면을 얹어 온 것을 치운다. 기능마다 자리는 한 곳(+ 바로가기 한 곳). 목록은 프로젝트 문서 개편_검토 7절 */

// 설정 › 정보의 앱 버전: 대표에게 알리는 시험판 번호(빌드할 때 함께 올린다)
const BX_TRIAL = 37;

/* 설정(앱): 첫 화면은 묶음 목록(화면 · 휴대폰 캘린더 · 알림 · 분류·데이터), 누르면 그 묶음만 보이는 화면.
   뒤로 가기(‹ 또는 휴대폰 뒤로)로 목록에 돌아온다. 휴대폰 설정과 같은 방식(대표 결정 11/3: 한 페이지가 너무 길어 메뉴를 다시 찾기 불편).
   묶음 줄 오른쪽에는 지금 고른 값(규칙 11). 정보(저장 위치·앱 버전)는 목록 맨 아래 한 줄.
   뺀 것: 메인 색(색은 파랑 하나, 10/31 결정), 분류 색 표시(늘 켬), 공휴일 데이터, 사용 설명서(웹 시절 내용), 웹의 연동·아침 일정 보고 칸 */
let BX_SET = null;
const BX_SET_PHONE = '<svg class="i" viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>';
function bxSetGroups(){
  const st = M.settings, th = lsGet('bx:theme') || '', rep = bxRepCfg();
  const pre = st.defaultRemind == null || st.defaultRemind === '' || remAbs(String(st.defaultRemind)) ? null : +st.defaultRemind;
  const preT = pre == null ? '미리 알림 끔' : pre === 0 ? '정시에' : pre % 1440 === 0 ? pre / 1440 + '일 전' : pre % 60 === 0 ? pre / 60 + '시간 전' : pre + '분 전';
  const g = [['view', BX_SET_PHONE, '화면', '다크 모드 ' + (th === 'dark' ? '켬' : th === 'light' ? '끔' : '자동') + ' · ' + (+st.weekStart === 0 ? '일요일' : '월요일') + ' 시작']];
  if (pcPlug()) g.push(['pcal', ICON.cal, '휴대폰 캘린더', pcCfg().on ? '함께 보기' : '꺼짐']);
  g.push(['alarm', ICON.bell, '알림', (rep.on ? '아침 ' + rep.at : '아침 일정 꺼짐') + ' · ' + preT]);
  g.push(['data', ICON.save, '분류·데이터', '분류 ' + M.cats.length + '개 · 휴지통 ' + M.trash.length + '개']);
  return g;
}
function bxSettingsHtml(){
  const g = bxSetGroups(), cur = BX_SET && g.find(x => x[0] === BX_SET);
  if (!cur) {
    BX_SET = null;
    return '<div class="page-head"><div class="ph-t"><h1>설정</h1></div></div>' +
      '<section class="set-sec bx-set-home" aria-label="설정 묶음"><div class="set-menu">' +
      g.map(x => '<button type="button" class="menu-row" data-bxset="' + x[0] + '"><span class="mi">' + x[1] + '</span><span class="ml">' + x[2] + '</span><span class="mv">' + esc(x[3]) + ICON.chevR + '</span></button>').join('') +
      '</div></section>' +
      '<p class="p small bx-set-foot">이 휴대폰에만 저장 · 시험판 ' + BX_TRIAL + '</p>';
  }
  return '<div class="page-head bx-set-subh"><button type="button" class="bx-set-back" data-bxset="" aria-label="설정 목록으로">' + ICON.chevL + '</button><div class="ph-t"><h1>' + cur[2] + '</h1></div></div>' + bxSetGroupHtml(BX_SET);
}
function bxSetGroupHtml(k){
  const st = M.settings;
  if (k === 'view') return '<section class="set-sec" aria-label="화면">' +
      setRow('다크 모드', segHtml('data-theme-set', [['', '자동'], ['light', '끔'], ['dark', '켬']], lsGet('bx:theme') || '', '다크 모드', 240)) +
      setRow('주 시작 요일', segHtml('data-wk', [['1', '월요일'], ['0', '일요일']], +st.weekStart === 0 ? '0' : '1', '주 시작 요일')) + '</section>' +
      // 시험판 37(대표 지적 11/3 '성격이 다른 것끼리 너무 붙어 있다'): 고르는 값과 다른 화면으로 가는 줄은 상자를 나눈다
      '<section class="set-sec" aria-label="위젯">' + bxWidgetRowHtml() + '</section>';
  // 휴대폰 캘린더 묶음은 제 칸 제목을 빼고(위 제목과 겹침) 그대로
  if (k === 'pcal') return pcSetHtml().replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '');
  if (k === 'alarm') {
    const pre = st.defaultRemind == null || st.defaultRemind === '' || remAbs(String(st.defaultRemind)) ? null : +st.defaultRemind, nu = minToNU(pre == null ? 10 : pre);
    const dayA = remAbs(remNorm(st.defaultRemindDay, false));
    // 시험판 37(대표 지적 11/3): 한 상자에 다 넣지 않고 성격마다 상자 하나 — 알람 테스트 · 아침 요약 · 울리는 방식 · 잠금 화면 표시 · 일정 알림
    const sec = (label, html) => '<section class="set-sec" aria-label="' + label + '">' + html + '</section>';
    return sec('알람 테스트', '<div class="set-menu"><button type="button" class="menu-row" data-act="bx-alarm-test"><span class="mi">' + ICON.bell + '</span><span class="ml">알람 테스트</span><span class="mv">10초 뒤 울려요' + ICON.chevR + '</span></button></div>') +
      sec('아침 요약', bxReportSetHtml()) + sec('울리는 방식', bxLevelSetHtml()) + sec('잠금 화면 표시', bxLockSetHtml()) +
      '<section class="set-sec" aria-label="일정 알림">' +
      // 켜고 끄기는 스위치(대표 의견 11/2 밤). 켜면 그 바로 아래 오른쪽에 값이 나온다(대표 지적 11/2, 규칙 12)
      setRow('일정 알림(기본)', bxSwitch('data-pre-on', pre != null, '일정 알림')) +
      (pre != null ? '<div class="bx-setsub"><span class="p small">새 일정의 기본값이에요. 0분은 정시</span><span class="bx-setsub-c">' + stepperHtml('set-pre-n', nu[0], 0, 999, 'set-pre-u') + unitSel('set-pre-u', nu[1]) + '</span></div>' : '') +
      setRow('종일 일정 알림 시각', bxSwitch('data-day-on', !!dayA, '종일 일정 알림 시각')) +
      (dayA ? '<div class="bx-setsub"><span class="p small">종일 일정은 그날 이 시각에 알려요</span>' + bxTimeChip('set-day-t', dayA.t, '종일 일정 알림 시각') + '</div>' : '') +
      '</section>';
  }
  const nItems = M.items.filter(i => !i.pc).length + M.trash.length;
  return '<section class="set-sec" aria-label="분류·데이터"><div class="set-menu">' +
      menuRow('cats', ICON.tag, '분류 관리', M.cats.length + '개') +
      menuRow('data', ICON.save, '백업·복원', '이 휴대폰에만 저장') +
      menuRow('trash', ICON.trash, '휴지통', M.trash.length + '개') + '</div></section>' +
    '<details class="set-sec danger-zone bx-reset"><summary id="s-reset">데이터 초기화<small>모든 일정 삭제 · 초기화</small></summary>' +
      '<div class="reset-row"><div><b>모든 일정 삭제</b><span>일정 ' + nItems + '개(휴지통 포함)를 모두 삭제해요. 분류와 설정은 그대로예요.</span></div><button type="button" class="btn sm danger-line" data-act="reset" data-kind="items">삭제</button></div>' +
      '<div class="reset-row"><div><b>초기화</b><span>일정 · 분류 · 설정을 모두 삭제하고 처음 상태로 돌아가요.</span></div><button type="button" class="btn sm danger-line" data-act="reset" data-kind="all">초기화</button></div>' +
      '<p class="p small">삭제하면 되돌릴 수 없어요.</p></details>';
}
// 묶음 들어가기·나오기. 들어가면 맨 위부터 보인다
function bxSetOpen(k){ BX_SET = k || null; if (S.view !== 'settings') go('settings'); else render(); try { window.scrollTo(0, 0); } catch (e) { /* 그대로 */ } }
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('[data-bxset]');
  if (b) { ev.preventDefault(); ev.stopPropagation(); if (SH) closeSheet(); bxSetOpen(b.dataset.bxset); return; }
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

/* 자동 시험(tests/)이 쓰는 고리. 화면에서는 쓰지 않는다 */
window.BX_T = {
  backup: () => bxBackupText(),
  restore: text => importJson({text: async () => text}),
  docs: () => Array.from(allDocs().entries()),
  write: (id, doc) => writeDoc(id, doc),
  reset: kind => doReset(kind || 'all'),
  day: ds => openDay(ds),
  banner: () => { const b = document.getElementById('banner'); return b && !b.hidden ? b.textContent : ''; }
};
