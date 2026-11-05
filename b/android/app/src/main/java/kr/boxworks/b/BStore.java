package kr.boxworks.b;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.UserManager;
import java.util.Iterator;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 모든 저장(SPEC 2절). 기기 보호 저장소에 두어, 휴대폰을 다시 켠 뒤 잠금을 풀기 전에도 알람 목록 · 설정 · 기록을 읽고 쓴다(A의 AlarmStore와 같은 방식).
 * 값은 JSON 글로 둔다. 웹은 다리(BPlugin)로만 읽고 쓴다.
 */
final class BStore {
    private BStore() {}

    static final String PREFS = "b_store";
    static final Object LOCK = new Object();
    static final int LOG_MAX = 500;

    static final String SETTINGS = "settings", OVERRIDES = "overrides", PLACES = "places", KW = "kw", ITEMS = "items", LOG = "log",
        ALARMS = "alarms", LAST_OPEN = "lastOpen", FIRST_RUN_DONE = "firstRunDone", PENDING_SHARE = "pendingShare";

    private static volatile SharedPreferences sp;

    static SharedPreferences prefs(Context c) {
        SharedPreferences p = sp;
        if (p != null) return p;
        Context dp = c.getApplicationContext() != null ? c.getApplicationContext() : c;
        p = dp.createDeviceProtectedStorageContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp = p;
        return p;
    }

    /** 잠금을 한 번이라도 풀었는지(풀기 전에는 캘린더를 읽을 수 없다) */
    static boolean unlocked(Context c) {
        try {
            UserManager um = (UserManager) c.getSystemService(Context.USER_SERVICE);
            return um == null || um.isUserUnlocked();
        } catch (Exception e) {
            return true;
        }
    }

    static JSONObject obj(Context c, String key) {
        synchronized (LOCK) {
            return BJson.parseObj(prefs(c).getString(key, "{}"));
        }
    }

    static JSONArray arr(Context c, String key) {
        synchronized (LOCK) {
            return BJson.parseArr(prefs(c).getString(key, "[]"));
        }
    }

    static void put(Context c, String key, Object json) {
        synchronized (LOCK) {
            prefs(c).edit().putString(key, json == null ? null : json.toString()).apply();
        }
    }

    // ───────── 설정 ─────────

    /** planner.js DEFAULTS와 같은 기본값 */
    static JSONObject defaults() {
        JSONObject d = new JSONObject();
        BJson.put(d, "prepDefault", 30);
        BJson.put(d, "travelDefault", 30);
        BJson.put(d, "buffer", 10);
        BJson.put(d, "heads", 10);
        BJson.put(d, "holdEvery", 3);
        BJson.put(d, "holdMax", 3);
        BJson.put(d, "morningOn", true);
        BJson.put(d, "morningAt", "08:00");
        BJson.put(d, "h24", false);
        BJson.put(d, "calendars", null);
        BJson.put(d, "writeCal", null);
        BJson.put(d, "sound", "alarm");
        BJson.put(d, "remindOwn", true);
        return d;
    }

    private static final String[] NUM_KEYS = { "prepDefault", "travelDefault", "buffer", "heads", "holdEvery", "holdMax" };
    private static final String[] BOOL_KEYS = { "morningOn", "h24", "remindOwn" };

    /** 저장해 둔 설정 + 빠진 값은 기본값 */
    static JSONObject settings(Context c) {
        JSONObject s = obj(c, SETTINGS);
        JSONObject out = defaults();
        for (Iterator<String> it = s.keys(); it.hasNext(); ) {
            String k = it.next();
            BJson.put(out, k, s.opt(k));
        }
        return out;
    }

    /**
     * 화면이 준 설정을 통째로 바꾼다. 숫자 칸에 숫자가 아닌 값, 참 · 거짓 칸에 다른 값은 버려 기본값이 쓰이게 한다
     * (계획 계산이 두 쪽에서 같게 나오도록). 모르는 칸(화면만 쓰는 설정)은 그대로 둔다
     */
    static void setSettings(Context c, JSONObject in) {
        JSONObject s = new JSONObject();
        if (in != null) {
            for (Iterator<String> it = in.keys(); it.hasNext(); ) {
                String k = it.next();
                Object v = in.opt(k);
                if (contains(NUM_KEYS, k)) {
                    if (!(v instanceof Number) || Double.isNaN(((Number) v).doubleValue()) || Double.isInfinite(((Number) v).doubleValue())) continue;
                } else if (contains(BOOL_KEYS, k)) {
                    if (!(v instanceof Boolean)) continue;
                } else if ("morningAt".equals(k) || "sound".equals(k)) {
                    if (!(v instanceof String)) continue;
                } else if ("calendars".equals(k)) {
                    if (!BJson.isNull(v) && !(v instanceof JSONArray)) continue;
                    if (v instanceof JSONArray) {
                        JSONArray a = new JSONArray();
                        for (int i = 0; i < ((JSONArray) v).length(); i++) {
                            Object x = ((JSONArray) v).opt(i);
                            if (x instanceof Number) a.put(BPlanner.jsNum(((Number) x).doubleValue()));
                            else if (x instanceof String) a.put(x);
                        }
                        v = a;
                    }
                } else if ("writeCal".equals(k)) {
                    if (v instanceof Number) v = BPlanner.jsNum(((Number) v).doubleValue());
                    else if (!BJson.isNull(v) && !(v instanceof String)) continue;
                }
                BJson.put(s, k, v);
            }
        }
        put(c, SETTINGS, s);
    }

    private static boolean contains(String[] a, String k) {
        for (String x : a) if (x.equals(k)) return true;
        return false;
    }

    static boolean h24(Context c) {
        return BJson.bool(settings(c), "h24", false);
    }

    // ───────── 기록 ─────────

    /** 기록 한 줄 {key, act, kind?, n?, t}. 최근 500개만 둔다 */
    static void log(Context c, String key, String act, String kind, Double n) {
        synchronized (LOCK) {
            JSONArray a = arr(c, LOG);
            JSONObject e = new JSONObject();
            BJson.put(e, "key", key);
            BJson.put(e, "act", act);
            if (kind != null && !kind.isEmpty()) BJson.put(e, "kind", kind);
            if (n != null && !Double.isNaN(n) && !Double.isInfinite(n)) BJson.put(e, "n", BPlanner.num(n));
            BJson.put(e, "t", System.currentTimeMillis());
            a.put(e);
            if (a.length() > LOG_MAX) {
                JSONArray kept = new JSONArray();
                for (int i = a.length() - LOG_MAX; i < a.length(); i++) kept.put(a.opt(i));
                a = kept;
            }
            put(c, LOG, a);
        }
    }

    // ───────── 그 밖 ─────────

    static void setOff(Context c, String key) {
        synchronized (LOCK) {
            JSONObject ov = obj(c, OVERRIDES);
            JSONObject o = ov.optJSONObject(key);
            if (o == null) o = new JSONObject();
            BJson.put(o, "off", true);
            BJson.put(ov, key, o);
            put(c, OVERRIDES, ov);
        }
    }

    static Long lastOpen(Context c) {
        synchronized (LOCK) {
            long v = prefs(c).getLong(LAST_OPEN, 0);
            return v > 0 ? v : null;
        }
    }

    /** 지난번 연 시각을 돌려주고 지금으로 적는다 */
    static Long opened(Context c) {
        synchronized (LOCK) {
            Long prev = lastOpen(c);
            prefs(c).edit().putLong(LAST_OPEN, System.currentTimeMillis()).apply();
            return prev;
        }
    }

    static boolean firstRunDone(Context c) {
        return prefs(c).getBoolean(FIRST_RUN_DONE, false);
    }

    static void setFirstRunDone(Context c, boolean v) {
        prefs(c).edit().putBoolean(FIRST_RUN_DONE, v).apply();
    }

    static void setPendingShare(Context c, String text) {
        synchronized (LOCK) {
            prefs(c).edit().putString(PENDING_SHARE, text).apply();
        }
    }

    /** 다른 앱에서 공유해 들어온 글(읽으면 지운다) */
    static String takePendingShare(Context c) {
        synchronized (LOCK) {
            String s = prefs(c).getString(PENDING_SHARE, null);
            if (s != null) prefs(c).edit().remove(PENDING_SHARE).apply();
            return s;
        }
    }
}
