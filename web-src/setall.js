/* ---------- 시험판 38: 설정 묶음 화면의 줄 목록 · 자세한 화면(대표 결정 2026-11-03 18:58) ----------
   대표: "지금처럼 묶음을 통해서 들어가는 것이 좋다. 자기가 세팅해 둔 값이 무엇인지 파악하고 들어가는 것이 좋아.
   다만 눌러 들어갔을 때 개선안처럼 상세 기능들과 내용으로 점점 심도 깊게 세팅을 바꿀 수 있도록 진입하는 것이 좋겠다.
   우리의 문제는 무엇을 바꿔야 할지 너무 많은 정보를 한 화면에서 제공해 이해가 어려워지는 세팅 편집 방식이었다.
   기능 설정이 많아질수록 삼성 쪽 방향이 옳다."
   → 설정 목록(지금 값) › 묶음 화면(줄마다 이름 + 그 아래 파란 글씨 값, 삼성 캘린더 설정) › 자세한 화면(그 설정 하나만). 화면은 tidy.js */
// 묶음 화면 줄에서 바로 여는 창(분류 · 백업 · 휴지통은 원래 ⋯ 메뉴의 줄과 같은 창)
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest) return;
  const b = ev.target.closest('[data-act="bx-set-cats"],[data-act="bx-set-data"],[data-act="bx-set-trash"]'); if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  // 원래 줄(data-menu)의 처리기를 그대로 쓴다
  const mr = document.createElement('button');
  mr.type = 'button'; mr.className = 'menu-row'; mr.dataset.menu = b.dataset.act.slice(7); mr.hidden = true;
  document.body.appendChild(mr); mr.click(); mr.remove();
}, true);
(function bxSetRowsStyle(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.textContent = [
    'html.bx-app .set-sec.bx-all{padding:4px var(--card-pad);gap:0}',
    'html.bx-app .bx-arow{display:flex;align-items:center;gap:10px;width:100%;min-height:66px;padding:11px 0;text-align:left;border-bottom:1px solid var(--line)}',
    'html.bx-app .bx-all > .bx-arow:last-child{border-bottom:0}',
    'html.bx-app .bx-at{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;text-align:left}',
    'html.bx-app .bx-at b{font-size:16px;font-weight:600;color:var(--ink)}',
    'html.bx-app .bx-at small{font-size:13.5px;line-height:1.35;color:var(--accent)}',
    'html.bx-app .bx-arow > .i{color:var(--ink-3);flex:none}',
    'html.bx-app .bx-adiv{width:1px;height:28px;background:var(--line-2);flex:none;margin:0 4px}',
    'html.bx-app .bx-adanger{color:var(--danger)}',
    // 자세한 화면: 제목은 머리 줄에 있으니 상자 안 같은 제목은 숨김, 설명 한 줄은 상자 밑
    'html.bx-app .bx-setd{display:flex;flex-direction:column;gap:14px}',
    'html.bx-app .bx-setd .bx-lock-h{display:none}',
    'html.bx-app .bx-setd .bx-lvset > .p.small:first-of-type{margin-top:0!important}',
    'html.bx-app .bx-setd-note{margin:-6px 4px 4px;color:var(--ink-3);line-height:1.5}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
