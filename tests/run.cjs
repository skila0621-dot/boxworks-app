// 자동 시험을 모두 돌린다: node tests/run.cjs [이름 일부]
// 실패가 하나라도 있으면 종료 코드 1(CI가 빌드를 멈춘다)
const fs = require('fs');
const path = require('path');

(async () => {
  const only = process.argv[2] || '';
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.cjs') && f.includes(only)).sort();
  let bad = 0, total = 0;
  for (const f of files) {
    const t0 = Date.now();
    let r;
    try {
      r = await require(path.join(__dirname, f))();
    } catch (e) {
      r = { name: f, n: 1, fails: ['시험이 멈춤: ' + (e && e.stack || e)] };
    }
    total += r.n;
    const ms = Date.now() - t0;
    if (r.fails.length) {
      bad += r.fails.length;
      console.log('✗ ' + r.name + ' (' + f + ', ' + ms + 'ms) — ' + r.fails.length + '/' + r.n + ' 실패');
      r.fails.slice(0, 40).forEach(m => console.log('   · ' + m));
    } else {
      console.log('✓ ' + r.name + ' (' + r.n + '개 확인, ' + ms + 'ms)');
    }
  }
  console.log(bad ? '\n실패 ' + bad + '개 / 확인 ' + total + '개' : '\n모두 통과 · 확인 ' + total + '개');
  process.exit(bad ? 1 : 0);
})();
