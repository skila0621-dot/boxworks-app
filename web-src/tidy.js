/* ---------- 정리판(대표 결정 2026-11-01) ----------
   대표 지적: "새로운 것을 추가하고 수정하게 되면서 사용자의 시점에서 생각한 관점들이 사라졌다.
   단순하게 접근이 가능해야 한다는 점이 점점 희미해지고 있다."
   웹 시절 화면 위에 앱 화면을 얹어 온 것을 치운다. 기능마다 자리는 한 곳(+ 바로가기 한 곳). 목록은 프로젝트 문서 개편_검토 7절 */

// 설정 › 정보의 앱 버전: 대표에게 알리는 시험판 번호(빌드할 때 함께 올린다)
const BX_TRIAL = 31;

/* 설정(앱): 화면 · 휴대폰 캘린더 · 알림 · 분류·데이터 · 데이터 초기화 · 정보.
   뺀 것: 메인 색(색은 파랑 하나, 10/31 결정), 분류 색 표시(늘 켬), 공휴일 데이터, 사용 설명서(웹 시절 내용), 웹의 연동·아침 일정 보고 칸 */
function bxSettingsHtml(){
  const st = M.settings;
  const pre = st.defaultRemind == null || st.defaultRemind === '' || remAbs(String(st.defaultRemind)) ? null : +st.defaultRemind, nu = minToNU(pre == null ? 10 : pre);
  const dayA = remAbs(remNorm(st.defaultRemindDay, false));
  const nItems = M.items.filter(i => !i.pc).length + M.trash.length;
  return '<div class="page-head"><div class="ph-t"><h1>설정</h1></div></div>' +
    '<section class="set-sec" aria-labelledby="s-view"><h2 id="s-view">화면</h2>' +
      setRow('다크 모드', segHtml('data-theme-set', [['', '자동'], ['light', '끄기'], ['dark', '켜기']], lsGet('bx:theme') || '', '다크 모드', 240)) +
      setRow('주 시작 요일', segHtml('data-wk', [['1', '월요일'], ['0', '일요일']], +st.weekStart === 0 ? '0' : '1', '주 시작 요일')) +
      bxWidgetRowHtml() +
    '</section>' +
    pcSetHtml() +
    '<section class="set-sec" aria-labelledby="s-alarm"><h2 id="s-alarm">알림</h2>' +
      '<div class="set-menu"><button type="button" class="menu-row" data-act="bx-alarm-test"><span class="mi">' + ICON.bell + '</span><span class="ml">휴대폰 알람 시험</span><span class="mv">10초 뒤 울려요' + ICON.chevR + '</span></button></div>' +
      bxReportSetHtml() +
      // 켜고 끄기는 스위치(대표 의견 11/2 밤). 켜면 그 바로 아래 오른쪽에 값이 나온다(대표 지적 11/2, 규칙 12)
      setRow('일정 시작 전 알림(기본)', bxSwitch('data-pre-on', pre != null, '일정 시작 전 알림')) +
      (pre != null ? '<div class="bx-setsub"><span class="p small">새 일정에 처음 들어가는 값이에요. 0분은 정시</span><span class="bx-setsub-c">' + stepperHtml('set-pre-n', nu[0], 0, 999, 'set-pre-u') + unitSel('set-pre-u', nu[1]) + '</span></div>' : '') +
      setRow('시간 없는 일정 알림 시각', bxSwitch('data-day-on', !!dayA, '시간 없는 일정 알림 시각')) +
      (dayA ? '<div class="bx-setsub"><span class="p small">시간 없는 일정은 그날 이 시각에 알려요</span>' + bxTimeChip('set-day-t', dayA.t, '시간 없는 일정 알림 시각') + '</div>' : '') +
    '</section>' +
    '<section class="set-sec" aria-labelledby="s-data"><h2 id="s-data">분류·데이터</h2><div class="set-menu">' +
      menuRow('cats', ICON.tag, '분류 관리', M.cats.length + '개') +
      menuRow('data', ICON.save, '백업·복원', '이 휴대폰에만 저장') +
      menuRow('trash', ICON.trash, '휴지통', M.trash.length + '개') + '</div></section>' +
    '<details class="set-sec danger-zone bx-reset"><summary id="s-reset">데이터 초기화<small>모든 일정 지우기 · 처음 상태로</small></summary>' +
      '<div class="reset-row"><div><b>모든 일정 지우기</b><span>일정 ' + nItems + '개(휴지통 포함)를 모두 지워요. 분류와 설정은 그대로예요.</span></div><button type="button" class="btn sm danger-line" data-act="reset" data-kind="items">일정 지우기</button></div>' +
      '<div class="reset-row"><div><b>처음 상태로 되돌리기</b><span>일정·분류·설정을 모두 지우고 처음 쓰는 상태로 돌아가요.</span></div><button type="button" class="btn sm danger-line" data-act="reset" data-kind="all">전체 초기화</button></div>' +
      '<p class="p small">지운 내용은 되돌릴 수 없어요.</p></details>' +
    '<section class="set-sec" aria-labelledby="s-info"><h2 id="s-info">정보</h2>' +
      setRow('저장 위치', '<span class="set-v">이 휴대폰</span>') +
      setRow('앱 버전', '<span class="set-v">시험판 ' + BX_TRIAL + '</span>') +
    '</section>';
}

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
