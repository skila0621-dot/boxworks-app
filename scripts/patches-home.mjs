// 홈 개편(대표 요청 2026-10-31)
// 1) 첫 상자: 날짜 + 일정 요약(예약·완료·확인 필요, 다음 일정)
// 2) 둘째 상자: '오늘 할 일' — 루틴, 일정, 오늘 수업
// 3) 아래 메뉴 가운데는 홈. 새 일정은 오른쪽 아래 동그란 + 단추(홈·캘린더에서만)
const OLD_TODAY_SEC = "  const todaySec = '<section class=\"tcard\" id=\"tcard\" aria-labelledby=\"h-today\" aria-roledescription=\"날짜별로 넘겨 보는 일정\">' + head + '<div class=\"tc-body\">' + (isT ? rtHomeHtml() : '') + secHead('h-today', title, dayIts.length + '개', addBtn(vd)) + body + '</div></section>';";
const I_CAL = '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.4h.01M12 17.4h.01" stroke-width="2.6"/></svg>';
const I_TT = '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16.5" rx="3"/><path d="M3.5 9.5h17M9.5 9.5v11M15 9.5v11"/></svg>';
const I_HOME = '<svg class="i" viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9v10.5h12V9"/><path d="M10 19.5v-5h4v5"/></svg>';
const I_RT = '<svg class="i" viewBox="0 0 24 24"><path d="M4.5 11a7.5 7.5 0 0 1 13-4.6L19.5 8.5"/><path d="M19.5 4v4.5H15"/><path d="M19.5 13a7.5 7.5 0 0 1-13 4.6L4.5 15.5"/><path d="M4.5 20v-4.5H9"/></svg>';
const I_MED = '<svg class="i" viewBox="0 0 24 24"><path d="M12 5c1.8 2 2.8 4 2.8 6.3s-1.2 4.2-2.8 5.2c-1.6-1-2.8-2.9-2.8-5.2S10.2 7 12 5z"/><path d="M12 16.5c-3.5 0-6.5-2-7.5-5.5 2.7-.3 5.2.6 7 2.5"/><path d="M12 16.5c3.5 0 6.5-2 7.5-5.5-2.7-.3-5.2.6-7 2.5"/><path d="M5 19.5h14"/></svg>';
const OLD_DOCK = [
  '    <button type="button" class="dock-btn" data-act="go" data-view="today"><svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><circle cx="12" cy="15.2" r="1.9" fill="currentColor" stroke="none"/></svg>오늘<span class="dock-badge" id="dock-badge" hidden></span></button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="month">' + I_CAL + '캘린더</button>',
  '    <button type="button" class="dock-btn dock-add" data-act="new" aria-label="새 일정 입력"><span class="plus"><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>새 일정</button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="tt">' + I_TT + '시간표</button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="routines">' + I_RT + '루틴</button>',
  '  </div>\n</nav>'
].join('\n');
const NEW_DOCK = [
  '    <button type="button" class="dock-btn" data-act="go" data-view="med">' + I_MED + '명상</button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="routines">' + I_RT + '루틴</button>',
  '    <button type="button" class="dock-btn dock-home" data-act="go" data-view="today">' + I_HOME + '홈<span class="dock-badge" id="dock-badge" hidden></span></button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="month">' + I_CAL + '캘린더</button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="tt">' + I_TT + '시간표</button>',
  '  </div>\n</nav>',
  '<button type="button" class="bx-fab" data-act="new" aria-label="새 일정 (길게 누르면 말하기)"><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>'
].join('\n');
export default [
  {
    name: '홈 개편: 요약 상자와 \'오늘 할 일\' 상자로 나눔',
    find: OLD_TODAY_SEC,
    replace: "  const todaySec = window.BX_APP ? bxHomeSplit(head, body, {isT, vd, title, n: dayIts.length, remainN, doneN, lateN, next, hol}) : '<section class=\"tcard\" id=\"tcard\" aria-labelledby=\"h-today\" aria-roledescription=\"날짜별로 넘겨 보는 일정\">' + head + '<div class=\"tc-body\">' + (isT ? rtHomeHtml() : '') + secHead('h-today', title, dayIts.length + '개', addBtn(vd)) + body + '</div></section>';"
  },
  {
    name: '└ 아래 메뉴: 명상 · 루틴 · 홈(가운데) · 캘린더 · 시간표(오른손 기준), 새 일정은 오른쪽 아래 + 단추',
    find: OLD_DOCK,
    replace: NEW_DOCK
  },
  {
    name: '└ 옆으로 밀어 날짜 넘기기는 두 상자 어디서나',
    find: "const c = ev.target.closest && ev.target.closest('#tcard');",
    replace: "const c = ev.target.closest && ev.target.closest('#tcard,#tcard2');"
  },
  {
    name: '└ 날짜를 넘길 때 두 상자 모두 미끄러지게',
    find: "  const c = $('#tcard'); if (!c || d === 0) return;\n  c.classList.remove('slide-l', 'slide-r'); void c.offsetWidth; c.classList.add(d > 0 ? 'slide-l' : 'slide-r');",
    replace: "  if (d === 0) return;\n  ['#tcard', '#tcard2'].forEach(q => { const c = $(q); if (!c) return; c.classList.remove('slide-l', 'slide-r'); void c.offsetWidth; c.classList.add(d > 0 ? 'slide-l' : 'slide-r'); });"
  },
  {
    name: '└ ⋯ 메뉴: 아래 메뉴에 없는 기능 + 아래 메뉴 고르기',
    find: "      menuRow('routines', ICON.loop, '루틴', M.routines.length ? M.routines.length + '개' : '기상·출근·잠자리') +",
    replace: "      (window.BX_APP ? bxMoreRows() : '') + menuRow('routines', ICON.loop, '루틴', M.routines.length ? M.routines.length + '개' : '기상·출근·잠자리') +"
  },
  {
    // 정리판(11/1): 앱에서는 '확인 필요'와 같은 카드(다 했어요·옮기기·날짜 고르기·그대로 두기)가 열리므로 이름도 '확인'
    name: '└ 늦은 일정 단추: 앱에서는 확인 카드를 연다(이름 \'확인\')',
    find: `aria-label="시간이 지났어요. 지연·연기·완료 고르기"><i></i>확인</button>'`,
    replace: `aria-label="' + (window.BX_APP ? '지난 일정 · 완료 · 미루기 · 그대로' : '시간이 지났어요. 지연·연기·완료 고르기') + '"><i></i>확인</button>'`
  },
  {
    name: '└ 고치기 창의 지난 일정 단추 \'지연·연기\' → 앱에서는 \'확인\'(같은 카드)',
    find: `data-act="late" data-id="' + esc(F.id) + '">지연·연기</button>`,
    replace: `data-act="late" data-id="' + esc(F.id) + '">' + (window.BX_APP ? '확인' : '지연·연기') + '</button>`
  },
  {
    name: '위쪽 막대: 사용 설명서(◫처럼 보이던 아이콘) 대신 ⓘ \'이 화면 사용법\', 순서는 찾기 · ⓘ · ⋯',
    find: '<button type="button" class="icon-btn ab-guide" data-act="go" data-view="guide" aria-label="사용 설명서"><svg class="i" viewBox="0 0 24 24"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z"/></svg></button>\n        <button type="button" class="icon-btn" data-menu="search" aria-label="검색"><svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg></button>',
    replace: '<button type="button" class="icon-btn" data-menu="search" aria-label="검색"><svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg></button>\n        <button type="button" class="icon-btn ab-guide" data-act="bx-help" aria-label="도움말"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg></button>'
  },
  {
    name: '└ ⋯ 메뉴(앱): 다른 곳에 있는 줄(루틴·명상·검색·다크 모드·위젯 모드)은 빼고 짧게',
    find: "    setSheet('<div class=\"menu\">' +\n      (window.BX_APP ? bxMoreRows() : '')",
    replace: "    if (window.BX_APP) { setSheet(bxMoreMenuHtml(), ''); return; }\n    setSheet('<div class=\"menu\">' +\n      (window.BX_APP ? bxMoreRows() : '')"
  },
  {
    name: '설정 이름을 쉬운 말로: 일정 시작 전 알림(기본)',
    find: "setRow('당일 예약된 일정 사전 알림 시간',",
    replace: "setRow(window.BX_APP ? '일정 시작 전 알림(기본)' : '당일 예약된 일정 사전 알림 시간',"
  },
  {
    name: '└ 시간 없는 일정 알림 시각',
    find: "setRow('당일 일정 정기알람 시간',",
    replace: "setRow(window.BX_APP ? '시간 없는 일정 알림 시각' : '당일 일정 정기알람 시간',"
  },
  {
    name: '└ 데이터 초기화는 접어 두기(눌러야 펼쳐짐)',
    find: "    '<section class=\"set-sec danger-zone\" aria-labelledby=\"s-reset\"><h2 id=\"s-reset\">데이터 초기화</h2>' +",
    replace: "    (window.BX_APP ? '<details class=\"set-sec danger-zone bx-reset\"><summary id=\"s-reset\">데이터 초기화<small>모든 일정 지우기 · 처음 상태로</small></summary>' : '<section class=\"set-sec danger-zone\" aria-labelledby=\"s-reset\"><h2 id=\"s-reset\">데이터 초기화</h2>') +"
  },
  {
    name: '└ (접기 끝)',
    find: "      '<p class=\"p small\">지운 내용은 되돌릴 수 없어요.</p></section>' +",
    replace: "      '<p class=\"p small\">지운 내용은 되돌릴 수 없어요.</p>' + (window.BX_APP ? '</details>' : '</section>') +"
  },
  {
    name: '루틴 페이지(앱): 내 루틴 먼저 + 새 루틴 단추, 오늘 할 일 순서는 따로 카드, 명상은 아래',
    find: `  return '<div class="page-head"><div class="ph-t"><h1>루틴</h1></div></div>' + (window.BX_APP ? medCardHtml() : '') + make + cards;`,
    replace: `  if (window.BX_APP) return bxRoutinesPage(cards);\n  return '<div class="page-head"><div class="ph-t"><h1>루틴</h1></div></div>' + make + cards;`
  },
  {
    name: '루틴 고치기 순서: 이름 → 언제 → 단계 → 다시 알림 → 소리 → 아이콘(접기), 삭제는 맨 아래',
    find: `'<div class="fgrid"><label class="fg-l" for="r-name">이름</label><input id="r-name" class="inp full" value="' + esc(R.name) + '" maxlength="30"></div>' + (window.BX_APP ? bxIconPickHtml() : '') +`,
    replace: `'<div class="fgrid"><label class="fg-l" for="r-name">이름</label><input id="r-name" class="inp full" value="' + esc(R.name) + '" maxlength="30"></div>' +`
  },
  {
    name: '└ 소리·아이콘을 아래로, 삭제는 저장과 멀리',
    find: `'<p class="p small bx-rnote">0번이면 한 번만 울려요.</p></div>'`,
    replace: `'<p class="p small bx-rnote">0번이면 한 번만 울려요.</p></div>' + bxIconPickHtml() + (R.id ? '<div class="bx-rdel"><button type="button" class="bx-del-link" data-act="rt-del">이 루틴 지우기</button></div>' : '')`
  },
  {
    name: '└ 아래 단추 줄은 저장만',
    find: `    (R.id ? '<button type="button" class="btn" data-act="rt-del">삭제</button>' : '') + '<button type="button" class="btn grow primary" data-act="rt-save">저장</button>');`,
    replace: `    (R.id && !window.BX_APP ? '<button type="button" class="btn" data-act="rt-del">삭제</button>' : '') + '<button type="button" class="btn grow primary" data-act="rt-save">저장</button>');`
  },
  {
    name: '확인 필요 · 그대로 두기(lateKeep = 그때의 마감 시각)한 일은 지난 일로 세지 않음. 날짜·시각을 바꾸면 다시 셈',
    find: "const isLate = it => !it.done && !it.pc && dueAt(it) <= M.now;",
    replace: "const isLate = it => !it.done && !it.pc && dueAt(it) <= M.now && !(it.lateKeep && it.lateKeep === +dueAt(it));"
  },
  {
    name: '홈 · 옛 환영 카드는 앱에서 뺌 (첫 실행 화면이 대신함, 새 일정은 + 단추)',
    find: "  const welcome = !M.settings.welcomed && !M.items.length && !M.trash.length ?",
    replace: "  const welcome = !window.BX_APP && !M.settings.welcomed && !M.items.length && !M.trash.length ?"
  }
];
