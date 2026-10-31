// 아래 메뉴 바꾸기: 더보기 → 루틴, 더보기는 위쪽 막대로 (대표 요청 2026-10-31)
export default [
  {
    "name": "아래 메뉴: '더보기' 자리에 '루틴'(대표 요청, 4안 메뉴와 같음)",
    "find": "    <button type=\"button\" class=\"dock-btn\" data-act=\"more\"><svg class=\"i\" viewBox=\"0 0 24 24\"><circle cx=\"5.5\" cy=\"12\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"18.5\" cy=\"12\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/></svg>더보기</button>",
    "replace": "    <button type=\"button\" class=\"dock-btn\" data-act=\"go\" data-view=\"routines\"><svg class=\"i\" viewBox=\"0 0 24 24\"><path d=\"M4.5 11a7.5 7.5 0 0 1 13-4.6L19.5 8.5\"/><path d=\"M19.5 4v4.5H15\"/><path d=\"M19.5 13a7.5 7.5 0 0 1-13 4.6L4.5 15.5\"/><path d=\"M4.5 20v-4.5H9\"/></svg>루틴</button>"
  },
  {
    "name": "└ '더보기'는 위쪽 막대 오른쪽 끝으로(다크 모드 단추 자리, 다크 모드는 더보기 안에 있음)",
    "find": "        <button type=\"button\" class=\"icon-btn dm-btn\" data-act=\"theme-toggle\" aria-label=\"다크 모드 켜기\"><svg class=\"i ico-moon\" viewBox=\"0 0 24 24\"><path d=\"M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z\"/></svg><svg class=\"i ico-sun\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4\"/></svg></button>\n        <button type=\"button\" class=\"icon-btn\" data-menu=\"search\" aria-label=\"검색\"><svg class=\"i\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m20 20-4.2-4.2\"/></svg></button>",
    "replace": "        <button type=\"button\" class=\"icon-btn\" data-menu=\"search\" aria-label=\"검색\"><svg class=\"i\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m20 20-4.2-4.2\"/></svg></button>\n        <button type=\"button\" class=\"icon-btn ab-more\" data-act=\"more\" aria-label=\"더보기\"><svg class=\"i\" viewBox=\"0 0 24 24\"><circle cx=\"5.5\" cy=\"12\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"18.5\" cy=\"12\" r=\"1.5\" fill=\"currentColor\" stroke=\"none\"/></svg></button>"
  },
  {
    "name": "└ 주간·월간 등 모든 화면의 위쪽 막대를 오늘 화면처럼(로고 + 설명서·검색·더보기). 주·달 이동은 화면 제목 옆으로(대표 요청)",
    "find": "  ab.classList.toggle('vmode', !!VBAR);",
    "replace": "  ab.classList.toggle('vmode', !!VBAR && !window.BX_APP);"
  }
];
