// 시험판 40(대표 결정 11/3 21:51, 결정 기록 D-15): 시간표 여러 개. 화면 쪽 코드는 web-src/v40.js · timetable.js
// 여기서는 시간표 문서(type 'ttset')가 백업 · 불러오기 · 초기화에 함께 들어가게 한다
export default [
  {
    name: "백업 불러오기에 시간표 묶음(ttset) 포함",
    find: "'tt', 'travelmem', 'pcx', 'medlog'].includes(x.type)",
    replace: "'tt', 'ttset', 'travelmem', 'pcx', 'medlog'].includes(x.type)"
  },
  {
    name: "└ 처음 상태로 되돌리기에도",
    find: "d.type === 'tt' || d.type === 'travelmem' || d.type === 'pcx' || d.type === 'medlog' || id === 'settings'",
    replace: "d.type === 'tt' || d.type === 'ttset' || d.type === 'travelmem' || d.type === 'pcx' || d.type === 'medlog' || id === 'settings'"
  }
];
