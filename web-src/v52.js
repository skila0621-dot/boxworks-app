/* 시험판 52(대표 11/4 16:34 · 16:58, 결정 기록 D-25): 루틴은 폰을 쥐고 있지 않아도 되게
   "출근 준비를 하는데 건건이 알람이 울리고 확인을 눌러야 꺼지면 스트레스다. 가볍게 울려 주면서 지금쯤 씻기를 해야 하는구나."
   - 단계마다 세기 셋: 꼭 울림(끌 때까지, 다시 알림) · 짧게 한 번(짧은 소리 한 번, 누를 것 없음) · 소리 없이(알림창 · 위젯 글만)
   - 기본값: 첫 단계(기상) · 출발 · 중요한 단계는 꼭 울림, 중간 단계는 짧게 한 번, 기다리기는 소리 없이. 바꾼 단계만 step.ring에 남는다
   - 소리 없이는 지금처럼 kind 'wait'(D-12 스위치를 끈 단계와 같음)
   - 확인하지 않은 단계 경고(홈 주의 줄 · 빨간 숫자 · 루틴 끝 10분 뒤 알림)는 중요한 단계에만 남긴다
   알람 계획은 scripts/build-web.mjs(BX_alarmPlan), 짧게 한 번 소리는 휴대폰 쪽(ShortChime · AlarmNotify.showShort)

   시험판 68(결정 사안 s20 '가 생활 기능으로', 배포 준비 3절 위험 1 — 약 알림은 Play에서 의료 분류): 약 단계 → '중요한 단계'(step.chk).
   - 단계 이름으로 정하지 않고, 루틴 고치기 › 알림 방식 페이지에서 단계마다 고른다(rticons.js bxChkHtml). 중요한 단계는 늘 꼭 울림
   - '먹었어요' · '약' 글자 · '약 먹기' 템플릿 · 도우미의 약 칸은 뺐다. 단추는 '했어요'
   - 시험판 67까지 저장한 루틴(chkV 없음)만, 그때 꼭 울림이던 약 이름 단계를 중요한 단계로 이어받는다(읽을 때, bxChkLegacy).
     새로 만들거나 한 번 저장한 루틴은 rtNorm이 chkV: 1을 붙여 이름 규칙을 다시 쓰지 않는다 */

// 시험판 67까지의 '약 단계' 이름 규칙(옛 루틴을 이어받을 때만 씀). '약속' · '예약' · '약국' · '요약'은 아니었다
function bxOldMedName(n){
  return /(?:^|[^가-힣])약(?![속국사간정])|(?:아침|점심|저녁|자기\s?전|취침|밤)\s?약|약\s?(?:먹|복용|챙)|복용|영양제|비타민/.test(String(n || ''));
}
// 저장된 루틴을 읽을 때(buildModel): 옛 자료면 꼭 울림이던 약 단계에 chk를 붙여 넘긴다. 짧게 한 번 · 기다리기로 바꿔 둔 단계는 그대로
function bxChkLegacy(d){
  if (!d || d.chkV || !Array.isArray(d.steps)) return d;
  return Object.assign({}, d, {steps: d.steps.map(s => s && !Array.isArray(s) && s.kind !== 'wait' && s.chk == null && s.ring !== 'short' && bxOldMedName(s.name) ? Object.assign({}, s, {chk: true}) : s)});
}
// 단계의 세기. steps: 그 루틴의 단계 목록(첫 단계를 알려고)
function bxStepRing(s, i, steps){
  if (!s || s.kind === 'wait') return 'silent';
  if (s.chk) return 'must';
  if (s.ring === 'must' || s.ring === 'short') return s.ring;
  const first = Array.isArray(steps) ? steps.findIndex(x => x && x.kind !== 'wait') : 0;
  return i === first ? 'must' : 'short';
}
const BX_RINGS = [['must', '꼭 울림'], ['short', '짧게 한 번'], ['silent', '소리 없이']];
// 루틴 창 '단계' 제목 밑 한 줄(v45.js · rticons.js)
const BX_RS_NOTE = '꼭 울림은 끌 때까지 울려요. 짧게 한 번은 한 번 울리고 저절로 멈춰요. 소리 없이는 시간만 지나가요(세탁 기다리기처럼).';
window.BX_RING = {ring: bxStepRing, legacy: bxChkLegacy};

// 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
