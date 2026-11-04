// 시험판 55(대표 11/5 01:30 '반복해 쓰는 것은 완성본을 골라 재활용', 결정 기록 D-28)
// 공통 부품(web-src/app.css 맨 앞 '공통 부품')이 가져간 웹 원본(boxworks.html) 규칙. 빌드할 때 원본에서 지운다
// 원본은 고치지 않는다(build-web.mjs 첫 줄). 목록에 있는데 원본에서 못 찾으면 빌드를 멈춘다
//   sel: 선택자(공백은 하나로 보고 비교) · drop: 이 속성만 지움(없으면 규칙째 지움) · set: 값을 바꿈 · n: 같은 선택자 규칙 수
export default [
  // 단추
  { sel: '.btn' }, { sel: '.btn svg.i' }, { sel: '.btn.primary' }, { sel: '.btn.danger' }, { sel: '.btn.grow' }, { sel: '.btn.sq' }, { sel: '.btn.sm' },
  { sel: '.btn.danger-line' }, { sel: '.btn.danger-solid' }, { sel: '.btn.danger-solid:disabled' }, { sel: '.rt-make-a .btn' },
  { sel: '.rt-now .btn', drop: ['height'] },
  // 나눔 단추
  { sel: '.seg' }, { sel: '.seg button' }, { sel: '.seg button[aria-pressed="true"]' }, { sel: '.seg.seg3' }, { sel: '.seg.mini' }, { sel: '.seg.mini button' },
  // 글자 단추
  { sel: '.link-btn' }, { sel: '.link-btn:hover' },
  { sel: '.sec-link' }, { sel: '.sec-link svg.i' }, { sel: '.sec-link:hover' }, { sel: '.sec-link.add', n: 2 }, { sel: '.sec-link.add svg.i' },
  { sel: '.month-wrap #agenda > .sec-h .sec-link' },
  // 아이콘 단추
  { sel: '.icon-btn' }, { sel: '.icon-btn:hover' }, { sel: '.icon-btn svg.i' }, { sel: '.rs-act .icon-btn' }, { sel: '.rs-act .icon-btn[disabled]' },
  { sel: '.nav-btn' }, { sel: '.nav-btn:hover' }, { sel: '.ab-view .nav-btn' }, { sel: '.hc-nav .nav-btn' }, { sel: '.tc-nav .nav-btn' }, { sel: '.tc-nav .nav-btn svg.i' },
  // 체크 칸
  { sel: '.chk', n: 2 }, { sel: '.chk::after' }, { sel: '.chk svg.i' }, { sel: '.chk:hover', n: 2 }, { sel: '.row.done .chk' }, { sel: '.row.late .chk', n: 2 },
  // 스위치
  { sel: '.tog' }, { sel: '.tog i' }, { sel: '.tog[aria-checked="true"]' }, { sel: '.tog[aria-checked="true"] i' },
  // 아이콘 선 굵기는 공통 값 하나로
  { sel: 'svg.i', set: { 'stroke-width': 'var(--ic-sw,1.8)' } }
];
