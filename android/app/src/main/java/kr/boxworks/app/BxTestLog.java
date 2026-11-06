package kr.boxworks.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 시험판 69(결정 사안 s10 '넣기(휴대폰 안에만, 테스터가 직접 보냄)', 개발 요청함 R-5): 시험 기록.
 * 알람이 울린 시각(예약 시각과 얼마나 어긋났는지) · '확인' · '5분 뒤'를 누른 시각 · 휴대폰이 꺼진 동안 지나간 알람 수만 남긴다.
 * 일정 · 루틴 이름, 장소, 메모는 남기지 않는다(묶음은 알아볼 수 없는 짧은 값으로만). 서버로 보내지 않고,
 * 테스터가 앱의 설정 › 시험 기록에서 직접 보낸다. 30일 · 3000개까지. 잠금을 풀기 전에도 울리므로 기기 보호 저장소에 둔다.
 */
final class BxTestLog {
    private BxTestLog() {}

    private static final String PREFS = "bx_testlog";
    private static final String KEY = "ev";
    private static final int MAX = 3000;
    private static final long KEEP_MS = 30L * 24 * 60 * 60 * 1000;

    private static SharedPreferences prefs(Context c) {
        Context x = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N ? c.createDeviceProtectedStorageContext() : c;
        return x.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** e: fire(울림) · ok(확인) · snooze(5분 뒤) · missed(꺼진 동안 지나감, n = 개수). o: 알람(종류 · 세기 · 예약 시각만 꺼냄) */
    static synchronized void add(Context c, String e, JSONObject o, int n) {
        try {
            long now = System.currentTimeMillis();
            JSONObject x = new JSONObject();
            x.put("t", now);
            x.put("e", e);
            if (n > 0) x.put("n", n);
            if (o != null) {
                String k = o.optString("kind", "");
                if (!k.isEmpty()) x.put("k", k);
                String lv = o.optString("lv", "");
                if (!lv.isEmpty()) x.put("lv", lv);
                long at = o.optLong("at", 0);
                if (at > 0) x.put("at", at);
                // s: 알람 묶음(없으면 알람 id)을 알아볼 수 없는 짧은 값으로 — 울림과 누름을 이름 없이 맞춰 본다
                String id = o.optString("id", "");
                String s = o.optString("series", "");
                if (s.isEmpty()) s = id;
                if (!s.isEmpty()) x.put("s", Integer.toHexString(s.hashCode()));
                if (o.optBoolean("first", false)) x.put("f", 1);
                if (o.optBoolean("local", false)) x.put("l", 1);
                int r = id.lastIndexOf("_r");
                if (r > 0 && r + 2 < id.length() && id.substring(r + 2).matches("\\d{1,2}")) x.put("r", Integer.parseInt(id.substring(r + 2)));
            }
            JSONArray list = load(c), out = new JSONArray();
            for (int i = Math.max(0, list.length() - (MAX - 1)); i < list.length(); i++) {
                JSONObject y = list.optJSONObject(i);
                if (y != null && now - y.optLong("t", 0) <= KEEP_MS) out.put(y);
            }
            out.put(x);
            prefs(c).edit().putString(KEY, out.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    static void add(Context c, String e, JSONObject o) {
        add(c, e, o, 0);
    }

    static synchronized JSONArray load(Context c) {
        try {
            return new JSONArray(prefs(c).getString(KEY, "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    static synchronized void clear(Context c) {
        prefs(c).edit().remove(KEY).apply();
    }

    /** 앱을 처음 설치한 시각(첫 일정 · 첫 루틴까지 걸린 시간을 재려고). 모르면 0 */
    static long installedAt(Context c) {
        try {
            return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).firstInstallTime;
        } catch (Exception e) {
            return 0;
        }
    }
}
