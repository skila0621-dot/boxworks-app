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
  '    <button type="button" class="dock-btn" data-act="go" data-view="month">' + I_CAL + '캘린더</button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="tt">' + I_TT + '시간표</button>',
  '    <button type="button" class="dock-btn dock-home" data-act="go" data-view="today">' + I_HOME + '홈<span class="dock-badge" id="dock-badge" hidden></span></button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="routines">' + I_RT + '루틴</button>',
  '    <button type="button" class="dock-btn" data-act="go" data-view="med">' + I_MED + '명상</button>',
  '  </div>\n</nav>',
  '<button type="button" class="bx-fab" data-act="new" aria-label="새 일정 넣기 (꾹 누르면 말로 넣기)"><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>'
].join('\n');
export default [
  {
    name: '홈 개편: 요약 상자와 \'오늘 할 일\' 상자로 나눔',
    find: OLD_TODAY_SEC,
    replace: "  const todaySec = window.BX_APP ? bxHomeSplit(head, body, {isT, vd, title, n: dayIts.length}) : '<section class=\"tcard\" id=\"tcard\" aria-labelledby=\"h-today\" aria-roledescription=\"날짜별로 넘겨 보는 일정\">' + head + '<div class=\"tc-body\">' + (isT ? rtHomeHtml() : '') + secHead('h-today', title, dayIts.length + '개', addBtn(vd)) + body + '</div></section>';"
  },
  {
    name: '└ 아래 메뉴: 캘린더 · 시간표 · 홈(가운데) · 루틴 · 명상, 새 일정은 오른쪽 아래 + 단추',
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
    find: "      menuRow('routines', ICON.loop, '루틴', M.routines.length ? M.routines.length + '개' : '기상·출근·약') +",
    replace: "      (window.BX_APP ? bxMoreRows() : '') + menuRow('routines', ICON.loop, '루틴', M.routines.length ? M.routines.length + '개' : '기상·출근·약') +"
  }
];
