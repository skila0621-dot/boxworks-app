// 시험판 9 사용 뒤 대표 지적 고침(2026-10-31)
export default [
  {
    "name": "루틴 창 '다시 알림' 줄 정렬(대표 지적): 간격·횟수를 한 줄씩. '하는 중 확인'은 앱에서 숨김(D-03, 루틴 진행 중 확인은 1차에서 뺌)",
    "find": "    '<div class=\"fgrid\"><span class=\"fg-l\">다시 알림</span><div class=\"rg-inline\">' + '<span>확인할 때까지</span>' + stepperHtml('r-every', R.every, 1, 60, null, 1) + '<span>분마다</span>' + stepperHtml('r-times', R.times, 0, 12, null, 1) + '<span>번 더</span></div>' +\n    '<span class=\"fg-l\">하는 중 확인</span><div class=\"rg-inline\">' + stepperHtml('r-check', R.check, 0, 60, null, 5) + '<span>분마다 \"아직 하는 중이죠?\" (0은 끄기)</span></div></div>',",
    "replace": "    (window.BX_APP\n      ? '<div class=\"fgrid\"><span class=\"fg-l\">다시 알림 <small>확인을 누르지 않으면</small></span>' +\n        '<div class=\"bx-rrow\"><span class=\"bx-rl\">간격</span>' + stepperHtml('r-every', R.every, 1, 60, null, 1) + '<span class=\"bx-ru\">분마다</span></div>' +\n        '<div class=\"bx-rrow\"><span class=\"bx-rl\">횟수</span>' + stepperHtml('r-times', R.times, 0, 12, null, 1) + '<span class=\"bx-ru\">번 더</span></div>' +\n        '<p class=\"p small bx-rnote\">0번이면 한 번만 울려요.</p></div>'\n      : '<div class=\"fgrid\"><span class=\"fg-l\">다시 알림</span><div class=\"rg-inline\">' + '<span>확인할 때까지</span>' + stepperHtml('r-every', R.every, 1, 60, null, 1) + '<span>분마다</span>' + stepperHtml('r-times', R.times, 0, 12, null, 1) + '<span>번 더</span></div>' +\n    '<span class=\"fg-l\">하는 중 확인</span><div class=\"rg-inline\">' + stepperHtml('r-check', R.check, 0, 60, null, 5) + '<span>분마다 \"아직 하는 중이죠?\" (0은 끄기)</span></div></div>'),"
  },
  {
    "name": "루틴을 저장하면 '말로 만들기' 칸을 비움(대표 지적: 저장 뒤에도 앞서 적은 글이 남아 있었음)",
    "find": "  writeDoc(id, doc); M = buildModel();\n  closeSheet(); if (S.view !== 'routines' && !doc.once) go('routines');",
    "replace": "  writeDoc(id, doc); M = buildModel();\n  S.rtText = '';\n  closeSheet(); if (S.view !== 'routines' && !doc.once) go('routines');"
  },
  {
    "name": "루틴 창 '횟수' −·+ 단추가 안 먹던 문제(대표 지적): 시각 칸 묶음과 횟수 칸이 같은 id(r-times)를 써서 단추가 엉뚱한 칸을 찾았음. 묶음 id를 r-timebox로",
    "find": "끝나면 목록에서 사라져요</p><div id=\"r-times\">",
    "replace": "끝나면 목록에서 사라져요</p><div id=\"r-timebox\">"
  },
  {
    "name": "└ (둘째 자리)",
    "find": "'시간 기준', 320) + '<div id=\"r-times\">",
    "replace": "'시간 기준', 320) + '<div id=\"r-timebox\">"
  },
  {
    "name": "└ (다시 그릴 때)",
    "find": "const tm = $('#r-times'); if (tm) tm.innerHTML = rtTimesHtml();",
    "replace": "const tm = $('#r-timebox'); if (tm) tm.innerHTML = rtTimesHtml();"
  },
  {
    "name": "오늘 화면: 그릴 때마다 칸 접기 단추·루틴 단계 펼치기 단추 붙이기(대표 요청, 코드는 web-src/home.js)",
    "find": "  if (SH && SH.refresh) SH.refresh();\n",
    "replace": "  if (window.BX_APP) bxFoldDecorate();\n  if (SH && SH.refresh) SH.refresh();\n"
  },
  {
    "name": "설정 > 알림에 '아침 보고' 켜기·시각(4안-5, 코드는 web-src/brief.js)",
    "find": "<span class=\"ml\">휴대폰 알람 시험</span><span class=\"mv\">10초 뒤 울려요' + ICON.chevR + '</span></button></div>' : '') +",
    "replace": "<span class=\"ml\">휴대폰 알람 시험</span><span class=\"mv\">10초 뒤 울려요' + ICON.chevR + '</span></button></div>' : '') + (window.BX_APP ? bxReportSetHtml() : '') +"
  }
];
