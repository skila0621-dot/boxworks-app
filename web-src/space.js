/* ---------- 시험판 37: 여백 · 간격(대표 지적 2026-11-03 17:25–17:33) ----------
   "우리 좌우 여백의 시작이 좁다. 많은 데이터를 담으려다 기초적인 배치 정렬이 망가졌다.
    성격 차이가 있다면 저런 투명도를 활용한 분리를 해 주어야 할 것 같다. 홈의 시간순 루틴 · 일정 · 시간표는 나눌 필요가 없지만
    설정이나 몇몇 곳에서 다른 것들끼리 너무 붙어 있다." / "위젯에서도, 박스 디자인에서도 좌우 여백이 좁다.
    로고 밑에 제목도 간격이 너무 좁다. 답답하고 가독성이 떨어진다." / 삼성 캘린더: "더보기 메뉴 위치, 여백과 간격은 참고할 만하다"
   잰 값(대표가 보낸 삼성 날씨 · 캘린더 · 알림 설정, 1dp = 2.81px):
     상자 바깥 10~12dp · 상자 안 18~26dp · 글자 28~38dp · 묶음 사이 12~21dp · 줄 55~61dp · 모서리 약 25dp · 위 막대 아이콘 끝에서 26~28dp
   우리 전(시험판 36, 384dp 화면): 상자 바깥 6 · 상자 안 14 · 글자 20 · 시트 22 · 상자는 흰 바탕에 흰 상자 + 옅은 그림자
   규칙(정리판 v10의 '글자는 한 왼쪽 선'을 그대로 넓힌다):
     글자 줄 32(--gut) · 상자 바깥 12(--bx-edge) · 상자 안 20(--card-pad) · 시트 안도 같은 줄 · 큰 표(달력 · 시간표)는 상자 선 12까지
     상자는 반투명 한 겹(라이트: 잉크 4.5%, 다크: 흰색 6.5%) — 그림자 · 테두리 없음. 상자 안의 회색 칸은 한 겹 더(6% · 8%)
     묶음 사이 14, 묶음 제목은 상자 밖 글자 줄에. 홈의 시간순 목록은 한 상자 그대로(대표 11/3)
   위젯은 안드로이드 쪽(res/layout/bx_widget*.xml): 안 여백 8 → 16dp(안드로이드 위젯 권장 16dp) */
(function bxSpaceStyle(){
  if (!window.BX_APP) return;
  const L = 'rgba(17,20,24,.045)', LI = 'rgba(17,20,24,.06)', D = 'rgba(255,255,255,.065)', DI = 'rgba(255,255,255,.08)';
  const tok = (c, ci) => '--bx-card:' + c + ';--bx-card-in:' + ci + ';--card-bg:var(--bx-card);--card-sh:none';
  const st = document.createElement('style');
  st.id = 'bx-space';
  st.textContent = [
    // 1) 여백 값과 상자 색. 앞 규칙(:root)보다 한 단계 세게(html.bx-app)
    'html.bx-app{--gut:32px;--card-pad:20px;--bx-edge:12px;' + tok(L, LI) + '}',
    '@media (prefers-color-scheme:dark){html.bx-app:not([data-theme="light"]){' + tok(D, DI) + '}}',
    'html.bx-app[data-theme="dark"]{' + tok(D, DI) + '}',
    '@media (max-width:380px){html.bx-app{--gut:28px;--card-pad:16px}}',
    '@media (min-width:720px){html.bx-app{--gut:40px;--card-pad:24px;--bx-edge:16px}}',
    // 상자 안의 회색 칸(점수 칸 · 고르개 · 단추)은 상자보다 한 겹 더 진하게
    'html.bx-app .set-sec,html.bx-app .screen.today .home-col > section,html.bx-app .bx-grp,html.bx-app .bx-lc{--sunk:var(--bx-card-in)}',

    // 2) 위 막대: 로고는 글자 줄(32)에, 오른쪽 아이콘은 끝에서 26. 로고 밑 제목('박스웍스' 아래 '스케줄러') 사이를 띄운다
    'html.bx-app .appbar-in{height:60px;padding-left:max(var(--gut),env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}',
    'html.bx-app .brand{gap:12px}',
    'html.bx-app .brand-t{gap:6px}',
    'html.bx-app .content{padding-top:14px}',

    // 3) 시트: 글자 줄 32, 아래 단추도 같은 줄
    'html.bx-app .sheet-h{padding:10px 14px 4px var(--gut)}',
    'html.bx-app .sheet-h.has-back{padding-left:14px}',
    'html.bx-app .sheet-b{padding:6px var(--gut) 28px}',
    'html.bx-app .sheet-f{padding:12px var(--gut)}',

    // 4) 묶음 상자(bx-grp): 화면 · 시트 어디서나 상자 바깥 12 · 안 20. 줄 사이 구분선은 상자 안에서만, 마지막 줄은 없음
    'html.bx-app .bx-grp{margin:0 calc(-1 * var(--card-pad));padding:2px var(--card-pad);border-radius:24px;background:var(--bx-card)}',
    'html.bx-app .bx-grp-pad{padding:16px var(--card-pad) 18px}',
    'html.bx-app .bx-grp > .menu-row:last-child,html.bx-app .bx-grp > .bx-ft-row:last-child,html.bx-app .bx-grp > .bx-wg-row:last-child,html.bx-app .bx-grp > .bx-swrow:last-child{border-bottom:0}',
    'html.bx-app .bx-grp > .menu-row{min-height:56px}',
    // 상자 안 줄은 곧은 구분선(둥근 줄 끝이 알약처럼 보였음)
    'html.bx-app .set-sec .menu-row,html.bx-app .bx-grp .menu-row{border-radius:0}',
    'html.bx-app .bx-grp > .bx-wg-row{padding:14px 0;border-bottom:1px solid var(--line)}',
    'html.bx-app .bx-grp > .bx-swrow{min-height:64px;margin:0}',
    'html.bx-app .bx-grp > .bx-ft-more{margin:0 0 12px}',
    'html.bx-app .bx-grp > .bx-ft-row{min-height:60px;padding:10px 0;gap:14px}',
    'html.bx-app .bx-grp > .bx-ft-row .bx-ft-t{display:flex;flex-direction:column;gap:3px}',
    // 묶음 제목: 상자 밖, 글자 줄에. 위로 넉넉히(묶음 사이), 상자와는 가깝게
    'html.bx-app .bx-menu-h{padding:22px 0 8px;font-size:13px}',
    'html.bx-app .menu>.bx-menu-h:first-child{padding-top:4px}',
    'html.bx-app .menu>.bx-grp + .bx-grp{margin-top:12px}',
    'html.bx-app .bx-ft-hd{display:flex;flex-direction:column;gap:4px;margin-top:10px}',
    'html.bx-app .bx-ft-hd:first-child{margin-top:0}',
    'html.bx-app .bx-ft-hd .p,html.bx-app .bx-ft-h{margin:0}',
    'html.bx-app .bx-ft-pv{border-color:var(--line-2)}',

    // 5) 설정: 성격마다 상자 하나(tidy.js), 상자 사이 14. 줄만 든 상자는 위아래를 줄인다(삼성 '직접 설정' 상자)
    'html.bx-app .screen.settings{gap:14px}',
    'html.bx-app .screen.settings > .page-head{margin-bottom:6px}',
    'html.bx-app .set-sec{padding:20px var(--card-pad)}',
    'html.bx-app .set-sec:has(> .set-menu:only-child){padding-top:4px;padding-bottom:4px}',
    'html.bx-app .set-sec > .set-row:last-child,html.bx-app .set-sec > .set-menu:last-child > .menu-row:last-child{border-bottom:0}',
    'html.bx-app .set-sec > .bx-lvset:first-child,html.bx-app .set-sec > .bx-lockset:first-child{margin-top:0;padding-top:0;border-top:0}',
    'html.bx-app .set-sec > .bx-setsub:last-child{margin-bottom:0}',
    'html.bx-app .bx-lock-h{margin-bottom:6px}',
    // 새 일정의 알림 칸: 꺼져 있을 때 켜면 들어갈 기본값(시험판 37)
    'html.bx-app .bx-rem-def{margin:2px 0 0;color:var(--ink-3)}html.bx-app .bx-rem-def b{color:var(--ink-2);font-weight:700}',

    // 6) 홈: 두 상자 사이 14, 날짜 상자 안 여백 14(점수 칸이 상자 끝에 붙지 않게)
    'html.bx-app .screen.today .home-col > section.bx-sumcard{padding:8px 14px 14px}',

    // 7) 확인 필요: 지난 일정 카드도 반투명 상자(테두리 대신), 상자 바깥 12 · 안 20
    'html.bx-app .bx-lc{border:0;margin:0 calc(-1 * var(--card-pad)) 12px;padding:18px var(--card-pad);border-radius:24px;background:var(--bx-card)}',
    'html.bx-app .bx-late-ok{margin:0 calc(-1 * var(--card-pad));padding:0 var(--card-pad);min-height:56px;border-radius:24px;background:var(--bx-card)}',

    // 8) 큰 표는 상자 선(12)까지: 달력 · 주간 · 시간표. 제목 · 고르개는 글자 줄 그대로
    'html.bx-app .screen.month .month-wrap,html.bx-app .screen.week .week-wrap,html.bx-app .tt-wrap{margin-left:calc(var(--bx-edge) - var(--gut));margin-right:calc(var(--bx-edge) - var(--gut))}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
