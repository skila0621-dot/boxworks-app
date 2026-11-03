// 시험판 36 단어 점검(대표 지시 11/3 16:39): 원본 web-src/boxworks.html에서 온 화면 글자.
// "뭐뭐하기처럼 풀어 쓴 말 · '단계 6개 보기' → '자세히'처럼 줄일 것, 다른 앱이 보편적으로 쓰는 표기를 따르기".
// 낱말표: 고치기 → 수정, 지우기 → 삭제, 다 했어요 → 완료, 넣기 → 추가, 고르기 → 선택, 오늘 쉬기 → 건너뛰기, 다시 켜기 → 되돌리기.
// 통합관리실이 쓴 모듈(web-src/*.js)의 글자는 scripts/words-modules.py로 소스를 직접 바꿨다.
// all: true는 같은 글자가 여러 곳이면 모두 바꾼다(한 곳도 없으면 멈춤)
export default [
  { name: '루틴 창 이름: 루틴 고치기 → 루틴 수정', find: "openSheet({title: id ? '루틴 고치기' : '새 루틴', draw: drawRoutine});", replace: "openSheet({title: id ? '루틴 수정' : '새 루틴', draw: drawRoutine});" },
  { name: '루틴을 다 마친 날: 모두 마쳤어요. 잘하셨어요. → 모두 완료', find: "ICON.check + '모두 마쳤어요. 잘하셨어요.</p>'", replace: "ICON.check + '모두 완료</p>'" },
  { name: '루틴 단계 줄 단추(읽어 주는 이름): 단계 지우기 → 단계 삭제', find: 'aria-label="단계 지우기"', replace: 'aria-label="단계 삭제"' },
  { name: '루틴 단계 체크(읽어 주는 이름): 끝냄으로 표시 → 완료로 표시', find: "aria-label=\"' + esc(r.name) + ' 끝냄으로 표시\"", replace: "aria-label=\"' + esc(r.name) + ' 완료로 표시\"" },
  { name: '루틴 오늘 쉬기 → 건너뛰기, 다시 켜기 → 되돌리기', find: 'data-on="0">다시 켜기</button>', replace: 'data-on="0">되돌리기</button>' },
  { name: '└ 건너뛰기 단추', find: 'data-on="1">오늘 쉬기</button>', replace: 'data-on="1">건너뛰기</button>' },
  { name: '└ 건너뛴 날의 한 줄: 오늘은 쉬어요. → 오늘은 건너뛰어요.', find: '오늘은 쉬어요.</p></div>', replace: '오늘은 건너뛰어요.</p></div>', all: true },
  { name: "루틴 카드: '40분 뒤 시작해요' → '40분 뒤 시작'", find: "untilText((s.next.at - s.nowM) * 60000) + ' 시작해요'", replace: "untilText((s.next.at - s.nowM) * 60000) + ' 시작'" },
  { name: "새 일정 창 시각 칩: 시각이 없으면 '시간 정하기' → '종일'(저장하면 종일 일정)", find: ": '시간 정하기', F.timed)", replace: ": '종일', F.timed)" },
  { name: '└ 시각 칸: 시간 없음 (종일) → 종일', find: '">시간 없음 (종일)</button>', replace: '">종일</button>' },
  { name: '└ 예상 소요시간 → 소요 시간', find: '예상 소요시간', replace: '소요 시간', all: true },
  { name: '검색 칸 안내: 제목·장소·메모로 찾기 → 제목 · 장소 · 메모 검색', find: 'placeholder="제목·장소·메모로 찾기"', replace: 'placeholder="제목 · 장소 · 메모 검색"' },
  { name: '알림: 루틴을 지웠어요. → 루틴을 삭제했어요.', find: "toast('루틴을 지웠어요.'", replace: "toast('루틴을 삭제했어요.'" },
  { name: '데이터 초기화 창 이름', find: "openSheet({title: kind === 'all' ? '처음 상태로 되돌리기' : '모든 일정 지우기',", replace: "openSheet({title: kind === 'all' ? '초기화' : '모든 일정 삭제'," },
  { name: '└ 안내 글', find: "개와 설정이 모두 지워져요. 되돌릴 수 없어요.", replace: "개와 설정이 모두 삭제돼요. 되돌릴 수 없어요." },
  { name: '└ 안내 글(일정만)', find: "개(휴지통 포함)가 모두 지워져요. 되돌릴 수 없어요.", replace: "개(휴지통 포함)가 모두 삭제돼요. 되돌릴 수 없어요." },
  { name: '└ 단추', find: "(kind === 'all' ? '전체 초기화' : '일정 모두 지우기')", replace: "(kind === 'all' ? '초기화' : '모두 삭제')" },
  { name: '└ 다 된 뒤 알림', find: "'처음 상태로 되돌렸어요.' : '일정을 모두 지웠어요.'", replace: "'초기화했어요.' : '일정을 모두 삭제했어요.'" }
];
