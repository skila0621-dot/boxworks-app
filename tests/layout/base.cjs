#!/usr/bin/env node
// 기준 사진(대표 11/5 01:30 '승인한 모습을 기준 이미지로 남기고 변경 후 같은 환경에서 비교', 결정 기록 D-28)
//   node tests/layout/base.cjs           단추 견본(web-src/v55.js)을 폭 360 · 384 · 412 × 라이트 · 다크로 찍어 tests/layout/base/ 사진과 비교. 다르면 종료 코드 1
//   node tests/layout/base.cjs --update  대표가 고른 모습을 기준 사진으로 남긴다(고른 값을 넣은 뒤에만)
// 같은 환경(Playwright 1.63 크로미움 · 앱 글꼴 BX Pretendard)에서 찍는다. 움직임은 멈추고 찍는다
// 다름: 한 점이라도 색 차이가 24를 넘는 점이 0.1%를 넘으면. 다른 곳은 tests/layout/out-base/에 빨갛게 표시한 사진으로 남긴다
const fs = require('fs');
const path = require('path');
const H = require('../harness.cjs');
const BASE = path.join(__dirname, 'base'), OUT = path.join(__dirname, 'out-base');
const update = process.argv.includes('--update');
const combos = []; [360, 384, 412].forEach(w => ['light', 'dark'].forEach(t => combos.push([w, t])));
(async () => {
  fs.mkdirSync(BASE, { recursive: true }); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  let bad = 0;
  for (const [w, t] of combos) {
    const name = w + '-' + t + '.png';
    const app = await H.openApp({ width: w, height: { 360: 780, 384: 832, 412: 915 }[w], colorScheme: t, data: [['settings', H.settings()]] });
    const p = app.page;
    await p.evaluate(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'; document.documentElement.appendChild(s); window.BX_specimen(); });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    // 견본 화면 전체(밀어서 보는 부분까지)를 한 장으로
    const shot = await p.evaluate(() => { const e = document.getElementById('bx-spec'); e.style.position = 'absolute'; e.style.inset = 'auto'; e.style.left = '0'; e.style.top = '0'; e.style.width = innerWidth + 'px'; e.style.overflow = 'visible'; return Math.ceil(e.scrollHeight); });
    await p.setViewportSize({ width: w, height: shot });
    await p.waitForTimeout(150);
    const buf = await p.screenshot({ clip: { x: 0, y: 0, width: w, height: shot } });
    if (update) { fs.writeFileSync(path.join(BASE, name), buf); console.log('기준 사진: ' + name + ' (' + w + '×' + shot + ')'); await app.close(); continue; }
    const basePath = path.join(BASE, name);
    if (!fs.existsSync(basePath)) { console.log('기준 사진 없음: ' + name + ' — 먼저 --update'); bad++; await app.close(); continue; }
    // 비교는 브라우저 캔버스로(따로 설치할 것 없음)
    const cmp = await p.evaluate(async ([a, b]) => {
      const load = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.src = src; });
      const A = await load(a), B = await load(b);
      if (A.width !== B.width || A.height !== B.height) return { size: [A.width, A.height, B.width, B.height] };
      const c = document.createElement('canvas'); c.width = A.width; c.height = A.height; const x = c.getContext('2d');
      x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
      x.clearRect(0, 0, c.width, c.height); x.drawImage(B, 0, 0); const img = x.getImageData(0, 0, c.width, c.height), db = img.data;
      let n = 0; for (let i = 0; i < da.length; i += 4) { const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (d > 24) { n++; db[i] = 255; db[i + 1] = 0; db[i + 2] = 0; } }
      x.putImageData(img, 0, 0);
      return { n, total: da.length / 4, diff: n ? c.toDataURL('image/png') : '' };
    }, ['data:image/png;base64,' + fs.readFileSync(basePath).toString('base64'), 'data:image/png;base64,' + buf.toString('base64')]);
    if (cmp.size) { bad++; console.log('다름: ' + name + ' 크기 ' + cmp.size.join('×')); fs.writeFileSync(path.join(OUT, name), buf); }
    else if (cmp.n / cmp.total > 0.001) { bad++; console.log('다름: ' + name + ' ' + cmp.n + '점(' + (cmp.n / cmp.total * 100).toFixed(2) + '%)'); fs.writeFileSync(path.join(OUT, name), buf); fs.writeFileSync(path.join(OUT, 'diff-' + name), Buffer.from(cmp.diff.split(',')[1], 'base64')); }
    else console.log('같음: ' + name + (cmp.n ? ' (' + cmp.n + '점 차이, 허용 안)' : ''));
    await app.close();
  }
  if (!update) console.log(bad ? '기준 사진과 다른 것 ' + bad + '장' : '기준 사진과 모두 같음');
  process.exit(bad ? 1 : 0);
})();
