// 설정 · 알람 점검 · 준비 기록
import { app, B, saveSettings, reload, refresh, render, IS_NATIVE } from './app.js';
import { hm, dateShort, mins } from './fmt.js';
import { esc, go, toast, stepper } from './ui.js';
import { icon } from './icons.js';
import { TRIAL } from './version.js';

const PERMS = [
  ['notif', '알림', '알람과 출발까지 남은 시간을 띄워요'],
  ['exact', '정확한 알람', '정한 시각에 늦지 않게 울려요'],
  ['fullscreen', '잠금 화면 알람', '화면이 꺼져 있어도 크게 보여요'],
  ['battery', '절전 예외', '삼성 휴대폰이 앱을 재우지 않게 해요'],
  ['calendar', '휴대폰 캘린더 함께 보기', '캘린더 약속을 그대로 가져와요']
];

export function renderSettings(root) {
  const s = app.st.settings, p = app.st.perms || {}, cals = app.st.calendars || [];
  const on = id => !s.calendars || s.calendars.includes(id);
  let h = '<main class="page"><header class="top"><button class="ib" type="button" data-back aria-label="뒤로">' + icon('back') + '</button><h1>설정</h1></header>';
  h += '<h2 class="sec">알람</h2><div class="card">' +
    '<div class="field"><div class="l"><b>기본 준비 시간</b><span>실제 기록이 3번 쌓이면 기록을 써요</span></div>' + stepper('prepDefault', s.prepDefault, '기본 준비 시간') + '</div>' +
    '<div class="field"><div class="l"><b>기본 이동 시간</b><span>장소마다 정한 시간이 먼저예요</span></div>' + stepper('travelDefault', s.travelDefault, '기본 이동 시간') + '</div>' +
    '<div class="field"><div class="l"><b>도착 여유</b><span>미루기는 이 여유 안에서만 돼요</span></div>' + stepper('buffer', s.buffer, '도착 여유') + '</div>' +
    '<div class="field"><div class="l"><b>출발 미리 알림</b><span>출발 몇 분 전에 짧게</span></div><span class="seg" role="group" aria-label="출발 미리 알림">' + [[0, '끔'], [5, '5분'], [10, '10분'], [15, '15분']].map(([v, l]) => '<button type="button" data-set="heads" data-v="' + v + '" aria-pressed="' + (s.heads === v) + '">' + l + '</button>').join('') + '</span></div>' +
    '<div class="field"><div class="l"><b>대답이 없으면 다시</b><span>최대 ' + s.holdMax + '번, 두 번째부터 읽어 줘요</span></div><span class="seg" role="group" aria-label="다시 울리는 간격">' + [2, 3, 5].map(v => '<button type="button" data-set="holdEvery" data-v="' + v + '" aria-pressed="' + (s.holdEvery === v) + '">' + v + '분</button>').join('') + '</span></div>' +
    '</div>';
  h += '<h2 class="sec">아침 요약</h2><div class="card"><div class="field"><div class="l"><b>아침에 오늘 약속 알려 주기</b><span>나가는 약속이 있는 날만</span></div><input class="sw" type="checkbox" role="switch" data-sw="morningOn" aria-label="아침 요약"' + (s.morningOn ? ' checked' : '') + '></div>' +
    (s.morningOn ? '<div class="field"><div class="l"><b>시각</b></div><input class="chip num" type="time" data-time="morningAt" value="' + esc(s.morningAt) + '" aria-label="아침 요약 시각"></div>' : '') + '</div>';
  h += '<h2 class="sec">캘린더</h2><div class="card">' + (cals.length ? cals.map(c => '<div class="field"><div class="l"><b>' + esc(c.name) + '</b><span>' + esc(c.account || '') + '</span></div><input class="sw" type="checkbox" role="switch" data-cal="' + esc(c.id) + '" aria-label="' + esc(c.name + ' 가져오기') + '"' + (on(c.id) ? ' checked' : '') + '></div>').join('') : '<div class="field"><div class="l"><b>볼 수 있는 캘린더가 없어요</b><span>아래 점검에서 캘린더 함께 보기를 켜 주세요</span></div></div>') + '</div>';
  h += '<h2 class="sec">표시</h2><div class="card"><div class="field"><div class="l"><b>시각 표시</b></div><span class="seg" role="group" aria-label="시각 표시"><button type="button" data-set="h24" data-v="0" aria-pressed="' + !s.h24 + '">오전 · 오후</button><button type="button" data-set="h24" data-v="1" aria-pressed="' + !!s.h24 + '">24시간</button></span></div></div>';
  h += '<h2 class="sec">알람이 잘 울리는지</h2><div class="card">' + PERMS.map(([k, n, d]) => '<div class="field"><div class="l"><b>' + n + '</b><span>' + d + '</span></div>' + (p[k] === 'no' ? '<button class="chip" type="button" data-fix="' + k + '">켜기</button>' : '<span class="perm ok">' + icon('check') + (p[k] === 'na' ? '필요 없음' : '켜짐') + '</span>') + '</div>').join('') +
    '<div class="field"><div class="l"><b>시험 알람</b><span>10초 뒤 준비 시작 알람처럼 울려요</span></div><button class="chip" type="button" data-test>울려 보기</button></div></div>';
  h += '<h2 class="sec">기록</h2><div class="list"><button class="row" type="button" data-go="#/record"><span class="t">' + icon('chart') + '</span><span class="m"><b>준비 기록</b><span>실제 준비 시간 · 미룬 횟수 · 늦은 횟수</span></span><span class="e">' + icon('chev') + '</span></button></div>';
  h += '<div class="foot"><span>B 스케줄러 · 시험판 B-' + TRIAL + (IS_NATIVE ? '' : ' · 미리 보기') + '</span><span>이 앱은 의료기기가 아니며 진단하거나 치료하지 않아요.</span></div></main>';
  root.innerHTML = h;
  root.onclick = async ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.back !== undefined) return history.length > 1 ? history.back() : go('#/');
    if (b.dataset.go) return go(b.dataset.go);
    const st = b.closest('[data-step]');
    if (st && b.dataset.d) { const k = st.dataset.step, lo = k === 'buffer' ? 0 : 5; return saveSettings({ [k]: Math.max(lo, Math.min(180, s[k] + +b.dataset.d)) }); }
    if (b.dataset.set) { const k = b.dataset.set, v = k === 'h24' ? b.dataset.v === '1' : +b.dataset.v; return saveSettings({ [k]: v }); }
    if (b.dataset.fix) { await B.fix({ kind: b.dataset.fix }); await refresh(); return render(); }
    if (b.dataset.test !== undefined) { await B.test({ seconds: 10 }); return toast('10초 뒤에 울려요 · 화면을 꺼 두고 기다려 보세요'); }
  };
  root.onchange = ev => {
    const t = ev.target;
    if (t.dataset.sw) return saveSettings({ [t.dataset.sw]: t.checked });
    if (t.dataset.time && /^\d{2}:\d{2}$/.test(t.value)) return saveSettings({ [t.dataset.time]: t.value }, '아침 ' + t.value + '에 알려 드려요');
    if (t.dataset.cal) {
      const all = cals.map(c => c.id); let list = s.calendars ? s.calendars.slice() : all.slice();
      list = t.checked ? Array.from(new Set(list.concat([t.dataset.cal]))) : list.filter(x => x !== t.dataset.cal);
      return saveSettings({ calendars: list.length === all.length ? null : list });
    }
  };
}

export async function renderRecord(root) {
  const L = app.st.learned || { prep: null, samples: [] };
  const S = await B.stats({ days: 7 });
  const tile = (v, l) => '<div class="field"><div class="l"><b>' + l + '</b></div><b class="num">' + esc(v) + '</b></div>';
  let h = '<main class="page"><header class="top"><button class="ib" type="button" data-back aria-label="뒤로">' + icon('back') + '</button><h1>준비 기록<small>지난 7일</small></h1></header>';
  h += '<div class="card">' + tile(S.rang + '번', '준비 시작 알람') + tile(S.prepToStart.median != null ? S.prepToStart.median + '분' : '--', '알람 → 시작까지(가운데 값)') + tile(S.snoozes + '번', '미룬 횟수') + tile(S.late.count + '번', '늦는다고 알린 횟수') + '</div>';
  h += '<h2 class="sec">실제 준비 시간</h2>';
  h += '<div class="card"><div class="field"><div class="l"><b>지금 쓰는 준비 시간</b><span>' + (L.prep ? '최근 기록의 가운데 값이에요' : '기록이 3번 모이면 기록으로 알려요(지금 ' + L.samples.length + '번)') + '</span></div><b class="num">' + (L.prep ? L.prep + '분' : app.st.settings.prepDefault + '분') + '</b></div>' +
    (L.samples.length ? '<ul class="plan">' + L.samples.slice(-8).reverse().map(x => '<li><b>' + esc(dateShort(x.t)) + '</b><span>' + esc(mins(x.minutes)) + '<small>' + esc(hm(x.t)) + ' 출발</small></span></li>').join('') + '</ul>' : '') + '</div>';
  h += '<div class="foot"><span>시작했어요부터 나갔어요까지 걸린 시간이에요. 이 기록은 휴대폰 안에만 있어요.</span></div></main>';
  root.innerHTML = h;
  root.onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.back !== undefined) history.length > 1 ? history.back() : go('#/settings'); };
}
