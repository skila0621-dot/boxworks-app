package kr.boxworks.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 루틴을 하는 동안 알림창에 붙어 있는 알림 한 장(전체 흐름 와이어프레임 11).
 * 첫 단계 알람이 울릴 때 생기고, 단계 알람·확인 때마다 고쳐 쓰며, 출발(또는 마지막 단계) 뒤 스스로 사라진다.
 * 잠금 화면에는 '아침 준비 · 진행 중'만 보이고 단계는 잠금을 풀면 보인다(대표 결정 10/31).
 * 밀어서 지우면 그날 그 루틴은 다시 띄우지 않는다. 포그라운드 서비스는 쓰지 않는다.
 */
final class RoutineOngoing {
    static final String CHANNEL = "bx_ongoing_v1";
    static final int NOTIF_ID = 0x0B20;
    private static final String PREFS = "bx_ongoing";
    private static final long AFTER_MS = 10 * 60 * 1000L;

    private RoutineOngoing() {}

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static String hm(long ms) {
        return new SimpleDateFormat("H:mm", Locale.KOREA).format(new Date(ms));
    }

    /** 루틴 단계 알람이 울렸을 때. 단계가 둘 이상인 루틴만 띄운다 */
    static void onAlarm(Context c, JSONObject o) {
        JSONArray steps = o.optJSONArray("steps");
        String key = o.optString("rid") + "_" + o.optString("ds");
        if (steps == null || steps.length() < 2 || o.optString("rid").isEmpty()) return;
        if (key.equals(prefs(c).getString("hidden", ""))) return;
        try {
            JSONObject plan = new JSONObject();
            plan.put("key", key);
            plan.put("name", o.optString("group", "루틴"));
            plan.put("leave", o.optLong("leave", 0));
            plan.put("steps", steps);
            prefs(c).edit().putString("plan", plan.toString()).apply();
        } catch (Exception ignored) {
            return;
        }
        post(c);
    }

    /** 사용자가 밀어서 지웠을 때: 그날 그 루틴은 다시 띄우지 않는다 */
    static void hide(Context c) {
        JSONObject p = load(c);
        if (p != null) prefs(c).edit().putString("hidden", p.optString("key")).remove("plan").apply();
        NotificationManagerCompat.from(c).cancel(NOTIF_ID);
    }

    static JSONObject load(Context c) {
        try {
            String s = prefs(c).getString("plan", null);
            return s == null ? null : new JSONObject(s);
        } catch (Exception e) {
            return null;
        }
    }

    /** 지금 진행 중인 루틴(위젯과 함께 쓴다). 끝났으면 null */
    static JSONObject active(Context c, long now) {
        JSONObject p = load(c);
        if (p == null) return null;
        long end = endOf(p);
        if (end <= 0 || now > end + AFTER_MS) return null;
        return p;
    }

    static long endOf(JSONObject p) {
        long leave = p.optLong("leave", 0);
        if (leave > 0) return leave;
        JSONArray st = p.optJSONArray("steps");
        if (st == null || st.length() == 0) return 0;
        JSONObject last = st.optJSONObject(st.length() - 1);
        return last == null ? 0 : last.optLong("at", 0) + last.optLong("min", 10) * 60000L;
    }

    /** 지금 단계 번호: 시각이 지난 마지막 단계 */
    static int currentIndex(JSONArray st, long now) {
        int cur = 0;
        for (int i = 0; i < st.length(); i++) {
            JSONObject s = st.optJSONObject(i);
            if (s != null && s.optLong("at", 0) <= now) cur = i;
        }
        return cur;
    }

    static boolean isDone(JSONObject step, JSONObject doneMap) {
        return step != null && (step.optBoolean("d", false) || doneMap.has(step.optString("s")));
    }

    static void post(Context c) {
        long now = System.currentTimeMillis();
        JSONObject p = active(c, now);
        if (p == null) {
            NotificationManagerCompat.from(c).cancel(NOTIF_ID);
            return;
        }
        ensureChannel(c);
        JSONArray st = p.optJSONArray("steps");
        JSONObject done = AlarmStore.loadDone(c);
        int cur = currentIndex(st, now);
        JSONObject s = st.optJSONObject(cur);
        JSONObject nx = cur + 1 < st.length() ? st.optJSONObject(cur + 1) : null;
        long leave = p.optLong("leave", 0);
        String name = p.optString("name", "루틴");

        String title = s == null ? name : s.optString("n") + (leave > 0 ? " · " + hm(leave) + " 출발" : "");
        String text = nx != null ? "다음 " + hm(nx.optLong("at")) + " " + nx.optString("n") : "곧 끝나요";
        StringBuilder lines = new StringBuilder();
        for (int i = 0; i < st.length(); i++) {
            JSONObject x = st.optJSONObject(i);
            if (x == null) continue;
            String mark = isDone(x, done) || i < cur ? "✓ " : i == cur ? "● " : "· ";
            if (lines.length() > 0) lines.append('\n');
            lines.append(mark).append(hm(x.optLong("at"))).append("  ").append(x.optString("n"));
        }

        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, NOTIF_ID, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent del = new Intent(c, AlarmActionReceiver.class);
        del.setAction("kr.boxworks.app.ACT.ongoing-x");
        del.putExtra(AlarmNotify.EXTRA_ACT, "ongoing-x");
        PendingIntent delPi = PendingIntent.getBroadcast(c, NOTIF_ID + 1, del,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        boolean none = "none".equals(AlarmStore.lockMode(c));
        Notification pub = new NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(none ? "박스웍스 · 진행 중" : name + " · 진행 중")
            .setContentText("잠금을 풀면 보여요")
            .build();
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(text)
            .setSubText(name + " · 진행 중")
            .setStyle(new NotificationCompat.BigTextStyle().setBigContentTitle(title).bigText(lines.toString()))
            .setProgress(st.length(), cur + 1, false)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(pub)
            .setContentIntent(openPi)
            .setDeleteIntent(delPi)
            .setTimeoutAfter(Math.max(60000L, endOf(p) + AFTER_MS - now));
        if (leave > now) {
            // 출발까지 남은 시간을 알림 머리에 거꾸로 세어 보여 준다(따로 고쳐 쓰지 않아도 맞다)
            b.setWhen(leave).setShowWhen(true).setUsesChronometer(true).setChronometerCountDown(true);
        } else {
            b.setShowWhen(false);
        }
        try {
            NotificationManagerCompat.from(c).notify(NOTIF_ID, b.build());
        } catch (SecurityException ignored) {
        }
    }

    private static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "루틴 진행 중", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("루틴을 하는 동안 지금 단계와 다음 단계를 알림창에 붙여 둬요. 소리는 나지 않아요");
        ch.setSound(null, null);
        ch.enableVibration(false);
        ch.setShowBadge(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        nm.createNotificationChannel(ch);
    }
}
