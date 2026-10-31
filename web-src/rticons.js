/* 루틴 아이콘 붙이기(대표 요청). 모양과 고르는 규칙은 icons.js(scripts/gen-icons.py가 만듦).
   루틴: 직접 고른 것(rt.icon) → 루틴 이름 → 첫 단계부터 맞는 단계 이름 → 기본(loop)
   단계: 단계 이름으로 맞는 것이 있을 때만 보인다 */
function bxRtIconKey(rt){
  if (!rt) return 'loop';
  if (rt.icon && BX_ICONS[rt.icon]) return rt.icon;
  const byName = bxIconFor(rt.name); if (byName) return byName;
  for (const s of rt.steps || []) { const k = bxIconFor(s.name); if (k) return k; }
  return 'loop';
}
function bxIconSpan(key, cls){ return key && BX_ICONS[key] ? '<span class="bx-ic ' + (cls || '') + '" aria-hidden="true">' + BX_ICONS[key] + '</span>' : ''; }
function bxRtIconHtml(rt){ return bxIconSpan(bxRtIconKey(rt), 'rt'); }
function bxStepIconHtml(name){ return bxIconSpan(bxIconFor(name), 'st'); }
// 루틴 창: 아이콘 고르기(자동 + 모음 전체)
function bxIconPickHtml(){
  const auto = bxRtIconKey(Object.assign({}, R, {icon: null}));
  const cur = R.icon && BX_ICONS[R.icon] ? R.icon : '';
  return '<div class="fgrid"><span class="fg-l">아이콘 <small>이름을 보고 골라 둬요. 눌러서 바꿀 수 있어요</small></span><div class="bx-icpick" id="bx-icpick" role="group" aria-label="아이콘">' +
    '<button type="button" class="bx-icb auto" data-ricon="" aria-pressed="' + !cur + '" aria-label="자동: ' + esc(BX_ICON_LABELS[auto] || '') + '">' + BX_ICONS[auto] + '<small>자동</small></button>' +
    Object.keys(BX_ICONS).filter(k => k !== 'loop').concat(['loop']).map(k => '<button type="button" class="bx-icb" data-ricon="' + k + '" aria-pressed="' + (cur === k) + '" aria-label="' + esc(BX_ICON_LABELS[k]) + '" title="' + esc(BX_ICON_LABELS[k]) + '">' + BX_ICONS[k] + '</button>').join('') +
    '</div></div>';
}
function bxIconPickRefresh(){ const el = $('#bx-icpick'); if (el && R) el.outerHTML = bxIconPickHtml().replace(/^<div class="fgrid"><span class="fg-l">[\s\S]*?<\/span>/, '').replace(/<\/div>$/, ''); }
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-ricon]'); if (!b || !R || !window.BX_APP) return;
  ev.stopPropagation();
  R.icon = b.dataset.ricon || null;
  bxIconPickRefresh();
}, true);
