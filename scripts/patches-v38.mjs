// 시험판 38(11/3 저녁, 대표 결정 18:58 · 19:06): 위 막대 = 왼쪽 위 메뉴 단추(더보기) · 가운데 로고(누르면 홈) · 오른쪽 검색 · 도움말.
// 이름은 위 막대에서 지우고, 처음 여는 화면에 로고 + '스케줄러' + 차오르는 게이지(이름은 차후에 정함, 그 전까지 '스케줄러'만). 화면 쪽 코드는 web-src/v38.js
const LOGO_PATHS = '<path d="M13.19 3.74Q16 2.2 18.81 3.74L25.99 7.66Q28.8 9.2 28.8 12.4L28.8 19.6Q28.8 22.8 25.99 24.34L18.81 28.26Q16 29.8 13.19 28.26L6.01 24.34Q3.2 22.8 3.2 19.6L3.2 12.4Q3.2 9.2 6.01 7.66Z" fill="var(--accent)"/><path d="M13.19 3.74Q16 2.2 18.81 3.74L25.99 7.66Q28.8 9.2 25.99 10.74L16 16.2 6.01 10.74Q3.2 9.2 6.01 7.66Z" fill="var(--accent-ink)" opacity=".2"/><path d="M8.7 13.3 12.3 23.6 16 18 19.7 23.6 23.3 13.3" fill="none" stroke="var(--accent-ink)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
export default [
  {
    name: '위 막대: 왼쪽 위 메뉴 단추(더보기 창), 로고는 홈으로(대표 결정 11/3 18:58)',
    find: '      <div class="appbar-in">\n        <a class="brand" href="#today" data-act="go" data-view="today" aria-label="박스웍스 스케줄러 오늘 화면">',
    replace: '      <div class="appbar-in">\n        <button type="button" class="icon-btn ab-menu" data-act="more" aria-label="메뉴"><svg class="i" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>\n        <a class="brand" href="#today" data-act="go" data-view="today" aria-label="홈으로">'
  },
  {
    name: '처음 여는 화면: 로고 + 스케줄러 + 차오르는 게이지(대표 결정 11/3 18:58)',
    find: '\n<div class="app">\n',
    replace: '\n<div id="bx-splash" aria-hidden="true"><div class="bxsp-in"><svg viewBox="0 0 32 32" class="bxsp-logo">' + LOGO_PATHS + '</svg><b class="bxsp-name">스케줄러</b><i class="bxsp-bar"><i></i></i></div></div>\n' +
      '<style>#bx-splash{position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;align-items:center;justify-content:center;pointer-events:none;transition:opacity .3s ease}' +
      '#bx-splash.bx-done{opacity:0}#bx-splash .bxsp-in{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:-8vh}' +
      '#bx-splash .bxsp-logo{width:76px;height:76px}#bx-splash .bxsp-name{font-size:22px;font-weight:800;letter-spacing:-.03em;color:var(--ink)}' +
      '#bx-splash .bxsp-bar{display:block;width:128px;height:4px;margin-top:8px;border-radius:2px;background:var(--line);overflow:hidden}' +
      '#bx-splash .bxsp-bar i{display:block;width:0;height:100%;border-radius:2px;background:var(--accent);animation:bxspFill 1.2s cubic-bezier(.3,.7,.3,1) forwards}' +
      '#bx-splash.bx-done .bxsp-bar i{width:100%;animation:none;transition:width .18s ease-out}@keyframes bxspFill{from{width:0}to{width:86%}}</style>\n<div class="app">\n'
  }
];
