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
    '</div></div>' + bxSoundPickHtml();
}
// 루틴 알람 소리: 기본 알람(잠금 화면 전체·1분) | 싱잉볼(종소리 한 번, 다시 알림 없음, 끝날 때 세 번)
function bxSoundPickHtml(){
  const cur = R.sound === 'bowl' ? 'bowl' : '';
  return '<div class="fgrid"><span class="fg-l">알람 소리</span><div class="picks" id="bx-sndpick">' +
    '<button type="button" class="pick" data-rsound="" aria-pressed="' + !cur + '">기본 알람</button>' +
    '<button type="button" class="pick" data-rsound="bowl" aria-pressed="' + (cur === 'bowl') + '">싱잉볼</button>' +
    '<button type="button" class="pick" data-act="bx-med-hear">' + bxIconSpan('music', '') + '듣기</button></div>' +
    '<p class="p small">싱잉볼은 단계마다 종이 한 번 울리고, 끝날 때 세 번 울려요. 명상·마음 정리 루틴에 어울려요.</p></div>';
}
function bxIconPickRefresh(){ const el = $('#bx-icpick'); if (el && R) el.outerHTML = bxIconPickHtml().replace(/^<div class="fgrid"><span class="fg-l">[\s\S]*?<\/span>/, '').replace(/<\/div>$/, ''); }
document.addEventListener('click', ev => {
  const sb = ev.target.closest && ev.target.closest('[data-rsound]');
  if (sb && R && window.BX_APP) { ev.stopPropagation(); R.sound = sb.dataset.rsound || null; $$('#bx-sndpick [data-rsound]').forEach(x => x.setAttribute('aria-pressed', String((x.dataset.rsound || null) === R.sound))); return; }
  const b = ev.target.closest && ev.target.closest('[data-ricon]'); if (!b || !R || !window.BX_APP) return;
  ev.stopPropagation();
  R.icon = b.dataset.ricon || null;
  bxIconPickRefresh();
}, true);
