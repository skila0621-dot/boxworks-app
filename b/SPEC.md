# B 스케줄러 — 기술 명세

안드로이드 앱 `kr.boxworks.b`(이름 'B 스케줄러'). A(`kr.boxworks.app`)와 따로 깔린다. 화면은 웹(Capacitor WebView), 알람 · 캘린더 · 백그라운드는 휴대폰 쪽(Java)이 한다.

**한 줄 목표**: 이미 휴대폰 캘린더에 있는 약속마다 '준비 시작'을 거꾸로 계산해 확인할 때까지 붙잡고, 확인한 시각으로 실제 준비 시간을 배운다. 앱을 열지 않아도 캘린더가 바뀌면 알람이 따라 바뀐다.

## 1. 나눔

| 쪽 | 하는 일 | 파일 |
| --- | --- | --- |
| 휴대폰(두뇌) | 저장, 캘린더 읽기 · 쓰기, 계획 계산, 알람 예약 · 울림 · 붙잡기, 진행 알림, 아침 요약, 백그라운드 다시 계획, 기록 | `android/app/src/main/java/kr/boxworks/b/*.java` |
| 웹(얼굴) | 화면, 한 문장 해석(`web/js/parse.js`), 설정 · 약속별 조정 | `web/` |
| 둘 다 | 계획 계산 규칙 | 기준: `web/js/planner.js` · 휴대폰: `BPlanner.java` · 시험표: `vectors/planner.json` |

모든 저장은 휴대폰 쪽에 있다(웹은 다리로 읽고 쓴다). 백그라운드에서도 계산할 수 있게 하려는 것이다.

## 2. 저장(SharedPreferences, 기기 보호 저장소 `createDeviceProtectedStorageContext()`)

| 키 | 모양 |
| --- | --- |
| `settings` | `{prepDefault:30, travelDefault:30, buffer:10, heads:10, holdEvery:3, holdMax:3, morningOn:true, morningAt:"08:00", h24:false, calendars:null\|[id…], writeCal:null\|id, sound:"alarm"\|"vibrate", remindOwn:true}` — 빠진 값은 기본값 |
| `overrides` | `{ "<key>": {out?, prep?, travel?, off?} }` |
| `places` | `{ "<normPlace>": 이동분 }` |
| `kw` | `{ "<normTitle>": true\|false }` — 같은 제목에 '나가는 약속' 여부를 정한 기억 |
| `items` | `[{id, title, at(ms), endAt?, place, out?}]` — 캘린더 권한이 없을 때만 쓰는 이 앱 자체 목록 |
| `log` | `[{key, act, kind?, n?, t}]` 최근 500개. act: `rang`(울림, kind) · `start` · `left` · `done` · `snooze`(kind, n분) · `late`(n분) · `off` · `undo`(kind: start/left/done) |
| `alarms` | 지금 예약해 둔 알람 목록(취소 · 재부팅 뒤 다시 걸기용) `[{id, key, kind, at, strong, hold?}]` |
| `lastOpen`, `firstRunDone`, `pendingShare` | |

**key**: 캘린더 약속 `c:<eventId>:<beginMs>`, 이 앱 자체 `o:<id>`, 아침 요약 `day:YYYY-MM-DD`.

## 3. 계획 규칙(요약 — 정확한 것은 `web/js/planner.js`)

- 나가는 약속(out): 내가 정한 것(overrides.out) > 넣을 때 정한 것(items.out) > `kw[normTitle]` > 장소가 있고 온라인(`ONLINE`)이 아니면 out(`place`) > 제목 낱말(`OUT_WORDS`)은 **묻기만**(out=false, `suggest=true`, outWhy `word`). 종일 일정은 out 아님(`allday`).
- 준비 시간: overrides.prep > 배운 값(최근 5번 가운데 값, 5분 올림, 10~120, 3번 이상) > prepDefault. 이동: overrides.travel > places[normPlace] > travelDefault.
- `leave0 = start − (travel + buffer)`. 준비 단계 미룸 snPrep, 출발 단계 미룸 snLeave. `prepAt = leave0 − prep + snPrep`, `leaveAt = leave0 + snPrep + snLeave`, `headsAt = leaveAt − heads`(heads>0이고 heads<prep일 때).
- state: `left`(나감) > `prep`(시작함) > `done`(이 앱 알림 했음) > `past`(시작 시각 지남) > `idle`.
- 빠듯함(tight): 나가는 약속끼리, 다음 약속의 prepAt이 앞 약속 끝(없으면 시작+60분)보다 이르면 `{key, title, minutes}`.
- 알람: `alarms()` 그대로. 시각이 지났는데 그 단계가 한 번도 안 울렸으면(log에 rang 없음) 5초 뒤 바로. 아침 요약은 그날 첫 준비 시작보다 이를 때만.
- 미루기: `snoozeLeft = 남은 여유 r(=buffer − snPrep − snLeave)이 2 이상이면 ceil(r/2), 아니면 r`. 0이면 미루기 단추를 내지 않는다.
- 늦음: `lateIfStartNow = ceil5(now + prep + travel − start)`, `lateIfLeaveNow = ceil5(now + travel − start)`(0 이하는 0).

## 4. 알람

| kind | 세기 | 언제 | 제목 · 본문 | 단추 |
| --- | --- | --- | --- | --- |
| `prep` | 강(알람 화면 · 소리) | prepAt | "준비 시작 · {제목}" / "지금 시작하면 {도착 예정} 도착 · {출발} 출발". 늦으면 "지금 시작해도 {n}분 늦어요" | **시작했어요** · {n}분만(여유 있을 때) 또는 늦는다고 알리기(늦을 때) · 작은 글자 '이번엔 안 가요' |
| `heads` | 약(알림) | headsAt | "{heads}분 뒤 출발 · {제목}" / "{출발} 출발" | 나갔어요 |
| `leave` | 강 | leaveAt | "출발 · {제목}" / "지금 나가면 {도착 예정} 도착 · {장소}". 늦으면 "지금 나가도 {n}분 늦어요" | **나갔어요** · {n}분만 또는 늦는다고 알리기 |
| `remind` | 강 | start(+미룸) | "{제목}" / "{시각}" | 했어요 · 10분 뒤 |
| `morning` | 약 | morningAt | "오늘 나가는 약속 {n}개" / "첫 준비 시작 {시각} · {제목}({시작})". 묻기만 한 일정이 있으면 " · 장소 없는 일정 {m}개는 알람 없이 둘게요" | 열기 |

- 시각 글: settings.h24면 "14:20", 아니면 "오후 2:20". '도착 예정' = start − 남은 여유.
- **강한 알람**: `AlarmManager.setAlarmClock`(보이는 곳: MainActivity). 울리면 log `rang` → 소리(알람 소리, `USAGE_ALARM`) + 진동, 화면 꺼짐/잠금이면 전체 화면 알람(`BAlarmActivity`, showWhenLocked · turnScreenOn), 쓰는 중이면 높은 중요도 알림. 소리는 60초 뒤 멈추고 알림은 남긴다.
- **붙잡기(대답할 때까지)**: 강한 알람이 울린 뒤 holdEvery분마다 다시(최대 holdMax번). prep은 leaveAt 전까지, leave는 start 전까지, remind는 start+30분 전까지. **다시 울릴 때마다 소리**를 내고(대표 결정 11/6), 두 번째부터는 소리 다음에 읽어 주기(TextToSpeech 한국어, 알람 음량): "{제목} 갈 준비를 시작할 시간이에요. 지금 시작하면 제시간에 도착해요." / 늦으면 "지금 시작해도 {n}분 늦어요. 늦는다고 미리 알려 두세요." 대답(시작 · 나감 · 했음 · 미룸 · 안 가요)하면 남은 붙잡기를 모두 취소.
- **약한 알람**: `setExactAndAllowWhileIdle`(권한 없으면 `setAndAllowWhileIdle`), 기본 중요도 알림.
- **단추가 하는 일**: 시작했어요 → log start, prep 붙잡기 취소, **진행 알림** 띄움 · 나갔어요 → log left, leave · heads · 붙잡기 취소, 진행 알림 지움 · N분만 → log snooze(kind, n), 다시 계획 · 늦는다고 알리기 → 공유 창(아래 글), log late(n) · 이번엔 안 가요 → overrides[key].off=true, log off, 모두 취소 · 했어요 → log done.
- **늦는다고 알리기 글**: 늦으면 "미안해요, {n}분쯤 늦을 것 같아요. {도착 시각}쯤 도착해요." 늦지 않으면 "지금 출발해요. {도착 시각}쯤 도착해요." 받는 사람은 사용자가 고른다(카톡 등). 자동으로 보내지 않는다. 알림 단추에서는 투명 액티비티(`BShareActivity`)로 공유 창을 연다(백그라운드에서 액티비티를 여는 제한 때문).
- **진행 알림(곁에서)**: 시작했어요 뒤 계속 떠 있는 알림. "출발까지 · {제목}", 출발 시각까지 거꾸로 가는 시계(`setUsesChronometer` + `setChronometerCountDown(true)` + `setWhen(leaveAt)`), "{출발} 출발 · {도착 예정} 도착". 단추: 나갔어요 · 늦는다고 알리기. Android 16(API 36)이면 `Notification.ProgressStyle`로 시작 → 출발 진행 막대와 `setRequestPromotedOngoing(true)`(삼성 Now bar). 안 되면 그냥 시계.

## 5. 캘린더

- 읽기: `CalendarContract.Instances`(begin~end). 보이는 캘린더(`VISIBLE=1`) 중 settings.calendars(null이면 모두). 참석 '거절'(`SELF_ATTENDEE_STATUS = DECLINED`)은 뺀다. 필드: eventId, begin, end, title, location, allDay, calendarId, calName(+계정), color.
- 쓰기: `addEvent({title, begin, end, location, calendarId})` → `Events` insert(`EVENT_TIMEZONE` 기기 시간대). calendarId 없으면 settings.writeCal, 그것도 없으면 쓸 수 있는(`CALENDAR_ACCESS_LEVEL >= CONTRIBUTOR`) 보이는 캘린더 중 `IS_PRIMARY` 또는 첫째. 결과 `{id, calendarId}`.
- 열기: `openEvent({id})` → 휴대폰 캘린더 앱에서 그 일정(`ACTION_VIEW content://com.android.calendar/events/<id>`).

## 6. 다시 계획(앱을 열지 않아도)

`BEngine.replan(ctx)`: 저장 + 캘린더(now−6시간 ~ now+48시간) → `BPlanner.plan` → `alarms` → 예약 목록과 비교해 새것만 걸고 사라진 것은 취소(붙잡기 · 이미 울린 것은 그대로) → 저장.

- 캘린더가 바뀌면: `JobScheduler` 내용 감시(`CalendarContract.Events.CONTENT_URI`, `FLAG_NOTIFY_FOR_DESCENDANTS`, 5~30초 모아서). 돈 뒤 다시 등록.
- 6시간마다(`setPeriodic`), 알람이 울릴 때마다, 앱을 열 때(onResume), 설정 · 약속을 바꿀 때.
- 재부팅: `LOCKED_BOOT_COMPLETED`에는 저장된 알람만 다시 걸고(캘린더는 잠금 해제 뒤에만 읽힘), `BOOT_COMPLETED` · `MY_PACKAGE_REPLACED` · `TIME_SET` · `TIMEZONE_CHANGED`에 replan + 감시 등록.

## 7. 다리(웹 → `Capacitor.Plugins.B`)

모두 Promise. 웹 쪽 가짜(`web/js/fake.js`)가 같은 모양으로 흉내 낸다(시험 · 미리 보기용).

| 부르기 | 돌려줌 |
| --- | --- |
| `state()` | `{settings, overrides, places, kw, items, learned:{prep, samples:[{key,t,minutes}]}, perms, calendars:[{id,name,account,color,writable,visible}], lastOpen, now, trial, firstRun}` |
| `plan({from, to})` | `{now, entries:[planner.js의 항목 + calId]}` — 빠듯함 계산을 위해 휴대폰 쪽은 from 앞 12시간도 읽는다 |
| `save({settings?, overrides?, places?, kw?, items?})` | `{ok, scheduled}` — 준 것만 통째로 바꾸고 다시 계획 |
| `act({key, act, kind?, n?})` | `{ok}` — 4절 단추와 같은 일(앱 안에서 누를 때) |
| `addEvent({title, begin, end, location, calendarId?})` | `{ok, id, calendarId}` 또는 거절 `no_calendar` |
| `openEvent({id})` | `{ok}` |
| `perms()` | `{notif, exact, fullscreen, battery, calendar, mic}` 각각 `"ok"`·`"no"`·`"na"` |
| `fix({kind})` | 권한 묻기 또는 설정 열기 → `{kind, state}` |
| `test({seconds})` | 'prep' 모양 시험 알람 |
| `share({text})` | 공유 창 |
| `shared()` | `{text}` 다른 앱에서 공유해 들어온 글(읽으면 지움) 또는 `{text:null}` |
| `listen()` · `stopListen()` | 말 듣기 시작 · 멈춤. 이벤트 `speech` `{text, final, error?}` |
| `opened()` | `{prev}` 지난번 연 시각을 돌려주고 지금으로 적음 |
| `stats({days})` | `{rang, started, prepToStart:{median,n}, snoozes, late:{count, leadMedian}, left:{onTime, late}}` |
| 이벤트 `changed` | 알림 · 알람 단추로 기록이 바뀌면(앱이 떠 있을 때) |

## 8. 권한(매니페스트)

POST_NOTIFICATIONS · USE_EXACT_ALARM · SCHEDULE_EXACT_ALARM(maxSdk 32) · USE_FULL_SCREEN_INTENT · RECEIVE_BOOT_COMPLETED · VIBRATE · WAKE_LOCK · FOREGROUND_SERVICE · FOREGROUND_SERVICE_SYSTEM_EXEMPTED(울리는 서비스 `systemExempted|shortService`) · READ_CALENDAR · WRITE_CALENDAR · RECORD_AUDIO · REQUEST_IGNORE_BATTERY_OPTIMIZATIONS · POST_PROMOTED_NOTIFICATIONS. 음성 인식 queries. 공유 받기 SEND text/plain.

## 9. 시험

- 웹: `node tests/run.mjs` — 계획 계산(시험표), 한 문장 해석, 화면 흐름(가짜 다리).
- 휴대폰: `./gradlew testDebugUnitTest` — `BPlannerTest`가 `../../vectors/planner.json`의 모든 경우를 같은 답으로 내는지.
- 정렬 점검: `node tests/gate.cjs` — 모든 화면 · 창을 360 · 384 · 412 × 라이트 · 다크 × 오전·오후 · 24시간으로 열어 겹침 · 가림 · 잘림 · 가로 넘침 · NaN · 시각 표시 · 작은 단추 · 안 보이는 글을 잰다. 하나라도 걸리면 설치 파일을 내지 않는다.
- CI: `.github/workflows/b.yml` — b/ 가 바뀔 때만. 통과하면 `b-test-N` 시험판(prerelease)에 `b-scheduler-test-N.apk`.
