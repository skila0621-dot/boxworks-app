// 시험판 42(대표 요청 11/3 18:15 · 정할 것 17번): 일정 첨부(사진 · 파일). 화면 쪽 코드는 web-src/v42.js, 휴대폰 쪽은 BxAttachPlugin.java
export default [
  {
    name: '일정 줄: 첨부가 있으면 📎 개수(장소 다음)',
    find: "  if (it.location) meta.push('<span class=\"meta\">' + ICON.pin + esc(it.location) + '</span>');",
    replace: "  if (it.location) meta.push('<span class=\"meta\">' + ICON.pin + esc(it.location) + '</span>');\n  if (window.BX_APP && it.att && it.att.length) meta.push(bxAttMeta(it));"
  },
  {
    name: '백업 불러오기: json과 zip(첨부 포함 백업) 둘 다 고를 수 있게',
    find: 'accept=".json,application/json" class="sr"',
    replace: 'accept=".json,.zip,application/json,application/zip" class="sr"'
  }
];
