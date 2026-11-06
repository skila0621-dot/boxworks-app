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
// slot: 아이콘이 없는 단계도 같은 자리를 비워 둔다(홈 루틴 카드 단계 목록, 시험판 54 — 이름 시작이 줄마다 같게)
function bxStepIconHtml(name, slot){ return bxIconSpan(bxIconFor(name), 'st') || (slot ? '<span class="bx-ic st" aria-hidden="true"></span>' : ''); }
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
// 시험판 67: 휴대폰 목소리로 읽기(BxAlarm.speak, 휴대폰 쪽 TextToSpeech). 없는 곳(웹 · 옛 설치 파일)에서는 '들어 보기'를 두지 않는다
function bxSayOk(){ const a = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.BxAlarm; return !!(a && typeof a.speak === 'function'); }
document.addEventListener('click', ev => {
  if (!window.BX_APP || !ev.target.closest || typeof R === 'undefined' || !R) return;
  const sw = ev.target.closest('[data-rsay]'), tr = !sw && ev.target.closest('[data-act="rt-say-try"]'); if (!sw && !tr) return;
  ev.preventDefault(); ev.stopPropagation();
  if (sw) { R.say = sw.dataset.rsay === '1'; const host = document.getElementById('bx-rt45-pntf'), box = sw.closest('.bx-notify'); if (host) host.innerHTML = bxNotifyHtml(); else if (box) box.outerHTML = bxNotifyHtml(); return; }
  const st = (R.steps || []).find(x => x && x.kind !== 'wait'), nm = st && String(st.name || '').trim() ? String(st.name).trim().slice(0, 30) : '씻기';
  Capacitor.Plugins.BxAlarm.speak({text: nm + ', 출발까지 25분'}).then(r => { if (r && r.ok === false) toast(r.why === 'lang' ? '이 휴대폰에는 한국어 목소리가 없어요. 휴대폰 설정 › 텍스트 읽어주기에서 받을 수 있어요.' : '이 휴대폰에서는 읽어 줄 수 없어요.'); }).catch(() => toast('이 휴대폰에서는 읽어 줄 수 없어요.'));
}, true);
function bxNotifyHtml(){
  const bowl = R.sound === 'bowl', bt = R.bowl || bxBowlType();
  const opt = (v, b, sm) => '<button type="button" class="bx-lock-o" role="radio" aria-checked="' + ((v === 'bowl') === bowl) + '" data-rsound="' + v + '"><i aria-hidden="true"></i><span><b>' + b + '</b><small>' + sm + '</small></span></button>';
  return '<div class="fgrid bx-notify"><span class="fg-l">알림 방식</span>' +
    '<div class="bx-lockset bx-ntf" role="radiogroup" aria-label="알림 방식">' + opt('', '알람', '꼭 울림 단계는 확인할 때까지 다시 울려요') + opt('bowl', '싱잉볼', '단계마다 종이 한 번, 끝날 때 세 번 울려요') + '</div>' +
    '<div id="bx-rrep"' + (bowl ? ' hidden' : '') + '>' +
      '<div class="bx-rrow"><span class="bx-rl">간격</span>' + stepperHtml('r-every', R.every, 1, 60, null, 1) + '<span class="bx-ru">분마다</span></div>' +
      '<div class="bx-rrow"><span class="bx-rl">횟수</span>' + stepperHtml('r-times', R.times, 0, 12, null, 1) + '<span class="bx-ru">번 더</span></div>' +
      '<p class="p small bx-rnote">꼭 울림 단계에서 확인을 누르지 않으면 다시 울려요. 0번이면 한 번만 울려요. 짧게 한 번 단계는 다시 울리지 않아요.</p>' +
      // 시험판 67(결정 사안 s05 '나 루틴마다 스위치(처음 꺼짐)'): 울릴 때 단계 이름을 휴대폰 목소리로. 휴대폰마다 목소리가 달라 '들어 보기'로 먼저 들어 봄
      '<div class="bx-swrow bx-say"><span><b>단계 이름 읽어 주기</b><small>울릴 때 “씻기, 출발까지 25분”처럼 읽어 줘요</small></span>' + bxSwitch('data-rsay', !!R.say, '단계 이름 읽어 주기') + '</div>' +
      (bxSayOk() ? '<button type="button" class="sec-link bx-say-try" data-act="rt-say-try">' + ICON.speak + '들어 보기</button>' : '') + '</div>' +
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

// 시험판 54(대표 11/4 22:59 '출발·준비 아이콘만 다른 세트'): 화면 줄의 아이콘은 앱 아이콘 한 세트(ICON).
// 걷기는 루틴 아이콘(BX_ICONS.walk)이 다른 아이콘보다 작고 가늘어 앱 아이콘 크기로 새로 그림. 따로 그린 아이콘(메모 · 첨부 · 모래시계 · 휴대폰 · 위젯)도 ICON에 모음
ICON.walk = '<svg class="i" viewBox="0 0 24 24"><circle cx="14" cy="4" r="2.2"/><path d="M8 21.5l3.3-6.8 3.7 3.1v3.7"/><path d="M11.3 14.7l1.7-8"/><path d="M5.5 11.5l3.3-4.6h4.2l2.6 4.3 3.9 1.6"/></svg>';
// 시험판 55(대표 11/5 03:16 '졸라맨 같은 출발 아이콘 다른 걸로', 선택실 B '집에서 나가기'): 출발·준비 · 루틴 이동 시간은 집에서 나가는 화살표. 걷기(ICON.walk)는 걷는 활동에만
ICON.depart = '<svg class="i" viewBox="0 0 24 24"><path d="M3 11 9.5 5.5 16 11"/><path d="M5 9.5v10h5.5"/><path d="M14 9.5V12"/><path d="M11 16.5h10"/><path d="m18 13.5 3 3-3 3"/></svg>';
ICON.memo = BX_MEMO_ICON;
ICON.home = BX_HOME_ICON;
ICON.checkC = '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.5 2.5 4.6-5"/></svg>';
// 시험판 60(누른 자리 메뉴 · 말하기 아이콘만): 마이크(bxMic와 같은 그림) · 휴강(시간표 TT_OFF) · 오늘은 쉬기 · 오늘은 하기
ICON.mic = '<svg class="i" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
ICON.calOff = TT_OFF;
ICON.pauseC = '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M10 9.2v5.6M14 9.2v5.6"/></svg>';
ICON.playC = '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m10.2 8.9 4.9 3.1-4.9 3.1z"/></svg>';
// 시험판 62: 아래 메뉴 · 메뉴 단추의 기능 아이콘(캘린더 · 시간표 · 루틴 · 메모 · 릴렉스 · 더보기 · 검색 · 설정)도 앱 아이콘 한 세트.
// '그 밖의 기능' 줄에 시간표 · 메모 · 릴렉스가 함께 놓이면서 정렬 점검 icon에 걸림(시간표 아이콘이 세트 밖) → 같은 종류를 모두 세트에 넣음
Object.keys(BX_DOCK_ALL).forEach(k => { ICON['fe_' + k] = BX_DOCK_ALL[k].icon; });
// 시험판 62(선택실 4 · 3번 ㄱ): 출발·준비 단계 알람을 끈 종(종 + 빗금). 종 모양은 ICON.bell 그대로
ICON.bellOff = '<svg class="i" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9"/><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0"/><path d="m3.5 3.5 17 17"/></svg>';
// 시험판 65(결정 사안 s07 '크게 울리기'): 크게 울리는 일정의 종(종 + 양쪽 소리 결). 종 모양은 ICON.bell 그대로
ICON.bellRing = '<svg class="i" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9"/><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0"/><path d="M19.6 2.6a8.6 8.6 0 0 1 2.3 5.2"/><path d="M4.4 2.6a8.6 8.6 0 0 0-2.3 5.2"/></svg>';
// 시험판 67(결정 사안 s05): '들어 보기'(휴대폰 목소리로 읽기) — 소리 나는 스피커
ICON.speak = '<svg class="i" viewBox="0 0 24 24"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M15.4 9.2a4 4 0 0 1 0 5.6"/><path d="M17.9 6.6a7.6 7.6 0 0 1 0 10.8"/></svg>';
// 자동 정렬 점검(tests/layout)이 아이콘 세트를 가려 보게(앱 아이콘 ICON | 루틴 아이콘 BX_ICONS)
window.BX_ICONSRC = {app: ICON, rt: BX_ICONS};
