/* 시험판 55 · 단추 견본(대표 11/5 01:30 '승인한 모습을 기준 이미지로 남깁니다', 결정 기록 D-28)
   공통 부품(app.css 맨 앞)을 상태마다 한 화면에 모은 시험용 화면. 메뉴에는 없고, 자동 점검이 window.BX_specimen()으로 연다
   - 정렬 점검(tests/layout/run.cjs)이 이 화면도 재고, 기준 사진(tests/layout/base.cjs)은 이 화면을 폭 360 · 384 · 412 × 라이트 · 다크로 찍어 비교한다
   - 상태: 짧은 글 · 긴 글(…) · 한글 + 숫자 · 아이콘 · 못 누름 · 처리 중 · 고른 것 · 상자 안 */
(function(){
  if (!window.BX_APP) return;
  const I = n => (typeof ICON !== 'undefined' && ICON[n]) || '';
  const spin = '<i class="spin" aria-hidden="true"></i>';
  const sec = (t, body) => '<section class="sp-sec"><h2 class="sp-h">' + t + '</h2>' + body + '</section>';
  const fig = (inner, cap, wide) => '<figure class="sp-f' + (wide ? ' wide' : '') + '">' + inner + '<figcaption>' + cap + '</figcaption></figure>';
  const btnSet = cls => '<div class="sp-grid">' +
    fig('<button type="button" class="btn ' + cls + '"><span>저장</span></button>', '짧은 글') +
    fig('<button type="button" class="btn ' + cls + '">' + I('plus') + '<span>새 루틴</span></button>', '아이콘') +
    fig('<button type="button" class="btn block ' + cls + '"><span>' + bxT('15:00') + ' · 10분 전 출발 알림 켜기</span></button>', '한글 + 숫자', 1) +
    fig('<button type="button" class="btn block ' + cls + '"><span>오늘 할 일 모두 보기 · 남은 일 3개 · 다음 일정 ' + bxT('15:00') + ' 치과</span></button>', '긴 글(넘치면 …)', 1) +
    fig('<button type="button" class="btn ' + cls + '" disabled><span>저장</span></button>', '못 누름') +
    fig('<button type="button" class="btn is-busy ' + cls + '" aria-busy="true"><span>저장</span>' + spin + '</button>', '처리 중(크기 그대로)') +
    fig('<div class="sp-row"><button type="button" class="btn sm ' + cls + '"><span>추가</span></button><button type="button" class="btn sm ' + cls + '">' + I('check') + '<span>완료</span></button><button type="button" class="btn sm ' + cls + '" disabled><span>이전</span></button></div>', '작은 단추 · 못 누름', 1) +
    '</div>';
  const chips = '<div class="sp-row wrap">' +
    '<button type="button" class="bx-cchip" aria-pressed="true"><i class="dot" style="background:var(--ink-2)"></i><span>전체</span></button>' +
    '<button type="button" class="bx-cchip" aria-pressed="false"><i class="dot" style="background:var(--cat-blue)"></i><span>회사 · 프로젝트 일정 (팀 공유)</span></button>' +
    '<button type="button" class="bx-cchip" aria-pressed="false"><i class="dot" style="background:var(--cat-aqua)"></i><span>개인</span></button>' +
    '<button type="button" class="bx-cchip bx-cchip-add">' + I('plus') + '<span>캘린더</span></button>' +
    '<button type="button" class="chip" disabled><span>3일 전</span></button></div>' +
    '<div class="bx-er bx-tt45-days sp-days"><div class="tt-days">' + ['월', '화', '수', '목', '금', '토', '일'].map((d, i) => '<button type="button" class="tt-dbtn' + (i === 5 ? ' sat' : i === 6 ? ' sun' : '') + '" aria-pressed="' + (i < 5) + '">' + d + '</button>').join('') + '</div></div>';
  const segs = '<div class="seg seg3" role="group" aria-label="울리는 방식"><button type="button" aria-pressed="true">꼭 울림</button><button type="button" aria-pressed="false">짧게 한 번</button><button type="button" aria-pressed="false">소리 없이</button></div>' +
    '<div class="seg" role="group" aria-label="고르는 방식"><button type="button" aria-pressed="false">빠른 선택</button><button type="button" aria-pressed="true">직접 입력</button></div>';
  const links = '<div class="sp-row wrap"><button type="button" class="link-btn">건너뛰기</button><button type="button" class="link-btn">' + I('plus') + '단계 추가</button><button type="button" class="link-btn">모두 보기 ' + I('chevR') + '</button>' +
    '<button type="button" class="link-btn danger">일정 삭제</button><button type="button" class="link-btn" disabled>지우기</button></div>';
  const icons = '<div class="sp-row">' + ['menu', 'search', 'help', 'chevL', 'chevR', 'edit'].map(n => '<button type="button" class="icon-btn" aria-label="' + n + '">' + (I(n) || I('help')) + '</button>').join('') + '</div>';
  const checks = '<div class="sp-row">' +
    '<button type="button" class="chk" aria-label="안 함">' + I('check') + '</button><button type="button" class="chk on" aria-label="했어요">' + I('check') + '</button>' +
    '<button type="button" class="tog" role="switch" aria-checked="false" aria-label="끔"><i></i></button><button type="button" class="tog" role="switch" aria-checked="true" aria-label="켬"><i></i></button></div>' +
    '<div class="bx-grp sp-box"><button type="button" class="bx-lock-o" role="radio" aria-checked="true"><i></i><span><b>도착 시각에 맞추기</b><small>도착할 시각에서 거꾸로 빼서 시작해요</small></span></button>' +
    '<button type="button" class="bx-lock-o" role="radio" aria-checked="false"><i></i><span><b>시작 시각부터</b><small>정한 시각에 첫 단계를 시작해요</small></span></button></div>';
  // 글자 역할: 시각이 든 글은 그릴 때 시각 규칙으로(시험판 58 — 불러올 때 만들면 24시간 표시에서도 '오후 3:00'으로 남음)
  const type = () => '<div class="sp-type"><p class="sp-t28">오늘</p><p class="sp-t20">오늘 할 일</p><p class="sp-t16">치과 정기 검진과 스케일링 예약 — 진료 전에 문진표 쓰기</p>' +
    '<p class="sp-t14">11월 2일 (월) · 일정 3개 · 다음 일정 ' + bxT('15:00') + '</p><p class="sp-t13">오른쪽 아래 + 를 눌러 “내일 3시 치과”처럼 적거나 말해 보세요. 말하면 날짜와 시각을 알아서 넣어요.</p><p class="sp-t11">루틴 · 캘린더 · 홈 · 시간표 · 메모</p></div>';
  window.BX_specimen = function(){
    let pg = document.getElementById('bx-spec'); if (pg) pg.remove();
    pg = document.createElement('div'); pg.id = 'bx-spec'; pg.className = 'bx-spec'; pg.setAttribute('role', 'dialog'); pg.setAttribute('aria-label', '단추 견본');
    pg.innerHTML = '<h1 class="sp-title">단추 견본</h1>' +
      sec('주 단추', btnSet('primary')) +
      sec('보조 단추', btnSet('') + '<div class="bx-grp sp-box"><div class="sp-row"><button type="button" class="btn grow"><span>한 번 더</span></button><button type="button" class="btn primary grow"><span>닫기</span></button></div></div>') +
      sec('칩 · 요일', chips) + sec('나눔 단추', segs) + sec('글자 단추', links) + sec('아이콘 단추', icons) + sec('체크 · 스위치 · 고르기 동그라미', checks) + sec('글자 역할', type());
    document.body.appendChild(pg);
    return pg;
  };
})();
