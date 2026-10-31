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
    '.bx-app .c-chip span{display:block;overflow:hidden;white-space:nowrap;text-overflow:clip}',
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
    '.bx-app .tt-hd{position:absolute;left:0;right:0;height:16px;touch-action:none;z-index:2}',
    '.bx-app .tt-hd.s{top:0}.bx-app .tt-hd.e{bottom:0}',
    '.bx-app .tt-hd.e::after{content:"";position:absolute;left:50%;bottom:3px;width:18px;height:3px;margin-left:-9px;border-radius:2px;background:var(--c);opacity:.55}',
    '.bx-app .tt-b.rs{z-index:5;overflow:visible;box-shadow:0 4px 14px rgba(0,0,0,.18);outline:2px solid var(--c)}',
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

  // 휴대폰 알람(2단계). 박스웍스가 계산한 앞으로 7일의 알람 목록을 휴대폰에 예약한다.
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
      var list = window.BX_alarmPlan(7);
      if (!list) return;
      // 홈 화면 위젯(4안-6): 앞으로의 일정과 알람 시각을 넘긴다(아침 보고는 알람이 아니라 뺀다)
      var widget = plugin('BxWidget');
      if (widget && typeof window.BX_widgetData === 'function') {
        var wd = window.BX_widgetData(list.filter(function (a) { return a.kind !== 'report'; }));
        var wsig = wd ? JSON.stringify({ i: wd.items, a: wd.alarms }) : null;
        if (wd && wsig !== lastWidget) { lastWidget = wsig; widget.update({ data: wd }).catch(function () { lastWidget = null; }); }
      }
      var sig = JSON.stringify(list);
      if (sig === lastSig) return;
      lastSig = sig;
      try { await alarm.sync({ alarms: list }); } catch (e) { lastSig = null; }
      if (list.length && !checked) { checked = true; askPermissions(false); }
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
    if (app2 && app2.addListener) app2.addListener('resume', function () { lastSig = null; pullConfirmed(); window.BX_afterRender(); if (window.BX_pcRefresh) window.BX_pcRefresh(true); });
    // 설정 > 알림 > 휴대폰 알람 시험
    document.addEventListener('click', async function (ev) {
      var b = ev.target && ev.target.closest && ev.target.closest('[data-act="bx-alarm-test"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
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
    var speakNow = function () {
      setTimeout(function () {
        var add = document.querySelector('.dock-add');
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
