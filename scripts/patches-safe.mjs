// 시험판 29: 자료 지키기(「박스웍스 자료실」 '문제점 점검' 기술 4·5·9·13).
// 저장이 실패하면 크게 알리고, 깨진 자료는 덮어쓰지 않고 따로 두고, 백업 불러오기는 한 번에 저장한다.
export default [
  {
    name: '자료 지키기 · 저장했는지 결과를 돌려준다',
    find: "function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }",
    replace: "function lsSet(k, v){ try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }"
  },
  {
    name: '└ 저장 공간이 가득 차 저장하지 못하면 위쪽 띠로 알린다(전에는 \'추가했어요\'만 뜨고 사라졌음)',
    find: "function saveLocal(){ lsSet('bx:data', JSON.stringify(Array.from(server.entries()))); }",
    replace: [
      "let bxSaveHold = 0, bxSavePend = false, bxSaveBad = false, bxNoSave = false, bxLoadBroken = '';",
      "function saveLocal(){",
      "  if (bxNoSave) return;",
      "  if (bxSaveHold) { bxSavePend = true; return; }",
      "  const ok = lsSet('bx:data', JSON.stringify(Array.from(server.entries())));",
      "  if (!ok && !bxSaveBad) { bxSaveBad = true; showBanner('저장 공간이 가득 차 방금 바꾼 내용을 저장하지 못했어요. 휴지통을 비우거나, 설정 › 백업에서 백업 파일을 만들어 두세요.'); toast('저장하지 못했어요. 저장 공간이 가득 찼어요.'); }",
      "  else if (ok && bxSaveBad) { bxSaveBad = false; showBanner(''); }",
      "}"
    ].join('\n')
  },
  {
    name: '└ 저장된 자료를 읽지 못하면 지우지 않고 따로 둔다(전에는 빈 자료로 덮어썼음)',
    find: "function loadLocal(){ try { const raw = lsGet('bx:data'); if (raw) JSON.parse(raw).forEach(p => server.set(p[0], p[1])); } catch (e) {} }",
    replace: [
      "function loadLocal(){",
      "  const raw = lsGet('bx:data');",
      "  if (!raw) return;",
      "  try { JSON.parse(raw).forEach(p => server.set(p[0], p[1])); }",
      "  catch (e) {",
      "    server.clear();",
      "    const key = !lsGet('bx:data.broken') ? 'bx:data.broken' : !lsGet('bx:data.broken2') ? 'bx:data.broken2' : '';",
      "    if (key && lsSet(key, raw)) bxLoadBroken = 'kept';",
      "    else { bxNoSave = true; bxLoadBroken = 'locked'; }",
      "    setTimeout(() => showBanner(bxLoadBroken === 'kept'",
      "      ? '저장된 자료를 읽지 못해 따로 보관해 두었어요. 백업 파일이 있으면 설정 › 백업에서 불러와 주세요.'",
      "      : '저장된 자료를 읽지 못했어요. 자료를 지키려고 지금은 저장하지 않아요. 앱을 지우지 말고 문의해 주세요.'), 0);",
      "  }",
      "}"
    ].join('\n')
  },
  {
    name: '└ 백업 글 만들기를 함수 하나로(내보내기와 자동 시험이 같이 쓴다)',
    find: "function exportJson(){ offerFile('boxworks-backup-' + M.today.replace(/-/g, '') + '.json', JSON.stringify({app: 'boxworks', version: 2, exportedAt: nowIso(), items: Array.from(allDocs().entries()).map(([id, d]) => Object.assign({id}, d))}, null, 2)); }",
    replace: "function bxBackupText(){ return JSON.stringify({app: 'boxworks', version: 2, exportedAt: nowIso(), items: Array.from(allDocs().entries()).map(([id, d]) => Object.assign({id}, d))}, null, 2); }\nfunction exportJson(){ offerFile('boxworks-backup-' + M.today.replace(/-/g, '') + '.json', bxBackupText()); }"
  },
  {
    name: '└ 백업 불러오기는 다 넣은 뒤 한 번만 저장(전에는 문서마다 전체를 다시 저장해 큰 백업에서 화면이 멈췄음)',
    find: "  for (const x of items) { const d = Object.assign({}, x); delete d.id; writeDoc(x.id, d); }",
    replace: "  bxSaveHold++;\n  try { for (const x of items) { const d = Object.assign({}, x); delete d.id; writeDoc(x.id, d); } }\n  finally { bxSaveHold--; if (bxSavePend) { bxSavePend = false; saveLocal(); } }"
  },
  {
    name: '└ 백업 불러오기에 명상 기록(medlog)도(전에는 내보내기만 하고 불러오지 않았음)',
    find: "'tt', 'travelmem', 'pcx'].includes(x.type)",
    replace: "'tt', 'travelmem', 'pcx', 'medlog'].includes(x.type)"
  },
  {
    name: '└ 처음 상태로 되돌리기에 명상 기록도',
    find: "d.type === 'tt' || d.type === 'travelmem' || d.type === 'pcx' || id === 'settings'",
    replace: "d.type === 'tt' || d.type === 'travelmem' || d.type === 'pcx' || d.type === 'medlog' || id === 'settings'"
  },
  {
    name: '└ 처음 상태로 되돌리면 휴대폰 캘린더 사본과 설정도 지운다(남의 일정이 남아 있었음)',
    find: "    ['bx:side', 'bx:widget', 'bx:theme', 'bx:accent', 'bx:fired'].forEach(k => lsSet(k, ''));",
    replace: "    ['bx:side', 'bx:widget', 'bx:theme', 'bx:accent', 'bx:fired'].forEach(k => lsSet(k, ''));\n    ['bx:pcache', 'bx:pcal'].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });\n    try { PC.events = null; PC.at = 0; } catch (e) {}"
  }
];
