package kr.boxworks.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.Set;

/**
 * 휴대폰 안에 예약한 알람 목록. 박스웍스 화면이 계산한 목록을 그대로 받아 예약하고,
 * 재부팅·업데이트 뒤 다시 예약할 수 있게 저장해 둔다. 서버는 쓰지 않는다(D-02).
 */
public final class AlarmStore {
    static final String PREFS = "bx_alarms";
    static final String KEY = "list";
    /** '확인'·'5분 뒤'를 누른 알람 묶음(series → 누른 시각). 남은 다시 알림을 다시 예약하지 않으려고 사흘 동안 기억한다. */
    static final String KEY_DONE = "done";
    /** '확인'이나 '5분 뒤'를 누른 묶음. 다시 알림을 다시 예약하지 않는 데 쓴다 */
    static final String KEY_HUSH = "hush";
    private static final long DONE_KEEP_MS = 3L * 24 * 3600 * 1000;
    static final String EXTRA_ID = "bx_id";
    static final String EXTRA_TITLE = "bx_title";
    static final String EXTRA_BODY = "bx_body";
    static final String EXTRA_AT = "bx_at";
    static final String EXTRA_JSON = "bx_json";
    private static final String ACTION_PREFIX = "kr.boxworks.app.ALARM.";

    private AlarmStore() {}

    static synchronized JSONArray load(Context c) {
        try {
            return new JSONArray(prefs(c).getString(KEY, "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static synchronized void save(Context c, JSONArray list) {
        prefs(c).edit().putString(KEY, list.toString()).apply();
    }

    static JSONObject loadDone(Context c) {
        return loadMap(c, KEY_DONE);
    }

    private static JSONObject loadMap(Context c, String key) {
        try {
            return new JSONObject(prefs(c).getString(key, "{}"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    /** 사흘 넘은 것은 지우고 series를 지금 시각으로 적는다 */
    private static void mark(Context c, String key, String series, long now) {
        JSONObject m = loadMap(c, key);
        JSONObject kept = new JSONObject();
        try {
            for (java.util.Iterator<String> it = m.keys(); it.hasNext(); ) {
                String k = it.next();
                long t = m.optLong(k, 0);
                if (now - t < DONE_KEEP_MS) kept.put(k, t);
            }
            kept.put(series, now);
        } catch (Exception ignored) {
        }
        prefs(c).edit().putString(key, kept.toString()).apply();
    }

    /**
     * 알람에서 '확인'(ok=true)이나 '5분 뒤'(ok=false)를 눌렀을 때. 같은 묶음(series)의 남은 다시 알림을 지우고,
     * 화면이 같은 목록을 다시 보내도 예약하지 않게 기억한다. 5분 뒤 알람(local)은 그대로 둔다.
     * '확인'만 따로 적어 두어, 앱이 그 루틴 단계를 '했어요'로 옮긴다.
     */
    static synchronized void confirm(Context c, JSONObject alarm, boolean ok) {
        String series = alarm == null ? "" : alarm.optString("series", "");
        if (series.isEmpty()) return;
        long now = System.currentTimeMillis();
        mark(c, KEY_HUSH, series, now);
        if (ok) mark(c, KEY_DONE, series, now);
        // 이미 울려 알림줄에 남은 같은 묶음의 알림도 지운다(처음 것과 다시 알림 1~12번)
        AlarmNotify.dismiss(c, series);
        for (int j = 1; j <= 12; j++) AlarmNotify.dismiss(c, series + "_r" + j);
        JSONArray prev = load(c);
        JSONArray stored = new JSONArray();
        for (int i = 0; i < prev.length(); i++) {
            JSONObject o = prev.optJSONObject(i);
            if (o == null) continue;
            if (series.equals(o.optString("series")) && !o.optBoolean("local", false)) cancel(c, o.optString("id"));
            else stored.put(o);
        }
        save(c, stored);
    }

    /** 루틴이 끝난 뒤 확인: 목록(s: 묶음, n: 단계 이름) 가운데 아직 확인하지 않은 단계 이름 */
    static java.util.List<String> unconfirmed(Context c, JSONArray check) {
        java.util.List<String> out = new java.util.ArrayList<>();
        if (check == null) return out;
        JSONObject done = loadDone(c);
        for (int i = 0; i < check.length(); i++) {
            JSONObject o = check.optJSONObject(i);
            if (o != null && !done.has(o.optString("s"))) out.add(o.optString("n"));
        }
        return out;
    }

    /** 화면에서 받은 목록으로 바꾼다. 앱이 직접 만든 알람(5분 뒤, 시험)은 남긴다. 이미 확인한 묶음은 뺀다. */
    static synchronized int replaceAll(Context c, JSONArray incoming) {
        long now = System.currentTimeMillis();
        JSONObject done = loadMap(c, KEY_HUSH);
        JSONArray next = new JSONArray();
        for (int i = 0; i < incoming.length(); i++) {
            JSONObject o = incoming.optJSONObject(i);
            if (o == null) continue;
            String series = o.optString("series", "");
            if (!series.isEmpty() && done.has(series)) continue;
            next.put(o);
        }
        JSONArray prev = load(c);
        Set<String> nextIds = new HashSet<>();
        for (int i = 0; i < next.length(); i++) {
            JSONObject o = next.optJSONObject(i);
            if (o != null) nextIds.add(o.optString("id"));
        }
        JSONArray stored = new JSONArray();
        for (int i = 0; i < prev.length(); i++) {
            JSONObject o = prev.optJSONObject(i);
            if (o == null) continue;
            String id = o.optString("id");
            if (o.optBoolean("local", false) && o.optLong("at", 0) > now) {
                stored.put(o);
            } else if (!nextIds.contains(id)) {
                cancel(c, id);
            }
        }
        int count = 0;
        for (int i = 0; i < next.length(); i++) {
            JSONObject o = next.optJSONObject(i);
            if (o == null) continue;
            long at = o.optLong("at", 0);
            String id = o.optString("id");
            if (id.isEmpty() || at <= now) continue;
            schedule(c, o);
            stored.put(o);
            count++;
        }
        save(c, stored);
        return count;
    }

    /** 앱이 직접 만드는 알람(5분 뒤, 시험). 화면 목록이 바뀌어도 지워지지 않는다. */
    static synchronized void addLocal(Context c, JSONObject o) {
        String id = o.optString("id");
        JSONArray prev = load(c);
        JSONArray stored = new JSONArray();
        for (int i = 0; i < prev.length(); i++) {
            JSONObject p = prev.optJSONObject(i);
            if (p != null && !id.equals(p.optString("id"))) stored.put(p);
        }
        try {
            o.put("local", true);
        } catch (Exception ignored) {
        }
        stored.put(o);
        save(c, stored);
        schedule(c, o);
    }

    static synchronized void remove(Context c, String id) {
        if (id == null) return;
        JSONArray prev = load(c);
        JSONArray stored = new JSONArray();
        for (int i = 0; i < prev.length(); i++) {
            JSONObject o = prev.optJSONObject(i);
            if (o != null && !id.equals(o.optString("id"))) stored.put(o);
        }
        save(c, stored);
    }

    /** 재부팅·앱 업데이트·시간 변경 뒤 저장해 둔 알람을 다시 예약한다. */
    static synchronized void rescheduleAll(Context c) {
        long now = System.currentTimeMillis();
        JSONArray prev = load(c);
        JSONArray stored = new JSONArray();
        for (int i = 0; i < prev.length(); i++) {
            JSONObject o = prev.optJSONObject(i);
            if (o == null) continue;
            long at = o.optLong("at", 0);
            if (at <= now) continue;
            schedule(c, o);
            stored.put(o);
        }
        save(c, stored);
    }

    private static Intent fireIntent(Context c, String id) {
        Intent i = new Intent(c, AlarmReceiver.class);
        i.setAction(ACTION_PREFIX + id);
        return i;
    }

    static void schedule(Context c, JSONObject o) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        String id = o.optString("id");
        long at = o.optLong("at", 0);
        Intent i = fireIntent(c, id);
        i.putExtra(EXTRA_ID, id);
        i.putExtra(EXTRA_AT, at);
        i.putExtra(EXTRA_TITLE, o.optString("title"));
        i.putExtra(EXTRA_BODY, o.optString("body"));
        i.putExtra(EXTRA_JSON, o.toString());
        PendingIntent fire = PendingIntent.getBroadcast(c, id.hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        boolean exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
        try {
            if ("report".equals(o.optString("kind"))) {
                // 아침 보고는 알람이 아니라 알림이라 상태 표시줄의 '다음 알람'에 넣지 않는다
                if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
                else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
            } else if (exact) {
                Intent open = new Intent(c, MainActivity.class);
                PendingIntent show = PendingIntent.getActivity(c, 0, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), fire);
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
        }
    }

    static void cancel(Context c, String id) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, id.hashCode(), fireIntent(c, id),
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) {
            if (am != null) am.cancel(pi);
            pi.cancel();
        }
    }
}
