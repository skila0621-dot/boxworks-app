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

## 지금 앱이 하는 일 (1단계: 앱 껍데기)

- 웹 박스웍스 화면과 기능을 그대로 씀
- 일정은 휴대폰 안에 저장(서버·로그인 없음, D-02). 구글 백업 대상
- AI는 쓰지 않고 박스웍스 안의 규칙 해석만 씀(D-04)
- 백업 파일 내보내기는 휴대폰 공유 창으로 저장할 곳을 고름
- 앱 아이콘과 시작 화면은 박스웍스 로고

아직 없는 것: 휴대폰 알람(2단계), 말로 넣기 마이크(3단계), 휴대폰 캘린더 읽기, 아침 보고, 위젯

## 시험판 만들기

`main`에 올리면 GitHub Actions가 설치 파일을 만들어 **Releases**에 `시험판 N`으로 올립니다. 휴대폰에서 그 페이지를 열어 apk를 받아 설치합니다. 처음 한 번은 "출처를 알 수 없는 앱 설치"를 허용해야 합니다.

직접 만들 때(Android Studio가 있는 컴퓨터):

```
npm ci
npm run sync
cd android && ./gradlew assembleDebug
```

## 웹 박스웍스가 바뀌었을 때

1. 새 원본을 `web-src/boxworks.html`에 덮어쓴다
2. `npm run sync` — 바꿀 곳을 못 찾으면 `scripts/build-web.mjs`의 해당 항목을 고친다

## 서명 키

`android/app/boxworks-test.keystore`는 **시험판 전용**입니다. 같은 키로 계속 서명해야 휴대폰에서 앱을 지우지 않고 새 버전으로 덮어 설치됩니다. Play 스토어에 올릴 키는 따로 만들고 저장소에 넣지 않습니다.

앱 ID `kr.boxworks.app`은 Play 스토어에 처음 올리기 전까지만 바꿀 수 있습니다.
