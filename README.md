# 박스웍스 안드로이드 앱 (1차)

웹 박스웍스 스케줄러를 안드로이드 앱으로 감싼 프로젝트입니다. 무엇을 만들지는 프로젝트 문서 `1차_범위.md`, 왜 그렇게 정했는지는 `결정_기록.md`를 따릅니다.

## 구조

| 위치 | 내용 |
| --- | --- |
| `web-src/boxworks.html` | 웹 박스웍스 원본(claude.ai 아티팩트에서 가져옴). 여기서는 직접 고치지 않음 |
| `web-src/app-shim.js` | 앱 연결부. 웹 박스웍스가 쓰던 Claude 기능 자리를 휴대폰 기능으로 채움 |
| `scripts/build-web.mjs` | 원본을 앱용 `www/index.html`로 바꿈. 바꿀 곳을 못 찾으면 멈춤 |
| `android/` | Capacitor가 만든 안드로이드 프로젝트 |
| `.github/workflows/android.yml` | GitHub에서 시험판 설치 파일을 자동으로 만듦 |

## 지금 앱이 하는 일

- 웹 박스웍스 화면과 기능을 그대로 씀. 일정은 휴대폰 안에 저장(서버·로그인 없음, D-02)
- **휴대폰 알람(2단계)**: 박스웍스 알림 규칙으로 앞으로 7일 알람을 계산해 `BxAlarm` 플러그인이 휴대폰에 예약. 잠금 화면 알람 화면(`AlarmActivity`), 알림의 확인·5분 뒤, 재부팅·업데이트 뒤 다시 예약(`BootReceiver`)
- **말로 넣기(3단계)**: `BxSpeech` 플러그인이 휴대폰 기본 음성 인식을 열고, 받은 글자를 박스웍스 규칙 해석에 넣음. 규칙 보강은 `scripts/build-web.mjs`의 `bxQuickPre`·`bxQuickFix`
- **시간표(D-06)**: `web-src/timetable.js`. 아래 메뉴의 시간표 탭, 한 문장 해석(`ttParse`), 시작 전 알람, 오늘 화면 카드
- **출발 시각 계산·준비 루틴(4단계)**: `web-src/travel.js`. "가는 데 30분" 해석, 출발 10분 전·출발 알람, 장소별 이동 시간 기억(`travelmem` 문서), 일정에 루틴 붙이기(출발 시각에서 거꾸로)
- **휴대폰 캘린더 읽기(D-05)**: `BxCalendar` 플러그인(읽기 전용, READ_CALENDAR)과 `web-src/calendar.js`. 읽은 일정은 화면에만 섞어 보여 주고, 박스웍스에서 정한 알림·이동 시간·완료는 `pcx` 문서에 따로 적음
- 앱에서 쓰지 않는 웹 전용 기능(Claude 연동, AI 정리, 위젯 모드, 바로가기 설치 안내)은 숨김
- 휴대폰 뒤로 버튼: 열린 창 → 앞 창 → 오늘 화면 → 앱을 뒤로 보냄

아직 없는 것: 아침 보고, 홈 화면 위젯, 루틴을 말로 고치기("샤워 30분으로")

## 설치 없이 화면 확인하기

`npm run build:web && node scripts/build-preview.mjs <파일>`로 앱 화면을 한 파일로 만들어 claude.ai 페이지로 올린다. 휴대폰 브라우저에서 열면 앱과 같은 화면이 나오고, 알람·마이크·휴대폰 캘린더만 동작하지 않는다(안내만 뜸). 화면·문구·정렬은 여기서 보고, 휴대폰 기능을 바꾼 때만 설치 파일로 확인한다.

## 시험판 만들기

`main`에 올리면 GitHub Actions가 설치 파일을 만들어 **Releases**에 `시험판 N`으로 올립니다. 결과(성공·실패, 오류 내용, 설치 파일)는 `ci-results` 브랜치에도 남아서 저장소가 비공개여도 git으로 받을 수 있습니다. 휴대폰에서 그 페이지를 열어 apk를 받아 설치합니다. 처음 한 번은 "출처를 알 수 없는 앱 설치"를 허용해야 합니다.

직접 만들 때(Android Studio가 있는 컴퓨터):

```
npm ci
npm run sync
cd android && ./gradlew assembleDebug
```

## 첨부 · 백업 (시험판 42)

- 일정 첨부는 `BxAttachPlugin`(사진 선택기 · 카메라 앱 · 파일 창, 권한 없음)이 `files/attach/`에 복사한다. 사진은 긴 변 2048px JPEG + 작은 그림(`_t.jpg`). 화면 코드는 `web-src/v42.js`
- 백업 파일은 첨부가 있으면 zip(`boxworks.json` + `attach/…`, 압축 없이), 없으면 json. 불러오기는 둘 다
- 구글 자동 백업은 `res/xml/bx_data_extraction.xml`(12 이상) · `bx_backup_rules.xml`(11 이하)에서 `attach/`를 뺀다. 앱 하나 25MB를 넘으면 일정까지 백업이 멈추기 때문

## 캘린더 보기 (시험판 43)

- 왼쪽 아래 작은 '일 · 주 · 월'(`#bx-vsw`)이 보기를 바꾼다. 위의 월간 · 주간 줄은 앱에서 뺐다(웹은 그대로). 코드는 `web-src/v43.js`, 화면 길은 `scripts/patches-v43.mjs`
- `bxCalFit`이 화면 높이에 맞춰 날짜 칸 높이(`--bx-cell-h`)와 칸마다 일정 줄 수(2~4)를 정한다
- '일'은 캘린더 안 하루 보기(`bxDayViewHtml`, `S.view = 'day'`). 휴대폰 뒤로 단추는 일 → 월

## 일정 창 · 명상 소리 (시험판 44)

- 일정 창은 삼성 캘린더 방식 줄 목록이다(`web-src/v44.js`의 `bxEdList`). 줄을 누르면 페이지(`#bx-ep`)가 열린다. 원래의 고르는 칸(`#f-panel`)을 페이지로 옮겨 쓰고, '완료'는 그대로 두고 ‹ · 휴대폰 뒤로는 연 순간의 값(`bxEpSnap`)으로 되돌린다
- 명상 소리 크기: `BxSound.setVolume({bell, bg})` → `SoundPrefs`(기기 보호 저장소). `BowlPlayer` · `BgPlayer`가 소리에 곱한다
- 앱을 최근 목록에서 지우면 배경 소리와 남은 명상 종을 멈춘다(`BxSoundService.onTaskRemoved`, `MainActivity.onDestroy`). 앱은 `BxSound.status().medCancel`을 보고 '명상 중' 화면을 치운다

## 수업 창 · 휴대폰 캘린더 일정 창 · 루틴 고치기 (시험판 45)

- 같은 삼성 방식을 다른 입력 창에도 쓴다(`web-src/v45.js`). 페이지는 시험판 44의 `bxPgOpen(제목, 칸, 되돌리기)`: 창 안에 숨겨 둔 칸을 페이지로 옮겨 쓰고, 닫으면 제자리로 돌려놓는다
- 수업 창(`ttDraw`): 저장은 예전처럼 `#tt-name` · `#tt-start` · `#tt-end` · `#tt-place` · `#tt-rem-c` 칸을 읽는다. 장소 · 알림 · 시간표는 숨긴 칸(`.bx-tt45-hold`)에 있다가 페이지로 간다
- 휴대폰 캘린더 일정 창(`pcDraw`): 고르면 바로 `px_…` 문서에 적히므로, ‹ 는 연 순간의 문서 · 이동 시간 기억(`travelmem`) · 막 만든 '외출 준비'를 되돌린다
- 루틴 고치기(`bxDrawRoutine`, `rtTimesHtml`): 알림 방식 · 기준은 페이지, 시각 줄은 기준에 따라 시작 시각 하나 또는 도착 시각 · 이동 시간 · 여유

## 확인 필요 날짜 변경 (시험판 46)

- '날짜 변경'(`bxLatePickDate`)은 카드 안에 칸을 펼치지 않고 페이지를 연다(`web-src/v46.js`). 페이지 안의 `#bx-lc-date` · `#bx-lc-time`과 숨은 `data-bx-late="move"` 단추를 쓰므로, 옮기는 일은 예전 '변경' 단추 처리(`flow.js`)가 그대로 한다. '완료'를 누르면 그 단추를 누른 것과 같다

## 앱 이름 바꾸기

앱 이름(지금 '스케줄러', 대표 결정 2026-11-03 23:40)은 **`android/app/src/main/res/values/strings.xml`의 `app_name` 한 곳**에서만 정합니다.

- 휴대폰 앱 이름 · 알림 · 알람 화면 · 위젯은 이 값을 읽습니다(`AlarmNotify.appName`)
- 앱 화면 글자는 `npm run sync` 때 같은 값을 읽어 `window.BX_NAME`으로 넣습니다(`scripts/build-web.mjs`). 화면 코드에서는 이름을 직접 쓰지 말고 `window.BX_NAME`을 씁니다
- 위젯 이름('오늘 일정', '지금 단계')과 공유 메뉴('일정으로 넣기')에는 앱 이름을 넣지 않습니다
- `capacitor.config.json`의 `appName`은 앱에 쓰이지 않지만 헷갈리지 않게 같이 바꿉니다
- 앱 ID `kr.boxworks.app`(설치 · 업데이트에 쓰는 주소)은 이름과 따로이며 바꾸지 않습니다

## 웹 박스웍스가 바뀌었을 때

1. 새 원본을 `web-src/boxworks.html`에 덮어쓴다
2. `npm run sync` — 바꿀 곳을 못 찾으면 `scripts/build-web.mjs`의 해당 항목을 고친다

## 서명 키

`android/app/boxworks-test.keystore`는 **시험판 전용**입니다. 같은 키로 계속 서명해야 휴대폰에서 앱을 지우지 않고 새 버전으로 덮어 설치됩니다. Play 스토어에 올릴 키는 따로 만들고 저장소에 넣지 않습니다.

앱 ID `kr.boxworks.app`은 Play 스토어에 처음 올리기 전까지만 바꿀 수 있습니다.
