/* ---------- 시험판 49 · 명상 배경 그림(대표 11/4 13:45 "갈대면 갈대숲이 천천히 흔들리는 영상, 바람은 바람을 뜻하는 영상이 뒤에 깔려 있으면") ----------
   고른 배경 소리에 맞춰 명상 화면 뒤에 천천히 움직이는 그림을 깐다. 영상 파일 없이 그림을 코드로 그려 움직인다(앱 크기 그대로, 대표가 고르지 않아 추천안 (나)).
   갈대: 줄기가 밑동을 축으로 흔들림 · 파도: 물결 세 겹이 옆으로 흐름 · 바람: 바람 줄기가 지나감 · 숲속 새소리: 나뭇잎이 흔들리고 빛 알갱이가 떠다님 · 백색소음: 빛 무리가 천천히 떠다님.
   진행 중에는 진하게, 고르는 화면에서는 옅게(어떤 그림인지 미리). 휴대폰 '움직임 줄이기'를 켜면 멈춘 그림 */
const BX_SCENES = {
  reeds(){
    // 갈대 22포기: 높이 · 굵기 · 흔들림 길이가 조금씩 다르다
    let g = '';
    for (let i = 0; i < 22; i++) {
      const x = 8 + i * 17.5 + ((i * 37) % 9) - 4, h = 150 + ((i * 53) % 90), w = 1.6 + ((i * 7) % 3) * 0.5, lean = ((i * 29) % 11) - 5;
      const tipX = x + lean, tipY = 400 - h;
      g += '<g class="bx-sc-reed" style="--d:' + (5.5 + ((i * 13) % 40) / 10) + 's;--o:-' + ((i * 17) % 50) / 10 + 's;transform-origin:' + x + 'px 400px">' +
        '<path d="M' + x + ' 400 Q' + (x + lean * 0.3) + ' ' + (400 - h * 0.55) + ' ' + tipX + ' ' + tipY + '" stroke-width="' + w + '"/>' +
        '<path class="pl" d="M' + tipX + ' ' + tipY + ' q' + (lean * 0.6 + 4) + ' -18 ' + (lean + 2) + ' -34 q-6 14 -' + (lean * 0.2 + 3) + ' 34z"/></g>';
    }
    return '<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + g + '</svg>';
  },
  waves(){
    const wave = (y, a, cls) => { let d = 'M0 ' + y; for (let k = 0; k < 8; k++) d += ' q50 -' + a + ' 100 0 t100 0'; return '<path class="' + cls + '" d="' + d + ' V400 H0z"/>'; };
    return '<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="bx-sc-w w1">' + wave(250, 14, 'a') + '</g><g class="bx-sc-w w2">' + wave(285, 10, 'b') + '</g><g class="bx-sc-w w3">' + wave(320, 8, 'c') + '</g></svg>';
  },
  wind(){
    let g = '';
    for (let i = 0; i < 9; i++) {
      const y = 60 + i * 38 + ((i * 23) % 17), amp = 10 + ((i * 11) % 14);
      g += '<path class="bx-sc-gust" style="--d:' + (7 + ((i * 7) % 6)) + 's;--o:-' + ((i * 19) % 70) / 10 + 's" d="M-40 ' + y + ' C 60 ' + (y - amp) + ', 140 ' + (y + amp) + ', 220 ' + y + ' S 380 ' + (y - amp) + ', 460 ' + y + '"/>';
    }
    return '<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + g + '</svg>';
  },
  birds(){
    // 양옆 나뭇가지의 잎 + 떠다니는 빛 알갱이
    let leaves = '';
    const leaf = (x, y, r, s, i) => '<g class="bx-sc-leaf" style="--d:' + (6 + (i % 4)) + 's;--o:-' + (i * 0.7) + 's;transform-origin:' + x + 'px ' + y + 'px"><path d="M' + x + ' ' + y + ' q' + (12 * s) + ' -10 ' + (26 * s) + ' 0 q-' + (12 * s) + ' 10 -' + (26 * s) + ' 0z" transform="rotate(' + r + ' ' + x + ' ' + y + ')"/></g>';
    for (let i = 0; i < 9; i++) leaves += leaf(0 + i * 9, 60 + i * 24, 20 + i * 6, 1.2, i);
    for (let i = 0; i < 9; i++) leaves += leaf(400 - i * 9, 90 + i * 22, 160 - i * 6, 1.2, i + 3);
    let motes = '';
    for (let i = 0; i < 14; i++) motes += '<circle class="bx-sc-mote" style="--d:' + (9 + (i % 5) * 2) + 's;--o:-' + (i * 1.3) + 's" cx="' + (40 + (i * 61) % 320) + '" cy="' + (90 + (i * 47) % 260) + '" r="' + (1.6 + (i % 3) * 0.8) + '"/>';
    return '<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="br" d="M-10 40 Q60 120 70 280"/><path class="br" d="M410 70 Q340 150 330 300"/>' + leaves + motes + '</svg>';
  },
  noise(){
    return '<div class="bx-sc-blob b1"></div><div class="bx-sc-blob b2"></div><div class="bx-sc-blob b3"></div>';
  }
};
// 화면을 다시 그려도(30초마다 등) 그림이 처음으로 튀지 않게, 앱을 연 때부터 흐른 시간만큼 앞당겨 이어 간다
const BX_SC_T0 = Date.now();
function bxSceneHtml(k, cls){
  const f = BX_SCENES[k]; if (!f) return '';
  return '<div class="bx-med-scene ' + (cls || '') + '" data-scene="' + k + '" aria-hidden="true" style="--t:-' + ((Date.now() - BX_SC_T0) / 1000).toFixed(2) + 's">' + f() + '</div>';
}
const bxMedHtml50 = medHtml;
medHtml = function(){
  let h = bxMedHtml50.apply(this, arguments);
  if (!window.BX_APP) return h;
  const run = MED.run;
  const k = run ? run.bg : (bgPlug() ? bgCur() : '');
  if (!k || !BX_SCENES[k]) return h;
  // 진행 중 · 끝: 진하게, 고르는 화면: 옅게
  return bxSceneHtml(k, run ? 'run' : 'pick') + h;
};

(function bxV50Style(){
  if (!window.BX_APP) return;
  const st = document.createElement('style');
  st.id = 'bx-v50';
  st.textContent = [
    // 그림은 위 막대와 아래 메뉴 사이 화면 전체에, 글자 · 단추 뒤에
    'html.bx-app .bx-med-scene{position:fixed;left:0;right:0;top:0;bottom:0;z-index:0;pointer-events:none;overflow:hidden;opacity:.55;transition:opacity .6s}',
    'html.bx-app .bx-med-scene.pick{opacity:.28}',
    'html.bx-app .bx-med-scene svg{position:absolute;left:0;bottom:calc(var(--dock-h,66px) + env(safe-area-inset-bottom,0px));width:100%;height:32%}',
    // 글자 · 단추는 그림 위에서도 또렷하게
    'html.bx-app .screen.med .bx-med-run .bx-med-stop{background:var(--bg)}',
    'html.bx-app .screen.med .bx-med-run .bx-med-acts .btn:not(.primary){background:var(--bg)}',
    'html.bx-app .bx-med-scene[data-scene="wind"] svg,html.bx-app .bx-med-scene[data-scene="birds"] svg{top:72px;height:auto;bottom:calc(var(--dock-h,66px) + env(safe-area-inset-bottom,0px))}',
    'html.bx-app .screen.med{position:relative}',
    'html.bx-app .screen.med > :not(.bx-med-scene){position:relative;z-index:1}',
    'html.bx-app .screen.med .bx-med-set{background:color-mix(in srgb,var(--card-bg) 88%,transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
    // 갈대
    'html.bx-app .bx-sc-reed path{fill:none;stroke:color-mix(in srgb,#c9a96a 70%,var(--ink-3));stroke-linecap:round}',
    'html.bx-app .bx-sc-reed path.pl{fill:color-mix(in srgb,#d8bd84 60%,transparent);stroke:none}',
    'html.bx-app .bx-sc-reed{animation:bxReed var(--d) ease-in-out calc(var(--o) + var(--t,0s)) infinite alternate}',
    '@keyframes bxReed{from{transform:rotate(-2.6deg)}to{transform:rotate(3.2deg)}}',
    // 파도
    'html.bx-app .bx-sc-w path{stroke:none}',
    'html.bx-app .bx-sc-w .a{fill:color-mix(in srgb,#3f8fd8 26%,transparent)}html.bx-app .bx-sc-w .b{fill:color-mix(in srgb,#2fb3c4 26%,transparent)}html.bx-app .bx-sc-w .c{fill:color-mix(in srgb,#3a6fd0 32%,transparent)}',
    'html.bx-app .bx-sc-w{animation:bxWave linear infinite;animation-delay:var(--t,0s)}html.bx-app .bx-sc-w.w1{animation-duration:16s}html.bx-app .bx-sc-w.w2{animation-duration:23s;animation-direction:reverse}html.bx-app .bx-sc-w.w3{animation-duration:31s}',
    '@keyframes bxWave{from{transform:translateX(0)}to{transform:translateX(-200px)}}',
    // 바람
    'html.bx-app .bx-sc-gust{fill:none;stroke:color-mix(in srgb,#9fb6d6 70%,var(--ink-3));stroke-width:1.6;stroke-linecap:round;stroke-dasharray:90 600;stroke-dashoffset:690;opacity:.8;animation:bxGust var(--d) cubic-bezier(.4,0,.3,1) calc(var(--o) + var(--t,0s)) infinite}',
    '@keyframes bxGust{0%{stroke-dashoffset:690;opacity:0}15%{opacity:.85}85%{opacity:.85}100%{stroke-dashoffset:0;opacity:0}}',
    // 숲속 새소리
    'html.bx-app .bx-med-scene[data-scene="birds"] .br{fill:none;stroke:color-mix(in srgb,#6f8a5a 70%,var(--ink-3));stroke-width:3;stroke-linecap:round;opacity:.7}',
    'html.bx-app .bx-sc-leaf path{fill:color-mix(in srgb,#5fa86a 55%,transparent)}',
    'html.bx-app .bx-sc-leaf{animation:bxLeaf var(--d) ease-in-out calc(var(--o) + var(--t,0s)) infinite alternate}',
    '@keyframes bxLeaf{from{transform:rotate(-6deg)}to{transform:rotate(7deg)}}',
    'html.bx-app .bx-sc-mote{fill:color-mix(in srgb,#ffe9a8 80%,transparent);animation:bxMote var(--d) ease-in-out calc(var(--o) + var(--t,0s)) infinite}',
    '@keyframes bxMote{0%,100%{transform:translate(0,0);opacity:.15}50%{transform:translate(14px,-26px);opacity:.9}}',
    // 백색소음
    'html.bx-app .bx-sc-blob{position:absolute;width:70vmax;height:70vmax;border-radius:50%;filter:blur(40px);opacity:.5}',
    'html.bx-app .bx-sc-blob.b1{left:-20vmax;top:10%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 45%,transparent),transparent 70%);animation:bxBlob1 26s ease-in-out var(--t,0s) infinite alternate}',
    'html.bx-app .bx-sc-blob.b2{right:-25vmax;top:30%;background:radial-gradient(circle,color-mix(in srgb,#a57bff 40%,transparent),transparent 70%);animation:bxBlob2 32s ease-in-out var(--t,0s) infinite alternate}',
    'html.bx-app .bx-sc-blob.b3{left:10%;bottom:-30vmax;background:radial-gradient(circle,color-mix(in srgb,#2fc4b2 35%,transparent),transparent 70%);animation:bxBlob1 38s ease-in-out var(--t,0s) infinite alternate-reverse}',
    '@keyframes bxBlob1{from{transform:translate(0,0)}to{transform:translate(12vmax,-8vmax)}}@keyframes bxBlob2{from{transform:translate(0,0)}to{transform:translate(-10vmax,10vmax)}}',
    // 라이트 모드: 조금 더 옅게
    '@media (prefers-color-scheme:light){html.bx-app:not([data-theme="dark"]) .bx-med-scene{opacity:.42}html.bx-app:not([data-theme="dark"]) .bx-med-scene.pick{opacity:.22}}',
    'html.bx-app[data-theme="light"] .bx-med-scene{opacity:.42}html.bx-app[data-theme="light"] .bx-med-scene.pick{opacity:.22}',
    // 라이트 모드의 갈대는 바탕이 밝아 잘 안 보여서 조금 진하게
    '@media (prefers-color-scheme:light){html.bx-app:not([data-theme="dark"]) .bx-med-scene[data-scene="reeds"].run{opacity:.7}}',
    'html.bx-app[data-theme="light"] .bx-med-scene[data-scene="reeds"].run{opacity:.7}',
    '@media (prefers-reduced-motion:reduce){html.bx-app .bx-med-scene *{animation:none!important}}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(st);
})();
