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

    /** 화면에서 받은 목록으로 바꾼다. 앱이 직접 만든 알람(5분 뒤, 시험)은 남긴다. */
    static synchronized int replaceAll(Context c, JSONArray next) {
        long now = System.currentTimeMillis();
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
            if (exact) {
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
