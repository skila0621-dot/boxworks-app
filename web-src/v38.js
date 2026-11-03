/* ---------- 시험판 38: 위 막대 · 아래 메뉴 · 처음 여는 화면(대표 결정 2026-11-03 18:58) ----------
   대표: "(더보기 자리) 나 안이 좋습니다(삼성 캘린더처럼 왼쪽 위 메뉴 단추). 대신 우리 로고가 중앙 배치되고 이름은 지우자.
   (로고는) 홈 화면으로 돌아가는 기능만. 로딩이 필요한 화면에서는 로딩 게이지가 차면서 로고와 우리의 네이밍을 보여 줘야겠지.
   네이밍은 차후에 다시 설정할 예정, 정해지기 전까지는 박스웍스 말고 스케줄러로만."
   - 위 막대: 왼쪽 메뉴 단추(더보기 창) · 가운데 로고(누르면 홈) · 오른쪽 검색 · 도움말. 오른쪽 ⋯는 뺌(같은 창이 메뉴 단추로)
   - 아래 메뉴: '더보기'를 빼고 기능만(기본 루틴 · 캘린더 · 홈 · 시간표). 4개까지 더 고를 수 있음(기능 · 메뉴 편집)
   - 처음 여는 화면: 로고 + '스케줄러' + 차오르는 게이지(patches-v38.mjs가 넣는 #bx-splash). 자료를 다 읽고 처음 그리면 닫힌다.
     너무 빨리 지나가 깜빡이지 않게 적어도 0.6초는 보인다. 누르는 것은 막지 않는다(pointer-events: none) */
(function bxBarStyle(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.textContent = [
    '.ab-menu{display:none}',
    // 왼쪽 메뉴 단추와 오른쪽 아이콘이 화면 끝에서 26(삼성 캘린더 26~28)
    'html.bx-app .appbar-in{position:relative;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}',
    'html.bx-app .ab-menu{display:inline-flex}',
    'html.bx-app .ab-menu svg.i{width:22px;height:22px}',
    'html.bx-app .ab-more{display:none}',
    'html.bx-app .appbar-in > .brand{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);height:44px;padding:0 10px;gap:0}',
    'html.bx-app .appbar-in > .brand svg{width:30px;height:30px}',
    'html.bx-app .appbar-in > .brand .brand-t{display:none}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
// 처음 여는 화면 닫기: 자료를 읽고(S.firstServer) 첫 화면을 그린 뒤. 적어도 0.6초
const BXSP_T0 = Date.now();
function bxSplashCheck(){
  const sp = document.getElementById('bx-splash');
  if (!sp || sp.classList.contains('bx-done') || !S.firstServer) return;
  const wait = Math.max(0, 600 - (Date.now() - BXSP_T0));
  setTimeout(() => { sp.classList.add('bx-done'); setTimeout(() => sp.remove(), 360); }, wait);
}
const bxRender38 = render;
render = function(){
  const r = bxRender38.apply(this, arguments);
  try { bxSplashCheck(); } catch (e) { /* 처음 여는 화면은 없어도 된다 */ }
  return r;
};
// 자료를 읽지 못해도 3초 뒤에는 닫는다(처음 여는 화면에 갇히지 않게)
setTimeout(() => { const sp = document.getElementById('bx-splash'); if (sp && !sp.classList.contains('bx-done')) { sp.classList.add('bx-done'); setTimeout(() => sp.remove(), 360); } }, 3000);
