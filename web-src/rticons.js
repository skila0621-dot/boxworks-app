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
  return '<span class="bx-icsum-i">' + BX_ICONS[k] + '</span><span class="bx-icsum-t">아이콘 <small>' + (R.icon && BX_ICONS[R.icon] ? esc(BX_ICON_LABELS[k] || '') : '이름으로 자동 선택') + '</small></span><span class="bx-icsum-c">변경</span>';
}
function bxIconPickHtml(){
  return '<details class="fgrid bx-icdet" id="bx-icdet"><summary class="bx-icsum" id="bx-icsum">' + bxIconSumHtml() + '</summary><div class="bx-icpick" id="bx-icpick" role="group" aria-label="아이콘">' + bxIconGridHtml() + '</div></details>';
}
/* 알려 주는 방식(대표 결정 11/1): 루틴마다 고르고, 루틴 고치기 창 위쪽에 한 줄. 설정에는 두지 않는다.
   알람 = 확인할 때까지 다시 울림(기본, 간격·횟수는 이때만 보임) / 싱잉볼 = 단계마다 종 한 번, 끝에 세 번, 다시 알림 없음(종소리 종류는 이 루틴에만) */
function bxNotifyHtml(){
  const bowl = R.sound === 'bowl', bt = R.bowl || bxBowlType();
  const opt = (v, b, sm) => '<button type="button" class="bx-lock-o" role="radio" aria-checked="' + ((v === 'bowl') === bowl) + '" data-rsound="' + v + '"><i aria-hidden="true"></i><span><b>' + b + '</b><small>' + sm + '</small></span></button>';
  return '<div class="fgrid bx-notify"><span class="fg-l">알림 방식</span>' +
    '<div class="bx-lockset bx-ntf" role="radiogroup" aria-label="알림 방식">' + opt('', '알람', '꼭 울림 단계는 확인할 때까지 다시 울려요') + opt('bowl', '싱잉볼', '단계마다 종이 한 번, 끝날 때 세 번 울려요') + '</div>' +
    '<div id="bx-rrep"' + (bowl ? ' hidden' : '') + '>' +
      '<div class="bx-rrow"><span class="bx-rl">간격</span>' + stepperHtml('r-every', R.every, 1, 60, null, 1) + '<span class="bx-ru">분마다</span></div>' +
      '<div class="bx-rrow"><span class="bx-rl">횟수</span>' + stepperHtml('r-times', R.times, 0, 12, null, 1) + '<span class="bx-ru">번 더</span></div>' +
      '<p class="p small bx-rnote">꼭 울림 단계에서 확인을 누르지 않으면 다시 울려요. 0번이면 한 번만 울려요. 짧게 한 번 단계는 다시 울리지 않아요.</p></div>' +
    '<div id="bx-rbowl"' + (bowl ? '' : ' hidden') + '><div class="bx-sndrow"><div class="picks bx-bowl-picks" id="bx-bowlpick">' +
      BX_BOWLS.map(b => '<button type="button" class="pick" data-rbowl="' + b[0] + '" aria-pressed="' + (bt === b[0]) + '">' + b[1] + '</button>').join('') + '</div></div>' +
      '<p class="p small">누르면 들려요. 명상의 종소리와는 따로예요.</p></div></div>';
}
// 루틴 고치기 창(앱): 이름 → 알려 주는 방식 → 언제(요일·기준·시각) → 시작·끝 한 줄 → 단계 → 아이콘 → 지우기
function bxDrawRoutine(){
  const days = [1, 2, 3, 4, 5, 6, 0].map(d => '<button type="button" class="day-tog" data-rday="' + d + '" aria-pressed="' + R.days.includes(d) + '">' + WD[d] + '</button>').join('');
  setSheet((R.note ? '<div class="hint">' + ICON.spark + '<span>' + esc(R.note) + '</span></div>' : '') +
    // (옛 창을 고치는 빌드 바꿈 글과 겹치지 않게 이름 칸을 둘로 나눠 적음)
    '<div class="fgrid"><label class="fg-l" for="r-name">이름</label>' + '<input id="r-name" class="inp full" value="' + esc(R.name) + '" maxlength="30"></div>' +
    bxNotifyHtml() +
    (R.once ? '<div class="fgrid"><span class="fg-l">언제</span><p class="rt-sum">' + esc(rtWhenText(R)) + ' · 끝나면 목록에서 사라져요</p><div id="r-timebox">' + rtTimesHtml() + '</div></div>' :
    '<div class="fgrid"><div class="fg-lr"><span class="fg-l">요일</span><span class="rdays-q"><button type="button" class="sec-link" data-rdays="wd">평일</button><button type="button" class="sec-link" data-rdays="all">매일</button></span></div><div class="rdays">' + days + '</div>' + bxHolRowHtml() + '</div>' +
    '<div class="fgrid"><span class="fg-l">기준</span>' + segHtml('data-rmode', [['arrive', '도착 시각'], ['start', '시작 시각']], R.mode, '시간 기준', 320) + '<div id="r-timebox">' + rtTimesHtml() + '</div></div>') +
    '<div class="fgrid"><div id="r-prev" class="rt-prev">' + rtPreviewHtml() + '</div></div>' +
    '<div class="fgrid"><span class="fg-l">단계 <small>이름 · 시간(분) · 알림</small></span><p class="p small bx-rs-note">' + BX_RS_NOTE + '</p><div id="r-steps">' + rtStepsHtml() + '</div><div><button type="button" class="btn sm" data-act="rs-add">' + ICON.plus + '단계 추가</button></div></div>' +
    bxIconPickHtml() + (R.id ? '<div class="bx-rdel"><button type="button" class="bx-del-link" data-act="rt-del">루틴 삭제</button></div>' : ''),
    '<button type="button" class="btn grow primary" data-act="rt-save">저장</button>');
}
function bxIconPickRefresh(){
  const g = $('#bx-icpick'), sm = $('#bx-icsum');
  if (g && R) g.innerHTML = bxIconGridHtml();
  if (sm && R) sm.innerHTML = bxIconSumHtml();
}
document.addEventListener('click', ev => {
  const sb = ev.target.closest && ev.target.closest('[data-rsound]');
  if (sb && R && window.BX_APP) {
    ev.stopPropagation(); R.sound = sb.dataset.rsound || null;
    $$('.bx-ntf [data-rsound]').forEach(x => x.setAttribute('aria-checked', String((x.dataset.rsound || null) === R.sound)));
    const rp = $('#bx-rrep'), bp = $('#bx-rbowl'); if (rp) rp.hidden = R.sound === 'bowl'; if (bp) bp.hidden = R.sound !== 'bowl';
    if (R.sound === 'bowl') { if (!R.bowl) R.bowl = bxBowlType(); medPlay('bowl', R.bowl); }
    return;
  }
  const rb = ev.target.closest && ev.target.closest('[data-rbowl]');
  if (rb && R && window.BX_APP) { ev.stopPropagation(); R.bowl = rb.dataset.rbowl; $$('[data-rbowl]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.rbowl === R.bowl))); medPlay('bowl', R.bowl); return; }
  const b = ev.target.closest && ev.target.closest('[data-ricon]'); if (!b || !R || !window.BX_APP) return;
  ev.stopPropagation();
  R.icon = b.dataset.ricon || null;
  bxIconPickRefresh();
}, true);
