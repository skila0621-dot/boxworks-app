#!/usr/bin/env python3
"""루틴 아이콘 모음(대표 요청 2026-10-31)을 한 곳에서 만든다.
- web-src/icons.js: 화면용 SVG와 이름으로 아이콘 고르는 규칙
- android/app/src/main/res/drawable/ic_rt_*.xml: 잠금 화면 알람용 같은 모양의 벡터
모양은 24x24 칸에 선(1.8)으로 그린다. 박스웍스 기존 아이콘과 같은 방식.
쓰는 법: python3 scripts/gen-icons.py
"""
import json, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# 이름, 고르기 창에 보일 말, 모양(p: 패스, c: 원 cx cy r, r: 둥근 사각형 x y w h rx)
ICONS = [
  ('book', '책', [('p', 'M4 5.5c2.6-1.1 5.3-1 8 1 2.7-2 5.4-2.1 8-1v13c-2.6-1.1-5.3-1-8 1-2.7-2-5.4-2.1-8-1z'), ('p', 'M12 6.5v13')]),
  ('pencil', '공부', [('p', 'M15.5 4.5l4 4L9 19H5v-4z'), ('p', 'M13 7l4 4')]),
  ('dumbbell', '운동', [('p', 'M3.5 10v4'), ('p', 'M6.5 7.5v9'), ('p', 'M17.5 7.5v9'), ('p', 'M20.5 10v4'), ('p', 'M6.5 12h11')]),
  ('walk', '걷기', [('c', 13, 4.5, 1.8), ('p', 'M10 21l2-6 2.5 2.5V21'), ('p', 'M12 15l.8-5.5L9 11l-1.5 3'), ('p', 'M12.8 9.5l2.2 3 2.5.5')]),
  ('yoga', '명상', [('c', 12, 5.5, 2), ('p', 'M12 9v5'), ('p', 'M6.5 11.5L12 10l5.5 1.5'), ('p', 'M4.5 19c2.3-1.6 4.8-2.3 7.5-2.3s5.2.7 7.5 2.3'), ('p', 'M8 16.5l4-2.5 4 2.5')]),
  ('pill', '약', [('p', 'M5.6 14.9l9.3-9.3a3.5 3.5 0 0 1 5 5l-9.3 9.3a3.5 3.5 0 0 1-5-5z'), ('p', 'M10.2 10.3l5 5')]),
  ('sun', '기상', [('c', 12, 12, 4), ('p', 'M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4')]),
  ('moon', '잠', [('p', 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z')]),
  ('drop', '씻기', [('p', 'M12 3.5c3.2 4.1 5.5 7.2 5.5 10.2a5.5 5.5 0 0 1-11 0c0-3 2.3-6.1 5.5-10.2z')]),
  ('tooth', '양치', [('p', 'M8 4c-2.4 0-3.8 1.9-3.8 4.3 0 2.8 1.4 3.9 1.9 6.8.4 2.4.9 5.4 2.4 5.4s1.4-3.8 3.5-3.8 2 3.8 3.5 3.8 2-3 2.4-5.4c.5-2.9 1.9-4 1.9-6.8C19.8 5.9 18.4 4 16 4c-1.5 0-2.5 1-4 1S9.5 4 8 4z')]),
  ('shirt', '옷', [('p', 'M8.5 4L4 6.8l1.8 3.6 2.2-1V20h8V9.4l2.2 1L20 6.8 15.5 4c-.6 1.4-2 2.3-3.5 2.3S9.1 5.4 8.5 4z')]),
  ('meal', '식사', [('p', 'M7 3v7.5a2 2 0 0 0 2 2V21'), ('p', 'M5 3v5'), ('p', 'M11 3v5'), ('p', 'M5 8h6'), ('p', 'M17 21V3c-2.2 1.5-3.3 4.2-3.3 7.4 0 1.5 1.1 2.6 3.3 2.6')]),
  ('cup', '물·커피', [('p', 'M5 8.5h11.5v5.5a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-5-5z'), ('p', 'M16.5 10H18a2.5 2.5 0 0 1 0 5h-1.5'), ('p', 'M8.5 3.5v2'), ('p', 'M12 3.5v2')]),
  ('home', '집안일', [('p', 'M4 11.5L12 5l8 6.5'), ('p', 'M6.5 10v10h11V10'), ('p', 'M10 20v-5h4v5')]),
  ('washer', '빨래', [('r', 4.5, 3.5, 15, 17, 2.5), ('c', 12, 13, 4), ('p', 'M8 7h.01'), ('p', 'M11 7h3')]),
  ('trash', '분리수거', [('p', 'M4 7h16'), ('p', 'M10 11v6M14 11v6'), ('p', 'M5.5 7l1 12.5h11l1-12.5'), ('p', 'M9 7V4h6v3')]),
  ('plant', '화분', [('p', 'M12 20v-8'), ('p', 'M12 12c0-4 3-7 7-7 0 4-3 7-7 7z'), ('p', 'M12 14.5c0-3-2.5-5-6-5 0 3 2.5 5 6 5z'), ('p', 'M8 20h8')]),
  ('bag', '짐 챙기기', [('r', 4.5, 8, 15, 12, 2.5), ('p', 'M9 8V6.5a3 3 0 0 1 6 0V8'), ('p', 'M4.5 12.5h15')]),
  ('briefcase', '출근·일', [('r', 3.5, 7.5, 17, 12, 2.5), ('p', 'M9 7.5v-2A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2'), ('p', 'M3.5 12.5h17')]),
  ('school', '학교·학원', [('p', 'M3 9l9-4.5L21 9l-9 4.5z'), ('p', 'M7 11v4.5c1.4 1.3 3 2 5 2s3.6-.7 5-2V11'), ('p', 'M21 9v5')]),
  ('car', '이동', [('p', 'M5 16.5v-4l2-5h10l2 5v4'), ('p', 'M4 12.5h16'), ('p', 'M4 16.5h16v2H4z'), ('c', 8, 18.5, 1.2), ('c', 16, 18.5, 1.2)]),
  ('cart', '장보기', [('p', 'M3.5 4.5h2l2.2 10.5h10.3l2-7.5H6.6'), ('c', 9, 19, 1.3), ('c', 17, 19, 1.3)]),
  ('phoneoff', '휴대폰 내려놓기', [('r', 7, 3, 10, 18, 2.5), ('p', 'M4 4l16 16')]),
  ('music', '악기·음악', [('p', 'M9 18.5V6l10-2v12.5'), ('c', 6.5, 18.5, 2.5), ('c', 16.5, 16.5, 2.5)]),
  ('laptop', '컴퓨터', [('r', 5, 5, 14, 10, 1.5), ('p', 'M3 18.5h18')]),
  ('pet', '반려동물', [('c', 7, 9, 1.6), ('c', 10.5, 6, 1.6), ('c', 13.5, 6, 1.6), ('c', 17, 9, 1.6), ('p', 'M12 11.5c-2.5 0-5 3-5 5.3 0 1.6 1.3 2.4 2.6 2.4 1 0 1.6-.6 2.4-.6s1.4.6 2.4.6c1.3 0 2.6-.8 2.6-2.4 0-2.3-2.5-5.3-5-5.3z')]),
  ('heart', '건강·병원', [('p', 'M12 20s-7.5-4.6-7.5-10a4.3 4.3 0 0 1 7.5-2.8A4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z')]),
  ('loop', '루틴', [('p', 'M4.5 11a7.5 7.5 0 0 1 13-4.6L19.5 8.5'), ('p', 'M19.5 4v4.5H15'), ('p', 'M19.5 13a7.5 7.5 0 0 1-13 4.6L4.5 15.5'), ('p', 'M4.5 20v-4.5H9')]),
]

# 이름(루틴·단계)으로 고르는 규칙. 위에서부터 먼저 맞는 것
RULES = [
  ('phoneoff', r'(휴대폰|핸드폰|폰|스마트폰)\s*(내려|멀리|끄|치우|놓)|디지털\s*디톡스'),
  ('pill', r'약(?!속)|영양제|비타민|복용|유산균'),
  ('tooth', r'양치|치실|이\s*닦'),
  ('book', r'(?<!산)책(?!상)|독서|읽기|읽어|읽는|성경|신문'),
  ('pencil', r'공부|학습|과제|숙제|복습|예습|시험|문제\s*풀|단어|암기|필기|노트|강의\s*듣'),
  ('dumbbell', r'운동|헬스|근력|웨이트|스쿼트|푸시업|팔굽|플랭크|홈트|피티|PT'),
  ('yoga', r'명상|요가|스트레칭|호흡|필라테스|마음\s*챙김'),
  ('pet', r'강아지|반려|고양이|개\s*산책|밥\s*주기\s*\(?(강아지|고양이)'),
  ('walk', r'러닝|달리기|조깅|산책|걷기|만보|등산|자전거|뛰기'),
  ('sun', r'기상|일어나|일어났|기지개|커튼|햇빛'),
  ('moon', r'취침|잠자리|수면|자기\s*전|잠들|눕기|누워'),
  ('drop', r'씻|샤워|세수|목욕|머리\s*감|스킨|로션|화장'),
  ('shirt', r'옷|복장|갈아입|단장'),
  ('cup', r'물\s*마|물마시|커피|차\s*마시|티타임'),
  ('meal', r'먹|식사|밥|점심|저녁|아침\s*식|간식|요리|도시락|식단'),
  ('washer', r'빨래|세탁|건조기|널기|개기'),
  ('trash', r'분리수거|쓰레기|음식물'),
  ('plant', r'화분|식물|물\s*주기|물주기'),
  ('home', r'청소|정리|설거지|집안일|환기|침구|이불|정돈'),
  ('bag', r'짐|가방|챙기'),
  ('briefcase', r'출근|회사|업무|회의|일하|근무|사무|퇴근'),
  ('school', r'등교|학교|학원|수업|강의|과외'),
  ('car', r'출발|이동|운전|버스|지하철|통근|나가|외출'),
  ('cart', r'장보기|마트|쇼핑|구매|장\s*보'),
  ('music', r'악기|피아노|기타|노래|연주|음악|바이올린|드럼'),
  ('laptop', r'코딩|컴퓨터|메일|글쓰기|블로그|작업|개발|일기'),
  ('heart', r'병원|진료|건강|혈압|체중|혈당'),
]

def rect_path(x, y, w, h, r):
    return 'M%g %gh%ga%g %g 0 0 1 %g %gv%ga%g %g 0 0 1 %g %gh%ga%g %g 0 0 1 %g %gv%ga%g %g 0 0 1 %g %gz' % (
        x + r, y, w - 2 * r, r, r, r, r, h - 2 * r, r, r, -r, r, -(w - 2 * r), r, r, -r, -r, -(h - 2 * r), r, r, r, -r)

def circle_path(cx, cy, r):
    return 'M%g %ga%g %g 0 1 0 %g 0a%g %g 0 1 0 %g 0z' % (cx - r, cy, r, r, 2 * r, r, r, -2 * r)

def paths(shapes):
    out = []
    for s in shapes:
        if s[0] == 'p': out.append(s[1])
        elif s[0] == 'c': out.append(circle_path(*s[1:]))
        elif s[0] == 'r': out.append(rect_path(*s[1:]))
    return out

def svg(shapes):
    return '<svg class="i" viewBox="0 0 24 24">' + ''.join('<path d="%s"/>' % d for d in paths(shapes)) + '</svg>'

js = ['/* 루틴 아이콘(대표 요청 2026-10-31). scripts/gen-icons.py가 만든 파일이라 직접 고치지 않는다.',
      '   bxIconFor(이름): 루틴·단계 이름으로 아이콘 이름을 고른다. 못 고르면 null */',
      'const BX_ICONS = ' + json.dumps({k: svg(v) for k, _, v in ICONS}, ensure_ascii=False, indent=0) + ';',
      'const BX_ICON_LABELS = ' + json.dumps({k: label for k, label, _ in ICONS}, ensure_ascii=False) + ';',
      'const BX_ICON_RULES = [' + ', '.join('[%s, /%s/i]' % (json.dumps(k), rx) for k, rx in RULES) + '];',
      'function bxIconFor(name){ const s = String(name || ""); for (const [k, rx] of BX_ICON_RULES) if (rx.test(s)) return k; return null; }',
      '']
open(os.path.join(ROOT, 'web-src', 'icons.js'), 'w', encoding='utf-8').write('\n'.join(js))

dr = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable')
for k, _, shapes in ICONS:
    body = ''.join('\n    <path android:fillColor="#00000000" android:strokeColor="#FFFFFF" android:strokeWidth="1.8" android:strokeLineCap="round" android:strokeLineJoin="round"\n        android:pathData="%s" />' % d for d in paths(shapes))
    xml = '<?xml version="1.0" encoding="utf-8"?>\n<!-- scripts/gen-icons.py가 만든 파일 -->\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">' + body + '\n</vector>\n'
    open(os.path.join(dr, 'ic_rt_%s.xml' % k), 'w', encoding='utf-8').write(xml)
print('아이콘 %d개, 규칙 %d개' % (len(ICONS), len(RULES)))
