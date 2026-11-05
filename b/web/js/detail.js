// 약속 하나 — 나가는 약속인지, 이동 · 준비 시간(왜 이 값인지), 알람 미리 보기, 이 약속만 알람 끄기
import { app, B, setOverride, reload } from './app.js';
import { hm, dateLong, mins } from './fmt.js';
import { MIN } from './planner.js';
import { esc, go, toast, stepper } from './ui.js';
import { icon } from './icons.js';

const PREP_WHY = { default: ['기본값', '실제 준비 시간이 3번 모이면 그 시간으로 알려요'], learned: ['지난 기록', '최근 준비 기록의 가운데 값이에요'], user: ['이 약속에만', '이 약속에만 정한 값이에요'] };
const TRAVEL_WHY = { default: ['기본값', '바꾸면 이 장소는 다음에도 그 시간으로 해요'], place: ['이 장소', '이 장소에 전에 정한 시간이에요'], user: ['이 약속에만', '이 약속에만 정한 값이에요'] };

export function renderDetail(root, key) {
  const e = app.entries.find(x => x.key === key);
  if (!e) { root.innerHTML = '<main class="page"><header class="top"><button class="ib" type="button" data-back aria-label="뒤로">' + icon('back') + '</button><h1>약속</h1></header><p class="muted">이 약속을 찾지 못했어요. 캘린더에서 지워졌을 수 있어요.</p></main>'; bind(root, null); return; }
  const when = e.allDay ? dateLong(e.start) + ' · 종일' : dateLong(e.start) + ' ' + hm(e.start) + (e.end ? ' – ' + hm(e.end) : '');
  const src = e.src === 'cal' ? (e.calName ? e.calName + '(휴대폰 캘린더)' : '휴대폰 캘린더') : '이 앱에만 넣음';
  let h = '<main class="page"><header class="top"><button class="ib" type="button" data-back aria-label="뒤로">' + icon('back') + '</button><h1>약속</h1></header>';
  h += '<div class="ev-h"><h1>' + esc(e.title || '제목 없음') + '</h1><p class="num">' + esc(when) + '</p><p>' + (e.place ? icon('pin', 'ico') + ' ' + esc(e.place) + ' · ' : '') + esc(src) + '</p></div>';
  if (e.allDay) {
    h += '<div class="card"><div class="field"><div class="l"><b>종일 일정이에요</b><span>시각이 없는 일정에는 알람을 걸지 않아요</span></div></div></div>';
  } else {
    h += '<div class="card">';
    h += '<div class="field"><div class="l"><b>나가는 약속</b><span>' + (e.out ? '준비 시작부터 출발까지 알려요' : e.outWhy === 'word' ? '나가는 약속이면 켜 주세요. 같은 제목은 기억해요' : '켜면 준비 시작 · 출발 알람을 걸어요') + '</span></div><input class="sw" type="checkbox" role="switch" data-sw="out" aria-label="나가는 약속"' + (e.out ? ' checked' : '') + '></div>';
    if (e.out) {
      const tw = TRAVEL_WHY[e.travelWhy] || ['', ''], pw = PREP_WHY[e.prepWhy] || ['', ''];
      h += '<div class="field"><div class="l"><b>이동 시간</b><span>' + esc(tw[0]) + '</span></div>' + stepper('travel', e.travel, '이동 시간') + '</div>';
      h += '<div class="sub"><div class="chips">' + [15, 30, 45, 60].map(v => '<button class="chip" type="button" data-set="travel" data-v="' + v + '" aria-pressed="' + (e.travel === v) + '">' + v + '분</button>').join('') + '</div><p class="fnote">' + esc(tw[1]) + '</p></div>';
      h += '<div class="field"><div class="l"><b>준비 시간</b><span>' + esc(pw[0]) + '</span></div>' + stepper('prep', e.prep, '준비 시간') + '</div>';
      h += '<div class="sub"><div class="chips">' + [15, 30, 45, 60].map(v => '<button class="chip" type="button" data-set="prep" data-v="' + v + '" aria-pressed="' + (e.prep === v) + '">' + v + '분</button>').join('') + '</div><p class="fnote">' + esc(pw[1]) + '</p></div>';
    }
    h += '</div>';
    if (e.out) {
      const left = Math.max(0, e.buffer - e.snoozed);
      const items = [
        [e.prepAt, '준비 시작', '"시작했어요"를 누를 때까지 울려요', e.state !== 'idle'],
        e.headsAt ? [e.headsAt, Math.round((e.leaveAt - e.headsAt) / MIN) + '분 뒤 출발', '한 번 짧게 알려요', e.state === 'left'] : null,
        [e.leaveAt, '출발', '"나갔어요"를 누를 때까지 울려요', e.state === 'left'],
        [e.start, '약속', left ? '도착 여유 ' + left + '분' : '여유 없이 딱 맞게', false]
      ].filter(Boolean);
      h += '<h2 class="sec">알람</h2><div class="card"><ul class="plan">' + items.map(([t, a, b, done]) => '<li class="' + (done ? 'done' : '') + '"><b>' + esc(hm(t)) + '</b><span>' + esc(a) + '<small>' + esc(b) + '</small></span></li>').join('') + '</ul></div>';
      h += '<div class="card gap"><div class="field"><div class="l"><b>이 약속은 알람 끄기</b><span>' + (e.off ? '알람이 꺼져 있어요' : '이번 한 번만 끄고 싶을 때') + '</span></div><input class="sw" type="checkbox" role="switch" data-sw="off" aria-label="이 약속은 알람 끄기"' + (e.off ? ' checked' : '') + '></div></div>';
    }
  }
  h += '<div class="pacts">';
  if (e.src === 'cal' && e.eventId) h += '<button class="btn sec wide" type="button" data-cal>' + icon('cal') + '캘린더에서 열기 · 고치기</button>';
  if (e.src === 'own') h += '<button class="btn del wide" type="button" data-del>이 알림 지우기</button>';
  h += '</div></main>';
  root.innerHTML = h;
  bind(root, e);
}

function bind(root, e) {
  root.onclick = async ev => {
    const b = ev.target.closest('button, input'); if (!b) return;
    if (b.dataset.back !== undefined) return history.length > 1 ? history.back() : go('#/');
    if (!e) return;
    const st = b.closest('[data-step]');
    if (st && b.dataset.d) {
      const k = st.dataset.step, v = Math.max(5, Math.min(k === 'prep' ? 180 : 240, e[k] + +b.dataset.d));
      return setOverride(e.key, { [k]: v }, (k === 'prep' ? '준비 ' : '이동 ') + mins(v) + (k === 'travel' && e.place ? ' · 이 장소는 다음에도' : ''));
    }
    if (b.dataset.set) { const k = b.dataset.set, v = +b.dataset.v; return setOverride(e.key, { [k]: v }, (k === 'prep' ? '준비 ' : '이동 ') + mins(v) + (k === 'travel' && e.place ? ' · 이 장소는 다음에도' : '')); }
    if (b.dataset.cal !== undefined) return B.openEvent({ id: e.eventId });
    if (b.dataset.del !== undefined) {
      const items = (app.st.items || []).filter(x => 'o:' + x.id !== e.key), before = app.st.items;
      await B.save({ items }); go('#/'); await reload();
      return toast('지웠어요', ['되돌리기', async () => { await B.save({ items: before }); await reload(); }]);
    }
  };
  root.onchange = ev => {
    const s = ev.target.closest('[data-sw]'); if (!s || !e) return;
    if (s.dataset.sw === 'out') return setOverride(e.key, { out: s.checked }, s.checked ? '나가는 약속으로 챙길게요 · 같은 제목은 기억해요' : '알람 없이 둘게요 · 같은 제목은 기억해요');
    if (s.dataset.sw === 'off') return setOverride(e.key, { off: s.checked || undefined }, s.checked ? '이 약속은 알람을 껐어요' : '다시 알려 드릴게요');
  };
}
