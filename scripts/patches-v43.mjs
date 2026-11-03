// 시험판 43(대표 아이디어 11/4 0:46 · 결정 0:55 '가'): 캘린더 보기 바꾸기를 왼쪽 아래 '일 · 주 · 월'로, 캘린더 안 하루 보기. 화면 쪽 코드는 web-src/v43.js
export default [
  {
    name: '하루 보기 화면(캘린더 안, 일 · 주 · 월의 일)',
    find: "(window.BX_APP && S.view === 'memo') ? bxMemoPageHtml() :",
    replace: "(window.BX_APP && S.view === 'day') ? bxDayViewHtml() : (window.BX_APP && S.view === 'memo') ? bxMemoPageHtml() :"
  },
  {
    name: '└ 하루 보기에서도 아래 메뉴의 캘린더가 켜짐',
    find: "(window.BX_APP && b.dataset.view === 'month' && S.view === 'week')",
    replace: "(window.BX_APP && b.dataset.view === 'month' && (S.view === 'week' || S.view === 'day'))"
  }
];
