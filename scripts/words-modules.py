# 시험판 36 단어 점검(대표 지시 11/3 16:39 "뭐뭐하기처럼 풀어 쓴 말 · '단계 6개 보기' → '자세히'처럼 줄일 것, 다른 앱의 표기를 따르기").
# web-src 모듈(통합관리실이 쓴 코드)의 화면 글자를 한 번에 바꾼다. 원본 web-src/boxworks.html에서 온 글자는 scripts/patches-words.mjs.
# 쓰는 법: python3 scripts/words-modules.py  (한 번만. 바꿀 곳 수가 다르면 멈춘다)
import sys

E = [
  # ── 홈 · 오늘 할 일 ──
  ('home.js', "b.innerHTML = '단계 ' + n + '개 보기' + ICON_FOLD;",
              "b.innerHTML = '<span class=\"bx-rt-tog-t\">' + (open ? '접기' : '자세히') + '</span>' + ICON_FOLD;\n    b.setAttribute('aria-label', '단계 ' + n + '개 ' + (open ? '접기' : '자세히'));", 1),
  ('home.js', "c.classList.toggle('bx-open', open); rb.setAttribute('aria-expanded', String(open));",
              "c.classList.toggle('bx-open', open); rb.setAttribute('aria-expanded', String(open));\n    const rtt = rb.querySelector('.bx-rt-tog-t'); if (rtt) rtt.textContent = open ? '접기' : '자세히';", 1),
  ('brief.js', "'<span>확인하지 않은 단계 '", "'<span>놓친 단계 '", 1),
  ('brief.js', ">모두 했어요</button>", ">모두 완료</button>", 1),
  # ── 확인 필요 ──
  ('home.js', "시간이 지난 일정과 확인 안 한 루틴 단계예요. 그대로 둬도 괜찮아요.", "지난 일정과 놓친 루틴 단계예요. 그대로 둬도 괜찮아요.", 1),
  ('home.js', "지난 일정은 다 정리했어요", "지난 일정 없음", 1),
  ('home.js', ">모두 했어요</button>", ">모두 완료</button>", 1),
  ('home.js', "'오늘 루틴 단계는 다 확인했어요</p>'", "'놓친 루틴 단계 없음</p>'", 1),
  ('home.js', ">지난 일 모두 그대로 두기</button>", ">모두 그대로</button>", 1),
  ('home.js', "openSheet({title: only ? '시간이 지난 일정' : '확인이 필요한 일',", "openSheet({title: only ? '지난 일정' : '확인 필요',", 1),
  # ── 도움말(ⓘ) ──
  ('home.js', "'네모 칸을 누르면 완료. 일정을 꾹 누르면 고치기·다 했어요·내일로 미루기·지우기가 바로 나와요.', '오른쪽 아래 +로 새 일정. 꾹 누르면 바로 말로 넣어요.'",
              "'네모 칸을 누르면 완료. 일정을 길게 누르면 수정 · 완료 · 내일로 미루기 · 삭제가 바로 나와요.', '오른쪽 아래 +로 새 일정. 길게 누르면 바로 말하기.'", 1),
  ('home.js', "거기서 바로 넣을 수 있어요. 일정을 꾹 누르면 고치기·지우기가 바로 나와요.", "거기서 바로 추가할 수 있어요. 일정을 길게 누르면 수정 · 삭제가 바로 나와요.", 1),
  ('home.js', "'오른쪽 아래 +는 고른 날짜에 일정을 넣어요.'", "'오른쪽 아래 +는 고른 날짜에 일정을 추가해요.'", 1),
  ('home.js', "'요일 옆 ‘+ 추가’로 그날 일정을 넣어요.'", "'요일 옆 ‘+ 추가’로 그날 일정을 추가해요.'", 1),
  ('home.js', "'아래 ‘말로 넣기’에 말하거나 적으면 시간표가 채워져요. 예) “월수 10시 반 경영학원론 301호”', '블록을 꾹 누르면 들어 올려져요.",
              "'아래 ‘빠른 추가’에 말하거나 적으면 시간표가 채워져요. 예) “월수 10시 반 경영학원론 301호”', '블록을 길게 누르면 들어 올려져요.", 1),
  ('home.js', "'꾹 누른 뒤 나오는 줄에서 같은 수업 묶기, 휴강(그날만 쉬기), 복제, 지우기를 해요.', '아래 ‘보기 설정’에서 보이는 시간과 주말을 바꿔요.'",
              "'길게 누른 뒤 나오는 줄에서 수업 묶기 · 휴강(그날만) · 복제 · 삭제.', '아래 ‘보기 설정’에서 표시 시간과 주말을 바꿔요.'", 1),
  ('home.js', "'루틴은 단계마다 알람이 울리고, ‘했어요’를 누를 때까지 다시 알려요.', '템플릿을 누르거나 말로 만들 수 있어요.'",
              "'루틴은 단계마다 알람이 울리고, 확인을 누를 때까지 다시 알려요.', '템플릿을 고르거나 빠른 추가로 만들 수 있어요.'", 1),
  ("home.js", "openSheet({title: '이 화면 사용법',", "openSheet({title: '도움말',", 1),
  ('home.js', "data-act=\"sheet-close\">알겠어요</button>", "data-act=\"sheet-close\">닫기</button>", 1),
  # ── ⋯ 더보기 · 아래 메뉴 ──
  ('home.js', "<span class=\"ml\">내가 쓸 기능 · 아래 메뉴</span>", "<span class=\"ml\">기능 · 메뉴 편집</span>", 2),
  ('home.js', "<span class=\"ml\">홈 화면 위젯 두기</span>", "<span class=\"ml\">위젯 추가</span>", 1),
  ('home.js', "data-act=\"bx-dock-reset\">처음대로</button>", "data-act=\"bx-dock-reset\">기본값</button>", 1),
  ('home.js', "openSheet({title: '아래 메뉴 고르기',", "openSheet({title: '아래 메뉴 편집',", 1),
  ('home.js', "'<span class=\"bx-togw\">$1$2 알람 켜기$3", "'<span class=\"bx-togw\">$1$2 알람$3", 1),
  # ── 새 루틴 ──
  ('home.js', "openSheet({title: '새 루틴 만들기',", "openSheet({title: '새 루틴',", 1),
  ('home.js', "템플릿에서 고르기 <small>누르면 바로 열려요. 시각만 고치고 저장하세요</small>", "템플릿 <small>누르면 열려요. 시각만 바꾸고 저장하세요</small>", 1),
  ('home.js', "style=\"margin-top:18px\">말로 만들기</h3>", "style=\"margin-top:18px\">빠른 추가</h3>", 1),
  ('home.js', "ICON.spark + '이대로 만들기</button>", "ICON.spark + '만들기</button>", 1),
  ('home.js', "<b>빈 루틴에서 시작</b><small>이름·시각·단계를 직접 적어요</small>", "<b>빈 루틴</b><small>이름 · 시각 · 단계 직접 입력</small>", 1),
  # ── 일정 꾹 메뉴 · 캘린더 ──
  ('flow.js', "row('edit', ICON.edit, pc ? '알림·이동 시간 고치기' : '고치기', '')", "row('edit', ICON.edit, pc ? '알림 · 이동 시간 수정' : '수정', '')", 1),
  ('flow.js', "it.done ? '완료 취소' : '다 했어요'", "it.done ? '완료 취소' : '완료'", 1),
  ('flow.js', "row('del', ICON.trash, '지우기', '휴지통에 30일', true)", "row('del', ICON.trash, '삭제', '휴지통에 30일 보관', true)", 1),
  ('flow.js', "pill.textContent = S.view === 'week' ? '이번 주로' : '이번 달로';", "pill.textContent = '오늘';", 1),
  ('flow.js', "'그대로 뒀어요. 확인 필요에서 빠져요'", "'확인 필요에서 뺐어요'", 1),
  ('flow.js', "aria-label=\"말로 넣기\">' + BXT_MIC", "aria-label=\"말하기\">' + BXT_MIC", 1),
  # ── 위젯 · 기능 ──
  ('flow.js', "['list', '오늘 일정', '4×2 · 오늘 일정 네 줄과 시각']", "['list', '오늘 일정', '4×2 · 하루 일정 · ‹ ›로 날짜 넘기기']", 1),
  ('flow.js', "<span class=\"ml\">홈 화면 위젯 두기</span>", "<span class=\"ml\">위젯 추가</span>", 1),
  ('flow.js', "data-bx-wpin=\"' + k + '\">두기</button>", "data-bx-wpin=\"' + k + '\">추가</button>", 1),
  ('flow.js', "'두기를 누르면 휴대폰이 놓을 자리를 물어요. '", "'추가를 누르면 휴대폰이 놓을 자리를 물어요. '", 1),
  ('flow.js', "'홈 화면을 꾹 누른 뒤 위젯 › 박스웍스에서도 놓을 수 있어요.</p>'", "'홈 화면을 길게 누른 뒤 위젯 › 박스웍스에서도 추가할 수 있어요.</p>'", 1),
  ('flow.js', "'홈 화면을 꾹 누른 뒤 위젯 › 박스웍스에서 놓을 수 있어요'", "'홈 화면을 길게 누른 뒤 위젯 › 박스웍스에서 추가할 수 있어요'", 1),
  ('flow.js', "['report', '아침에 오늘 일정 받기']", "['report', '아침 요약']", 1),
  ('flow.js', "openSheet({title: '내가 쓸 기능',", "openSheet({title: '기능 · 메뉴 편집',", 1),
  ('flow.js', "data-bxset=\"alarm\">시각 바꾸기</button>", "data-bxset=\"alarm\">시각 변경</button>", 1),
  ('flow.js', "data-act=\"bx-rep-try\">지금 한 번 받아 보기</button>", "data-act=\"bx-rep-try\">미리 보기</button>", 1),
  ('flow.js', "data-bx-fnav=\"reset\">처음대로</button>", "data-bx-fnav=\"reset\">기본값</button>", 1),
  # ── 시간표 ──
  ('timetable.js', "data-act=\"tt-add\">넣기</button>", "data-act=\"tt-add\">추가</button>", 2),
  ('timetable.js', "아래 ‘말로 넣기’로 넣어 보세요.", "아래 ‘빠른 추가’로 넣어 보세요.", 1),
  ('timetable.js', "'<span>말로 넣기</span></button>'", "'<span>빠른 추가</span></button>'", 1),
  ('timetable.js', "aria-label=\"보기 설정 바꾸기 · '", "aria-label=\"보기 설정 · '", 1),
  ('timetable.js', "aria-label=\"시간표 보기 설정 바꾸기\"", "aria-label=\"시간표 보기 설정\"", 1),
  ('timetable.js', "<small>요일·시간 골라 넣기</small>", "<small>요일 · 시간 직접 입력</small>", 1),
  ('timetable.js', "(window.BX_APP ? '수업 고치기' : '시간표 고치기')", "(window.BX_APP ? '수업 수정' : '시간표 고치기')", 1),
  ('timetable.js', "data-act=\"tt-del\">' + ICON.trash + '지우기</button>'", "data-act=\"tt-del\">' + ICON.trash + '삭제</button>'", 1),
  ('timetable.js', "openSheet({title: '말로 넣기',", "openSheet({title: '빠른 추가',", 1),
  ('timetable.js', "toast('시간표에서 지웠어요'", "toast('시간표에서 삭제했어요'", 2),
  ('timetable.js', ">보이는 시간</span>", ">표시 시간</span>", 1),
  ('timetable.js', ">보이는 요일</span>", ">표시 요일</span>", 1),
  ('timetable.js', "aria-label=\"보이는 요일\"", "aria-label=\"표시 요일\"", 1),
  ('timetable.js', "'블록을 꾹 누르면 옮기기·길이 바꾸기를 할 수 있어요. 클립으로 같은 수업을 연결하면 함께 움직여요.'", "'블록을 길게 누르면 옮기거나 길이를 바꿀 수 있어요. 클립으로 연결한 수업은 함께 움직여요.'", 1),
  ('timetable.js', "b('tt-x-edit', ICON.edit, '고치기') + b('tt-x-del', ICON.trash, '지우기')", "b('tt-x-edit', ICON.edit, '수정') + b('tt-x-del', ICON.trash, '삭제')", 1),
  ('timetable.js', "openSheet({title: e.name + ' 지우기',", "openSheet({title: e.name + ' 삭제',", 1),
  ('timetable.js', "요일만 지우기", "요일만 삭제", 1),
  ('timetable.js', "연결된 수업 모두 지우기", "연결된 수업 모두 삭제", 1),
  # ── 루틴 수정 창 ──
  ('rticons.js', "'이름을 보고 자동으로 골랐어요'", "'이름으로 자동 선택'", 1),
  ('rticons.js', "<span class=\"bx-icsum-c\">바꾸기</span>", "<span class=\"bx-icsum-c\">변경</span>", 1),
  ('rticons.js', "<span class=\"fg-l\">알려 주는 방식</span>", "<span class=\"fg-l\">알림 방식</span>", 1),
  ('rticons.js', "aria-label=\"알려 주는 방식\"", "aria-label=\"알림 방식\"", 1),
  ('rticons.js', "누르면 바로 들어 볼 수 있어요. 명상 화면의 종소리와는 따로예요.", "누르면 들려요. 명상의 종소리와는 따로예요.", 1),
  ('rticons.js', "[['arrive', '도착 시각에 맞추기'], ['start', '시작 시각부터']]", "[['arrive', '도착 시각'], ['start', '시작 시각']]", 1),
  ('rticons.js', "<small>이름 · 걸리는 시간(분) · 알람</small>", "<small>이름 · 시간(분) · 알람</small>", 1),
  ('rticons.js', "data-act=\"rt-del\">이 루틴 지우기</button>", "data-act=\"rt-del\">루틴 삭제</button>", 1),
  ('v31.js', "<span>공휴일에는 쉬기</span>' + bxSwitch('data-rhol', !!R.skipHol, '공휴일에는 쉬기')", "<span>공휴일 제외</span>' + bxSwitch('data-rhol', !!R.skipHol, '공휴일 제외')", 1),
  ('v32.js', "row('edit', ICON.edit, '고치기', '') + row('del', ICON.trash, '지우기', '지운 뒤 되돌릴 수 있어요', true)", "row('edit', ICON.edit, '수정', '') + row('del', ICON.trash, '삭제', '삭제해도 되돌릴 수 있어요', true)", 1),
  ('v32.js', "bxJosaUl(rt.name) + ' 지웠어요.'", "bxJosaUl(rt.name) + ' 삭제했어요.'", 1),
  # ── 첫 실행 · 허용 ──
  ('start.js', "['report', '아침에 오늘 일정 받기',", "['report', '아침 요약',", 1),
  ('start.js', "+ n + '개 고름</button>'", "+ n + '개 선택</button>'", 1),
  ('start.js', "card('sun', '아침에 오늘 일정 받기',", "card('sun', '아침 요약',", 1),
  ('start.js', "data-bxs=\"done\">시작하기</button>", "data-bxs=\"done\">시작</button>", 1),
  ('start.js', "' : ' disabled') + '>루틴 만들기</button>'", "' : ' disabled') + '>만들기</button>'", 1),
  ('start.js', "data-bxr=\"later\">나중에 할게요</button>", "data-bxr=\"later\">나중에</button>", 1),
  ('start.js', "esc(rt.name) + ' 알람 켜기\" data-bxr-to", "esc(rt.name) + ' 알람\" data-bxr-to", 1),
  ('start.js', "'알람 켜기' : '내 루틴 보기')", "'알람 켜기' : '내 루틴')", 1),
  ('start.js', "['notifications', '알림 보내기',", "['notifications', '알림',", 1),
  ('start.js', "['exact', '정확한 시각에 울리기',", "['exact', '정확한 알람',", 1),
  ('start.js', "['fullScreen', '잠금 화면에 알람 띄우기',", "['fullScreen', '잠금 화면 알람',", 1),
  ('start.js', "['battery', '절전에서 빼기',", "['battery', '절전 예외',", 1),
  ('start.js', "ICON.check + '허락됨</span>'", "ICON.check + '허용됨</span>'", 1),
  ('start.js', "'설정 열기' : '허락하기'", "'설정 열기' : '허용'", 1),
  ('start.js', "절전에서 빼기: 박스웍스 앱 정보가 열리면", "절전 예외: 박스웍스 앱 정보가 열리면", 1),
  ("start.js", "ICON.bell + '알람 한 번 들어 보기 · 10초 뒤</button>'", "ICON.bell + '알람 테스트 · 10초 뒤</button>'", 1),
  ('start.js', "need[1] + ' 허락하기'", "need[1] + ' 허용'", 1),
  # ── 설정 ──
  ('brief.js', "setRow('아침에 오늘 일정 받기', bxSwitch('data-bxrep', cfg.on, '아침에 오늘 일정 받기'))", "setRow('아침 요약', bxSwitch('data-bxrep', cfg.on, '아침 요약'))", 1),
  ('brief.js', "['title', '일정 제목까지',", "['title', '일정 제목',", 1),
  ('brief.js', "['none', '아무것도',", "['none', '표시 안 함',", 1),
  ('brief.js', "aria-label=\"잠금 화면에 보여 줄 것\"><b class=\"bx-lock-h\">잠금 화면에 보여 줄 것</b>", "aria-label=\"잠금 화면 표시\"><b class=\"bx-lock-h\">잠금 화면 표시</b>", 1),
  ('tidy.js', "[['', '자동'], ['light', '끄기'], ['dark', '켜기']]", "[['', '자동'], ['light', '끔'], ['dark', '켬']]", 1),
  ('tidy.js', "<span class=\"ml\">휴대폰 알람 시험</span>", "<span class=\"ml\">알람 테스트</span>", 1),
  ('tidy.js', "setRow('일정 시작 전 알림(기본)', bxSwitch('data-pre-on', pre != null, '일정 시작 전 알림'))", "setRow('일정 알림(기본)', bxSwitch('data-pre-on', pre != null, '일정 알림'))", 1),
  ('tidy.js', "새 일정에 처음 들어가는 값이에요. 0분은 정시", "새 일정의 기본값이에요. 0분은 정시", 1),
  ('tidy.js', "'시간 없는 일정 알림 시각'", "'종일 일정 알림 시각'", 3),
  ('tidy.js', "시간 없는 일정은 그날 이 시각에 알려요", "종일 일정은 그날 이 시각에 알려요", 1),
  ('tidy.js', "<small>모든 일정 지우기 · 처음 상태로</small>", "<small>모든 일정 삭제 · 초기화</small>", 1),
  ('tidy.js', "<b>모든 일정 지우기</b><span>일정 ' + nItems + '개(휴지통 포함)를 모두 지워요.", "<b>모든 일정 삭제</b><span>일정 ' + nItems + '개(휴지통 포함)를 모두 삭제해요.", 1),
  ('tidy.js', "data-kind=\"items\">일정 지우기</button>", "data-kind=\"items\">삭제</button>", 1),
  ('tidy.js', "<b>처음 상태로 되돌리기</b><span>일정·분류·설정을 모두 지우고 처음 쓰는 상태로 돌아가요.</span>", "<b>초기화</b><span>일정 · 분류 · 설정을 모두 삭제하고 처음 상태로 돌아가요.</span>", 1),
  ('tidy.js', "data-kind=\"all\">전체 초기화</button>", "data-kind=\"all\">초기화</button>", 1),
  ('tidy.js', "지운 내용은 되돌릴 수 없어요.", "삭제하면 되돌릴 수 없어요.", 1),
  # ── 명상 ──
  ('meditation.js', "누르면 바로 들어 볼 수 있어요. 끝날 때는 늘 세 번 울려요(눈을 감고 있어도 끝을 알게).", "누르면 들려요. 끝 종은 늘 세 번 울려요.", 1),
  ('meditation.js', "<span>중간 종 · 다시 치는 간격</span>", "<span>중간 종 간격</span>", 1),
  # (아래 넷은 점검 뒤 한 번 더: 명상 끝내기 → 종료, 기능 스위치 'X 쓰기' → 'X 사용', 홈 안내 카드 '루틴 만들기' → '만들기', 숫자 칸 'X 목록 보기' → 'X 목록')
  # ── 새 일정 창(출발 · 준비) ──
  ('calendar.js', ">가는 데 걸리는 시간</div>", ">이동 시간</div>", 1),
  ('calendar.js', "setRow('휴대폰 캘린더 일정 함께 보기', bxSwitch('data-pc-on', cfg.on, '휴대폰 캘린더 일정 함께 보기'))", "setRow('휴대폰 캘린더 함께 보기', bxSwitch('data-pc-on', cfg.on, '휴대폰 캘린더 함께 보기'))", 1),
  ('travel.js', "data-fpanel=\"time\">' + ICON.clock + '시간 정하기</button>", "data-fpanel=\"time\">' + ICON.clock + '시간 지정</button>", 1),
  ('travel.js', "<div class=\"fg-l\">가는 데 걸리는 시간</div>", "<div class=\"fg-l\">이동 시간</div>", 1),
]

def main():
    files = {}
    bad = 0
    for f, a, b, n in E:
        p = 'web-src/' + f
        s = files.get(p) or open(p, encoding='utf8').read()
        c = s.count(a)
        if c != n:
            print('✗', f, c, '곳 (기대', n, ') :', a[:80]); bad += 1; files[p] = s; continue
        files[p] = s.replace(a, b)
    if bad:
        print('멈춤:', bad, '개가 맞지 않음'); sys.exit(1)
    for p, s in files.items():
        open(p, 'w', encoding='utf8').write(s)
    print('바꿈', len(E), '곳 ·', len(files), '파일')

main()
