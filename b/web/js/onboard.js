// 처음 세 장: 캘린더 함께 보기 → 잠금 화면 알람 → 삼성 절전 예외. 묻는 화면은 질문 하나에 한 장
import { app, B, refresh, render } from './app.js';
import { esc } from './ui.js';
import { hm, hmParts } from './fmt.js';

// 장마다 작은 그림(실제 화면과 같은 부품): 거꾸로 계산한 하루 · 잠금 화면 알람 · 절전 예외. 시각은 설정(오전·오후 | 24시간)을 따른다
const T = (h, m) => new Date(2026, 0, 5, h, m).getTime();
const tcol = ms => { const [ap, t] = hmParts(ms); return '<span class="t">' + (ap ? '<small>' + ap + '</small>' : '') + t + '</span>'; };
const PIC = [
  () => '<div class="list"><div class="row">' + tcol(T(13, 50)) + '<span class="m"><b>준비 시작</b><span><i class="dot"></i>지금 시작하면 제시간</span></span><span class="e"></span></div><div class="row">' + tcol(T(14, 20)) + '<span class="m"><b>출발</b><span>이동 30분</span></span><span class="e"></span></div><div class="row">' + tcol(T(15, 0)) + '<span class="m"><b>치과</b><span>캘린더에 있던 약속</span></span><span class="e"></span></div></div>',
  () => '<div class="mock"><span>준비 시작 · 치과</span><b class="num">' + hm(T(13, 50)) + '</b><span>지금 시작하면 ' + hm(T(14, 50)) + ' 도착</span><i>시작했어요</i></div>',
  () => '<div class="list"><div class="row"><span class="t">설정</span><span class="m"><b>배터리 › 백그라운드 사용 제한</b><span>절전 예외 앱에 B 스케줄러</span></span><span class="e"></span></div></div>'
];
const STEPS = [
  { h: '약속 시간 말고,<br>준비를 시작할 시간을 알려 드려요', p: '휴대폰 캘린더에 있는 약속을 그대로 가져와요. 옮겨 적지 않아도 돼요.', go: '캘린더 함께 보기', kinds: ['calendar'] },
  { h: '잠금 화면에서도<br>크게 울리게 해 주세요', p: '"시작했어요"를 누를 때까지 몇 분마다 다시 알려요. 두 번째부터는 소리 내어 읽어 줘요.', go: '알람 허용하기', kinds: ['notif', 'exact', 'fullscreen'] },
  { h: '휴대폰이 앱을<br>재우지 않게 해 주세요', p: '삼성 휴대폰은 한동안 안 쓴 앱을 재워요. 절전 예외에 넣으면 알람이 늦지 않아요.', go: '절전 예외에 넣기', kinds: ['battery'] }
];

export function renderOnboard(root) {
  const i = Math.min(app.onb, STEPS.length - 1), s = STEPS[i];
  root.innerHTML = '<main class="onb"><div class="dots" aria-label="' + (i + 1) + ' / 3">' + STEPS.map((_, k) => '<i class="' + (k <= i ? 'on' : '') + '"></i>').join('') + '</div>' +
    '<section><h1>' + s.h + '</h1><p>' + esc(s.p) + '</p><div class="pic" aria-hidden="true">' + PIC[i]() + '</div></section>' +
    '<div class="acts"><button class="btn pri wide" type="button" data-go>' + esc(s.go) + '</button><button class="btn ghost wide" type="button" data-skip>나중에</button></div></main>';
  root.onclick = async ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.go !== undefined) { b.disabled = true; for (const k of s.kinds) { const p = (app.st.perms || {})[k]; if (p === 'no') await B.fix({ kind: k }); } }
    app.onb++;
    if (app.onb >= STEPS.length) { await B.save({ firstRunDone: true }); await refresh(); app.st.firstRun = false; location.hash = '#/'; }
    else await refresh();
    render();
  };
}
