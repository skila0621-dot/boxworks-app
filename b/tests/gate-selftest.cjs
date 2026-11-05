// 정렬 점검이 정말 잡는지(일부러 틀린 화면으로) 확인
const { chromium } = require('playwright'); const fs = require('fs');
const src = fs.readFileSync(__dirname + '/gate.cjs', 'utf8'); const fn = src.slice(src.indexOf('function audit(o)'), src.indexOf('\n}\n', src.indexOf('function audit(o)')) + 2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 360, height: 640 } });
  await p.setContent('<body style="background:#fff;margin:0"><button style="position:absolute;left:10px;top:10px;width:80px;height:44px">가</button><button style="position:absolute;left:50px;top:20px;width:80px;height:44px">나</button>' +
    '<p style="position:absolute;top:80px">약속 3:00 시작</p><div style="position:absolute;top:120px;width:100px;overflow:hidden;white-space:nowrap">아주아주아주아주아주아주 긴 글이 잘려요</div>' +
    '<p style="position:absolute;top:160px;color:#eee">안 보이는 글</p><button style="position:absolute;top:200px;width:30px;height:30px">x</button><svg style="position:absolute;top:240px" width="24" height="24"><path d="M0 0h24"/></svg><p style="position:absolute;top:280px">NaN월</p></body>');
  const r = await p.evaluate('(' + fn + ')({h24:false,bottom:false})');
  const kinds = [...new Set(r.map(x => x.k))].sort();
  console.log(kinds.join(','));
  const want = ['cut', 'icon', 'ink', 'nan', 'small', 'tap', 'time12'];
  console.log(want.every(k => kinds.includes(k)) ? '점검이 잡아요: OK' : '못 잡는 것: ' + want.filter(k => !kinds.includes(k)));
  await b.close();
})();
