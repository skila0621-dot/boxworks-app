// 오늘 — 한 페이지로 보는 하루. 맨 위 큰 숫자는 약속 시각이 아니라 '준비 시작' · '출발' 시각
import { app, B, refresh, render, setOverride, doStart, doLeft, doSnooze, doLate, lateText } from './app.js';
import { hm, hmParts, rel, dateLong, sod, addDays, mins } from './fmt.js';
import { snoozeLeft, lateIfStartNow, lateIfLeaveNow, MIN } from './planner.js';
import { esc, go, toast } from './ui.js';
import { icon } from './icons.js';

const WHY = { default: '기본', learned: '지난 기록', user: '내가 정함', place: '이 장소', memory: '전에 정함' };

export function heroModel(E, now) {
  const outs = E.filter(e => e.out && !e.off && !e.allDay);
  const prep = outs.filter(e => e.state === 'prep' && now < e.start).sort((a, b) => a.leaveAt - b.leaveAt)[0];
  if (prep) return { kind: 'count', e: prep };
  const up = outs.filter(e => e.state === 'idle' && now < e.start).sort((a, b) => a.prepAt - b.prepAt)[0];
  if (!up) return { kind: 'none' };
  if (now < up.prepAt) return { kind: 'wait', e: up };
  if (now < up.leaveAt) return { kind: 'prepnow', e: up };
  return { kind: 'leavenow', e: up };
}

function track(e) {
  const left = Math.max(0, e.buffer - e.snoozed);
  const seg = (cls, m, label) => m > 0 ? '<span class="' + cls + '" style="flex:' + m + ' 1 0;min-width:40px" title="' + esc(label + ' ' + m + '분') + '">' + m + '분</span>' : '';
  return '<div class="track" aria-label="' + esc('준비 ' + e.prep + '분, 이동 ' + e.travel + '분, 여유 ' + left + '분') + '">' + seg('p', e.prep, '준비') + seg('v', e.travel, '이동') + seg('b', left, '여유') + '</div>' +
    '<div class="track-l"><span>' + esc(hm(e.prepAt)) + ' 준비</span><span>' + esc(hm(e.leaveAt)) + ' 출발</span><span>' + esc(hm(e.start)) + ' 약속</span></div>';
}
const what = e => '<b>' + esc(e.title || '제목 없음') + '</b> ' + esc(hm(e.start)) + (e.place ? ' · ' + esc(e.place) : '');
const basis = e => '준비 ' + e.prep + '분(' + WHY[e.prepWhy] + ') · 이동 ' + e.travel + '분(' + WHY[e.travelWhy] + ') · 도착 여유 ' + Math.max(0, e.buffer - e.snoozed) + '분';

function hero(m, now) {
  if (m.kind === 'none') {
    const t1 = addDays(now, 1), t2 = addDays(now, 2);
    const nx = app.entries.filter(e => e.out && !e.off && !e.allDay && e.start >= t1 && e.start < t2).sort((a, b) => a.prepAt - b.prepAt)[0];
    return '<section class="hero calm" aria-label="다음 할 일"><div class="k">' + icon('sun') + ' 오늘 남은 나가는 약속이 없어요</div>' +
      (nx ? '<div class="what">내일 첫 준비 시작 <b class="num">' + esc(hm(nx.prepAt)) + '</b> · ' + esc(nx.title) + '(' + esc(hm(nx.start)) + ')</div>' : '<div class="what">휴대폰 캘린더에 약속이 생기면 여기에 떠요.</div>') + '</section>';
  }
  const e = m.e; let k, big, sub, acts;
  if (m.kind === 'wait') {
    k = '<i></i>준비 시작'; big = esc(hm(e.prepAt)); sub = rel(e.prepAt, now);
    acts = '<button class="btn pri" type="button" data-start="' + esc(e.key) + '">지금 시작하기</button><button class="btn sec" type="button" data-open="' + esc(e.key) + '">약속 보기</button>';
  } else if (m.kind === 'prepnow') {
    const late = lateIfStartNow(e, now), sn = snoozeLeft(e);
    k = '<i></i>지금 준비 시작'; big = '지금'; sub = late ? '시작해도 ' + late + '분 늦어요' : '시작하면 제시간에 도착해요';
    acts = '<button class="btn pri" type="button" data-start="' + esc(e.key) + '">시작했어요</button>' + (sn ? '<button class="btn sec" type="button" data-snooze="' + esc(e.key) + '" data-kind="prep">' + sn + '분만</button>' : '<button class="btn sec" type="button" data-late="' + esc(e.key) + '">늦는다고 알리기</button>');
  } else if (m.kind === 'leavenow') {
    const late = lateIfLeaveNow(e, now), sn = snoozeLeft(e);
    k = '<i class="go"></i>지금 출발'; big = '지금'; sub = late ? '나가도 ' + late + '분 늦어요' : '나가면 ' + hm(now + e.travel * MIN) + ' 도착';
    acts = '<button class="btn pri" type="button" data-left="' + esc(e.key) + '">나갔어요</button>' + (sn && !late ? '<button class="btn sec" type="button" data-snooze="' + esc(e.key) + '" data-kind="leave">' + sn + '분만</button>' : '<button class="btn sec" type="button" data-late="' + esc(e.key) + '">늦는다고 알리기</button>');
  } else {
    const left = Math.max(0, Math.round((e.leaveAt - now) / MIN)), late = lateIfLeaveNow(e, now);
    k = '<i class="go"></i>출발까지'; big = left ? mins(left) : '지금';
    sub = left ? hm(e.leaveAt) + ' 출발' : late ? '나가도 ' + late + '분 늦어요' : '나가면 ' + hm(now + e.travel * MIN) + ' 도착';
    acts = '<button class="btn pri" type="button" data-left="' + esc(e.key) + '">나갔어요</button><button class="btn sec" type="button" data-late="' + esc(e.key) + '">' + (late ? '늦는다고 알리기' : '도착 시각 알리기') + '</button>';
  }
  return '<section class="hero" aria-label="다음 할 일"><div class="k">' + k + '</div><div class="big">' + big + '</div><div class="rel">' + esc(sub) + '</div><div class="what">' + what(e) + '</div>' + track(e) +
    '<div class="acts">' + acts + '</div><div class="why">' + esc(basis(e)) + '</div></section>';
}

function row(e, now) {
  const [ap, t] = e.allDay ? ['', '종일'] : hmParts(e.start);
  const time = '<span class="t">' + (ap ? '<small>' + ap + '</small>' : '') + esc(t) + '</span>';
  let sub = '', tag = '', dim = false;
  if (e.allDay) sub = esc(e.calName || '종일');
  else if (e.out && e.off) { tag = '<span class="tag">알람 꺼짐</span>'; sub = esc(e.place || '나가는 약속'); }
  else if (e.out) {
    if (e.state === 'left') tag = '<span class="tag ok">출발함</span>';
    else if (e.state === 'prep') tag = '<span class="tag prep">준비 중</span>';
    else if (e.state === 'past') dim = true;
    // 줄에는 B의 핵심 시각 하나만(준비 시작, 준비 중이면 출발). 나머지는 약속 화면에
    sub = (e.state === 'idle' ? '<i class="dot"></i>준비 시작 ' + esc(hm(e.prepAt)) : e.state === 'prep' ? '출발 ' + esc(hm(e.leaveAt)) : '') + (e.place ? (e.state === 'idle' || e.state === 'prep' ? ' · ' : '') + esc(e.place) : '');
  } else if (e.src === 'own') { sub = '알림 ' + esc(hm(e.start)); if (e.state === 'done') tag = '<span class="tag ok">했어요</span>'; else if (e.state === 'past') dim = true; }
  else { sub = esc([e.place, '알람 없음'].filter(Boolean).join(' · ')); dim = e.state === 'past'; }
  if (!e.out && e.state === 'past' && !e.allDay) dim = true;
  if (e.suggest && !e.off && e.state !== 'past') {
    return '<div class="row askrow' + (dim ? ' dim' : '') + '">' + time + '<button class="m" type="button" data-open="' + esc(e.key) + '"><b>' + esc(e.title || '제목 없음') + '</b><span>나가는 약속인가요?</span></button><span class="e"></span>' +
      '<div class="ask"><button class="chip" type="button" data-out="' + esc(e.key) + '" data-v="1">네, 나가요</button><button class="chip" type="button" data-out="' + esc(e.key) + '" data-v="0">아니에요</button></div></div>';
  }
  return '<button class="row' + (dim ? ' dim' : '') + '" type="button" data-open="' + esc(e.key) + '">' + time + '<span class="m"><b>' + esc(e.title || '제목 없음') + '</b><span>' + (sub || '&nbsp;') + '</span></span><span class="e">' + tag + icon('chev') + '</span></button>' +
    (e.tight && e.state === 'idle' && !e.off ? '<div class="note"><b>빠듯해요</b> · 앞 약속(' + esc(e.tight.title) + ')이 끝나기 ' + e.tight.minutes + '분 전에 준비를 시작해야 해요</div>' : '');
}

export function renderToday(root) {
  const now = app.now, st = app.st, E = app.entries;
  const t0 = sod(now), t1 = addDays(now, 1), t2 = addDays(now, 2);
  const inDay = (e, a, b) => e.allDay ? e.start < b && (e.end || e.start + 1) > a : e.start >= a && e.start < b;
  const today = E.filter(e => inDay(e, t0, t1)), tomorrow = E.filter(e => inDay(e, t1, t2));
  const outsToday = today.filter(e => e.out && !e.off && !e.allDay).length;
  const p = st.perms || {};
  const alarmOk = ['notif', 'exact', 'fullscreen'].every(k => p[k] !== 'no');
  let h = '<main class="page"><header class="top"><h1>' + esc(dateLong(now)) + '<small>' + (outsToday ? '오늘 나가는 약속 ' + outsToday + '개' : '오늘 나가는 약속 없음') + '</small></h1><button class="ib" type="button" data-go="#/settings" aria-label="설정">' + icon('gear') + '</button></header>';
  if (app.backDays > 2 && !app.backSeen) {
    h += '<section class="back" aria-label="돌아온 날"><b>' + app.backDays + '일 만이에요 · 오늘부터 시작</b><p>지난 일은 그대로 두고, 오늘 약속부터 챙길게요.</p><button class="btn pri" type="button" data-backok>시작하기</button></section>';
  } else if (p.calendar === 'no') {
    h += '<section class="back" aria-label="캘린더"><b>휴대폰 캘린더를 함께 볼까요?</b><p>약속을 옮겨 적지 않아도 준비 시작부터 알려 드려요.</p><button class="btn pri" type="button" data-fix="calendar">캘린더 함께 보기</button></section>';
  } else h += hero(heroModel(E, now), now);
  if (!alarmOk) h += '<button class="row alert" type="button" data-go="#/settings"><span class="t">' + icon('bellOff') + '</span><span class="m"><b>알람이 안 울릴 수 있어요</b><span>설정에서 한 번에 점검해요</span></span><span class="e">' + icon('chev') + '</span></button>';
  h += '<h2 class="sec">오늘</h2>';
  h += today.length ? '<div class="list">' + today.map(e => row(e, now)).join('') + '</div>' : '<p class="empty">오늘은 일정이 없어요. 휴대폰 캘린더에 넣은 약속도 여기에 떠요.</p>';
  h += '<h2 class="sec">내일</h2>';
  h += tomorrow.length ? '<div class="list">' + tomorrow.slice(0, 5).map(e => row(e, now)).join('') + '</div>' : '<p class="empty">내일은 아직 일정이 없어요.</p>';
  h += '</main><button class="btn pri fab" type="button" data-add>' + icon('plus') + '넣기</button>';
  root.innerHTML = h;
  root.onclick = async ev => {
    const b = ev.target.closest('button'); if (!b) return;
    const E2 = k => app.entries.find(x => x.key === k);
    if (b.dataset.go) return go(b.dataset.go);
    if (b.dataset.open) return go('#/e/' + encodeURIComponent(b.dataset.open));
    if (b.dataset.add !== undefined) return (await import('./add.js')).openAdd();
    if (b.dataset.backok !== undefined) { app.backSeen = true; return render(); }
    if (b.dataset.fix) { await B.fix({ kind: b.dataset.fix }); await refresh(); return render(); }
    if (b.dataset.start) return doStart(E2(b.dataset.start));
    if (b.dataset.left) return doLeft(E2(b.dataset.left));
    if (b.dataset.snooze) return doSnooze(E2(b.dataset.snooze), b.dataset.kind);
    if (b.dataset.late) return doLate(E2(b.dataset.late));
    if (b.dataset.out) { const v = b.dataset.v === '1'; return setOverride(b.dataset.out, { out: v }, v ? '나가는 약속으로 챙길게요 · 같은 제목은 기억해요' : '알람 없이 둘게요 · 같은 제목은 기억해요'); }
  };
}
