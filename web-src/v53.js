/* 시험판 53(대표 11/4 19:48 "전체적으로 모든 페이지를 참고하고 정렬이 흐트러진 곳이 없는지 검토를 해 주세요", 결정 기록 D-26)
   앱 전체 정렬 점검(화면 · 창 · 페이지 67곳을 사진으로 찍고 자동 점검)에서 찾은 것을 고친다.
   - 한국어 줄 바꿈은 낱말 단위로('주소 / 는' · '예 / 약' · '저절 / 로'처럼 낱말 가운데에서 꺾이던 것). 칸보다 긴 낱말만 쪼갠다
   - 홈 루틴 카드를 펼친 단계 목록의 '도착' 줄: 이동 · 여유 글이 …로 잘리던 것(빈 확인 칸 자리까지 쓴다)
   - 홈 '지난 일': '20시간 40분 지남'이 오른쪽 '확인' 칸에 눌려 끝 글자가 잘리던 것(모자라면 다음 줄로)
   - 앱을 열어 둔 동안 위에 뜨는 알림 카드: 화면 끝에서 12, 글자는 32(다른 상자와 같은 줄, D-13)
   - 홈 · 찾기 줄의 장소 글: 길면 …로 끝나야 하는데 글자가 반쯤 잘려 보이던 것('연세'가 '연서'처럼)
   - 설정 첫 화면: 값이 길면(360 폭 '아침 요약 오전 7:30 · 10분 전') › 가 다른 줄보다 오른쪽으로 밀리던 것. 값은 이름 옆 남는 칸을 다 쓰고, 그래도 길면 …
   - 입력칸 안내 글이 칸보다 길면 반쯤 잘린 글자 대신 …. 홈 메모 칸은 '떠오른 것을 적거나 말해요'(대표 휴대폰 폭 384에서도 '보세요'가 잘렸음, v41.js),
     새 일정 제목 칸은 칸에 안 들어가는 좁은 휴대폰(360)에서만 '예) 오후 3시 치과'(칸을 누르면 바로 키보드가 올라와 …도 안 보임)
   '오전 · 오후'(D-24)가 빠졌던 글은 원래 자리(flow.js · start.js · brief.js)에서 고친다 */
(function(){
  if (!window.BX_APP) return;
  // 모양 규칙은 web-src/app.css로 옮김(시험판 54 덧칠 정리)
  // 안내 글이 칸에 안 들어가면 짧은 글로. 원래 글은 data-bx-ph에 두고 칸이 넓어지면 되돌린다
  const SHORT = { '예) 내일 오후 3시 치과': '예) 오후 3시 치과' };
  let cv = null, q = 0;
  const fit = () => {
    q = 0;
    document.querySelectorAll('input[placeholder]').forEach(e => {
      const full = e.getAttribute('data-bx-ph') || e.placeholder, short = SHORT[full];
      if (!short || !e.clientWidth) return;
      const cs = getComputedStyle(e), ps = getComputedStyle(e, '::placeholder');
      cv = cv || document.createElement('canvas').getContext('2d');
      cv.font = ps.fontWeight + ' ' + ps.fontSize + ' ' + ps.fontFamily;
      const need = cv.measureText(full).width + (parseFloat(ps.letterSpacing) || 0) * full.length;
      const want = need <= e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) ? full : short;
      if (e.placeholder !== want) { e.setAttribute('data-bx-ph', full); e.placeholder = want; }
    });
  };
  window.BX_fitPh = fit;
  const ask = () => { if (!q) q = requestAnimationFrame(fit); };
  new MutationObserver(ask).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', ask);
  // 시험판 55(대표 11/5 '글꼴 로딩 후에도 배치 유지'): 글꼴(BX Pretendard)을 다 불러온 뒤 한 번 더 잰다. 그 전에는 다른 글꼴 너비로 재서 짧은 글을 잘못 고를 수 있다
  if (document.fonts) { document.fonts.ready.then(ask); document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', ask); }
})();
