// 넣기 — 한 문장(말 · 글) → 날짜 · 시각 · 장소 · 제목 → 말로 다시 고치기 → 휴대폰 캘린더에 넣기
import { app, B, reload, setOverride } from './app.js';
import { parse, revise } from './parse.js';
import { hm, dateLong } from './fmt.js';
import { esc, openSheet, closeSheet, toast } from './ui.js';
import { icon } from './icons.js';

const toMs = (date, hhmm) => { const [y, m, d] = date.split('-').map(Number); const [h, mi] = hhmm.split(':').map(Number); return new Date(y, m - 1, d, h, mi).getTime(); };
const todayYmd = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

export function openAdd(prefill) {
  let draft = null, cand = null, outSet = null, editing = null, listening = false, speechSub = null;
  const cals = (app.st.calendars || []).filter(c => c.writable && c.visible);
  const body = '<div class="say"><input class="inp" id="addT" type="text" autocomplete="off" enterkeyhint="done" placeholder="예: 금요일 7시 홍대에서 저녁" aria-label="한 문장으로 약속"><button class="ib" type="button" id="addMic" aria-label="말로 넣기" aria-pressed="false">' + icon('mic') + '</button></div>' +
    '<p class="hint" id="addHint">날짜 · 시각 · 장소를 한 문장에. 말해도 돼요.</p><div class="prev" id="addPrev"></div>' +
    '<div class="acts"><button class="btn pri wide" type="button" id="addGo" disabled>캘린더에 넣기</button></div>';
  const sh = openSheet('약속 넣기', body, s => {
    const T = s.querySelector('#addT'), P = s.querySelector('#addPrev'), G = s.querySelector('#addGo'), Hn = s.querySelector('#addHint'), M = s.querySelector('#addMic');
    const fill = d => { if (!d) return d; const x = Object.assign({}, d); if (!x.date && x.start) { const t = todayYmd(app.now); x.date = toMs(t, x.start) > app.now ? t : todayYmd(app.now + 864e5); x.guessed = true; } return x; };
    const compute = () => { const t = T.value.trim(); const r = draft && t ? revise(draft, t, new Date(app.now)) : null; cand = r ? Object.assign(r, { revised: true }) : t ? fill(parse(t, new Date(app.now))) : draft; draw(); };
    const commit = () => { if (!cand) return; const wasRev = cand.revised; draft = Object.assign({}, cand); delete draft.revised; if (wasRev) { T.value = ''; toast('고쳤어요'); } compute(); };
    function draw() {
      const d = cand;
      if (!d || !d.title && !d.start) { P.innerHTML = ''; G.disabled = true; Hn.textContent = '날짜 · 시각 · 장소를 한 문장에. 말해도 돼요.'; return; }
      const out = outSet != null ? outSet : !!d.place;
      const chip = (k, label, val) => '<button class="chip" type="button" data-edit="' + k + '" aria-label="' + esc(label + ' 고치기') + '">' + esc(val) + '</button>';
      let h = '<p class="ttl">' + esc(d.title || '제목 없음') + '</p><div class="chips">' +
        chip('date', '날짜', d.date ? dateLong(toMs(d.date, '00:00')) + (d.guessed ? '(짐작)' : '') : '날짜 미지정') +
        chip('time', '시각', d.start ? hm(toMs(d.date || todayYmd(app.now), d.start)) + (d.end ? ' – ' + hm(toMs(d.date || todayYmd(app.now), d.end)) : '') : '--:--') +
        chip('place', '장소', d.place || '장소 없음') + chip('title', '제목', '제목 고치기') + '</div>';
      if (d.alt) h += '<button class="chip" type="button" data-alt>' + esc('이번 달 ' + Number(d.alt.slice(8)) + '일로 바꾸기') + '</button>';
      if (editing) {
        const v = editing === 'date' ? d.date || '' : editing === 'time' ? d.start || '' : editing === 'place' ? d.place || '' : d.title || '';
        h += '<div class="edit"><label for="addE">' + ({ date: '날짜', time: '시각', place: '장소', title: '제목' })[editing] + '</label><input class="inp" id="addE" type="' + (editing === 'date' ? 'date' : editing === 'time' ? 'time' : 'text') + '" value="' + esc(v) + '"><button class="btn sec" type="button" data-editok>이대로</button></div>';
      }
      h += '<div class="card"><div class="field"><div class="l"><b>나가는 약속</b><span>' + (out ? '준비 시작 · 출발 알람을 걸어요' : '알람 없이 캘린더에만 넣어요') + '</span></div><input class="sw" type="checkbox" role="switch" id="addOut" aria-label="나가는 약속"' + (out ? ' checked' : '') + '></div>' +
        (cals.length > 1 ? '<div class="field"><div class="l"><b>넣을 캘린더</b></div><select class="chip" id="addCal" aria-label="넣을 캘린더">' + cals.map(c => '<option value="' + esc(c.id) + '"' + (String(app.st.settings.writeCal || cals[0].id) === String(c.id) ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></div>' : '') + '</div>';
      P.innerHTML = h;
      G.disabled = !d.start || !d.date;
      Hn.textContent = d.start ? '고칠 게 있으면 이어서 말하세요: "7시 반으로" · "모레로" · "장소는 합정역"' : '시각을 말해 주세요(예: 3시). 시각이 있어야 알람을 걸 수 있어요.';
      const E = P.querySelector('#addE'); if (E) E.focus();
    }
    T.addEventListener('input', compute);
    T.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); commit(); } });
    P.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b || !cand) return;
      if (b.dataset.edit) { editing = editing === b.dataset.edit ? null : b.dataset.edit; draw(); return; }
      if (b.dataset.alt !== undefined) { cand = Object.assign({}, cand, { date: cand.alt, alt: null }); draft = Object.assign({}, cand); draw(); return; }
      if (b.dataset.editok !== undefined) {
        const v = P.querySelector('#addE').value.trim(); const k = editing;
        cand = Object.assign({}, cand, k === 'date' ? { date: v || cand.date, guessed: false } : k === 'time' ? { start: v || cand.start } : k === 'place' ? { place: v || null } : { title: v || cand.title });
        draft = Object.assign({}, cand); editing = null; T.value = ''; draw();
      }
    });
    P.addEventListener('change', ev => {
      if (ev.target.id === 'addOut') { outSet = ev.target.checked; draw(); }
      if (ev.target.id === 'addCal') B.save({ settings: Object.assign({}, app.st.settings, { writeCal: ev.target.value }) }).then(() => { app.st.settings.writeCal = ev.target.value; });
    });
    M.addEventListener('click', async () => {
      if (listening) { listening = false; M.setAttribute('aria-pressed', 'false'); await B.stopListen(); return; }
      if (app.st.perms.mic === 'no') { const r = await B.fix({ kind: 'mic' }); if (r.state !== 'ok') { toast('마이크를 허용하면 말로 넣을 수 있어요'); return; } app.st.perms.mic = 'ok'; }
      listening = true; M.setAttribute('aria-pressed', 'true'); Hn.textContent = '듣고 있어요…';
      if (!speechSub) speechSub = await B.addListener('speech', d => {
        if (d.error) { listening = false; M.setAttribute('aria-pressed', 'false'); Hn.textContent = '잘 듣지 못했어요. 한 번 더 말하거나 글로 적어 주세요.'; return; }
        T.value = d.text || ''; compute(); if (d.final) { listening = false; M.setAttribute('aria-pressed', 'false'); commit(); }
      });
      await B.listen();
    });
    G.addEventListener('click', async () => {
      const d = cand || draft; if (!d || !d.start || !d.date) return;
      G.disabled = true;
      const begin = toMs(d.date, d.start), end = d.end ? toMs(d.date, d.end) : begin + 3600e3;
      const out = outSet != null ? outSet : !!d.place;
      const title = d.title || '약속';
      try {
        const r = await B.addEvent({ title, begin, end: end > begin ? end : begin + 3600e3, location: d.place || '', calendarId: app.st.settings.writeCal || undefined });
        const key = 'c:' + r.id + ':' + begin;
        if (out !== !!d.place) { await reload(); await setOverride(key, { out }); }
        closeSheet(); await reload();
        const e = app.entries.find(x => x.key === key);
        toast(e && e.out ? '넣었어요 · ' + hm(e.prepAt) + '에 준비 시작을 알려요' : '휴대폰 캘린더에 넣었어요');
      } catch (err) {
        // 캘린더 권한이 없으면 이 앱에만 넣는다(알람은 똑같이)
        const items = (app.st.items || []).concat([{ id: Date.now().toString(36), title, at: begin, endAt: end, place: d.place || '', out }]);
        await B.save({ items }); closeSheet(); await reload();
        toast('캘린더를 볼 수 없어 이 앱에만 넣었어요');
      }
    });
    if (prefill) { T.value = prefill; compute(); commit(); } else setTimeout(() => T.focus(), 50);
  });
  return sh;
}
