// 시험판 44: 일정 창을 삼성 캘린더 방식으로(대표 11/4 1:34 · 1:50 · 1:53), 캘린더 + 단추 · 일 · 주 · 월 · 칩 작게(1:18)
const { openApp, settings, checker } = require('./harness.cjs');

const old = '2026-10-29T00:00:00.000Z';
function seed() {
  return [['settings', settings()],
    ['c_w', { type: 'category', name: '일·공부', color: '#2a78d6', order: 0, createdAt: old }],
    ['c_p', { type: 'category', name: '개인', color: '#1baf7a', order: 1, createdAt: old }],
    ['c_m', { type: 'category', name: '회사 · 마케팅팀 공유 캘린더', color: '#6250d6', order: 2, createdAt: old }],
    ['it_1', { type: 'item', title: '치과 정기 검진', date: '2026-11-02', start: '15:00', end: '16:00', remind: 10, location: '서울대학교치과병원 본관 3층 보존과 앞 회의실', note: '신분증 챙기기\n둘째 줄', categoryId: 'c_m', createdAt: old, updatedAt: '2026-10-30T00:00:00.000Z' }],
    ['it_2', { type: 'item', title: '점심', date: '2026-11-01', start: '12:00', end: '', location: '강남역 2번 출구', categoryId: 'c_p', createdAt: old, updatedAt: '2026-10-31T00:00:00.000Z' }],
    ['it_3', { type: 'item', title: '회의', date: '2026-10-30', start: '10:00', end: '', location: '회사', categoryId: 'c_w', createdAt: old, updatedAt: '2026-10-29T00:00:00.000Z' }]];
}
// 시험판 49: 고치기의 '일정 삭제' 줄(맨 아래)은 빼고 센다(v49에서 따로 봄)
const rows = p => p.evaluate(() => Array.from(document.querySelectorAll('#f-chips > .bx-er:not(.bx-er-del), #f-chips > .bx-edt')).map(r => r.classList.contains('bx-edt') ? 'DT' : r.textContent.trim()));
const row = (p, sel) => p.evaluate(s => { const r = document.querySelector('#f-chips ' + s); if (!r) return null; const t = r.querySelector('.bx-er-t'); return { t: (t || r).textContent.trim(), ph: !!(t && t.classList.contains('ph')) }; }, sel);
const page = p => p.evaluate(() => { const e = document.getElementById('bx-ep'); return e ? e.querySelector('#bx-ep-t').textContent : null; });
const done = p => p.click('#bx-ep [data-bxep="done"]').then(() => p.waitForTimeout(250));

module.exports = async function () {
  const c = checker('시험판 44 · 일정 창 삼성 방식(줄 목록 · 페이지 · 완료) · + 단추 · 일 · 주 · 월 · 칩');
  const app = await openApp({ data: seed() });
  try {
    const p = app.page;
    // (1) 캘린더: + 단추 70% · 옅은 그림자, 일 · 주 · 월 높이 31(누르는 범위 44), 칩 높이 28
    await p.click('.dock [data-view="month"]'); await p.waitForTimeout(700);
    const cal = await p.evaluate(() => {
      const f = getComputedStyle(document.querySelector('.bx-fab')), v = document.getElementById('bx-vsw'), b = v.querySelector('button');
      const hit = getComputedStyle(b, '::after');
      return { bg: f.backgroundColor, sh: f.boxShadow, vh: Math.round(v.getBoundingClientRect().height), bw: Math.round(b.getBoundingClientRect().width), hitTop: hit.top, ch: Math.round(document.querySelector('.bx-cchip').getBoundingClientRect().height),
        dy: Math.round((v.getBoundingClientRect().top + v.getBoundingClientRect().height / 2) - (document.querySelector('.bx-fab').getBoundingClientRect().top + 30)) };
    });
    // 시험판 48(대표 11/4 13:51 "단추는 100%, 번지는 효과만 70%"): 단추는 꽉 찬 색, 둘레 빛은 전(40%)의 70%인 28%
    c.ok(/^rgb\(/.test(cal.bg), '+ 단추 불투명도 100% ' + cal.bg);
    const glow = +(((cal.sh.match(/\/ ([\d.]+)\) 0px 8px 22px/) || [])[1]) || 0);
    c.ok(/0px 8px 22px/.test(cal.sh) && glow > 0.25 && glow < 0.31, '+ 단추 둘레 빛 70%(28%) ' + cal.sh);
    c.ok(cal.vh === 31 && cal.bw === 28 && cal.hitTop === '-10px' && Math.abs(cal.dy) <= 2, '일 · 주 · 월 70%(높이 31 · 단추 28, 누르는 범위 44), + 단추와 같은 높이 ' + JSON.stringify(cal));
    c.eq(cal.ch, 28, '캘린더 칩 높이 28');
    // (2) 일정 창: 삼성 순서의 줄 목록, 길면 …, 비어 있으면 회색 이름
    await p.click('.dock [data-view="today"]'); await p.waitForTimeout(500);
    await p.click('#tcard2 .row-main[data-id="it_1"]'); await p.waitForTimeout(500);
    c.eq(await rows(p), ['하루 종일', 'DT', '서울대학교치과병원 본관 3층 보존과 앞 회의실', '회사 · 마케팅팀 공유 캘린더', '10분 전', '출발·준비', '신분증 챙기기', '사진·파일'],
      '줄 순서: 하루 종일 · 시작 → 끝 · 장소 · 캘린더 · 알림 · 출발·준비 · 메모(첫 줄) · 사진·파일');
    const ell = await p.evaluate(() => { const t = document.querySelector('#f-chips [data-bxsub="loc"] .bx-er-t'); const s = getComputedStyle(t); return { cut: t.scrollWidth > t.clientWidth, ov: s.textOverflow, ws: s.whiteSpace, h: Math.round(t.closest('.bx-er').getBoundingClientRect().height) }; });
    c.ok(ell.cut && ell.ov === 'ellipsis' && ell.ws === 'nowrap' && ell.h === 56, '긴 장소는 한 줄, 뒤는 …(줄 높이 56) ' + JSON.stringify(ell));
    c.eq(await row(p, '[data-fpanel="go"]'), { t: '출발·준비', ph: true }, '정하지 않은 출발·준비는 회색 이름');
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#f-chips .bx-edt button')).map(b => b.textContent)), ['11월 2일 (월)', '오후 3:00', '11월 2일 (월)', '오후 4:00'], '시작 → 끝: 날짜 · 시각 두 칸');
    // (3) 알림 페이지: 고르고 ‹ 이면 되돌림, 완료면 바뀜
    await p.click('#f-chips [data-fpanel="rem"]'); await p.waitForTimeout(400);
    c.eq(await page(p), '알림', '알림 줄 → 알림 페이지');
    c.eq(await p.evaluate(() => document.querySelector('#bx-ep .bx-swrow > span').textContent), '사용 중', "스위치 줄은 삼성처럼 '사용 중'");
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#bx-ep .bx-rem-q .pick')).map(b => [b.textContent.trim(), b.getAttribute('aria-pressed')])), [['정시', 'false'], ['10분 전', 'true'], ['1시간 전', 'false'], ['직접 입력', 'false']], '동그라미 목록 + 직접 입력');
    await p.click('#bx-ep [data-bx-rem="60"]'); await p.waitForTimeout(200);
    await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(250);
    c.ok(!(await page(p)) && (await row(p, '[data-fpanel="rem"]')).t === '10분 전', '‹ 를 누르면 바꾼 것을 되돌림(10분 전)');
    await p.click('#f-chips [data-fpanel="rem"]'); await p.waitForTimeout(300);
    await p.click('#bx-ep [data-bx-rem="60"]'); await p.waitForTimeout(200);
    await done(p);
    c.eq((await row(p, '[data-fpanel="rem"]')).t, '1시간 전', "'완료'를 누르면 바뀜(1시간 전)");
    // (4) 휴대폰 뒤로: 페이지만 닫고 되돌림, 창은 그대로
    await p.click('#f-chips [data-fpanel="rem"]'); await p.waitForTimeout(300);
    await p.click('#bx-ep [data-bx-rem="0"]'); await p.waitForTimeout(200);
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(250);
    c.ok(!(await page(p)) && !!(await p.$('#sheet-root #f-chips')) && (await row(p, '[data-fpanel="rem"]')).t === '1시간 전', '뒤로: 페이지만 닫히고 되돌림, 일정 창은 그대로');
    // (5) 캘린더 페이지: 긴 이름도 다 보이고, 고른 것은 굵게 · ✓
    await p.click('#f-chips [data-fpanel="cat"]'); await p.waitForTimeout(350);
    const cp = await p.evaluate(() => Array.from(document.querySelectorAll('#bx-ep #f-cat > .picks .pick')).map(b => ({ t: b.textContent.trim(), on: b.getAttribute('aria-pressed') === 'true', full: b.scrollWidth <= b.clientWidth + 1, ck: getComputedStyle(b, '::after').content !== 'none' })));
    c.eq(cp.map(x => x.t), ['일·공부', '개인', '회사 · 마케팅팀 공유 캘린더', '캘린더 없음'], '캘린더 목록(마지막은 캘린더 없음)');
    c.ok(cp.every(x => x.full) && cp[2].on && cp[2].ck && !cp[1].ck, '긴 이름도 다 보이고 고른 것만 ✓ ' + JSON.stringify(cp));
    await p.click('#bx-ep [data-fcat="c_p"]'); await p.waitForTimeout(200);
    await done(p);
    c.eq((await row(p, '[data-fpanel="cat"]')).t, '개인', '캘린더를 바꾸면 줄도');
    // (6) 장소 페이지: 적는 칸 · 최근 장소 · 지도 앱에서 찾기
    await p.click('#f-chips [data-bxsub="loc"]'); await p.waitForTimeout(400);
    const lp = await p.evaluate(() => ({ t: document.getElementById('bx-ep-t').textContent, loc: !!document.querySelector('#bx-ep #f-loc') && document.querySelector('#bx-ep #f-loc').offsetParent !== null, note: document.querySelector('#bx-ep #f-note').offsetParent !== null,
      rec: Array.from(document.querySelectorAll('#bx-ep [data-bxplace]')).map(b => b.textContent.trim()), focus: document.activeElement && document.activeElement.id }));
    c.ok(lp.t === '장소' && lp.loc && !lp.note && lp.focus === 'f-loc', '장소 페이지: 장소 칸만, 바로 적기 ' + JSON.stringify(lp));
    c.eq(lp.rec, ['강남역 2번 출구', '회사'], '최근 장소(지금 장소는 빼고 최근 순)');
    await p.fill('#f-loc', '강남'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#bx-ep [data-bxplace]')).map(b => b.textContent.trim())), ['강남역 2번 출구'], '적으면 그 글자가 든 장소만');
    await p.click('#bx-ep [data-bxplace="강남역 2번 출구"]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => document.getElementById('f-loc').value), '강남역 2번 출구', '최근 장소를 누르면 칸에');
    await p.evaluate(() => { window.__geo = []; const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function(){ if (/^geo:/.test(this.href)) { window.__geo.push(this.href); return; } return o.apply(this, arguments); }; });
    await p.click('#bx-ep [data-bxmap]'); await p.waitForTimeout(150);
    c.eq(await p.evaluate(() => window.__geo), ['geo:0,0?q=' + encodeURIComponent('강남역 2번 출구')], '지도 앱에서 찾기: 휴대폰 지도 앱(geo:)으로');
    await done(p);
    c.eq((await row(p, '[data-bxsub="loc"]')).t, '강남역 2번 출구', '완료하면 장소 줄도');
    // (7) 메모 페이지: 메모 칸만, 줄에는 첫 줄
    await p.click('#f-chips [data-bxsub="note"]'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => document.getElementById('bx-ep-t').textContent === '메모' && document.querySelector('#bx-ep #f-loc').offsetParent === null && document.activeElement.id === 'f-note'), '메모 페이지: 메모 칸만, 바로 적기');
    await p.fill('#f-note', '보험증\n진료 카드'); await p.waitForTimeout(150);
    await done(p);
    c.eq((await row(p, '[data-bxsub="note"]')).t, '보험증', '메모 줄은 첫 줄');
    await p.click('#sheet-root [data-act="save"]'); await p.waitForTimeout(500);
    const d1 = await p.evaluate(() => { const x = window.BX_T.docs().find(([k]) => k === 'it_1'); return x && [x[1].remind, x[1].categoryId, x[1].location, x[1].note]; });
    c.eq(d1, ['60', 'c_p', '강남역 2번 출구', '보험증\n진료 카드'], '저장: 알림 · 캘린더 · 장소 · 메모');
    // (8) 새 일정: 하루 종일이 켜진 채 시작, 끄면 시각 두 칸, 말로 시각을 넣으면 꺼짐
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => [document.querySelector('#f-chips [data-bxallday]').getAttribute('aria-checked'), document.querySelectorAll('#f-chips .bx-edt-t').length]), ['true', 0], '새 일정: 하루 종일 켜짐, 시각 칸 없음');
    await p.click('#f-chips [data-bxallday]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('#f-chips .bx-edt-t')).map(b => b.textContent)), ['오전 7:00', '오전 8:00'], '하루 종일을 끄면 시각 두 칸(기본 + 1시간)');
    // 손으로 하루 종일을 바꾸면 말보다 손이 먼저(지금 앱과 같음) → 새 창에서 말로
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    await p.click('.bx-fab'); await p.waitForTimeout(500);
    await p.fill('#f-title', '내일 오후 3시 치과'); await p.waitForTimeout(400);
    c.eq(await p.evaluate(() => [document.querySelector('#f-chips [data-bxallday]').getAttribute('aria-checked'), Array.from(document.querySelectorAll('#f-chips .bx-edt button')).map(b => b.textContent)]), ['false', ['11월 3일 (화)', '오후 3:00', '11월 3일 (화)', '오후 4:00']], '말로 시각을 넣으면 하루 종일 꺼짐 · 날짜 · 시각');
    await p.click('#f-chips .bx-edt-t'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => document.getElementById('bx-ep-t').textContent === '시간' && getComputedStyle(document.querySelector('#bx-ep #f-time > .seg')).display === 'none'), "시각을 누르면 시간 페이지('종일/시간 지정'은 하루 종일 스위치로)");
    await done(p);
    await p.click('#f-chips .bx-edt-d'); await p.waitForTimeout(300);
    c.eq(await p.evaluate(() => [document.getElementById('bx-ep-t').textContent, getComputedStyle(document.querySelector('#bx-ep #f-date > .picks')).gridTemplateColumns.split(' ').length]), ['날짜', 4], '날짜를 누르면 날짜 페이지(오늘 · 내일 · 모레 · 다음 주 월 4칸)');
    await p.click('#bx-ep [data-fdate="2026-11-04"]'); await p.waitForTimeout(150);
    await p.click('#bx-ep [data-bxep="back"]'); await p.waitForTimeout(200);
    c.eq(await p.evaluate(() => document.querySelector('#f-chips .bx-edt-d').textContent), '11월 3일 (화)', '날짜 페이지에서 ‹ 이면 그대로');
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    c.eq(app.errors, [], '화면 오류(시험판 44)');
  } finally { await app.close(); }

  // (9) 명상 소리(대표 11/4 2:09): 소리와 호흡은 페이지, 종소리 끄기, 소리마다 크기, 앱을 닫아 멈춘 명상은 치움, 끝 화면 주 단추는 닫기
  const app2 = await openApp({ data: [['settings', settings()]] });
  try {
    const p = app2.page;
    await p.evaluate(() => { const l = window.Capacitor.Plugins.BxAlarm; window.__local = []; l.local = async x => { window.__local.push(x.alarms); return {}; }; l.cancelLocal = async () => ({}); window.__vol = []; window.Capacitor.Plugins.BxSound.setVolume = async x => { window.__vol.push(x); return {}; }; });
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(600);
    c.ok(await p.evaluate(() => !document.querySelector('.bx-med-more') && !!document.querySelector('.bx-med-row[data-act="bx-med-sound"]')), "'소리와 호흡'은 펼치는 칸이 아니라 줄 하나");
    const y0 = await p.evaluate(() => Math.round(document.querySelector('[data-act="bx-med-start"]').getBoundingClientRect().top));
    await p.click('[data-act="bx-med-sound"]'); await p.waitForTimeout(350);
    c.ok(await p.evaluate(() => document.getElementById('bx-mp-t').textContent === '소리와 호흡' && !!document.querySelector('#bx-mp [data-bxmed-bellon]')), '누르면 소리와 호흡 페이지(종소리 스위치)');
    c.eq(await p.evaluate(() => Math.round(document.querySelector('[data-act="bx-med-start"]').getBoundingClientRect().top)), y0, '시작 단추 자리는 그대로(펼치지 않음)');
    // 소리 크기: 종소리 60%, 배경 소리(파도) 40%
    await p.evaluate(() => { const r = document.querySelector('#bx-mp [data-bxmed-vol="bell"]'); r.value = 60; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(300);
    await p.click('#bx-mp [data-bxbg="waves"]'); await p.waitForTimeout(300);
    await p.evaluate(() => { const r = document.querySelector('#bx-mp [data-bxmed-vol="bg"]'); r.value = 40; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(300);
    const vol = await p.evaluate(() => ({ last: window.__vol.slice(-1)[0], med: JSON.parse(localStorage.getItem('bx:med') || '{}'), lb: Array.from(document.querySelectorAll('#bx-mp .bx-mp-vol b')).map(b => b.textContent) }));
    c.ok(vol.last && Math.abs(vol.last.bell - 0.6) < 1e-6 && Math.abs(vol.last.bg - 0.4) < 1e-6 && vol.med.bellVol === 60 && vol.med.bgVol === 40 && vol.lb.join() === '60%,40%', '소리마다 크기(종소리 60% · 파도 40%)를 휴대폰에 넘기고 남김 ' + JSON.stringify(vol.last));
    // 종소리 끄기 → 종 없이 명상, 끝은 소리 없는 알림
    await p.click('#bx-mp [data-bxmed-bellon]'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => !document.querySelector('#bx-mp [data-bxbowl]') && /끝나면 소리 없이 알림만/.test(document.getElementById('bx-mp').innerText)), '종소리를 끄면 종류 · 크기 칸이 빠지고 안내 한 줄');
    await p.click('#bx-mp [data-bxmp="back"]'); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => /종소리 끔/.test(document.querySelector('.bx-med-row small').textContent) && /배경 소리 파도 40%/.test(document.querySelector('.bx-med-row small').textContent)), "줄에 '종소리 끔 · 배경 소리 파도 40%'");
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => (window.__local.slice(-1)[0] || []).map(a => [a.id, a.sound])), [['med_end', 'bowl_none']], '종소리 끔: 첫 종 · 중간 종 없이 끝 알림만(소리 없음)');
    c.ok(await p.evaluate(() => /종소리 없이 진행해요/.test(document.querySelector('.bx-med-run .bx-med-note').textContent)), '진행 중 안내: 종소리 없이');
    // 앱을 최근 목록에서 지워 휴대폰이 멈춘 명상: 다시 보면 '명상 중' 화면을 치운다
    await p.evaluate(() => { const b = window.Capacitor.Plugins.BxSound; b.st = { playing: false, sound: '', mode: '', medCancel: Date.now() }; document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => !JSON.parse(localStorage.getItem('bx:med') || '{}').run && !!document.querySelector('[data-act="bx-med-start"]')), '앱을 닫아 멈춘 명상은 다시 열면 치워짐');
    // 끝 화면: 주 단추는 '닫기'(오른쪽), '한 번 더'는 옆
    await p.evaluate(() => { const b = window.Capacitor.Plugins.BxSound; b.st = { playing: false, sound: '', mode: '' }; });
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(400);
    const run = await p.evaluate(() => JSON.parse(localStorage.getItem('bx:med') || '{}').run);
    await p.clock.setSystemTime(new Date(run.endAt + 3000)); await p.waitForTimeout(1600);
    c.eq(await p.evaluate(() => Array.from(document.querySelectorAll('.bx-med-acts .btn')).map(b => b.textContent.trim() + (b.classList.contains('primary') ? '*' : ''))), ['한 번 더', '닫기*'], "끝 화면: '닫기'가 주 단추");
    c.eq(app2.errors, [], '화면 오류(명상 소리)');
  } finally { await app2.close(); }

  // (10) 다른 곳도 같은 기준: 루틴 '아이콘 변경'은 페이지, 아래 메뉴 칩은 4칸 맞춤
  const old3 = '2026-10-29T00:00:00.000Z';
  const app3 = await openApp({ data: [['settings', settings()], ['rt_1', { type: 'routine', name: '아침 준비', mode: 'start', start: '07:00', days: [1, 2, 3, 4, 5], on: true, steps: [{ name: '세수', min: 10 }], createdAt: old3, updatedAt: old3 }]] });
  try {
    const p = app3.page;
    await p.click('.dock [data-view="routines"]'); await p.waitForTimeout(600);
    await p.evaluate(() => document.querySelector('[data-act="rt-edit"]').click()); await p.waitForTimeout(600);
    const sum0 = await p.evaluate(() => document.getElementById('bx-icsum').textContent);
    await p.evaluate(() => document.getElementById('bx-icsum').click()); await p.waitForTimeout(300);
    c.ok(await p.evaluate(() => document.getElementById('bx-pg-t').textContent === '아이콘' && !document.getElementById('bx-icdet').open && !!document.querySelector('#bx-pg #bx-icpick')), "아이콘 변경: 펼치지 않고 '아이콘' 페이지");
    await p.evaluate(() => document.querySelector('#bx-pg [data-ricon="book"]').click()); await p.waitForTimeout(200);
    await p.evaluate(() => window.BX_back()); await p.waitForTimeout(200);
    c.ok(await p.evaluate(s0 => !document.getElementById('bx-pg') && document.getElementById('bx-icsum').textContent === s0 && !!document.querySelector('#bx-icdet #bx-icpick'), sum0), '뒤로: 고른 것을 되돌리고 루틴 창으로');
    await p.evaluate(() => document.getElementById('bx-icsum').click()); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelector('#bx-pg [data-ricon="book"]').click()); await p.waitForTimeout(200);
    await p.click('#bx-pg [data-bxpg="done"]'); await p.waitForTimeout(200);
    c.ok(await p.evaluate(() => /책/.test(document.getElementById('bx-icsum').textContent)), "완료: 아이콘 '책'");
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="sheet-close"]').click()); await p.waitForTimeout(300);
    await p.click('.ab-menu'); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('#sheet-root [data-act="bx-feat"]').click()); await p.waitForTimeout(500);
    c.eq(await p.evaluate(() => getComputedStyle(document.querySelector('.bx-ft-chips')).gridTemplateColumns.split(' ').length), 4, '아래 메뉴 고르기: 4칸 맞춤(흐르는 칩 줄 아님)');
    c.eq(app3.errors, [], '화면 오류(다른 곳)');
  } finally { await app3.close(); }
  return c.done();
};
