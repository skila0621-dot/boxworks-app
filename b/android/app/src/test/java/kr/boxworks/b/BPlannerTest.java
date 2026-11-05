package kr.boxworks.b;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

/**
 * 휴대폰 쪽 계획 계산(BPlanner)이 웹 기준 구현(web/js/planner.js)과 같은 답을 내는지: ../../vectors/planner.json의 모든 경우.
 * 시험표는 tests/make-vectors.mjs가 planner.js로 만든다. 앱과 같은 길(org.json → BJson → BPlanner.input)로 읽는다.
 * ./gradlew testDebugUnitTest (작업 폴더는 b/android/app)
 */
public class BPlannerTest {

    private static File vectorsFile() {
        File f = new File("../../vectors/planner.json");
        if (f.isFile()) return f;
        File found = VectorCheck.find();
        assertNotNull("vectors/planner.json을 찾지 못했어요(작업 폴더 " + new File(".").getAbsolutePath() + ")", found);
        return found;
    }

    private static JSONObject load() throws Exception {
        return new JSONObject(new String(Files.readAllBytes(vectorsFile().toPath()), StandardCharsets.UTF_8));
    }

    @Test
    public void allVectorsMatchPlannerJs() throws Exception {
        JSONArray vectors = load().getJSONArray("vectors");
        assertTrue("시험표가 비었어요", vectors.length() > 0);
        List<String> fails = new ArrayList<>();
        for (int i = 0; i < vectors.length(); i++) {
            JSONObject v = vectors.getJSONObject(i);
            Map<String, Object> plain = BJson.map(v);
            List<String> errs = VectorCheck.check(plain);
            if (!errs.isEmpty()) fails.add(v.getString("name") + ": " + errs);
        }
        if (!fails.isEmpty()) fail(fails.size() + "/" + vectors.length() + " 틀림\n" + String.join("\n", fails));
    }

    /** 칸 하나하나(시험표가 적어 둔 것 모두)를 따로 확인: 틀리면 어느 칸인지 바로 보이게 */
    @Test
    public void everyExpectedFieldAndAlarm() throws Exception {
        JSONArray vectors = load().getJSONArray("vectors");
        int fields = 0, alarms = 0;
        for (int i = 0; i < vectors.length(); i++) {
            JSONObject v = vectors.getJSONObject(i);
            String name = v.getString("name");
            BPlanner.Input in = BPlanner.input(BJson.map(v.getJSONObject("input")));
            List<BPlanner.Entry> entries = BPlanner.plan(in);
            List<BPlanner.Alarm> got = BPlanner.alarms(entries, in);
            JSONArray we = v.getJSONObject("expect").getJSONArray("entries");
            assertEquals(name + " 항목 수", we.length(), entries.size());
            for (int j = 0; j < we.length(); j++) {
                JSONObject want = we.getJSONObject(j);
                Map<String, Object> g = entries.get(j).toMap();
                for (String k : VectorCheck.FIELDS) {
                    Object w = BJson.plain(want.opt(k));
                    Object a = g.get(k);
                    if ("tight".equals(k) && a instanceof Map) {
                        Map<?, ?> t = (Map<?, ?>) a;
                        java.util.LinkedHashMap<String, Object> gt = new java.util.LinkedHashMap<>();
                        gt.put("key", t.get("key"));
                        gt.put("minutes", t.get("minutes"));
                        a = gt;
                    }
                    assertTrue(name + " 항목 " + j + " " + k + ": " + a + " (기대 " + w + ")", VectorCheck.same(w, a));
                    fields++;
                }
            }
            JSONArray wa = v.getJSONObject("expect").getJSONArray("alarms");
            assertEquals(name + " 알람 수", wa.length(), got.size());
            for (int j = 0; j < wa.length(); j++) {
                Object w = BJson.plain(wa.getJSONObject(j));
                assertTrue(name + " 알람 " + j + ": " + got.get(j).toMap() + " (기대 " + w + ")", VectorCheck.same(w, got.get(j).toMap()));
                alarms++;
            }
        }
        assertTrue(fields > 0 && alarms > 0);
    }

    @Test
    public void helpers() {
        BPlanner.Entry e = new BPlanner.Entry();
        e.buffer = 10;
        e.snoozed = 0;
        assertEquals(5.0, BPlanner.snoozeLeft(e), 0);
        e.snoozed = 5;
        assertEquals(3.0, BPlanner.snoozeLeft(e), 0);
        e.snoozed = 8;
        assertEquals(1.0, BPlanner.snoozeLeft(e), 0);
        e.snoozed = 9;
        assertEquals(1.0, BPlanner.snoozeLeft(e), 0);
        e.snoozed = 10;
        assertEquals(0.0, BPlanner.snoozeLeft(e), 0);
        e.start = 100 * BPlanner.MIN;
        e.prep = 30;
        e.travel = 30;
        assertEquals(0.0, BPlanner.lateIfStartNow(e, 40 * BPlanner.MIN), 0);
        assertEquals(5.0, BPlanner.lateIfStartNow(e, 41 * BPlanner.MIN), 0);
        assertEquals(10.0, BPlanner.lateIfLeaveNow(e, 76 * BPlanner.MIN), 0);
        assertEquals("치과", BPlanner.normTitle("  치과 3시!! "));
        assertEquals("강남역 3번 출구", BPlanner.normPlace("  강남역　 3번   출구 "));
        assertTrue(BPlanner.isOnline("Google Meet"));
    }
}
