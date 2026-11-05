// B 자동 시험: node tests/run.mjs (하나라도 틀리면 1로 끝남)
import parseT from './parse.test.mjs';
import plannerT from './planner.test.mjs';
let pass = 0, fail = 0; const fails = [];
const check = { eq(a, b, name) { const ok = JSON.stringify(a) === JSON.stringify(b); if (ok) pass++; else { fail++; fails.push(name + '\n    받은 것 ' + JSON.stringify(a) + '\n    바란 것 ' + JSON.stringify(b)); } }, ok(v, name) { this.eq(!!v, true, name); } };
for (const [n, f] of [['한 문장 해석', parseT], ['계획 계산', plannerT]]) { const before = fail; await f(check); console.log((fail > before ? '✗ ' : '✓ ') + n); }
const ui = process.argv.includes('--ui') ? (await import('./ui.test.mjs')).default : null;
if (ui) { const before = fail; await ui(check); console.log((fail > before ? '✗ ' : '✓ ') + '화면 흐름'); }
fails.forEach(f => console.log('  ✗ ' + f));
console.log(`통과 ${pass} · 실패 ${fail}`);
process.exit(fail ? 1 : 0);
