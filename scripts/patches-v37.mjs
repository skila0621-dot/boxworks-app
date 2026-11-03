// 시험판 37(11/3 저녁): 여백 · 반투명 상자(web-src/space.js), 움직임(web-src/motion.js), 알림 진동 3번 · 놓치면 다시(BX_alarmPlan · AlarmNotify)
export default [
  {
    // 대표 의견 11/3 17:53 '부드러운 등장과 사라짐': 정해진 시간이 지나 사라질 때는 흐려지며 올라간다(motion.js bxToastGone)
    name: '토스트: 사라질 때 흐려지며 올라가기',
    find: "  setTimeout(() => el.remove(), actions && actions.length ? 7000 : 4000);",
    replace: "  setTimeout(() => (window.BX_APP && typeof bxToastGone === 'function' ? bxToastGone(el) : el.remove()), actions && actions.length ? 7000 : 4000);"
  }
];
