/* ---------- 시험판 37: 움직임(대표 의견 2026-11-03 17:53) ----------
   "이런 부드러운 등장과 사라짐이 필요한 곳에 우리도 차용해서 모션적으로 보완을 할 수 있을까요? 지금은 딱딱한 구성들만 있다."
   대표 질문 "어플리케이션이 무거워질까요?" → 가볍게 만든다.
     투명도(opacity)와 위치(transform)만 움직인다. 휴대폰의 그래픽 칩이 따로 처리해서 화면을 다시 그리지 않는다.
     0.2초 안팎으로 한 번. 계속 도는 움직임은 넣지 않는다. 휴대폰 '움직임 줄이기'를 켜면 모두 멈춘다(앞 규칙 prefers-reduced-motion).
   넣은 곳:
     1) 앱 안 알림 글(토스트): 아래 메뉴 위에서는 떠오르며 나타나고 흐려지며 내려가 사라진다. 창이 열려 화면 위에 뜰 때는 위에서 내려온다
     2) 시트: 닫힐 때도 내려가며 사라진다. 닫는 순간 시트 그림(사본)만 남겨 움직이고 진짜 창은 바로 비운다
        → 다음 창이 바로 열려도 겹치지 않고, 앱이 하던 일의 순서도 그대로
     3) 자세히(루틴 단계) 펼치기: 단계 목록이 위에서 살짝 내려오며 나타난다
     4) 완료 체크가 톡 튀고, 확인 필요 카드는 완료 · 미루기 · 그대로를 누르면 흐려지며 빠진다
     5) 아래 메뉴로 화면을 바꾸면 흐려졌다 나타나고, 홈의 날짜 ‹ ›는 오늘 할 일 목록도 옆으로 밀리며 바뀐다 */
const BXM = {view: null, rt: null, pop: null};
function bxCalm(){ try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
// 1) 토스트: 정해진 시간이 지나 사라질 때(누른 단추로 닫을 때는 바로 사라진다)
function bxToastGone(el){
  if (!el || !el.isConnected) return;
  if (bxCalm()) { el.remove(); return; }
  el.classList.add('bx-out');
  setTimeout(() => el.remove(), 220);
}
// 사라지는 그림(사본). 누를 수 없고 읽어 주지도 않는다
function bxGhost(node, cls, rect){
  if (!node || bxCalm()) return null;
  const g = node.cloneNode(true);
  g.classList.add('bx-ghost', cls);
  g.setAttribute('aria-hidden', 'true'); g.setAttribute('inert', '');
  [g].concat(Array.from(g.querySelectorAll('*'))).forEach(e => {
    e.removeAttribute('id');
    Array.from(e.attributes).forEach(a => { if (/^data-/.test(a.name)) e.removeAttribute(a.name); });
  });
  if (rect) Object.assign(g.style, {left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px'});
  document.body.appendChild(g);
  setTimeout(() => g.remove(), 260);
  return g;
}
// 2) 시트가 닫힐 때. 열리는 창이 있으면(창에서 창으로) 남은 그림을 바로 치운다
const bxCloseSheet0 = closeSheet;
closeSheet = function(silent){
  if (SH && !silent) { const s = document.querySelector('#sheet-root > .scrim'); if (s) bxGhost(s, 'bx-ghost-sheet'); }
  return bxCloseSheet0.apply(this, arguments);
};
const bxOpenSheet0 = openSheet;
openSheet = function(){
  document.querySelectorAll('.bx-ghost-sheet').forEach(g => g.remove());
  return bxOpenSheet0.apply(this, arguments);
};
// 3) · 4) 누른 것을 기억해 두었다가 화면을 다시 그린 뒤 한 번만 움직인다. 창보다 먼저(window) 듣는다
window.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  // 자세히: 누르기 전에 접혀 있었는지만 적어 두고, 펼친 뒤(아래 document 쪽)에 움직인다
  const rc = (ev.target.closest('.bx-rt-tog') || ev.target.closest('.rt-sec .rt-h b, .rt-sec .rt-h .rt-meta')) && ev.target.closest('.rt-card');
  BXM.rt = rc ? {card: rc, was: rc.classList.contains('bx-open')} : null;
  const ck = ev.target.closest('[data-act="toggle"][data-id]');
  if (ck) BXM.pop = ck.getAttribute('data-id');
  const lb = ev.target.closest('[data-bx-late]');
  if (lb && /^(done|today|later|keep|move)$/.test(lb.getAttribute('data-bx-late'))) {
    const card = lb.closest('.bx-lc');
    if (card) bxGhost(card, 'bx-ghost-card', card.getBoundingClientRect());
  }
}, true);
// 자세히(home.js가 상자에 bx-open을 붙인 바로 뒤, 그리기 전에): 새로 펼친 단계 목록만
document.addEventListener('click', () => {
  const r = BXM.rt; BXM.rt = null;
  if (r && !r.was && r.card.classList.contains('bx-open')) r.card.querySelectorAll('.rt-steps, .bx-rt-foot').forEach(e => bxOnce(e, 'bx-in'));
}, true);
const bxRender0 = render;
render = function(){
  const r = bxRender0.apply(this, arguments);
  try { bxAfterRender(); } catch (e) { /* 움직임은 없어도 된다 */ }
  return r;
};
function bxOnce(el, cls){ if (!el || bxCalm()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 400); }
function bxAfterRender(){
  if (!window.BX_APP) return;
  // 5) 화면 바꾸기: 처음 그릴 때는 그대로
  if (BXM.view && BXM.view !== S.view) bxOnce(document.getElementById('screen'), 'bx-enter');
  BXM.view = S.view;
  if (BXM.pop) {
    const id = BXM.pop; BXM.pop = null;
    document.querySelectorAll('.chk[data-id="' + id + '"]').forEach(e => bxOnce(e, 'bx-pop'));
  }
}
// 5) 홈의 날짜 ‹ ›: 날짜 상자는 이미 밀리고(tc-head), 오늘 할 일 목록도 같은 쪽으로
const bxHomeDayGo0 = homeDayGo;
homeDayGo = function(d){
  const r = bxHomeDayGo0.apply(this, arguments);
  if (d) bxOnce(document.querySelector('.screen.today .bx-todo'), d > 0 ? 'bx-slide-l' : 'bx-slide-r');
  return r;
};
(function bxMotionStyle(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-motion';
  const OUT = 'cubic-bezier(.2,.8,.2,1)', IN = 'cubic-bezier(.4,0,1,1)';
  st.textContent = [
    '@keyframes bxDrop{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}',
    '@keyframes bxLift{from{opacity:1;transform:none}to{opacity:0;transform:translateY(-12px)}}',
    '@keyframes bxRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
    '@keyframes bxSink{from{opacity:1;transform:none}to{opacity:0;transform:translateY(10px)}}',
    '@keyframes bxFadeOut{from{opacity:1}to{opacity:0}}',
    '@keyframes bxSheetDown{from{transform:none}to{transform:translateY(64px)}}',
    '@keyframes bxIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
    '@keyframes bxPop{0%{transform:scale(.7)}60%{transform:scale(1.12)}100%{transform:scale(1)}}',
    '@keyframes bxScreen{from{opacity:.15}to{opacity:1}}',
    '@keyframes bxCardOut{from{opacity:1;transform:none}to{opacity:0;transform:scale(.96)}}',
    // 토스트는 보통 아래 메뉴 위(아래에서 떠오름), 창이 열려 있으면 화면 위(위에서 내려옴)
    '.bx-app #toasts .toast{animation:bxRise .26s ' + OUT + '}',
    '.bx-app #toasts .toast.bx-out{animation:bxSink .2s ' + IN + ' forwards}',
    'html.locked.bx-app #toasts .toast{animation:bxDrop .26s ' + OUT + '}',
    'html.locked.bx-app #toasts .toast.bx-out{animation:bxLift .2s ' + IN + ' forwards}',
    '.bx-ghost{pointer-events:none!important}',
    '.bx-ghost.bx-ghost-sheet{animation:bxFadeOut .22s ease-in forwards}',
    '.bx-ghost.bx-ghost-sheet .sheet{animation:bxSheetDown .22s ' + IN + ' forwards}',
    '.bx-ghost.bx-ghost-card{position:fixed;z-index:85;margin:0!important;box-sizing:border-box;animation:bxCardOut .2s ease-in forwards}',
    '.bx-app .bx-in{animation:bxIn .22s ' + OUT + '}',
    '.bx-app .chk.bx-pop{animation:bxPop .3s cubic-bezier(.3,1.4,.5,1)}',
    // 화면 전체는 위치를 옮기지 않고 투명도만(화면 안의 고정 막대가 흔들리지 않게)
    '.bx-app #screen.bx-enter{animation:bxScreen .2s ease-out}',
    '.bx-app .screen.today .bx-todo.bx-slide-l .bx-tl{animation:slideL .24s ease-out}',
    '.bx-app .screen.today .bx-todo.bx-slide-r .bx-tl{animation:slideR .24s ease-out}',
    '@media (prefers-reduced-motion:reduce){.bx-ghost{display:none!important}}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
