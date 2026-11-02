/*
 * 박스웍스 안드로이드 앱 연결부.
 * 웹 박스웍스는 claude.ai 안에서 window.claude 기능(계정 저장소, AI, 파일 받기)을 씁니다.
 * 앱에서는 그 자리를 휴대폰 기능으로 채웁니다.
 *  - 저장소(db)·계정(user): 주지 않음 → 박스웍스가 휴대폰 안 저장(localStorage)으로 동작
 *  - AI(sample): 주지 않음 → 규칙 해석만 사용 (D-02, D-04)
 *  - 파일 받기(downloads): 휴대폰에 파일을 만들고 공유 창을 열어 저장할 곳을 고르게 함
 */
(function () {
  var cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  window.BX_APP = true;
  document.documentElement.classList.add('bx-app');

  // 앱에서는 쓰지 않는 웹 전용 메뉴를 숨김: 위젯 모드(PC 바탕화면용)와 그 설명
  var style = document.createElement('style');
  style.textContent = [
    '.bx-app [data-act="widget"],.bx-app #g-widget{display:none!important}',
    // 월간 달력: 웹은 휴대폰 폭에서 점만 보여 주는데, 앱에서는 칸마다 일정 제목을 색 띠로 보여 줌
    '@media (max-width:719px){',
    '.bx-app .cell{min-height:86px;align-items:stretch;padding:4px 1px 6px;gap:2px}',
    '.bx-app .cell .c-top{justify-content:center}',
    '.bx-app .cell .c-num{width:26px;height:26px;font-size:13.5px}',
    '.bx-app .cell .c-dots{display:none}',
    '.bx-app .c-chips{display:flex;flex-direction:column;gap:2px;min-width:0}',
    '.bx-app .c-chip{display:block;min-width:0;font-size:10.5px;font-weight:600;line-height:1.3;padding:1px 2px 1px 3px;border-left:2px solid var(--c);border-radius:3px;background:color-mix(in srgb,var(--c) 14%,transparent);color:var(--ink);text-align:left;overflow:hidden;white-space:nowrap}',
    '.bx-app .c-chip .dot,.bx-app .c-chip .c-t{display:none}',
    '.bx-app .c-chip span{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
    '.bx-app .c-chip.done span{text-decoration:line-through;color:var(--ink-3)}',
    '.bx-app .c-more{font-size:10.5px;font-weight:700;color:var(--ink-3);line-height:1.2;padding-left:3px;text-align:left}',
    '}',
    // Claude가 보내던 아침 일정 보고 설정은 앱에서 쓰지 않음(앱의 아침 보고는 5단계에서 휴대폰이 직접 만듦)
    '.bx-app section[aria-labelledby="s-report"]{display:none!important}',
    // 말로 넣기 마이크 버튼
    '.bx-app .bx-inrow{display:flex;align-items:center;gap:8px}',
    '.bx-app .bx-inrow > input{flex:1;min-width:0}',
    '.bx-app .bx-mic{flex:none;width:44px;height:44px;border-radius:22px;border:0;background:var(--accent);color:var(--accent-ink);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}',
    '.bx-app .bx-mic.busy{opacity:.55}',
    '.bx-app .rt-make-a{justify-content:space-between}',
    // 시간표(D-06)
    '.bx-app .tt-mode{display:flex;justify-content:center;margin:6px 0 14px}',
    '.bx-app .page-head .sec-link.add{align-self:center}',
    '.bx-app .tt-add{margin:2px 0 12px}',
    '.bx-app .tt-add .inp{height:46px}',
    '.bx-app .tt-add .btn{flex:none;height:44px}',
    '.bx-app .tt-empty{margin:0 0 12px}',
    '.bx-app .tt-wrap{margin:0 -4px}',
    '.bx-app .tt-grid,.bx-app .tt-body{display:grid;grid-template-columns:26px repeat(var(--n),minmax(0,1fr))}',
    '.bx-app .tt-h{height:30px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--ink-3)}',
    '.bx-app .tt-h.today{color:var(--accent)}.bx-app .tt-h.sun{color:var(--sun)}.bx-app .tt-h.sat{color:var(--sat)}',
    '.bx-app .tt-body{position:relative;border-top:1px solid var(--line)}',
    '.bx-app .tt-lines{position:absolute;inset:0;pointer-events:none}',
    '.bx-app .tt-line{position:absolute;left:0;right:0;border-top:1px solid var(--line)}',
    '.bx-app .tt-line span{position:absolute;left:0;top:-7px;width:22px;text-align:right;font-size:10.5px;color:var(--ink-3);background:var(--bg);font-variant-numeric:tabular-nums}',
    '.bx-app .tt-col{position:relative;border-left:1px solid var(--line)}',
    '.bx-app .tt-col.today{background:color-mix(in srgb,var(--accent) 6%,transparent)}',
    '.bx-app .tt-b{position:absolute;left:2px;right:2px;display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:3px 3px 3px 4px;border:0;border-left:3px solid var(--c);border-radius:6px;background:color-mix(in srgb,var(--c) 17%,var(--bg));color:var(--ink);text-align:left;overflow:hidden;font-family:inherit;cursor:pointer}',
    '.bx-app .tt-b b{font-size:11.5px;font-weight:700;line-height:1.25;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:keep-all;overflow-wrap:anywhere}',
    '.bx-app .tt-b small{font-size:10px;color:var(--ink-2);line-height:1.2;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:100%}',
    '.bx-app .tt-now{position:absolute;left:-1px;right:0;height:2px;background:var(--accent);z-index:1}',
    '.bx-app .tt-card{margin-top:14px}',
    '.bx-app .tt-row{align-items:center}',
    '.bx-app .tt-dot{flex:none;width:12px;height:12px;border-radius:6px;background:var(--c);margin:0 10px 0 9px}',
    '.bx-app .tt-form{display:flex;flex-direction:column;gap:8px}',
    '.bx-app .tt-l{font-size:13px;font-weight:700;color:var(--ink-2);margin-top:6px}',
    '.bx-app .tt-days{display:flex;gap:6px}',
    '.bx-app .tt-dbtn,.bx-app .tt-pill{display:flex;align-items:center;justify-content:center;text-align:center;padding:0;flex:1;min-width:0;height:42px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);font:inherit;font-weight:700;color:var(--ink)}',
    '.bx-app .tt-pills{display:flex;gap:6px}.bx-app .tt-pill{font-size:13px;font-weight:600}',
    '.bx-app .tt-pill[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}',
    '.bx-app .tt-sub{display:flex;align-items:center;justify-content:space-between;margin:-4px 0 12px}',
    '.bx-app .tt-dbtn.sun{color:var(--sun)}.bx-app .tt-dbtn.sat{color:var(--sat)}',
    '.bx-app .tt-dbtn[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}',
    '.bx-app .tt-times{display:flex;align-items:center;gap:8px}.bx-app .tt-times .inp{flex:1;min-width:0}',
    '.bx-app .tt-sws{display:flex;gap:12px;padding:4px 2px}',
    '.bx-app .tt-sw{width:32px;height:32px;border-radius:16px;border:0;background:var(--c)}',
    '.bx-app .tt-sw[aria-pressed="true"]{box-shadow:0 0 0 3px var(--bg),0 0 0 5px var(--c)}',
    '.bx-app .tt-hint{color:var(--warn-ink);margin:0}',
    // 시간표 블록 끌기·꾹 누르기(대표 요청): 위·아래 끝 손잡이, 끄는 동안 시각 표시
    '.bx-app .tt-b{touch-action:manipulation;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}',
    // 편집 모드(꾹 누른 블록): 들어 올린 모양, 손잡이는 이 블록에만, 몸통을 끌면 옮기기
    '.bx-app .tt-hd{position:absolute;left:0;right:0;height:18px;z-index:2;display:none}',
    '.bx-app .tt-b.sel .tt-hd{display:block;touch-action:none}',
    '.bx-app .tt-hd.s{top:-6px}.bx-app .tt-hd.e{bottom:-6px}',
    '.bx-app .tt-b.sel .tt-hd::after{content:"";position:absolute;left:50%;width:22px;height:6px;margin-left:-11px;border-radius:4px;background:var(--bg);border:2px solid var(--c)}',
    '.bx-app .tt-hd.s::after{top:3px}.bx-app .tt-hd.e::after{bottom:3px}',
    '.bx-app .tt-b.sel{z-index:6;overflow:visible;touch-action:none;outline:2px solid var(--c);outline-offset:1px;box-shadow:0 6px 18px rgba(0,0,0,.22);background:color-mix(in srgb,var(--c) 30%,var(--bg));cursor:grab}',
    '.bx-app .tt-b.drag{cursor:grabbing;opacity:.92}',
    '.bx-app .tt-body.editing .tt-b:not(.sel){opacity:.55}',
    '.bx-app .tt-lk{position:absolute;right:2px;bottom:2px;width:13px;height:13px;color:var(--c);opacity:.9;pointer-events:none}',
    '.bx-app .tt-lk .i{width:13px;height:13px;stroke-width:2.4}',
    '.bx-app .tt-bar{position:absolute;z-index:9;display:flex;gap:2px;padding:4px;border-radius:14px;background:var(--ink);color:var(--bg);box-shadow:0 8px 24px rgba(0,0,0,.28)}',
    '.bx-app .tt-xb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:50px;min-height:48px;padding:4px 6px;border:0;border-radius:10px;background:transparent;color:inherit;font:inherit;cursor:pointer}',
    '.bx-app .tt-xb .i{width:19px;height:19px}',
    '.bx-app .tt-xb small{font-size:10.5px;font-weight:600;line-height:1.1;white-space:nowrap}',
    '.bx-app .tt-xb.on{background:color-mix(in srgb,var(--bg) 18%,transparent)}',
    '.bx-app .tt-xb:active{background:color-mix(in srgb,var(--bg) 26%,transparent)}',
    '.bx-app .tt-pills + .tt-l,.bx-app .tt-times + .tt-l{margin-top:16px}',
    // 휴강: 그 날짜 하루만 끈 수업
    '.bx-app .tt-b.off{background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--c) 10%,var(--bg)) 0 6px,var(--bg) 6px 12px);border-left-style:dashed}',
    '.bx-app .tt-b.off b{text-decoration:line-through;color:var(--ink-3)}',
    '.bx-app .tt-b .tt-offtag{color:var(--warn-ink);font-weight:700}',
    '.bx-app .row.bx-off .row-title{text-decoration:line-through;color:var(--ink-3)}',
    '.bx-app .row.bx-off .row-time b{color:var(--ink-3)}',
    '.bx-app .meta.bx-off-tag{color:var(--warn-ink);font-weight:700}',
    // 시간표 위 두 단추: 무엇을 하는지 글로 보이게(대표 지적: 눌러 보기 전엔 알 수 없음)
    '.bx-app .tt-sub{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.bx-app .tt-opt{display:flex;align-items:center;gap:10px;min-height:56px;padding:8px 12px;border:1px solid var(--line);border-radius:14px;background:var(--card-bg,var(--bg));color:var(--ink);text-align:left;font:inherit;cursor:pointer}',
    '.bx-app .tt-opt > .i{width:20px;height:20px;flex:none;color:var(--accent)}',
    '.bx-app .tt-opt > .i:last-child{width:16px;height:16px;margin-left:auto;color:var(--ink-3)}',
    '.bx-app .tt-opt span{display:flex;flex-direction:column;gap:2px;min-width:0}',
    '.bx-app .tt-opt b{font-size:14px;font-weight:800}',
    '.bx-app .tt-opt small{font-size:12px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.bx-app .tt-b.rs{z-index:7;overflow:visible;box-shadow:0 4px 14px rgba(0,0,0,.18);outline:2px solid var(--c)}',
    '.bx-app .tt-b.rs::after{content:attr(data-rs-t);position:absolute;left:50%;top:-24px;transform:translateX(-50%);padding:2px 7px;border-radius:7px;background:var(--ink);color:var(--bg);font-size:11.5px;font-weight:700;white-space:nowrap}',
    '.bx-app .tt-rg{gap:4px}.bx-app .tt-rg .i{width:15px;height:15px}',
    '.bx-app .tt-tip{margin:-4px 0 10px;color:var(--ink-3)}',
    '.bx-app .tt-menu .menu-row.danger .ml,.bx-app .tt-menu .menu-row.danger .mi{color:var(--danger)}',
    // 출발 시각 계산·준비 루틴(4단계): 새 일정 창의 '출발' 칸과 일정 줄의 출발 시각
    '.bx-app .tv-cus{display:flex;align-items:center;gap:8px;margin-top:10px}',
    '.bx-app .tv-mem{margin:8px 0 0;color:var(--accent)}',
    '.bx-app .tv-h{margin-top:18px}.bx-app .tv-h small{font-weight:500;color:var(--ink-3);margin-left:4px}',
    '.bx-app .tv-line{list-style:none;margin:16px 0 8px;padding:0}',
    '.bx-app .tv-line li{display:flex;align-items:center;gap:12px;min-height:36px;position:relative;padding-left:20px}',
    '.bx-app .tv-line li::before{content:"";position:absolute;left:3px;top:50%;width:9px;height:9px;margin-top:-5px;border-radius:50%;background:var(--line-2)}',
    '.bx-app .tv-line li::after{content:"";position:absolute;left:7px;top:calc(50% + 6px);height:calc(100% - 12px);width:1px;background:var(--line-2)}',
    '.bx-app .tv-line li:last-child::after{display:none}',
    '.bx-app .tv-line li.go::before{background:var(--accent)}.bx-app .tv-line li.arr::before{background:var(--ink)}',
    '.bx-app .tv-line b{min-width:46px;font-size:15px}.bx-app .tv-line span{flex:1;min-width:0;font-size:15px}',
    '.bx-app .tv-line small{margin-left:6px;color:var(--ink-3);font-size:13px}',
    '.bx-app .tv-line li.go span{font-weight:700;color:var(--accent)}.bx-app .tv-line li.wait span{color:var(--ink-3)}',
    '.bx-app .tv-line .i{width:16px;height:16px;color:var(--ink-3)}',
    '.bx-app .meta.bx-go{color:var(--accent);font-weight:700}.bx-app .meta.bx-go .i{width:14px;height:14px}',
    // 위쪽 막대는 모든 화면에서 오늘 화면과 같게(로고 + 설명서·검색·더보기). 주간·월간 제목과 이동 단추는 화면 안 제목 줄에
    '.bx-app .screen.week .page-head h1,.bx-app .screen.month .page-head h1{display:block}',
    '.bx-app .screen.week .page-head .ph-nav,.bx-app .screen.month .page-head .ph-nav{display:flex}',
    '.bx-app .screen.week .page-head p,.bx-app .screen.month .page-head p{margin-top:8px}',
    // 루틴 창 '다시 알림': 이름 · 숫자 · 단위를 한 줄에 맞춰 정렬
    '.bx-app .bx-rrow{display:grid;grid-template-columns:52px auto 1fr;align-items:center;gap:12px;margin-top:8px}',
    '.bx-app .bx-rl{font-size:15px;font-weight:700;color:var(--ink-2)}.bx-app .bx-ru{font-size:15px;font-weight:600;color:var(--ink-2)}',
    '.bx-app .bx-rnote{margin:6px 0 0;color:var(--ink-3)}',
    // 오늘 화면 정리: 요약 칸을 낮게, 칸마다 접기, 루틴은 '지금 할 일'만 보이고 단계는 눌러서
    '.bx-app .screen.today .tc-head{padding-top:14px}',
    '.bx-app .screen.today .tc-title h1{font-size:24px}',
    '.bx-app .tc-tiles{gap:6px}',
    '.bx-app .tc-tile{min-height:0;padding:8px 11px;gap:2px;border-radius:14px}',
    '.bx-app .tc-tile b{font-size:20px}.bx-app .tc-tile b small{font-size:12.5px}.bx-app .tc-tile .ring{width:20px;height:20px}',
    '.bx-app .tc-l{font-size:12px}',
    '.bx-app .tc-next{margin-top:10px;padding:8px 12px 8px 10px}',
    '.bx-app .bx-fold-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:10px;color:var(--ink-3);flex:none;margin-left:-4px}',
    '.bx-app .bx-fold-btn .i,.bx-app .bx-rt-tog .i{width:18px;height:18px;transition:transform .15s}',
    '.bx-app .bx-fold-btn[aria-expanded="false"] .i{transform:rotate(-90deg)}',
    '.bx-app .sec-h.bx-foldable h2{cursor:pointer}',
    '.bx-f-rt .rt-sec > :not(.sec-h){display:none!important}',
    '.bx-f-today .tc-body > .sec-h:has(#h-today) ~ *{display:none!important}',
    '.bx-f-today .it-sub > .sec-h ~ *{display:none!important}',
    '.bx-f-tt .bx-tts > .sec-h ~ *{display:none!important}',
    // 홈 개편: 요약 상자 + '오늘 할 일' 상자, 오른쪽 아래 + 단추
    '.bx-app .screen.today .home-col{gap:14px!important}',
    '.bx-app .bx-sumcard .tc-head{padding:6px 0 2px}',
    '.bx-app .bx-todo .bx-todo-h{margin-top:4px!important}',
    '.bx-app .screen.today .bx-todo .rt-sec .sec-h h2,.bx-app .screen.today .bx-todo .bx-sub .sec-h h2{font-size:13px!important;font-weight:500;color:var(--ink-2);letter-spacing:0}',
    '.bx-app .bx-todo .rt-sec .sec-h .sec-sub,.bx-app .bx-todo .bx-sub .sec-h .sec-sub{font-size:13px}',
    '.bx-app .screen.today .bx-todo .grp-h.warn{background:transparent;padding:6px 0 2px;margin:0;font-size:13px;font-weight:500}',
    '.bx-app .screen.today .bx-todo .grp-h{font-size:13px;font-weight:500;color:var(--ink-2)}',
    '.bx-app .bx-todo .rt-sec .sec-h,.bx-app .bx-todo .bx-sub .sec-h{margin-top:18px}',
    '.bx-app .bx-todo .bx-sub + .bx-sub,.bx-app .bx-todo .rt-sec + .bx-sub{border-top:1px solid var(--line);margin-top:14px}',
    '.bx-app .bx-todo-empty{margin:14px 0 4px}',
    '#tcard2{touch-action:pan-y}#tcard2.slide-l .tc-body{animation:slideL .24s ease-out}#tcard2.slide-r .tc-body{animation:slideR .24s ease-out}',
    '.bx-app .bx-fab{position:fixed;right:max(18px,env(safe-area-inset-right,0px));bottom:calc(var(--dock-h) + env(safe-area-inset-bottom,0px) + 16px);z-index:41;width:60px;height:60px;border-radius:50%;border:0;background:var(--accent);color:var(--accent-ink);display:none;align-items:center;justify-content:center;box-shadow:0 8px 22px color-mix(in srgb,var(--accent) 40%,transparent),0 2px 6px rgba(0,0,0,.16);-webkit-touch-callout:none;user-select:none;-webkit-user-select:none;cursor:pointer}',
    '.bx-app .bx-fab .i{width:28px;height:28px;stroke-width:2.4}',
    // 홈 요약 두 줄 · 글자 계층(대표 결정 10/31): 굵기는 보통 400 · 중간 500 · 굵게 700만
    '.bx-app .screen.today .home-col > section.bx-sumcard{padding:6px 10px 12px}',
    '.bx-app .bx-sumcard .tc-head{padding:0}',
    '.bx-app .bx-sum-date{display:flex;align-items:center;gap:4px}',
    '.bx-app .bx-sum-nav{width:44px;height:44px;flex:none;border-radius:22px;display:flex;align-items:center;justify-content:center;color:var(--ink-2)}',
    '.bx-app .bx-sum-nav .i{width:20px;height:20px}',
    '.bx-app .bx-sum-nav:active{background:var(--sunk)}',
    '.bx-app .bx-sum-mid{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.bx-app .bx-sum-top{display:flex;align-items:center;gap:6px;min-height:18px;font-size:12px;line-height:1}',
    '.bx-app .bx-sum-rel{color:var(--accent);font-weight:700}',
    '.bx-app .bx-sum-rel2{color:var(--ink-2);font-weight:500}',
    '.bx-app .bx-sum-back{display:inline-flex;align-items:center;gap:3px;height:22px;padding:0 8px;border-radius:11px;background:var(--accent-soft);color:var(--accent);font-size:12px;font-weight:700}',
    '.bx-app .bx-sum-back .i{width:12px;height:12px}',
    '.bx-app .bx-sum-hol{color:var(--sun);font-weight:500}',
    '.bx-app .bx-sum-d{margin:0;font-size:20px;font-weight:700;letter-spacing:-.02em;line-height:1.3;white-space:nowrap}',
    '.bx-app .bx-sum-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}',
    '.bx-app .bx-st{display:flex;align-items:center;justify-content:center;gap:6px;min-height:46px;padding:0 6px;border-radius:12px;background:var(--sunk);color:var(--ink)}',
    '.bx-app .bx-st span{font-size:13px;color:var(--ink-2);font-weight:500;white-space:nowrap}',
    '.bx-app .bx-st b{font-size:17px;font-weight:700;line-height:1}',
    '.bx-app .bx-st b small{font-size:13px;font-weight:500;color:var(--ink-2)}',
    '.bx-app .bx-st.warn{background:var(--warn-soft)}.bx-app .bx-st.warn span,.bx-app .bx-st.warn b{color:var(--warn-ink)}',
    '.bx-app .bx-st.zero b{color:var(--ink-3)}',
    '.bx-app .bx-st:active{filter:brightness(.96)}',
    '.bx-app .bx-todo .bx-todo-h h2{font-size:17px!important;font-weight:700}',
    '.bx-app .bx-todo .row-title{font-size:15.5px;font-weight:400}',
    '.bx-app .bx-todo .row-time b{font-size:15px;font-weight:500}',
    '.bx-app .bx-todo .row.bx-next{background:var(--accent-soft)}',
    '.bx-app .bx-todo .row.bx-next .row-time b{color:var(--accent);font-weight:700}',
    '.bx-app .bx-todo .row.bx-next .row-title{font-weight:500}',
    '.bx-app .bx-next-tag{color:var(--accent);font-weight:500}',
    '.bx-app .bx-todo .rt-card{border:0;border-bottom:1px solid var(--line);border-radius:0;margin:0!important;padding:8px 0 10px!important;background:transparent;box-shadow:none}',
    '.bx-app .bx-todo .rt-sec .rt-card:last-child{border-bottom:0}',
    '.bx-app .bx-todo .rt-card.bx-miss{box-shadow:none;border-color:var(--line)}',
    '.bx-app .bx-todo .rt-card.bx-miss .rt-note{display:none}',
    '.bx-app .bx-todo .rt-h b{font-size:15.5px;font-weight:500}',
    '.bx-app .bx-todo .bx-miss-line{background:transparent;padding:2px 0;margin:2px 0 0;font-size:13px;font-weight:500}',
    '.bx-app .bx-todo .bx-miss-line .btn{margin-left:auto}',
    '.bx-app .page-head h1{font-weight:700}',
    '.bx-app .sec-h h2{font-weight:700}',
    // 흐린 글자가 너무 옅어 읽기 어렵던 것(흰 바탕 대비 4.5:1 이상으로)
    '@media (prefers-color-scheme:light){html.bx-app:not([data-theme="dark"]){--ink-3:#6E7581}}',
    'html.bx-app[data-theme="light"]{--ink-3:#6E7581}',
    // '확인이 필요한 일' 창, 이 화면 사용법, 데이터 초기화 접기
    '.bx-app .bx-late-h{margin:10px 0 4px;font-size:13px;font-weight:500;color:var(--ink-2)}',
    '.bx-app .bx-late-rt{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}',
    '.bx-app .bx-late-rt > div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}',
    '.bx-app .bx-late-rt b{font-size:15px;font-weight:500}.bx-app .bx-late-rt span{font-size:13px;color:var(--warn-ink)}',
    '.bx-app .bx-help{margin:0;padding:0 0 0 22px;display:flex;flex-direction:column;gap:14px;font-size:15px;line-height:1.6;color:var(--ink)}',
    '.bx-app details.bx-reset > summary{display:flex;flex-direction:column;gap:3px;cursor:pointer;list-style:none;font-size:16px;font-weight:700;color:var(--danger);min-height:44px;justify-content:center}',
    '.bx-app details.bx-reset > summary small{font-size:13px;font-weight:400;color:var(--ink-2)}',
    '.bx-app details.bx-reset > summary::-webkit-details-marker{display:none}',
    '.bx-app details.bx-reset:not([open]){box-shadow:var(--card-sh)}',
    '.bx-app details.bx-reset[open] > summary{margin-bottom:10px}',
    // 루틴 페이지: 새 루틴 단추, 알람 스위치 글자, 템플릿 고르기
    // 새 루틴: 루틴 화면의 파란 단추 하나(정리판 9번)
    '.bx-app .bx-rt-new{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:52px;margin-top:12px;border-radius:14px;border:0;color:var(--accent-ink);font-size:15.5px;font-weight:700;background:var(--accent)}',
    '.bx-app .bx-rt-new .i{width:18px;height:18px}',
    '.bx-app .bx-togw{display:flex;flex-direction:column;align-items:center;gap:2px;flex:none}',
    '.bx-app .bx-togw small{font-size:11px;color:var(--ink-2)}',
    '.bx-app .bx-tpls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '.bx-app .bx-tpl{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px;border-radius:14px;border:1px solid var(--line);background:var(--bg);text-align:left;min-height:84px}',
    '.bx-app .bx-tpl-i{width:30px;height:30px;border-radius:9px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;margin-bottom:2px}',
    '.bx-app .bx-tpl-i .i{width:17px;height:17px}',
    '.bx-app .bx-tpl b{font-size:14.5px;font-weight:700}.bx-app .bx-tpl small{font-size:12px;color:var(--ink-2)}',
    '.bx-app .bx-late-h small{font-weight:400;margin-left:6px;color:var(--ink-3)}',
    '.bx-app .bx-rt-blank{display:flex;align-items:center;gap:12px;width:100%;margin-top:18px;padding:12px;border-radius:14px;border:1px solid var(--line);background:var(--bg);text-align:left;color:var(--ink)}',
    '.bx-app .bx-rt-blank > .i{width:20px;height:20px;color:var(--ink-2);flex:none}',
    '.bx-app .bx-rt-blank span{flex:1;display:flex;flex-direction:column;gap:2px}.bx-app .bx-rt-blank b{font-size:14.5px;font-weight:700}.bx-app .bx-rt-blank small{font-size:12px;color:var(--ink-2)}',
    // 루틴 고치기: 소리 ▶, 아이콘 접기, 맨 아래 삭제
    '.bx-app .bx-sndrow{display:flex;align-items:center;gap:8px}',
    '.bx-app .bx-play{width:44px;height:44px;flex:none;border-radius:22px;border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;color:var(--ink)}',
    '.bx-app .bx-play .i{width:16px;height:16px}',
    '.bx-app .bx-icdet > summary{list-style:none;cursor:pointer}',
    '.bx-app .bx-icdet > summary::-webkit-details-marker{display:none}',
    '.bx-app .bx-icsum{display:flex;align-items:center;gap:10px;min-height:52px;padding:0 12px;border-radius:14px;border:1px solid var(--line)}',
    '.bx-app .bx-icsum-i{width:32px;height:32px;border-radius:10px;background:var(--sunk);display:flex;align-items:center;justify-content:center;color:var(--ink-2);flex:none}',
    '.bx-app .bx-icsum-i .i{width:18px;height:18px}',
    '.bx-app .bx-icsum-t{flex:1;font-size:14.5px;font-weight:500}.bx-app .bx-icsum-t small{display:block;font-size:12px;font-weight:400;color:var(--ink-2)}',
    '.bx-app .bx-icsum-c{font-size:13px;font-weight:700;color:var(--accent)}',
    '.bx-app .bx-icdet[open] .bx-icsum-c{color:var(--ink-2)}',
    '.bx-app .bx-icdet .bx-icpick{margin-top:10px}',
    '.bx-app .bx-rdel{display:flex;justify-content:center;margin:18px 0 4px}',
    '.bx-app .bx-del-link{min-height:44px;padding:0 12px;color:var(--danger);font-size:14.5px;font-weight:700;background:transparent}',
    // 직접 입력 칸(시간표 알림·명상 시간)
    '.bx-app .tt-remc,.bx-app .bx-med-cmin{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:14.5px;color:var(--ink-2)}',
    '.bx-app .tt-remc[hidden]{display:none}',
    // 첫 실행 · 루틴 도우미(한 화면에 하나, 여백 넉넉히)
    '#bx-start{position:fixed;inset:0;z-index:120;background:var(--bg);overflow-y:auto;-webkit-overflow-scrolling:touch}',
    '#bx-start .bxs-in{min-height:100%;box-sizing:border-box;max-width:560px;margin:0 auto;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 14px) 22px calc(env(safe-area-inset-bottom,0px) + 24px)}',
    '#bx-start .bxs-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px}',
    '#bx-start .bxs-dots{display:flex;gap:6px}#bx-start .bxs-dots span{width:6px;height:6px;border-radius:3px;background:var(--line-2)}#bx-start .bxs-dots span.on{width:22px;background:var(--accent)}#bx-start .bxs-dots span.done{background:var(--accent)}',
    '#bx-permbar{display:flex;align-items:center;gap:10px;margin:10px 16px 0;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--danger) 12%,var(--bg));color:var(--danger);font-size:14px;font-weight:600;line-height:1.45}#bx-permbar span{flex:1}#bx-permbar .btn{flex:none}',
    '#bx-start .bxs-skip{min-height:44px;padding:0 6px;color:var(--ink-2);font-size:14px;background:transparent}',
    '#bx-start .bxs-back-i{width:44px;height:44px;margin-left:-12px;display:flex;align-items:center;justify-content:center;color:var(--ink)}#bx-start .bxs-back-i .i{width:22px;height:22px}',
    '#bx-start .bxs-tt{flex:1;font-size:15px;font-weight:700;color:var(--ink-2)}',
    '#bx-start .bxs-h{margin:22px 0 0;font-size:26px;font-weight:700;letter-spacing:-.02em;line-height:1.3}',
    '#bx-start .bxs-h.big{margin-top:40px;font-size:27px;line-height:1.35}',
    '#bx-start .bxs-h2{margin:28px 0 10px;font-size:16px;font-weight:700}',
    '#bx-start .bxs-p{margin:10px 0 0;font-size:15px;line-height:1.6;color:var(--ink-2)}#bx-start .bxs-p.small{font-size:13px;margin-top:8px}',
    '#bx-start .bxs-list{display:flex;flex-direction:column;gap:12px;margin-top:26px}',
    '#bx-start .bxs-opt,#bx-start .bxs-card,#bx-start .bxs-res,.bx-app .bx-nudge{display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;text-align:left;color:var(--ink)}',
    '#bx-start .bxs-opt{border:2px solid var(--line);background:var(--bg);min-height:72px}',
    '#bx-start .bxs-opt[aria-checked="true"],#bx-start .bxs-opt.fixed{border-color:var(--accent);background:var(--accent-soft)}',
    '#bx-start .bxs-card{background:var(--sunk);align-items:flex-start;padding:16px}',
    '#bx-start .bxs-ic,.bx-app .bx-nudge .bxs-ic{width:40px;height:40px;flex:none;border-radius:12px;background:var(--bg);color:var(--accent);display:flex;align-items:center;justify-content:center}',
    '#bx-start .bxs-ic .i,.bx-app .bx-nudge .bxs-ic .i{width:21px;height:21px}',
    '#bx-start .bxs-t,.bx-app .bx-nudge .bxs-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}',
    '#bx-start .bxs-t b,.bx-app .bx-nudge .bxs-t b{font-size:16px;font-weight:700}#bx-start .bxs-t small,.bx-app .bx-nudge .bxs-t small{font-size:13.5px;line-height:1.55;color:var(--ink-2)}',
    '#bx-start .bxs-cn{display:flex;align-items:center;gap:6px;flex-wrap:wrap}#bx-start .bxs-cn em{font-style:normal;font-size:11.5px;font-weight:700;color:var(--ink-2);border:1px solid var(--line-2);border-radius:9px;padding:1px 7px}',
    // 루틴 도우미 2/2 넣을 단계(골라 둔 채로, 한 줄에 하나)
    '#bx-start .bxr-steps{display:flex;flex-direction:column;gap:8px;margin-top:22px}#bx-start .bxr-st{display:flex;align-items:center;gap:14px;min-height:56px;padding:0 16px;border-radius:14px;border:1px solid var(--line-2);background:var(--bg);color:var(--ink);text-align:left}',
    '#bx-start .bxr-st b{flex:1;min-width:0;font-size:16.5px;font-weight:500}#bx-start .bxr-st small{font-size:14px;color:var(--ink-2)}#bx-start .bxr-st.on{border-color:var(--accent);background:var(--accent-soft)}#bx-start .bxr-st.on b{font-weight:700}',
    '#bx-start .bxr-addbox{display:flex;gap:8px;margin-top:10px}#bx-start .bxr-addbox input{flex:1;min-width:0;min-height:52px;padding:0 14px;border-radius:12px;border:1px solid var(--accent);background:var(--bg);color:var(--ink);font:inherit;font-size:16px}#bx-start .bxr-addbox .btn{min-height:52px}',
    '#bx-start .bxs-chk{width:26px;height:26px;flex:none;border-radius:8px;border:2px solid var(--line-2);display:flex;align-items:center;justify-content:center;color:var(--accent-ink)}#bx-start .bxs-chk.on{background:var(--accent);border-color:var(--accent)}#bx-start .bxs-chk .i{width:16px;height:16px;stroke-width:2.6}',
    '#bx-start .bxs-sp{flex:1;min-height:24px}',
    '#bx-start .bxs-go{width:100%;min-height:56px;font-size:17px;border-radius:16px}',
    '#bx-start .bxs-go[disabled]{opacity:.45}',
    // 다음·시작하기 단추는 늘 화면 아래에 보이게(첫 실행 2단계 '시작하기'가 화면 밖에 있던 문제 11/1)
    '#bx-start .bxs-in > .bxs-go,#bx-start .bxs-in > .bxs-row{position:sticky;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);z-index:3;box-shadow:0 -16px 16px 2px var(--bg)}#bx-start .bxs-in > .bxs-row{background:var(--bg)}#bx-start .bxs-in > .bxs-go[disabled]{opacity:1;background:var(--sunk);color:var(--ink-3)}',
    '#bx-start .bxs-row{display:flex;gap:10px}#bx-start .bxs-row .bxs-go{flex:1;width:auto}#bx-start .bxs-back{min-height:56px;padding:0 22px;border-radius:16px}',
    '#bx-start .bxs-dock{display:grid;margin:0 -22px 16px;height:58px;border-top:1px solid var(--line);font-size:12px;font-weight:700;color:var(--ink-3)}#bx-start .bxs-dock span{display:flex;align-items:center;justify-content:center}#bx-start .bxs-dock span.on{color:var(--accent)}',
    '#bx-start .bxs-prog{height:6px;border-radius:3px;background:var(--line);margin-top:12px;overflow:hidden}#bx-start .bxs-prog span{display:block;height:100%;border-radius:3px;background:var(--accent)}',
    '#bx-start .bxs-pn{align-self:flex-end;margin-top:6px;font-size:13px;font-weight:700;color:var(--ink-2)}',
    '#bx-start .bxs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:34px}#bx-start .bxs-grid.wide{grid-template-columns:1fr}',
    '#bx-start .bxs-big{display:flex;align-items:center;justify-content:center;min-height:58px;padding:0 16px;border-radius:16px;border:1px solid var(--line-2);background:var(--bg);font-size:18px;font-weight:700;color:var(--ink);text-align:center}',
    '#bx-start .bxs-big.on,#bx-start .bxs-cust.on{border:2px solid var(--accent);background:var(--accent-soft);color:var(--accent)}',
    '#bx-start .bxs-cust{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:54px;margin-top:12px;border-radius:16px;border:1px dashed var(--line-2);background:var(--bg);font-size:16px;font-weight:700;color:var(--ink)}#bx-start .bxs-cust .i{width:18px;height:18px}',
    '#bx-start .bxs-custbox{display:flex;align-items:center;gap:12px;margin-top:10px;padding:10px 14px;border-radius:14px;background:var(--accent-soft);font-size:15px;color:var(--ink-2)}',
    '#bx-start .bxs-custbox input{flex:1;min-height:50px;padding:0 12px;border-radius:12px;border:1px solid var(--accent);background:var(--bg);color:var(--ink);font:inherit;font-size:20px;font-weight:700}',
    '#bx-start .bxs-links{display:flex;justify-content:center;gap:28px;margin-top:22px}#bx-start .bxs-links button{min-height:44px;padding:0 8px;font-size:15px;color:var(--ink-2);text-decoration:underline;text-underline-offset:4px;background:transparent}#bx-start .bxs-links button.on{color:var(--accent);font-weight:700}',
    '#bx-start .bxs-box{display:flex;flex-direction:column;margin-top:24px;border:1px solid var(--line);border-radius:18px}#bx-start .bxs-res{border-bottom:1px solid var(--line);border-radius:0}#bx-start .bxs-res:last-child{border-bottom:0}',
    '#bx-start .bxs-chips{display:flex;flex-wrap:wrap;gap:8px}#bx-start .bxs-chip{min-height:42px;padding:0 14px;border-radius:21px;border:1px solid var(--line-2);background:var(--bg);font-size:14px;color:var(--ink)}',
    // 옆으로 밀 때 화면이 가로로 밀리거나 늘어나지 않게(아래 메뉴가 같이 움직이던 문제 10/31)
    'html.bx-app{overflow-x:hidden;overscroll-behavior:none}html.bx-app body{overflow-x:clip;overscroll-behavior:none}.bx-app #tcard,.bx-app #tcard2{overflow-x:clip;touch-action:pan-y}',
    // 일정 꾹 누르기 메뉴: 지우기는 주의 색, 꾹 누르는 동안 글자가 잡히지 않게
    '.bx-app .menu-row.bx-im-del .ml,.bx-app .menu-row.bx-im-del .mi{color:var(--danger,#C62828)}.bx-app .row .row-main,.bx-app .c-chip{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}',
    '.bx-app .bx-bowl-picks{margin-top:8px}',
    // 루틴 고치기 창 '알려 주는 방식'(대표 결정 11/1): 설정의 잠금 화면 고르기와 같은 모양
    '.bx-app .bx-notify .bx-lockset{margin-top:4px;padding-top:0;border-top:0}.bx-app .bx-notify .bx-lock-o:last-child{border-bottom:0}.bx-app #bx-rrep,.bx-app #bx-rbowl{margin-top:6px}',
    // 명상: '소리와 호흡' 접힌 줄(지금 고른 값이 보임)
    '.bx-app .bx-med-more{margin-top:16px;border-top:1px solid var(--line)}.bx-app .bx-med-more > summary{display:flex;align-items:center;gap:10px;min-height:60px;list-style:none;cursor:pointer}.bx-app .bx-med-more > summary::-webkit-details-marker{display:none}',
    '.bx-app .bx-mm-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.bx-app .bx-mm-t b{font-size:15.5px}.bx-app .bx-mm-t small{font-size:13px;color:var(--ink-2)}.bx-app .bx-med-more > summary .i{width:18px;height:18px;color:var(--ink-3);transition:transform .15s}.bx-app .bx-med-more[open] > summary .i{transform:rotate(90deg)}',
    // ⋯ 메뉴 다크 모드 줄: 스위치 모양(지금 화면이 어두우면 켜짐)
    '.bx-app .bx-dm-row[aria-pressed="true"] .tog{background:var(--accent)}.bx-app .bx-dm-row[aria-pressed="true"] .tog i{transform:translateX(20px)}',
    // 캘린더 머리: ‹ 10월 › 가운데, 월간|주간 작은 칩
    '.bx-app .page-head.bx-ch{display:flex;flex-direction:column;align-items:stretch;gap:0;margin:0 0 10px;padding-top:4px}',
    '.bx-app .bx-ch-top{display:flex;align-items:center;gap:8px;min-height:36px}.bx-app .bx-ch-top .tt-mode{margin:0;flex:1;justify-content:flex-start}',
    '.bx-app .bx-ch-top .seg{width:auto!important;padding:3px;border-radius:11px;grid-template-columns:auto auto}.bx-app .bx-ch-top .seg button{height:30px;padding:0 13px;font-size:13px;border-radius:9px}',
    '.bx-app .bx-ch-today{flex:none;height:32px;padding:0 12px;border-radius:16px;border:1px solid var(--line-2);background:var(--bg);font-size:13px;font-weight:700;color:var(--accent)}',
    '.bx-app .bx-ch-mid{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:6px}.bx-app .bx-ch-mid h1{margin:0;min-width:110px;text-align:center;font-size:22px;line-height:1.2}',
    '.bx-app .bx-ch-mid .nav-btn{width:40px;height:40px;border:0;background:transparent;border-radius:20px;color:var(--ink)}.bx-app .bx-ch-mid .nav-btn:active{background:var(--sunk)}.bx-app .bx-ch-mid .nav-btn .i{width:22px;height:22px}',
    '.bx-app .page-head.bx-ch>p{margin:2px 0 0;text-align:center;font-size:13px;color:var(--ink-2)}',
    // 시간표: 머리는 제목만, 도구는 아래 메뉴 위 툴바
    '.bx-app .bx-tt-head{margin-bottom:8px}.bx-app .bx-tt-head h1{font-size:22px}.bx-app .bx-tt-head p{font-size:13px}',
    '.bx-app .bx-ttbar{position:fixed;left:0;right:0;bottom:calc(var(--dock-h) + env(safe-area-inset-bottom,0px));z-index:39;display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px;padding:8px 12px;background:color-mix(in srgb,var(--bg) 96%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--line)}',
    '.bx-app .bx-ttb{display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;border-radius:14px;border:1px solid var(--line-2);background:var(--bg);font-size:14px;font-weight:700;color:var(--ink)}.bx-app .bx-ttb .i{width:19px;height:19px}',
    '.bx-app .bx-ttb.main{border-color:var(--accent);background:var(--accent);color:var(--accent-ink)}',
    'html.bx-ttbar-on .content{padding-bottom:calc(var(--dock-h) + env(safe-area-inset-bottom,0px) + 76px)}html.bx-ttbar-on #toasts{bottom:calc(var(--dock-h) + env(safe-area-inset-bottom,0px) + 72px)}',
    // 빈 홈의 예시 문장, + 단추 팁
    '.bx-app .bx-empty-ex{padding:14px 0 6px}.bx-app .bx-empty-ex .bx-todo-empty{padding:0;margin:0 0 10px;text-align:left}.bx-app .bx-ex-chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.bx-app .bx-ex{min-height:40px;padding:0 14px;border-radius:20px;border:1px solid var(--line-2);background:var(--bg);font-size:14px;color:var(--ink)}',
    // 새 일정: 자주 넣은 말
    '.bx-app .bx-freq{margin-top:12px}.bx-app .bx-freq-h{display:block;font-size:13px;font-weight:500;color:var(--ink-2);margin-bottom:6px}.bx-app .bx-freq-c{display:flex;flex-wrap:wrap;gap:8px}',
    '.bx-app .bx-freq-b{min-height:38px;padding:0 12px;border-radius:19px;border:1px solid var(--line-2);background:var(--bg);font-size:13.5px;color:var(--ink)}',
    // 확인 필요 창
    '.bx-app .bx-late-p{margin:0 0 4px}.bx-app .bx-lc{border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:10px}.bx-app .bx-lc-t{display:flex;flex-direction:column;gap:2px}.bx-app .bx-lc-t b{font-size:15.5px}.bx-app .bx-lc-t small{font-size:13px;color:var(--ink-2)}',
    '.bx-app .bx-lc-a{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.bx-app .bx-lc-a .btn{min-height:46px;justify-content:center}',
    '.bx-app .bx-late-ok{display:flex;align-items:center;gap:8px;min-height:50px;padding:0 14px;border-radius:14px;background:var(--sunk);font-size:14.5px;color:var(--ink-2)}.bx-app .bx-late-ok .i{width:18px;height:18px;color:var(--accent);stroke-width:2.4}',
    // 시간표 도우미
    '#bx-start .bxt-in{display:flex;align-items:flex-start;gap:8px;margin-top:22px;padding:12px 8px 12px 14px;border-radius:16px;border:2px solid var(--accent);background:var(--bg)}',
    '#bx-start .bxt-in textarea{flex:1;min-width:0;border:0;outline:0;resize:none;background:transparent;font:inherit;font-size:16px;line-height:1.6;color:var(--ink)}#bx-start .bxt-in .bx-mic{width:44px;height:44px;flex:none;border-radius:22px;background:var(--accent-soft);color:var(--accent)}',
    '#bx-start .bxt-prev{display:flex;flex-direction:column;gap:8px;margin-top:16px}#bx-start .bxt-ph{font-size:13px;font-weight:500;color:var(--ink-2)}',
    '#bx-start .bxt-row{display:flex;align-items:center;gap:12px;min-height:58px;padding:0 14px;border-radius:14px;background:var(--sunk)}#bx-start .bxt-row.bad small{color:var(--warn-ink)}#bx-start .bxt-bar{width:4px;height:30px;flex:none;border-radius:2px;background:var(--c)}#bx-start .bxt-row.bad .bxt-bar{background:var(--line-2)}',
    // 홈 화면 위젯 창(설정 › 화면), 지난 일정 카드 안 날짜 칸, 루틴을 펼친 곳의 '오늘 쉬기'
    '.bx-app .bx-wg-row{display:flex;align-items:center;gap:12px;min-height:64px;padding:10px 0;border-bottom:1px solid var(--line)}.bx-app .bx-wg-row .bxs-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.bx-app .bx-wg-row b{font-size:15.5px}.bx-app .bx-wg-row small{font-size:13px;color:var(--ink-2);line-height:1.5}',
    '.bx-app .bx-wg-row .btn{min-width:64px;min-height:44px;justify-content:center}.bx-app .bx-wg-on{display:flex;align-items:center;gap:4px;font-size:13.5px;color:var(--ink-2)}.bx-app .bx-wg-on .i{width:16px;height:16px;color:var(--accent)}',
    '.bx-app .bx-lc-pick{display:flex;gap:8px;margin-top:10px}.bx-app .bx-lc-pick .inp{flex:1;min-width:0;min-height:46px}.bx-app .bx-lc-pick .btn{min-height:46px}',
    // 작게 보이는 단추도 누르는 범위는 44px 안팎(보이는 크기는 그대로, 점검 11/1)
    '.bx-app .rt-chk,.bx-app .bx-fold-btn,.bx-app .bx-sum-back,.bx-app .rdays-q .sec-link,.bx-app .bx-ch-top .seg button,.bx-app .tt-sw,.bx-app .bx-rt-tog{position:relative}',
    '.bx-app .rt-chk::after{content:"";position:absolute;inset:-9px}.bx-app .bx-fold-btn::after{content:"";position:absolute;inset:-6px}',
    '.bx-app .bx-sum-back::after{content:"";position:absolute;inset:-11px -4px}.bx-app .rdays-q .sec-link::after{content:"";position:absolute;inset:-4px -2px}.bx-app .bx-ch-top .seg button::after{content:"";position:absolute;inset:-7px 0}.bx-app .tt-sw::after{content:"";position:absolute;inset:-6px}.bx-app .bx-rt-tog::after{content:"";position:absolute;inset:-7px 0}',
    '.bx-app .bx-file-btn{display:inline-flex;align-items:center;gap:6px;margin-top:6px}.bx-app .bx-file-btn .i{width:18px;height:18px}',
    '.bx-app .bx-del-btn{gap:6px;color:var(--danger,#C62828);padding:0 16px}.bx-app .bx-del-btn .i{width:18px;height:18px}',
    '.bx-app .bx-rt-foot{display:flex;justify-content:flex-end;padding:4px 0 2px}.bx-app .bx-rt-foot .sec-link{min-height:44px;padding:0 6px}.bx-app .rt-card:not(.bx-open) .bx-rt-foot{display:none}',
    // 설정: 울리는 방식
    '.bx-app .bx-lvset{display:flex;flex-direction:column;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.bx-app .bx-lv-fix{font-size:14px;color:var(--ink-2)}.bx-app .bx-lv-note{margin-top:6px}',
    // 캘린더: 휴대폰 캘린더 일정은 회색 테두리
    '.bx-app .c-chip[data-item^="pc_"]{background:transparent;border:1px solid var(--ink-3);border-left-width:1px}',
    '.bx-app .bx-cal-lg{display:flex;gap:10px;margin-left:auto;font-size:12.5px;color:var(--ink-2)}.bx-app .bx-cal-lg span{display:flex;align-items:center;gap:5px}.bx-app .bx-cal-lg i{width:10px;height:10px;border-radius:3px;box-sizing:border-box}.bx-app .bx-cal-lg i.bx{background:var(--accent)}.bx-app .bx-cal-lg i.pc{border:1.5px solid var(--ink-3)}',
    '.bx-app .tt-mode{display:flex;align-items:center;gap:10px}',
    // 내가 쓸 기능
    '.bx-app .bx-ft-h{margin:6px 0 2px;font-size:15px;font-weight:700}.bx-app .bx-ft-h+p+.bx-ft-row,.bx-app .bx-ft-row{display:flex;align-items:center;gap:10px;min-height:52px;border-bottom:1px solid var(--line);font-size:15px}.bx-app .bx-ft-row>span:first-child{flex:1}',
    '.bx-app .bx-ft-chips{display:flex;flex-wrap:wrap;gap:8px}.bx-app .bx-ft-chip{display:flex;align-items:center;gap:6px;min-height:42px;padding:0 14px;border-radius:21px;border:1px solid var(--line-2);background:var(--bg);font-size:14px;color:var(--ink)}',
    '.bx-app .bx-ft-chip.on{padding-left:8px;border-color:var(--accent);background:var(--accent);color:var(--accent-ink);font-weight:700}.bx-app .bx-ft-chip em{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:11px;background:var(--bg);color:var(--accent);font-style:normal;font-size:12px}',
    '.bx-app .bx-ft-chip .i{width:16px;height:16px;stroke-width:2.6}',
    '.bx-app .bx-ft-chip.off{border-style:dashed;background:var(--sunk);color:var(--ink-2)}.bx-app .bx-ft-pv-h{display:block;margin-top:14px;font-size:13px;font-weight:500;color:var(--ink-2)}',
    '.bx-app .bx-ft-pv{display:grid;height:50px;margin-top:6px;border:1px solid var(--line);border-radius:14px;font-size:12.5px;font-weight:700;color:var(--ink-2)}.bx-app .bx-ft-pv span{display:flex;align-items:center;justify-content:center}.bx-app .bx-ft-pv span.on{color:var(--accent)}',
    // 첫 실행 2: 알람 허락 예고 줄
    '#bx-start .bxs-note{display:flex;align-items:center;gap:10px;margin-top:14px;padding:12px 14px;border-radius:14px;border:1px solid var(--line);font-size:13.5px;line-height:1.5;color:var(--ink-2)}#bx-start .bxs-note .i{width:20px;height:20px;flex:none;color:var(--accent)}',
    // 루틴 도우미 결과: 거꾸로 짠 시각표
    '#bx-start .bxs-res.col{flex-direction:column;align-items:stretch;gap:8px;padding:14px 16px}#bx-start .bxs-rh{display:flex;align-items:center;gap:10px}#bx-start .bxs-rh .bx-togw{display:flex;flex-direction:row;align-items:center;gap:8px;font-size:13px;color:var(--ink-2)}',
    '#bx-start .bxs-tl{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-direction:column}#bx-start .bxs-tl li{display:flex;align-items:center;gap:12px;min-height:34px;font-size:15px}',
    '#bx-start .bxs-tl .bxs-tm{width:46px;flex:none;font-size:14px;font-weight:500;color:var(--ink-2);font-variant-numeric:tabular-nums}#bx-start .bxs-tl i{width:8px;height:8px;flex:none;border-radius:4px;background:var(--accent)}',
    '#bx-start .bxs-tl .bxs-sm{margin-left:auto;font-size:13px;color:var(--ink-2)}#bx-start .bxs-tl li.lv{font-weight:700}#bx-start .bxs-tl li.lv .bxs-tm{color:var(--ink);font-weight:700}#bx-start .bxs-flag{display:flex;width:8px;justify-content:center;color:var(--accent)}#bx-start .bxs-flag .i{width:14px;height:14px;stroke-width:2.2}',
    // 알람 허락
    '#bx-start .bxp-ic{display:flex;align-items:center;justify-content:center;width:52px;height:52px;margin-top:18px;border-radius:16px;background:var(--accent-soft);color:var(--accent)}#bx-start .bxp-ic .i{width:28px;height:28px}',
    '#bx-start .bxp-list{list-style:none;padding:0}#bx-start .bxp-row{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--line)}#bx-start .bxp-row:last-child{border-bottom:0}#bx-start .bxp-row .btn{flex:none;min-height:42px}',
    '#bx-start .bxp-ok{display:flex;align-items:center;gap:4px;flex:none;font-size:14px;font-weight:700;color:var(--accent)}#bx-start .bxp-ok .i{width:18px;height:18px;stroke-width:2.4}#bx-start .bxp-tag{font-size:12px;font-weight:500;color:var(--ink-2)}',
    '#bx-start .bxs-test{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;margin-bottom:10px;border-radius:16px;font-size:15.5px}#bx-start .bxs-test .i{width:19px;height:19px}#bx-start .bxs-test[disabled]{opacity:.45}',
    '#bx-start .bxp-later{width:100%;min-height:44px;margin-top:4px;background:transparent;font-size:13.5px;color:var(--ink-2)}',
    // 설정 > 알림: 잠금 화면에 보여 줄 것
    '.bx-app .bx-lockset{display:flex;flex-direction:column;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.bx-app .bx-lock-h{font-size:15px;font-weight:700;margin-bottom:4px}',
    '.bx-app .bx-lock-o{display:flex;align-items:center;gap:12px;min-height:56px;padding:6px 0;border-bottom:1px solid var(--line);background:transparent;text-align:left;color:var(--ink)}.bx-app .bx-lock-o:last-of-type{border-bottom:0}',
    '.bx-app .bx-lock-o i{width:20px;height:20px;flex:none;border-radius:50%;border:2px solid var(--line-2);box-sizing:border-box}.bx-app .bx-lock-o[aria-checked="true"] i{border:6px solid var(--accent)}',
    '.bx-app .bx-lock-o span{display:flex;flex-direction:column;gap:1px}.bx-app .bx-lock-o b{font-size:15px;font-weight:500}.bx-app .bx-lock-o b small{font-size:12px;color:var(--ink-2)}.bx-app .bx-lock-o span>small{font-size:12.5px;line-height:1.45;color:var(--ink-2)}',
    '.bx-app .bx-nudge{margin:12px 0 2px;background:var(--accent-soft);align-items:flex-start;padding:16px 8px 16px 16px}.bx-app .bx-nudge .bxs-t{gap:4px}.bx-app .bx-nudge-go{display:flex;margin-top:10px}.bx-app .bx-nudge-go .btn{min-height:42px;padding:0 16px}.bx-app .bx-nudge-x{flex:none;width:40px;height:40px;margin-top:-8px}',
    // 고른 칸은 어디서나 파랑(명상·소리 고르기에서 검정이던 것 통일)
    '.bx-app .pick[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}',
    '.bx-app .tt-remc .inp,.bx-app .bx-med-cmin .inp{width:96px;min-height:44px;font-size:16px;font-weight:700;text-align:center}',
    // 아래 메뉴 고르기
    '.bx-app .bx-dk{align-items:center}',
    '.bx-app .bx-dk .bx-dk-ic{display:flex;width:34px;height:34px;flex:none;border-radius:10px;background:var(--sunk);color:var(--ink-2);align-items:center;justify-content:center}',
    '.bx-app .bx-dk .bx-dk-ic .i{width:19px;height:19px}',
    '.bx-app .bx-dk[aria-checked="true"] .bx-dk-ic{background:color-mix(in srgb,var(--accent) 14%,var(--bg));color:var(--accent)}',
    '.bx-app .bx-dk .bx-dk-n{margin-left:auto;flex:none;width:24px;height:24px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-style:normal;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}',
    '.bx-app .bx-fab:active{transform:scale(.94)}',
    'html.bx-fab-on .bx-app .bx-fab,html.bx-fab-on.bx-app .bx-fab{display:flex}',
    'html.bx-fab-on .content{padding-bottom:calc(var(--dock-h) + env(safe-area-inset-bottom,0px) + 96px)}',
    'html.bx-fab-on #toasts{bottom:calc(var(--dock-h) + env(safe-area-inset-bottom,0px) + 88px)}',
    '.bx-f-tt .tt-card .sec-h ~ *{display:none!important}',
    '.bx-f-cal .hcal-sec > :not(.sec-h){display:none!important}',
    '.bx-f-cal .hcal-sec .hc-nav{display:none}',
    '.bx-app .rt-sec .rt-card:not(.bx-open) .rt-steps{display:none}',
    '.bx-app .rt-sec .rt-card.bx-one .rt-steps{display:none}',
    '.bx-app .rt-sec .rt-card:not(.bx-open){padding-bottom:10px}',
    '.bx-app .rt-sec .rt-card{margin:6px 0 8px}',
    '.bx-app .bx-rt-tog{display:inline-flex;align-items:center;gap:2px;height:30px;padding:0 4px 0 8px;border-radius:9px;color:var(--ink-3);font-size:12.5px;font-weight:700;flex:none}',
    '.bx-app .bx-rt-tog[aria-expanded="true"] .i{transform:rotate(180deg)}',
    '.bx-app .rt-sec .rt-h b,.bx-app .rt-sec .rt-h .rt-meta{cursor:pointer}',
    '@media (prefers-reduced-motion:reduce){.bx-app .bx-fold-btn .i,.bx-app .bx-rt-tog .i{transition:none}}',
    // 옆으로 밀어 넘길 때 들어오는 움직임
    '@keyframes bxSlN{from{transform:translateX(28px);opacity:.35}to{transform:none;opacity:1}}',
    '@keyframes bxSlP{from{transform:translateX(-28px);opacity:.35}to{transform:none;opacity:1}}',
    '.bx-app .bx-sl-n{animation:bxSlN .22s ease-out}.bx-app .bx-sl-p{animation:bxSlP .22s ease-out}',
    '@media (prefers-reduced-motion:reduce){.bx-app .bx-sl-n,.bx-app .bx-sl-p{animation:none}}',
    // 확인하지 않은 루틴 단계
    '.bx-app .rt-card.bx-miss{border-color:var(--warn);box-shadow:0 0 0 1px var(--warn) inset}',
    '.bx-app .bx-miss-line{display:flex;align-items:center;gap:8px;margin:4px 0 8px;padding:8px 10px;border-radius:12px;background:var(--warn-soft);color:var(--warn-ink);font-size:13.5px;font-weight:700}',
    '.bx-app .bx-miss-line .i{width:16px;height:16px;flex:none}.bx-app .bx-miss-line span{flex:1;min-width:0}',
    '.bx-app .bx-miss-line .btn{flex:none}',
    '.bx-app .bx-miss-chip{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:11px;background:var(--warn-soft);color:var(--warn-ink);font-size:12px;font-weight:800}',
    // 루틴 아이콘
    '.bx-app .bx-ic{display:inline-flex;align-items:center;justify-content:center;flex:none}',
    '.bx-app .bx-ic.rt{width:30px;height:30px;border-radius:10px;background:var(--accent-soft);color:var(--accent)}.bx-app .bx-ic.rt .i{width:18px;height:18px}',
    '.bx-app .bx-ic.st{width:18px;height:18px;margin-right:6px;color:var(--ink-3);vertical-align:-3px}.bx-app .bx-ic.st .i{width:16px;height:16px}',
    '.bx-app .rt-sec .rt-h{flex-wrap:wrap;column-gap:8px;row-gap:0}',
    '.bx-app .rt-sec .rt-h b{flex:1 1 0;min-width:0}.bx-app .rt-sec .rt-h .sp{display:none}',
    '.bx-app .rt-sec .rt-h .rt-meta{order:10;flex-basis:100%;padding-left:38px;margin-top:-4px;font-size:12.5px}',
    '.bx-app .rt-sec .rt-h .sec-link{white-space:nowrap}',
    '.bx-app .rt-item .rt-open{display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center}.bx-app .rt-item .rt-open .bx-ic{grid-row:span 2}',
    '.bx-app .bx-icpick{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:8px}',
    '.bx-app .bx-icb{height:44px;border-radius:12px;background:var(--sunk);border:0;color:var(--ink-2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}',
    '.bx-app .bx-icb .i{width:20px;height:20px}.bx-app .bx-icb small{font-size:10px;font-weight:700;line-height:1}',
    '.bx-app .bx-icb[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink)}',
    // 명상(D-07)
    '.bx-app .bx-med-card{padding-block:14px}.bx-app .bx-med-row{display:flex;align-items:center;gap:12px}',
    '.bx-app .bx-med-row .bx-ic.rt{width:40px;height:40px;border-radius:13px}.bx-app .bx-med-row .bx-ic.rt .i{width:22px;height:22px}',
    '.bx-app .bx-med-t{flex:1;min-width:0}.bx-app .bx-med-t h2{font-size:18px;font-weight:800;margin:0}.bx-app .bx-med-t p{margin:2px 0 0}',
    '.bx-app .bx-med-set .picks{margin-top:6px}.bx-app .bx-med-note{color:var(--ink-3);margin:10px 0 0}',
    '.bx-app .bx-med-acts{display:flex;gap:10px;margin-top:18px}.bx-app .bx-med-acts .btn{height:50px}.bx-app .bx-med-acts .bx-ic{margin-right:4px}',
    '.bx-app .bx-med-run{display:flex;flex-direction:column;align-items:center;gap:18px;padding:28px 0 8px}',
    '.bx-app .bx-med-circle{width:230px;height:230px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--accent) 20%,var(--bg)),color-mix(in srgb,var(--accent) 8%,var(--bg)));box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 25%,transparent) inset}',
    '.bx-app .bx-med-left{font-size:44px;font-weight:800;letter-spacing:-.03em;color:var(--ink)}.bx-app .bx-med-cue{font-size:15px;color:var(--ink-2);min-height:20px}',
    '@keyframes bxBreath{0%{transform:scale(.82)}40%{transform:scale(1)}100%{transform:scale(.82)}}',
    '.bx-app .bx-med-run.breath .bx-med-circle{animation:bxBreath 10s ease-in-out infinite}',
    '.bx-app .bx-med-run.done .bx-med-left{font-size:34px}',
    '.bx-app .bx-med-stop{width:100%;max-width:320px;height:50px;flex:none;justify-content:center}',
    '.bx-app .bx-med-run .bx-med-acts{width:100%;max-width:320px;margin-top:4px}',
    '@media (prefers-reduced-motion:reduce){.bx-app .bx-med-run.breath .bx-med-circle{animation:none}}',
    // 길게 듣기 막대
    '.bx-listen{position:fixed;left:0;right:0;bottom:0;z-index:300;display:flex;flex-direction:column;gap:8px;padding:16px max(16px,env(safe-area-inset-right,0px)) calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:var(--bg);border-top:1px solid var(--line);box-shadow:0 -6px 24px rgba(0,0,0,.14);border-radius:20px 20px 0 0}',
    '.bx-ls-top{display:flex;align-items:center;gap:8px;font-size:15px}.bx-ls-hint{margin-left:auto;font-size:12.5px;color:var(--ink-3)}',
    '.bx-ls-dot{width:10px;height:10px;border-radius:50%;background:var(--danger);animation:bxLs 1s ease-in-out infinite}',
    '@keyframes bxLs{50%{opacity:.25}}',
    '.bx-ls-text{margin:0;min-height:48px;font-size:18px;line-height:1.4;color:var(--ink);word-break:keep-all}.bx-ls-text.ph{color:var(--ink-3)}',
    '.bx-ls-stop{height:48px;font-size:16px}',
    '@media (prefers-reduced-motion:reduce){.bx-ls-dot{animation:none}}',
    // 휴대폰 캘린더(D-05): 설정 칸, 캘린더 고르기, 일정 창
    '.bx-app .pc-set-note{margin:2px 0 10px;color:var(--ink-3)}',
    '.bx-app .pc-cals{display:flex;flex-direction:column;gap:6px;margin:6px 0 10px}',
    '.bx-app .pc-calb{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 12px;border-radius:12px;background:var(--sunk);border:0;color:var(--ink);text-align:left;font-size:15px}',
    '.bx-app .pc-calb span{flex:1;min-width:0;display:flex;flex-direction:column}.bx-app .pc-calb small{color:var(--ink-3);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.bx-app .pc-calb .i{width:18px;height:18px;color:var(--accent);opacity:0}.bx-app .pc-calb[aria-pressed="true"] .i{opacity:1}',
    '.bx-app .pc-calb[aria-pressed="false"]{color:var(--ink-3)}',
    '.bx-app .pc-cal-name{display:flex;align-items:center;gap:8px;color:var(--ink-2);font-size:14px;font-weight:700}',
    '.bx-app .pc-title{font-size:22px;margin:8px 0 4px;line-height:1.3}.bx-app .pc-when{margin:0;color:var(--ink-2);font-size:16px}',
    '.bx-app .pc-loc{display:flex;align-items:center;gap:6px;margin:8px 0 0;color:var(--ink-2)}.bx-app .pc-loc .i{width:16px;height:16px}',
    '.bx-app .pc-note{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:var(--sunk);color:var(--ink-2);white-space:pre-wrap;font-size:14px}',
    '.bx-app .pc-ro{margin-top:14px;color:var(--ink-3)}',
    // AI 정리(Claude 연동 필요)는 앱에서 숨김(D-04). 사용 설명서의 Claude 연동 장은 숨김
    '.bx-app [data-act="ai-capture"],.bx-app #g-ai,.bx-app #g-share,.bx-app #g-start,.bx-app #g-report,.bx-app [data-to="g-ai"],.bx-app [data-to="g-share"],.bx-app [data-to="g-report"]{display:none!important}'
  ].join('');
  (document.head || document.documentElement).appendChild(style);

  function plugin(name) {
    return (cap.Plugins && cap.Plugins[name]) || null;
  }

  function toBase64(text) {
    var bytes = new TextEncoder().encode(String(text));
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  function fail(code, message) {
    return Object.assign(new Error(message || code), { code: code });
  }

  var downloads = {
    save: async function (o) {
      var fs = plugin('Filesystem');
      var share = plugin('Share');
      if (!fs || !share) throw fail('unavailable');
      var file = await fs.writeFile({
        path: String(o.filename || 'boxworks.txt'),
        data: toBase64(o.data),
        directory: 'CACHE'
      });
      try {
        await share.share({ title: o.filename, files: [file.uri], dialogTitle: '파일 저장할 곳 고르기' });
      } catch (e) {
        throw fail('declined', e && e.message);
      }
    }
  };

  // 휴대폰 뒤로 버튼. 박스웍스 안에서 되돌아갈 곳이 있으면 거기로 가고,
  // 오늘 화면에서 누르면 앱을 끄지 않고 뒤로 보냄(안드로이드 12 이후 기본 동작과 같음)
  var app = plugin('App');
  if (app && app.addListener) {
    app.addListener('backButton', function () {
      var handled = false;
      try { handled = typeof window.BX_back === 'function' && window.BX_back(); } catch (e) {}
      if (!handled && app.minimizeApp) app.minimizeApp();
    });
  }

  // 휴대폰 알람(2단계). 박스웍스가 계산한 앞으로 14일의 알람 목록을 휴대폰에 예약한다(끝나기 전날 '알람이 곧 끝나요').
  // 목록이 바뀐 때만 다시 예약하고, 알림 권한은 알람이 처음 생길 때 한 번만 묻는다(D-01).
  var alarm = plugin('BxAlarm');
  var memo = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  if (alarm) {
    var lastSig = null, lastWidget = null, timer = null, checked = false;
    var syncAlarms = async function () {
      if (typeof window.BX_alarmPlan !== 'function') return;
      var list = window.BX_alarmPlan(14);
      if (!list) return;
      var real = list.filter(function (a) { return a.kind !== 'report' && a.id !== 'bx_renew'; }).length;
      if ((real > 0) !== (permCount > 0)) { permCount = real; permCheck(); } else permCount = real;
      // 홈 화면 위젯(4안-6): 앞으로의 일정과 알람 시각을 넘긴다(아침 보고는 알람이 아니라 뺀다)
      var widget = plugin('BxWidget');
      if (widget && typeof window.BX_widgetData === 'function') {
        var wd = window.BX_widgetData(list.filter(function (a) { return a.kind !== 'report' && a.id !== 'bx_renew'; }));
        var wsig = wd ? JSON.stringify({ i: wd.items, r: wd.routines, l: wd.late }) : null;
        if (wd && wsig !== lastWidget) { lastWidget = wsig; widget.update({ data: wd }).catch(function () { lastWidget = null; }); }
      }
      // 잠금 화면에 보여 줄 것(설정): alarm(기본) | title | none
      var lock = typeof window.BX_lockMode === 'function' ? window.BX_lockMode() : 'alarm';
      var sig = lock + JSON.stringify(list);
      if (sig === lastSig) return;
      lastSig = sig;
      try { await alarm.sync({ alarms: list, lock: lock }); } catch (e) { lastSig = null; }
      // 처음 알람이 생길 때 알람 허락 화면(전체 흐름 와이어프레임 6). 빠진 허락이 있을 때 한 번만
      // 아침 보고만 있을 때는 묻지 않는다(사용자가 만든 첫 알람이 생길 때)
      if (!checked && list.some(function (a) { return a.kind !== 'report' && a.id !== 'bx_renew'; })) { checked = true; permFirst(list); }
    };
    // 알람 허락 화면이 쓰는 휴대폰 쪽 함수(web-src/start.js의 bxPermOpen)
    window.BX_perm = {
      status: function () { return alarm.status(); },
      notifications: function () { return alarm.requestNotifications(); },
      open: function (which) { return alarm.openSettings({ which: which }); },
      test: function () { return alarm.test({ seconds: 10 }); }
    };
    // 알림이나 정확한 알람이 꺼져 있으면 홈 맨 위에 빨간 줄(문제점 점검 기술 9). 앱을 열 때·돌아올 때·알람이 처음 생길 때 확인
    var permCount = 0;
    var permCheck = function () {
      Promise.resolve(alarm.status()).then(function (st) {
        var bad = permCount > 0 && st ? (!st.notifications ? 'notifications' : !st.exact ? 'exact' : '') : '';
        var el = document.getElementById('bx-permbar');
        if (!bad) { if (el) el.remove(); return; }
        if (!el) {
          var host = document.getElementById('banner');
          if (!host || !host.parentNode) return;
          el = document.createElement('div');
          el.id = 'bx-permbar';
          el.setAttribute('role', 'alert');
          host.parentNode.insertBefore(el, host.nextSibling);
        }
        el.setAttribute('data-which', bad);
        el.innerHTML = '<span>' + (bad === 'notifications' ? '알림이 꺼져 있어 알람이 울리지 않아요' : '정확한 알람이 꺼져 있어 알람이 늦을 수 있어요') + '</span><button type="button" class="btn sm" data-act="bx-perm-fix">켜기</button>';
      }).catch(function () {});
    };
    window.BX_permCheck = permCheck;
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-perm-fix"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      var bar = document.getElementById('bx-permbar'), which = bar ? bar.getAttribute('data-which') : 'notifications';
      var go = which === 'notifications'
        ? Promise.resolve(alarm.requestNotifications()).then(function (st) { if (!st || !st.notifications) return alarm.openSettings({ which: 'notifications' }); permCheck(); })
        : Promise.resolve(alarm.openSettings({ which: which }));
      go.catch(function () {});
    }, true);
    var permFirst = async function (list) {
      try {
        if (memo.get('bx:permShown') === '1' || typeof window.BX_permOpen !== 'function') return;
        var st = await alarm.status();
        if (st.notifications && st.exact && st.fullScreen) return;
        memo.set('bx:permShown', '1');
        var first = list.filter(function (a) { return a.kind !== 'report' && a.id !== 'bx_renew'; })[0];
        window.BX_permOpen(first ? first.at : 0, st);
      } catch (e) {}
    };
    var askPermissions = async function (fromTest) {
      try {
        var st = await alarm.status();
        if (!st.notifications && (fromTest || memo.get('bx:askNotif') !== '1')) {
          memo.set('bx:askNotif', '1');
          st = await alarm.requestNotifications();
          if (!st.notifications && fromTest && window.confirm('알림이 꺼져 있어서 알람이 울리지 않아요. 휴대폰 설정에서 박스웍스 알림을 켤까요?')) {
            alarm.openSettings({ which: 'notifications' });
            return false;
          }
        }
        if (st.notifications && !st.exact && (fromTest || memo.get('bx:askExact') !== '1')) {
          memo.set('bx:askExact', '1');
          if (window.confirm('알람이 정확한 시각에 울리려면 다음 화면에서 박스웍스를 허용해 주세요.')) alarm.openSettings({ which: 'exact' });
        }
        if (st.notifications && !st.fullScreen && (fromTest || memo.get('bx:askFull') !== '1')) {
          memo.set('bx:askFull', '1');
          if (window.confirm('잠금 화면에서도 알람을 크게 띄우려면 다음 화면에서 박스웍스를 허용해 주세요.')) alarm.openSettings({ which: 'fullscreen' });
        }
        return !!st.notifications;
      } catch (e) {
        return false;
      }
    };
    window.BX_afterRender = function () {
      clearTimeout(timer);
      timer = setTimeout(syncAlarms, 700);
    };
    // 휴대폰 알람에서 '확인'한 루틴 단계를 앱에 '했어요'로 옮긴다(켤 때·돌아올 때)
    var pullConfirmed = function () {
      if (!alarm.confirmed) return;
      alarm.confirmed().then(function (r) { if (r && r.done && window.BX_applyConfirmed) window.BX_applyConfirmed(r.done); }).catch(function () {});
    };
    setTimeout(pullConfirmed, 1500);
    var app2 = plugin('App');
    if (app2 && app2.addListener) app2.addListener('resume', function () { if (window.BX_permRefresh) window.BX_permRefresh(); permCheck(); lastSig = null; pullConfirmed(); window.BX_afterRender(); if (window.BX_pcRefresh) window.BX_pcRefresh(true); });
    // 설정 > 알림 > 휴대폰 알람 시험
    document.addEventListener('click', async function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-alarm-test"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      try {
        var st0 = await alarm.status();
        if (!(st0.notifications && st0.exact && st0.fullScreen) && typeof window.BX_permOpen === 'function') { window.BX_permOpen(0, st0); return; }
      } catch (e0) {}
      var ok = await askPermissions(true);
      if (!ok) return;
      try {
        await alarm.test({ seconds: 10 });
        if (window.BX_toast) window.BX_toast('10초 뒤 알람이 울려요. 화면을 끄고 기다려 보세요.');
      } catch (e) {
        if (window.BX_toast) window.BX_toast('시험 알람을 예약하지 못했어요.');
      }
    }, true);
  }

  // 위젯의 말하기 단추로 앱이 열리면: 새 일정 창을 열고 바로 마이크를 켠다
  var widgetPl = plugin('BxWidget');
  if (widgetPl) {
    // 홈 화면에 놓인 위젯 수(위젯 두기 제안을 보일지 정함, web-src/flow.js)
    var placedRefresh = function () {
      if (!widgetPl.placed) return;
      widgetPl.placed().then(function (r) { var prev = JSON.stringify(window.BX_WPLACED || null); window.BX_WPLACED = r; if (JSON.stringify(r) !== prev && window.BX_afterRender) { try { window.BX_rerender && window.BX_rerender(); } catch (e) {} } }).catch(function () {});
    };
    setTimeout(placedRefresh, 1200);
    var app3 = plugin('App');
    if (app3 && app3.addListener) app3.addListener('resume', placedRefresh);
    window.BX_widgetPin = function (which) { return widgetPl.pin({ which: which || 'now' }); };
    var speakNow = function () {
      setTimeout(function () {
        var add = document.querySelector('.bx-fab');
        if (!add) return;
        add.click();
        setTimeout(function () { var m = document.querySelector('[data-act="bx-mic"][data-for="f-title"]'); if (m) m.click(); }, 350);
      }, 300);
    };
    if (widgetPl.addListener) widgetPl.addListener('speak', speakNow);
    if (widgetPl.consumeLaunch) widgetPl.consumeLaunch().then(function (r) { if (r && r.speak) setTimeout(speakNow, 700); }).catch(function () {});
  }

  // 말로 넣기(3단계). 휴대폰 기본 음성 인식으로 받은 글자를 칸에 넣고,
  // 박스웍스가 글자를 칠 때와 똑같이 해석하게 한다(날짜·시각 자동 인식).
  var speech = plugin('BxSpeech');
  // 듣는 동안 화면 아래에 뜨는 막대: 들은 글자가 바로 보이고 '끝'으로 마친다
  var listenLongUi = function (prompt) {
    var bar = document.createElement('div');
    bar.className = 'bx-listen';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<div class="bx-ls-top"><i class="bx-ls-dot"></i><b>듣는 중</b><span class="bx-ls-hint">말을 3초쯤 멈추면 끝나요</span></div><p class="bx-ls-text"></p><button type="button" class="btn primary bx-ls-stop">끝</button>';
    bar.querySelector('.bx-ls-text').textContent = prompt;
    bar.querySelector('.bx-ls-text').classList.add('ph');
    document.body.appendChild(bar);
    var sub = null;
    if (speech.addListener) {
      Promise.resolve(speech.addListener('partial', function (d) {
        var t = bar.querySelector('.bx-ls-text');
        if (d && d.text) { t.textContent = d.text; t.classList.remove('ph'); }
      })).then(function (h) { sub = h; });
    }
    bar.querySelector('.bx-ls-stop').addEventListener('click', function (ev) { ev.stopPropagation(); speech.stop().catch(function () {}); });
    var done = function () { if (sub && sub.remove) sub.remove(); bar.remove(); };
    return speech.listenLong({ prompt: prompt }).then(function (r) { done(); return r; }, function (e) { done(); throw e; });
  };
  if (speech) {
    window.BX_HAS_MIC = true;
    // 음성 인식이 없는 휴대폰: 마이크를 숨기고, 일정 칸을 처음 누를 때 키보드 마이크를 안내한다(D-10 보완 11/2, P-17)
    if (speech.available) {
      Promise.resolve(speech.available()).then(function (r) {
        if (!r || r.available !== false) return;
        window.BX_HAS_MIC = false;
        window.BX_NO_MIC = true;
        if (window.BX_rerender) window.BX_rerender();
      }).catch(function () {});
    }
    document.addEventListener('focusin', function (ev) {
      var t = ev.target;
      if (!window.BX_NO_MIC || !t || !/^(f-title|day-in|tt-in|rt-text|bx-rt-say)$/.test(t.id || '')) return;
      if (memo.get('bx:noMicTold') === '1') return;
      memo.set('bx:noMicTold', '1');
      if (window.BX_toast) window.BX_toast('이 휴대폰에서는 박스웍스 마이크를 쓸 수 없어요. 키보드의 마이크로 말해도 똑같이 정리돼요.');
    }, true);
    document.addEventListener('click', async function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-mic"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (b.classList.contains('busy')) return;
      var field = document.getElementById(b.getAttribute('data-for'));
      b.classList.add('busy');
      try {
        var r = null;
        if (speech.listenLong) {
          // 앱 안에서 길게 듣기: 말이 잠깐 끊겨도 이어 듣고, '끝'을 누르면 마친다(대표 지적: 입력 시간이 너무 짧음)
          try { r = await listenLongUi(b.getAttribute('data-prompt') || '말해 보세요'); }
          catch (e2) { if (e2 && (e2.code === 'unavailable' || e2.code === 'denied')) r = null; else throw e2; }
        }
        if (!r) r = await speech.listen({ prompt: b.getAttribute('data-prompt') || '말해 보세요' });
        var text = (r && r.text ? String(r.text) : '').trim();
        field = document.getElementById(b.getAttribute('data-for')) || field;
        if (text && field) {
          field.value = field.value.trim() ? field.value.trim() + ' ' + text : text;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.focus();
        }
      } catch (e) {
        if (e && e.code === 'unavailable' && window.BX_toast) window.BX_toast('이 휴대폰에서 음성 인식을 쓸 수 없어요. 키보드의 마이크를 써 주세요.');
      } finally {
        b.classList.remove('busy');
      }
    }, true);
  }

  window.claude = {
    use: function (name) {
      return Promise.resolve(name === 'downloads' ? downloads : null);
    }
  };
})();
