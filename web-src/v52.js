/* 시험판 52(대표 11/4 16:34 · 16:58, 결정 기록 D-25): 루틴은 폰을 쥐고 있지 않아도 되게
   "출근 준비를 하는데 건건이 알람이 울리고 확인을 눌러야 꺼지면 스트레스다. 가볍게 울려 주면서 지금쯤 씻기를 해야 하는구나."
   - 단계마다 세기 셋: 꼭 울림(끌 때까지, 다시 알림) · 짧게 한 번(짧은 소리 한 번, 누를 것 없음) · 소리 없이(알림창 · 위젯 글만)
   - 기본값: 첫 단계(기상) · 약 · 출발은 꼭 울림, 중간 단계는 짧게 한 번, 기다리기는 소리 없이. 바꾼 단계만 step.ring에 남는다
   - 소리 없이는 지금처럼 kind 'wait'(D-12 스위치를 끈 단계와 같음)
   - 확인하지 않은 단계 경고(홈 주의 줄 · 빨간 숫자 · 루틴 끝 10분 뒤 알림)는 약 단계에만 남긴다(약 루틴은 지금처럼 확인)
   알람 계획은 scripts/build-web.mjs(BX_alarmPlan), 짧게 한 번 소리는 휴대폰 쪽(ShortChime · AlarmNotify.showShort) */

// 약 단계: '약 먹기' · '아침 약' · '저녁약' · '영양제'. '약속' · '예약' · '약국' · '요약'은 약이 아니다
function bxIsMed(n){
  return /(?:^|[^가-힣])약(?![속국사간정])|(?:아침|점심|저녁|자기\s?전|취침|밤)\s?약|약\s?(?:먹|복용|챙)|복용|영양제|비타민/.test(String(n || ''));
}
// 단계의 세기. steps: 그 루틴의 단계 목록(첫 단계를 알려고)
function bxStepRing(s, i, steps){
  if (!s || s.kind === 'wait') return 'silent';
  if (s.ring === 'must' || s.ring === 'short') return s.ring;
  const first = Array.isArray(steps) ? steps.findIndex(x => x && x.kind !== 'wait') : 0;
  return i === first || bxIsMed(s.name) ? 'must' : 'short';
}
const BX_RINGS = [['must', '꼭 울림'], ['short', '짧게 한 번'], ['silent', '소리 없이']];
// 루틴 창 '단계' 제목 밑 한 줄(v45.js · rticons.js)
const BX_RS_NOTE = '꼭 울림은 끌 때까지 울려요. 짧게 한 번은 한 번 울리고 저절로 멈춰요. 소리 없이는 시간만 지나가요(세탁 기다리기처럼).';
window.BX_RING = {isMed: bxIsMed, ring: bxStepRing};
// 단계 이름을 '약 먹기'로 적으면 고르지 않은 단계의 기본값도 바로 꼭 울림으로(세 칸만 다시 그림, 적던 칸은 그대로)
document.addEventListener('input', ev => {
  const t = ev.target; if (!window.BX_APP || !t || !t.dataset || t.dataset.rsName == null || typeof R === 'undefined' || !R) return;
  const i = +t.dataset.rsName, st = R.steps[i], row = t.closest('.rs-row'), seg = row && row.querySelector('.bx-rs-ring');
  // 앱의 입력 처리(st.name = 값)는 이보다 늦게 붙어 있어 적은 글로 직접 본다
  if (st && seg && !st.ring && st.kind !== 'wait') seg.outerHTML = bxRsAlarmHtml(Object.assign({}, st, {name: t.value}), i);
});

(function(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v52-css';
  st.textContent = [
    // 단계 줄: 첫 줄은 이름 · 분, 둘째 줄은 세기 세 칸 · 위로 · 지우기(세 칸이 좁은 휴대폰에서도 한 줄에 들게)
    'html.bx-app #r-steps .rs-row{grid-template-columns:minmax(0,1fr) auto auto;column-gap:8px;row-gap:8px}',
    'html.bx-app #r-steps .rs-row .rs-name{grid-column:1;grid-row:1}',
    'html.bx-app #r-steps .rs-row > .stepper{grid-column:2/4;grid-row:1;justify-self:end}',
    'html.bx-app #r-steps .rs-row .bx-rs-ring{grid-column:1/3;grid-row:2;width:auto;min-width:0}',
    'html.bx-app #r-steps .rs-row .rs-act{grid-column:3;grid-row:2;justify-self:end}',
    'html.bx-app .bx-rs-ring button{height:38px;padding:0 4px;font-size:13px;font-weight:600;white-space:nowrap;word-break:keep-all}',
    'html.bx-app .bx-rs-ring button[aria-pressed="true"]{color:var(--accent-text)}',
    // 홈 루틴 카드: 시각이 지나 저절로 지나간 단계는 흐리게(지운 줄 · 체크 없이). 확인한 단계만 줄을 긋는다
    'html.bx-app .rt-steps li.past .rt-n,html.bx-app .rt-steps li.past .rt-t{color:var(--ink-3)}',
    'html.bx-app .rt-steps li.past .rt-n{font-weight:500}',
    // 펼친 단계 목록: 시각은 카드 머리의 시각 칸 아래, 이름은 루틴 이름 아래(시험판 51에서 '오전 7:00'이 두 줄로 꺾이던 것)
    'html.bx-app .bx-tl-rt .rt-steps{margin-left:38px}',
    'html.bx-app .bx-tl-rt .rt-steps li{grid-template-columns:76px minmax(0,1fr) auto 32px;column-gap:14px}',
    'html.bx-app .bx-tl-rt .rt-steps li .rt-t{white-space:nowrap}',
    // 루틴 목록 줄: '오전 9:00'이 '오 / 전 9:00'으로 꺾이지 않게
    'html.bx-app .rt-item .rt-open > span{word-break:keep-all}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
