// 시험판 54(대표 상시 규칙 11/4 22:59, 결정 기록 D-27): 정렬 재발 방지
// (1) 홈 화면 위젯(오늘 일정) 4×2 · 4×3 · 4×4(대표 지시 11/4 23:09): 날짜 줄은 위에 고정, 목록이 남는 높이를 채움,
//     ✎ · 🎤 · + 는 오른쪽 아래, 세로로 늘리는 한도 없음, 처음 놓을 때 4×2. 위젯 추가 화면에 늘리는 법 한 줄
// 화면 정렬(겹침 · 가림 · 잘림 · 칸 · 아이콘)은 tests/layout/run.cjs가 모든 화면에서 잰다
const fs = require('fs');
const path = require('path');
const { openApp, settings, checker } = require('./harness.cjs');
const RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

module.exports = async function () {
  const c = checker('시험판 54 · 위젯 크기 · 명상 소리 · 종 다시 걸기 · 배경 그림 없음');
  const info = fs.readFileSync(path.join(RES, 'xml', 'bx_widget_info.xml'), 'utf8');
  const attr = (s, k) => { const m = s.match(new RegExp('android:' + k + '="([^"]*)"')); return m ? m[1] : null; };
  c.ok(/vertical/.test(attr(info, 'resizeMode') || ''), '오늘 일정 위젯: 세로로 늘릴 수 있음(resizeMode)');
  c.ok(/horizontal/.test(attr(info, 'resizeMode') || ''), '오늘 일정 위젯: 가로로 늘릴 수 있음(resizeMode)');
  c.ok(!/maxResize(Height|Width)/.test(info), '오늘 일정 위젯: 크기 한도 없음');
  c.eq([attr(info, 'targetCellWidth'), attr(info, 'targetCellHeight')], ['4', '2'], '오늘 일정 위젯: 처음 놓을 때 4×2');

  // 위젯 모양: 맨 바깥 세로 줄 → 첫 줄 날짜(46dp 고정) → 가로줄 → 목록 칸(높이 0dp · weight 1 = 남는 높이를 다 씀)
  //   목록 칸 안에 아래 흐림(bottom) · 단추 줄(bottom|end)
  const lay = fs.readFileSync(path.join(RES, 'layout', 'bx_widget.xml'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const tags = []; const re = /<(\/?)([A-Za-z.]+)([^>]*?)(\/?)>/g; let m; const stack = [];
  while ((m = re.exec(lay))) {
    if (m[2] === '?xml') continue;
    if (m[1]) { stack.pop(); continue; }
    const node = { tag: m[2], a: m[3], depth: stack.length, parent: stack[stack.length - 1] || null };
    tags.push(node); if (!m[4]) stack.push(node);
  }
  const root = tags[0], kids = tags.filter(t => t.parent === root);
  c.ok(root && attr(root.a, 'orientation') === 'vertical' && attr(root.a, 'layout_height') === 'match_parent', '위젯: 맨 바깥은 세로로 쌓고 위젯 높이를 다 씀');
  c.eq(kids[0] && attr(kids[0].a, 'layout_height'), '46dp', '위젯: 첫 줄(날짜 줄)은 46dp로 고정');
  const list = kids.find(k => tags.some(t => t.parent === k && /w_list/.test(t.a)));
  c.ok(!!list && attr(list.a, 'layout_height') === '0dp' && attr(list.a, 'layout_weight') === '1', '위젯: 목록 칸이 남는 높이를 다 채움(0dp · weight 1)');
  c.ok(!!list && kids.indexOf(list) === kids.length - 1, '위젯: 목록 칸이 맨 아래 칸(늘린 만큼 목록이 길어짐)');
  const inList = list ? tags.filter(t => t.parent === list) : [];
  const btns = inList.find(t => tags.some(x => x.parent === t && /w_add/.test(x.a)));
  c.eq(btns && attr(btns.a, 'layout_gravity'), 'bottom|end', '위젯: ✎ · 🎤 · + 는 목록 칸 오른쪽 아래에 붙음');
  c.ok(inList.some(t => attr(t.a, 'layout_gravity') === 'bottom' && /bx_widget_fade/.test(t.a)), '위젯: 아래 흐림은 목록 칸 아래에 붙음');
  // 크기 세 가지(칸 높이는 One UI 홈 화면 칸 수에 따라 다름: 대략 2칸 ≈ 170dp · 3칸 ≈ 260dp · 4칸 ≈ 350dp)에서 목록 칸 높이
  for (const [nm, h] of [['4×2', 170], ['4×3', 260], ['4×4', 350]]) {
    const listH = h - 46 - 1 - 6 - 12; // 날짜 줄 · 가로줄 · 목록 위 · 아래 여백
    c.ok(listH >= 100, '위젯 ' + nm + ': 목록 칸 ' + listH + 'dp(단추 줄 40dp 위로 한 줄 이상 보임)');
  }

  // 명상(대표 11/4 22:32): 배경 그림 없음 · 칩 안 음표 칸에 여백 없음 · 명상하는 동안 배경 소리 · 종소리를 바꾸면 그대로 따름
  {
    const app = await openApp({ now: '2026-11-02T07:40:00+09:00', data: [['settings', settings({})]], sound: true });
    try {
      const p = app.page; await p.waitForTimeout(900);
      await p.evaluate(() => { window.__loc = []; const a = Capacitor.Plugins.BxAlarm; a.local = async x => { window.__loc.push(x); return {}; }; });
      await p.click('.dock [data-view="med"]'); await p.waitForTimeout(400);
      const open = async () => { await p.evaluate(() => { const b = document.querySelector('[data-act="bx-med-sound"]') || Object.assign(document.body.appendChild(document.createElement('button')), { type: 'button' }); b.dataset.act = 'bx-med-sound'; b.click(); }); await p.waitForTimeout(350); };
      const back = async () => { await p.evaluate(() => { const b = document.querySelector('[data-bxmp="back"]'); if (b) b.click(); }); await p.waitForTimeout(350); };
      await open(); await p.click('[data-bxbg="reeds"]'); await p.waitForTimeout(250); await back();
      c.ok(await p.evaluate(() => !document.querySelector('.bx-med-scene')), '명상 고르는 화면: 배경 그림 없음(갈대를 골라도)');
      await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(5600);
      c.ok(await p.evaluate(() => !document.querySelector('.bx-med-scene')), '명상하는 동안: 배경 그림 없음');
      const tag = await p.evaluate(() => { const s = document.querySelector('.bx-med-tag > span .bx-ic'); if (!s) return null; const q = getComputedStyle(s); return [q.paddingLeft, q.backgroundColor]; });
      c.eq(tag, ['0px', 'rgba(0, 0, 0, 0)'], "명상 칩 '♫ 갈대': 음표 칸에 칩 여백 · 바탕이 붙지 않음(양쪽 여백이 같게)");
      // 명상하는 동안 '없음' → 명상 소리를 끔, 다른 소리 → 그 소리로(미리 듣기 아님)
      await open();
      c.ok(await p.evaluate(() => !document.querySelector('.bx-bg-only')), "명상하는 동안 소리 페이지: '소리만 틀기' 없음");
      await p.evaluate(() => { window.__bg = []; }); await p.click('[data-bxbg="none"]'); await p.waitForTimeout(300);
      const b1 = await p.evaluate(() => window.__bg.map(x => x[0] + (x[1] && x[1].sound != null ? ':' + x[1].sound : '')));
      c.ok(b1.includes('stop') && !b1.some(x => /^play/.test(x)), "명상하는 동안 배경 소리 '없음': 명상 소리를 끔 — " + JSON.stringify(b1));
      await p.evaluate(() => { window.__bg = []; }); await p.click('[data-bxbg="waves"]'); await p.waitForTimeout(300);
      const b2 = await p.evaluate(() => window.__bg.filter(x => x[0] === 'play').map(x => x[1].sound + '/' + x[1].mode));
      c.eq(b2, ['waves/med'], '명상하는 동안 다른 배경 소리: 명상 소리를 그 소리로 바꿈(미리 듣기가 아니라)');
      // 종소리를 끄면 남은 종을 다시 건다: 끝 알림만 소리 없이
      await p.evaluate(() => { window.__loc = []; }); await p.click('[data-bxmed-bellon]'); await p.waitForTimeout(400);
      const al = await p.evaluate(() => (window.__loc[window.__loc.length - 1] || {}).alarms || []);
      c.eq(al.map(a => a.id + ':' + a.sound), ['med_end:bowl_none'], '명상하는 동안 종소리를 끄면: 남은 종을 지우고 끝 알림만 소리 없이 다시 건다');
      await p.click('[data-bxmed-bellon]'); await p.waitForTimeout(400);
      const al2 = await p.evaluate(() => (window.__loc[window.__loc.length - 1] || {}).alarms || []);
      c.ok(al2.some(a => a.id === 'med_end' && a.sound === 'bowl3') && !al2.some(a => a.id === 'med_start'), '다시 켜면: 끝 종(세 번)을 다시 걸고, 이미 지난 시작 종은 걸지 않음 — ' + JSON.stringify(al2.map(a => a.id + ':' + a.sound)));
      c.eq(app.errors, [], '명상: 오류 없음');
    } finally { await app.close(); }
  }

  // 명상 소리 품질(대표 11/4 22:32 '사운드들이 전체적으로 다 거칠다', 측정 조사 11/5)
  {
    const raw = path.join(RES, 'raw'), have = fs.readdirSync(raw);
    const kinds = ['clear', 'deep', 'crystal', 'chime'];
    c.ok(kinds.every(k => have.includes('bx_bowl_' + k + '.flac') && have.includes('bx_bowl_' + k + '_end.flac')) && !have.some(f => /^bx_bowl_.*\.ogg$/.test(f)), '종소리: 손실 없는 FLAC(전: Vorbis q2) — 8개');
    const rates = kinds.flatMap(k => [k, k + '_end']).map(k => { const b = fs.readFileSync(path.join(raw, 'bx_bowl_' + k + '.flac')); const sr = (b[18] << 12) | (b[19] << 4) | (b[20] >> 4); const ch = ((b[20] >> 1) & 7) + 1; return sr + '/' + ch; });
    c.ok(rates.every(r => r === '48000/1'), '종소리: 48kHz 한 채널(휴대폰 기본 높이, 다시 바꾸지 않음) — ' + rates.join(' '));
    const bg = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'sound', 'make-bg.py'), 'utf8');
    c.ok(/'-q:a', '6'/.test(bg), '배경 소리: Vorbis q6 한 번만 압축(전: q3 — 6kHz 위가 한쪽으로 뭉개짐)');
    c.ok(!/shelf=\(/.test(bg.slice(bg.indexOf('SOUNDS = {'), bg.indexOf('NOISE_LUFS'))), '배경 소리: 고음을 키우는 처리 없음(전: 바람 +6dB · 갈대 +5dB)');
    const bp = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'kr', 'boxworks', 'app', 'BgPlayer.java'), 'utf8');
    c.ok(/NOISE_GAIN = 0\.0312f/.test(bp) && /0\.99886f/.test(bp) && /Math\.PI \* 6000/.test(bp), "소음: 부드러운 분홍 소음(100Hz 아래 · 6kHz 위를 줄임, −25 LUFS) — 전: 거의 하얀 잡음(8kHz 위 47%)");
  }

  // 위젯 추가 화면의 안내 한 줄
  const app = await openApp({ now: '2026-11-02T07:40:00+09:00', data: [['settings', settings({})]] });
  try {
    const p = app.page; await p.waitForTimeout(900);
    await p.click('.ab-menu'); await p.waitForTimeout(400);
    await p.click('#sheet-root [data-act="bx-widget-open"]'); await p.waitForTimeout(500);
    const t = await p.evaluate(() => document.querySelector('#sheet-root .sheet') ? document.querySelector('#sheet-root .sheet').textContent : '');
    c.ok(/오늘 일정 위젯은 길게 눌러 4×4까지 늘릴 수 있어요/.test(t), "위젯 추가 화면: '오늘 일정 위젯은 길게 눌러 4×4까지 늘릴 수 있어요'");
    c.eq(app.errors, [], '위젯 추가 화면: 오류 없음');
  } finally { await app.close(); }
  return c.done();
};
