# B 스케줄러

약속 시간 말고, 준비를 시작할 시간을 알려 주는 안드로이드 앱. 휴대폰 캘린더에 이미 있는 약속마다 '준비 시작'을 거꾸로 계산해 확인할 때까지 붙잡고, 확인한 시각으로 실제 준비 시간을 배운다.

A 스케줄러(저장소 맨 위)와 따로 만드는 비교 시험판이다. 기술 명세는 [SPEC.md](SPEC.md).

| 할 일 | 명령 |
| --- | --- |
| 웹 미리 보기 | `node -e "require('./tests/serve.cjs')(require('path').resolve('web'), 5173).then(s=>console.log(s.url))"` |
| 자동 시험(계획 · 한 문장 · 화면 흐름) | `node tests/run.mjs --ui` |
| 정렬 점검(312곳) | `node tests/gate.cjs` |
| 시험표 다시 만들기(규칙을 바꾼 뒤) | `node tests/make-vectors.mjs` |
| 앱에 넣을 웹 파일 | `npm run sync` |

CI(`.github/workflows/b.yml`)는 b/ 가 바뀔 때만 돌고, 다 통과하면 `b-test-N` 시험판에 설치 파일을 올린다.
