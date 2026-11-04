// 시험판 49 · 명상 배경 그림(대표 11/4 13:45, 정할 것 27 추천안 (나)): 고른 배경 소리마다 코드로 그린 움직이는 그림
const { openApp, settings, checker } = require('./harness.cjs');

module.exports = async function () {
  const c = checker('시험판 49 · 명상 배경 그림(갈대 · 파도 · 바람 · 숲속 새소리 · 백색소음)');
  const app = await openApp({ data: [['settings', settings()]] });
  try {
    const p = app.page;
    await p.click('.dock [data-view="med"]'); await p.waitForTimeout(400);
    c.ok(await p.evaluate(() => !document.querySelector('.bx-med-scene')), '배경 소리 없음: 그림 없음');
    await p.click('[data-act="bx-med-sound"]'); await p.waitForTimeout(250); await p.click('[data-bxbg="reeds"]'); await p.waitForTimeout(250);
    await p.click('[data-bxmp="back"]'); await p.waitForTimeout(350);
    c.ok(await p.evaluate(() => { const s = document.querySelector('.bx-med-scene'); return !!s && s.classList.contains('pick') && s.dataset.scene === 'reeds' && +getComputedStyle(s).opacity < 0.35; }), '고르는 화면: 고른 소리(갈대) 그림을 옅게');
    await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(600);
    const run = await p.evaluate(() => { const s = document.querySelector('.bx-med-scene'); return { run: s.classList.contains('run'), n: s.querySelectorAll('.bx-sc-reed').length, anim: getComputedStyle(s.querySelector('.bx-sc-reed')).animationName, t: s.style.getPropertyValue('--t'), z: getComputedStyle(s).zIndex,
      under: getComputedStyle(document.querySelector('.screen.med .bx-med-run')).zIndex }; });
    c.ok(run.run && run.n === 22 && run.anim === 'bxReed' && /^-\d+(\.\d+)?s$/.test(run.t) && run.z === '0' && run.under === '1', '명상 중: 갈대 22포기가 흔들림(글자 · 단추 뒤) ' + JSON.stringify(run));
    await p.click('[data-act="bx-med-stop"]'); await p.waitForTimeout(400);
    for (const [k, sel] of [['waves', '.bx-sc-w'], ['wind', '.bx-sc-gust'], ['birds', '.bx-sc-leaf'], ['noise', '.bx-sc-blob']]) {
      await p.click('[data-act="bx-med-sound"]'); await p.waitForTimeout(200); await p.click('[data-bxbg="' + k + '"]'); await p.waitForTimeout(200);
      await p.click('[data-bxmp="back"]'); await p.waitForTimeout(300);
      await p.click('[data-act="bx-med-start"]'); await p.waitForTimeout(400);
      c.ok(await p.evaluate(({ k, sel }) => { const s = document.querySelector('.bx-med-scene.run'); return !!s && s.dataset.scene === k && s.querySelectorAll(sel).length > 0; }, { k, sel }), k + ': 그 소리의 그림');
      await p.click('[data-act="bx-med-stop"]'); await p.waitForTimeout(300);
    }
    c.eq(app.errors, [], '화면 오류');
  } finally { await app.close(); }
  return c.done();
};
