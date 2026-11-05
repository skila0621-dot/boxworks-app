package kr.boxworks.b;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 알람 예약(SPEC 4절). 강한 알람은 setAlarmClock(시계 앱처럼 '다음 알람'에 보임), 약한 알람은 setExactAndAllowWhileIdle
 * (정확한 알람 권한이 없으면 setAndAllowWhileIdle). 지금 걸어 둔 목록은 저장해 두어 취소 · 재부팅 뒤 다시 걸기에 쓴다.
 * 목록 한 줄: {id, key, kind, at, strong, hold?, test?, e(약속 요약: 잠금을 풀기 전에도 글을 만들 수 있게)}
 */
final class BScheduler {
    private BScheduler() {}

    static final String ACTION_PREFIX = "kr.boxworks.b.ALARM.";
    static final String ACTION_TICK = "kr.boxworks.b.TICK";
    static final String EXTRA_JSON = "b_alarm";

    static JSONArray list(Context c) {
        return BStore.arr(c, BStore.ALARMS);
    }

    static void save(Context c, JSONArray a) {
        BStore.put(c, BStore.ALARMS, a);
    }

    static int count(Context c) {
        return list(c).length();
    }

    static boolean exactOk(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            return am != null && am.canScheduleExactAlarms();
        } catch (Exception e) {
            return false;
        }
    }

    private static Intent fireIntent(Context c, String id) {
        Intent i = new Intent(c, BAlarmReceiver.class);
        i.setAction(ACTION_PREFIX + id);
        return i;
    }

    /** AlarmManager에 건다(같은 id면 바꿔 건다) */
    static void set(Context c, JSONObject a) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        String id = BJson.str(a, "id", "");
        if (id.isEmpty()) return;
        long at = BJson.lng(a, "at", 0);
        Intent i = fireIntent(c, id);
        i.putExtra(EXTRA_JSON, a.toString());
        PendingIntent fire = PendingIntent.getBroadcast(c, id.hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        boolean exact = exactOk(c);
        try {
            if (BJson.bool(a, "strong", false)) {
                if (exact) {
                    Intent open = new Intent(c, MainActivity.class);
                    PendingIntent show = PendingIntent.getActivity(c, 0, open,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), fire);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
                }
            } else if (exact) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
            }
        } catch (SecurityException e) {
            try {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, fire);
            } catch (Exception ignored) {
            }
        } catch (IllegalStateException e) {
            // 앱 하나가 걸 수 있는 알람(500개)을 넘었다. 나머지는 계속한다
        }
    }

    /** AlarmManager에서 뺀다 */
    static void unset(Context c, String id) {
        if (id == null || id.isEmpty()) return;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, id.hashCode(), fireIntent(c, id),
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) {
            if (am != null) am.cancel(pi);
            pi.cancel();
        }
    }

    /** 걸고 목록에 넣는다(같은 id는 바꾼다) */
    static void add(Context c, JSONObject a) {
        synchronized (BStore.LOCK) {
            String id = BJson.str(a, "id", "");
            JSONArray prev = list(c), next = new JSONArray();
            for (int i = 0; i < prev.length(); i++) {
                JSONObject o = prev.optJSONObject(i);
                if (o != null && !id.equals(BJson.str(o, "id", ""))) next.put(o);
            }
            next.put(a);
            save(c, next);
            set(c, a);
        }
    }

    /** 울린 알람을 목록에서 뺀다(AlarmManager에는 이미 없다) */
    static void forget(Context c, String id) {
        synchronized (BStore.LOCK) {
            JSONArray prev = list(c), next = new JSONArray();
            for (int i = 0; i < prev.length(); i++) {
                JSONObject o = prev.optJSONObject(i);
                if (o != null && !BJson.str(o, "id", "").equals(id)) next.put(o);
            }
            save(c, next);
        }
    }

    /** 이 약속의 알람을 취소한다. kind가 null이면 모든 단계, holdsOnly면 붙잡기만 */
    static void cancel(Context c, String key, String kind, boolean holdsOnly) {
        synchronized (BStore.LOCK) {
            JSONArray prev = list(c), next = new JSONArray();
            for (int i = 0; i < prev.length(); i++) {
                JSONObject o = prev.optJSONObject(i);
                if (o == null) continue;
                boolean match = BJson.str(o, "key", "").equals(key)
                    && (kind == null || BJson.str(o, "kind", "").equals(kind))
                    && (!holdsOnly || BJson.lng(o, "hold", 0) > 0);
                if (match) unset(c, BJson.str(o, "id", ""));
                else next.put(o);
            }
            save(c, next);
        }
    }

    /** 재부팅 · 업데이트 · 시간 변경 뒤: 저장해 둔 알람 가운데 아직 오지 않은 것을 다시 건다 */
    static void rescheduleAll(Context c) {
        synchronized (BStore.LOCK) {
            long now = System.currentTimeMillis();
            JSONArray prev = list(c), next = new JSONArray();
            for (int i = 0; i < prev.length(); i++) {
                JSONObject o = prev.optJSONObject(i);
                if (o == null || BJson.lng(o, "at", 0) <= now) continue;
                set(c, o);
                next.put(o);
            }
            save(c, next);
        }
    }

    /** 진행 알림의 진행 막대를 고치는 작은 깨우지 않는 알람(Android 16 이상에서만) */
    static void tick(Context c, long at) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(c, BAlarmReceiver.class);
        i.setAction(ACTION_TICK);
        PendingIntent pi = PendingIntent.getBroadcast(c, ACTION_TICK.hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            am.set(AlarmManager.RTC, at, pi);
        } catch (Exception ignored) {
        }
    }

    static void untick(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        Intent i = new Intent(c, BAlarmReceiver.class);
        i.setAction(ACTION_TICK);
        PendingIntent pi = PendingIntent.getBroadcast(c, ACTION_TICK.hashCode(), i,
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) {
            if (am != null) am.cancel(pi);
            pi.cancel();
        }
    }
}
