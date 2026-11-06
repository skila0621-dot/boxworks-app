// 시험판 31: 알람 공휴일 제외(루틴마다 '공휴일에는 쉬기', 대표 요청·결정 11/2). 화면 쪽 코드는 web-src/v31.js
export default [
  {
    name: "루틴에 '공휴일에는 쉬기'(skipHol)를 저장",
    find: "bowl: typeof o.bowl === 'string' && o.bowl ? o.bowl.slice(0, 12) : null};",
    // 시험판 67(결정 사안 s05 '나 루틴마다 스위치, 처음 꺼짐'): 단계 이름 읽어 주기(say)도 같은 자리에 저장
    replace: "bowl: typeof o.bowl === 'string' && o.bowl ? o.bowl.slice(0, 12) : null, skipHol: o.skipHol === true || undefined, say: o.say === true || undefined};"
  },
  {
    name: '└ 루틴이 그날 하는지 보는 곳 하나(알람·홈·위젯·아침 일정 알림이 다 여기를 본다)에서 공휴일을 거른다',
    find: "const rtActiveOn = (rt, date) => rt.on && (rt.once ? rt.once === date : rt.days.includes(parseYmd(date).getDay()));",
    replace: "const rtActiveOn = (rt, date) => rt.on && (rt.once ? rt.once === date : rt.days.includes(parseYmd(date).getDay()) && !(window.BX_APP && bxHolOff(rt, date)));"
  },
  {
    name: "└ 루틴 목록의 요일 글자: '평일(공휴일 빼고)'",
    find: "const rtWhenText = rt => rt.once ? (rt.once === M.today ? '오늘만' : fmtMD(rt.once) + '만') : daysText(rt.days);",
    replace: "const rtWhenText = rt => rt.once ? (rt.once === M.today ? '오늘만' : fmtMD(rt.once) + '만') : daysText(rt.days) + (window.BX_APP && rt.skipHol ? '(공휴일 빼고)' : '');"
  },
  {
    name: "└ 홈: 공휴일이라 쉬는 루틴도 그 시각 자리에 흐리게, 단추는 '오늘은 하기'",
    find: "  const skipBtn = s.skip ? '<button type=\"button\" class=\"sec-link\" data-act=\"rt-skip\" data-rid=\"' + rid + '\" data-on=\"0\">다시 켜기</button>' :",
    replace: "  const hol = window.BX_APP && bxHolOff(rt, M.today);\n  const skipBtn = hol ? '<button type=\"button\" class=\"sec-link\" data-act=\"bx-holrun\" data-rid=\"' + rid + '\">오늘은 하기</button>' : s.skip ? '<button type=\"button\" class=\"sec-link\" data-act=\"rt-skip\" data-rid=\"' + rid + '\" data-on=\"0\">다시 켜기</button>' :"
  },
  {
    name: "└ 쉬는 루틴 줄에 루틴 이름표(data-rid)를 달아 홈 목록의 시각 자리에 둔다(전에는 목록 맨 아래로 빠졌음)",
    find: "  if (s.skip) return '<div class=\"rt-card off\">' + head + '<p class=\"rt-note\">오늘은 쉬어요.</p></div>';",
    replace: "  if (hol) return '<div class=\"rt-card off bx-holoff\" data-rid=\"' + rid + '\">' + head + '<p class=\"rt-note\">' + esc(bxHolNote(M.today)) + '</p></div>';\n  if (s.skip) return '<div class=\"rt-card off\"' + (window.BX_APP ? ' data-rid=\"' + rid + '\"' : '') + '>' + head + '<p class=\"rt-note\">오늘은 쉬어요.</p></div>';"
  },
  {
    name: '└ 홈 루틴 칸에 공휴일이라 쉬는 루틴도 넣는다',
    find: "  const list = M.routines.filter(rt => rtActiveOn(rt, M.today));\n  if (!list.length) return '';",
    replace: "  const list = M.routines.filter(rt => rtActiveOn(rt, M.today) || (window.BX_APP && bxHolOff(rt, M.today)));\n  if (!list.length) return '';"
  },
  {
    name: "루틴 저장 알림의 조사('아침 준비를 저장했어요', 전에는 '아침 준비을')와 '공휴일 빼고'",
    find: "doc.name + '을 저장했어요. ' + daysText(doc.days) + ' ' + mm(p.start) + '에 시작해요.');",
    replace: "doc.name + (window.BX_APP ? bxJosaUl(doc.name) : '을') + ' 저장했어요. ' + (window.BX_APP ? rtWhenText(doc) : daysText(doc.days)) + ' ' + mm(p.start) + '에 시작해요.');"
  }
];
