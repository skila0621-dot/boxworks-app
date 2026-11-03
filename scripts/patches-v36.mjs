// 시험판 36(11/3 오후): 말로 넣기에서 달 없이 'N일'(대표 지적: "17일 오후 3시 늘푸른 병원 예약"이 오늘로 들어감),
// 새 일정 창의 '다음 달로 넣었어요 · 지난 날짜예요' 한 줄. 화면 쪽 코드는 web-src/v36.js
export default [
  {
    name: "말로 넣기: 달 없이 'N일' · 'N일 뒤'를 날짜로(지난 날이면 다음 달)",
    find: String.raw`  s = s.replace(/이번\s*달\s*(\d{1,2})\s*일/g, (m, d) => (now.getMonth() + 1) + '월 ' + d + '일');
  return s;
}`,
    replace: String.raw`  s = s.replace(/이번\s*달\s*(\d{1,2})\s*일/g, (m, d) => (now.getMonth() + 1) + '월 ' + d + '일');
  s = bxDayOnlyPre(s, now);
  return s;
}`
  },
  {
    name: '└ 다음 달로 넘겼으면 이번 달 그날을 결과에 남김(새 일정 창에서 한 번에 바꾸기)',
    find: '  if (tv) r.travel = tv.min;',
    replace: '  bxDayOnlyTag(r);\n  if (tv) r.travel = tv.min;'
  },
  {
    name: '새 일정 창: 날짜를 바꿨으면 제목 아래 해석 결과도 그 날짜로',
    find: 'esc(p.date ? fmtMD(p.date) : relDay(F.date, ymd(new Date())))',
    replace: 'esc(p.date ? fmtMD(F.touchedDate && isDate(F.date) ? F.date : p.date) : relDay(F.date, ymd(new Date())))'
  },
  {
    name: "└ 해석 결과 밑에 '○월로 넣었어요 · 지난 날짜예요' 한 줄",
    find: "(window.BX_APP ? tvHint() : '') + '</span></div>';\n  } else el.innerHTML = '';\n}",
    replace: "(window.BX_APP ? tvHint() : '') + '</span></div>' + bxDateNote(p);\n  } else el.innerHTML = bxDateNote(null);\n}"
  }
];
