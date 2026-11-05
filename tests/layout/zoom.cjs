// 휴대폰 글꼴 크기 설정 흉내(시험판 63). 안드로이드 웹뷰는 시스템 글꼴 크기만큼 모든 글자(px 포함)와 px 줄 높이를 키운다(textZoom).
// 화면의 모든 요소(html · body 포함 — rem도 함께 커짐)의 글자 크기 · px 줄 높이를 z배로 바꾸고, 되돌리는 함수 window.__bxUnzoom을 남긴다
module.exports = function zoomText(z){
  const els = [document.documentElement, document.body].concat(Array.from(document.body.querySelectorAll('*')).filter(e => !e.closest('svg,script,style,template')));
  const was = els.map(e => [e, e.style.getPropertyValue('font-size'), e.style.getPropertyPriority('font-size'), e.style.getPropertyValue('line-height'), e.style.getPropertyPriority('line-height'), getComputedStyle(e).fontSize, getComputedStyle(e).lineHeight]);
  for (const [e, , , , , fz, lh] of was) { e.style.setProperty('font-size', parseFloat(fz) * z + 'px', 'important'); if (/px$/.test(lh)) e.style.setProperty('line-height', parseFloat(lh) * z + 'px', 'important'); }
  window.__bxUnzoom = () => { for (const [e, f, fp, l, lp] of was) { if (f) e.style.setProperty('font-size', f, fp); else e.style.removeProperty('font-size'); if (l) e.style.setProperty('line-height', l, lp); else e.style.removeProperty('line-height'); } window.__bxUnzoom = null; };
};
