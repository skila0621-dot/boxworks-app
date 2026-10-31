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
// 루틴 고치기 창의 소리·아이콘(대표 결정 10/31: 이름 → 언제 → 단계 → 소리 → 아이콘 순서, 아이콘은 접어 둔다)
function bxIconGridHtml(){
  const auto = bxRtIconKey(Object.assign({}, R, {icon: null}));
  const cur = R.icon && BX_ICONS[R.icon] ? R.icon : '';
  return '<button type="button" class="bx-icb auto" data-ricon="" aria-pressed="' + !cur + '" aria-label="자동: ' + esc(BX_ICON_LABELS[auto] || '') + '">' + BX_ICONS[auto] + '<small>자동</small></button>' +
    Object.keys(BX_ICONS).filter(k => k !== 'loop').concat(['loop']).map(k => '<button type="button" class="bx-icb" data-ricon="' + k + '" aria-pressed="' + (cur === k) + '" aria-label="' + esc(BX_ICON_LABELS[k]) + '" title="' + esc(BX_ICON_LABELS[k]) + '">' + BX_ICONS[k] + '</button>').join('');
}
function bxIconSumHtml(){
  const k = R.icon && BX_ICONS[R.icon] ? R.icon : bxRtIconKey(Object.assign({}, R, {icon: null}));
  return '<span class="bx-icsum-i">' + BX_ICONS[k] + '</span><span class="bx-icsum-t">아이콘 <small>' + (R.icon && BX_ICONS[R.icon] ? esc(BX_ICON_LABELS[k] || '') : '이름을 보고 자동으로 골랐어요') + '</small></span><span class="bx-icsum-c">바꾸기</span>';
}
function bxIconPickHtml(){
  return bxSoundPickHtml() + '<details class="fgrid bx-icdet" id="bx-icdet"><summary class="bx-icsum" id="bx-icsum">' + bxIconSumHtml() + '</summary><div class="bx-icpick" id="bx-icpick" role="group" aria-label="아이콘">' + bxIconGridHtml() + '</div></details>';
}
// 루틴 알람 소리: 기본 알람(잠금 화면 전체·1분) | 싱잉볼(종소리 한 번, 다시 알림 없음, 끝날 때 세 번)
function bxSoundPickHtml(){
  const cur = R.sound === 'bowl' ? 'bowl' : '';
  return '<div class="fgrid"><span class="fg-l">알람 소리</span><div class="bx-sndrow"><div class="picks" id="bx-sndpick">' +
    '<button type="button" class="pick" data-rsound="" aria-pressed="' + !cur + '">기본 알람</button>' +
    '<button type="button" class="pick" data-rsound="bowl" aria-pressed="' + (cur === 'bowl') + '">싱잉볼</button></div>' +
    '<button type="button" class="bx-play" data-act="bx-med-hear" aria-label="싱잉볼 소리 미리 듣기"><svg class="i" viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/></svg></button></div>' +
    '<div class="picks bx-bowl-picks" id="bx-bowlpick"' + (cur === 'bowl' ? '' : ' hidden') + '>' + BX_BOWLS.map(b => '<button type="button" class="pick" data-bxbowl="' + b[0] + '" aria-pressed="' + (bxBowlType() === b[0]) + '">' + b[1] + '</button>').join('') + '</div>' +
    '<p class="p small">싱잉볼은 단계마다 종이 한 번 울리고, 끝날 때 세 번 울려요. 명상·마음 정리 루틴에 어울려요. 종류는 명상과 같이 써요.</p></div>';
}
function bxIconPickRefresh(){
  const g = $('#bx-icpick'), sm = $('#bx-icsum');
  if (g && R) g.innerHTML = bxIconGridHtml();
  if (sm && R) sm.innerHTML = bxIconSumHtml();
}
document.addEventListener('click', ev => {
  const sb = ev.target.closest && ev.target.closest('[data-rsound]');
  if (sb && R && window.BX_APP) { ev.stopPropagation(); R.sound = sb.dataset.rsound || null; $$('#bx-sndpick [data-rsound]').forEach(x => x.setAttribute('aria-pressed', String((x.dataset.rsound || null) === R.sound))); const bp = $('#bx-bowlpick'); if (bp) bp.hidden = R.sound !== 'bowl'; return; }
  const b = ev.target.closest && ev.target.closest('[data-ricon]'); if (!b || !R || !window.BX_APP) return;
  ev.stopPropagation();
  R.icon = b.dataset.ricon || null;
  bxIconPickRefresh();
}, true);
