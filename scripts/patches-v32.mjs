// 시험판 32: 대표 휴대폰 확인 뒤 고침(11/3). 화면 쪽 코드는 web-src/v32.js, 설정 묶음은 web-src/tidy.js
export default [
  {
    name: "루틴 단계: '할 일 / 기다리기' 칸 대신 단계마다 '알람' 스위치(대표 결정 11/3: 켜면 울리고 확인, 끄면 시간만)",
    find: "    '<select class=\"inp rs-kind\" data-rs-kind=\"' + i + '\" aria-label=\"' + (i + 1) + '번째 단계 방식\"><option value=\"do\"' + (s.kind === 'do' ? ' selected' : '') + '>할 일</option><option value=\"wait\"' + (s.kind === 'wait' ? ' selected' : '') + '>기다리기</option></select>' +",
    replace: "    (window.BX_APP ? bxRsAlarmHtml(s, i) : '<select class=\"inp rs-kind\" data-rs-kind=\"' + i + '\" aria-label=\"' + (i + 1) + '번째 단계 방식\"><option value=\"do\"' + (s.kind === 'do' ? ' selected' : '') + '>할 일</option><option value=\"wait\"' + (s.kind === 'wait' ? ' selected' : '') + '>기다리기</option></select>') +"
  },
  {
    name: '휴대폰 뒤로 버튼: 설정 묶음 화면이면 설정 목록으로(대표 결정 11/3)',
    find: "  if (S.view === 'guide' && S.gsec) { guideOpen(null); return true; }",
    replace: "  if (S.view === 'guide' && S.gsec) { guideOpen(null); return true; }\n  if (window.BX_APP && S.view === 'settings' && BX_SET && !document.getElementById('bx-start')) { bxSetOpen(null); return true; }"
  }
];
