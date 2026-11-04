#!/usr/bin/env node
// 정리 전후 비교(대표 상시 규칙 11/4 22:59 '정리 전후 화면 사진이 같아야 한다'): run.cjs --snap A · --snap B 로 남긴 것을 비교한다
//   node tests/layout/compare.cjs A B   → 화면마다 사진(바이트) · 계산된 모양(요소마다 자리 · 크기 · 글자 · 색)이 같은지
//   다른 화면이 하나라도 있으면 종료 코드 1, 처음 다른 요소 몇 개를 적는다
const fs = require('fs');
const path = require('path');
const [A, B] = process.argv.slice(2).map(p => path.resolve(p));
if (!A || !B) { console.log('쓰는 법: node tests/layout/compare.cjs <전> <후>'); process.exit(2); }
let screens = 0, shotDiff = 0, digDiff = 0; const out = [];
for (const combo of fs.readdirSync(A).filter(d => fs.statSync(path.join(A, d)).isDirectory()).sort()) {
  const ra = JSON.parse(fs.readFileSync(path.join(A, combo, 'result.json'), 'utf8'));
  const rb = fs.existsSync(path.join(B, combo, 'result.json')) ? JSON.parse(fs.readFileSync(path.join(B, combo, 'result.json'), 'utf8')) : { states: {} };
  for (const [nm, sa] of Object.entries(ra.states)) {
    screens++;
    const sb = rb.states[nm];
    if (!sb) { out.push(combo + ' ' + nm + ': 후에 없음'); digDiff++; continue; }
    for (const pos of ['top', 'bottom']) {
      const da = sa[pos] || [], db = sb[pos] || [];
      if (da.join('\n') !== db.join('\n')) {
        digDiff++;
        const n = Math.max(da.length, db.length); const diffs = [];
        for (let i = 0; i < n && diffs.length < 3; i++) if (da[i] !== db[i]) diffs.push('    전 ' + String(da[i]).slice(0, 220) + '\n    후 ' + String(db[i]).slice(0, 220));
        out.push(combo + ' ' + nm + ' (' + (pos === 'top' ? '위' : '맨 아래') + ') 모양 다름 — 요소 ' + da.length + ' → ' + db.length + '\n' + diffs.join('\n'));
      }
    }
    for (const f of [nm + '.png', nm + '__bottom.png']) {
      const fa = path.join(A, combo, f), fb = path.join(B, combo, f);
      if (!fs.existsSync(fa)) continue;
      if (!fs.existsSync(fb) || !fs.readFileSync(fa).equals(fs.readFileSync(fb))) { shotDiff++; out.push(combo + ' ' + f + ': 사진 다름'); }
    }
  }
}
console.log('화면 ' + screens + ' · 모양 다름 ' + digDiff + ' · 사진 다름 ' + shotDiff);
out.slice(0, 60).forEach(x => console.log(' · ' + x));
process.exit(digDiff || shotDiff ? 1 : 0);
