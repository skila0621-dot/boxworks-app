// 시험판 41(대표 아이디어 11/3 15:17 · 그림 11/3 23:35): 오늘의 메모. 화면 쪽 코드는 web-src/v41.js
export default [
  {
    name: '날짜 창: 일정 아래 그날 메모(넣는 칸 포함)',
    find: "(its.length ? '<div class=\"list\">' + its.map(i => rowHtml(i, {day: ds})).join('') + '</div>' : '<p class=\"empty\">일정 없음</p>');",
    replace: "(its.length ? '<div class=\"list\">' + its.map(i => rowHtml(i, {day: ds})).join('') + '</div>' : '<p class=\"empty\">일정 없음</p>') + (window.BX_APP && bxMemoOn() ? bxMemoSecHtml(ds) : '');"
  },
  {
    name: '메모 화면(대표 요청 11/3 23:38: 아래 메뉴 · 위젯 ✎ 단추로 바로 적기)',
    find: "(window.BX_APP && S.view === 'med') ? medHtml() :",
    replace: "(window.BX_APP && S.view === 'memo') ? bxMemoPageHtml() : (window.BX_APP && S.view === 'med') ? medHtml() :"
  },
  {
    name: '30초마다 다시 그리기는 메모를 적는 동안 미룸(적던 글 · 키보드를 지킴, 칸을 떠나면 그림)',
    find: "setInterval(() => { if (!document.hidden) scheduleRender(); }, 30000);",
    replace: "setInterval(() => { if (!document.hidden && !(window.BX_APP && bxMmHold())) scheduleRender(); }, 30000);"
  },
  {
    name: '백업 불러오기에 메모(memo) 포함',
    find: "'tt', 'ttset', 'travelmem', 'pcx', 'medlog'].includes(x.type)",
    replace: "'tt', 'ttset', 'travelmem', 'pcx', 'medlog', 'memo'].includes(x.type)"
  },
  {
    name: '└ 모든 일정 삭제 · 처음 상태로 되돌리기에도 메모',
    find: "allDocs().forEach((d, id) => { if (!d) return; if (d.type === 'item' || d.type === 'task' || d.type === 'event') ids.push(id);",
    replace: "allDocs().forEach((d, id) => { if (!d) return; if (d.type === 'item' || d.type === 'task' || d.type === 'event' || (window.BX_APP && d.type === 'memo')) ids.push(id);"
  }
];
