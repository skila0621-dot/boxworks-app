package kr.boxworks.b;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.StatusBarNotification;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.json.JSONObject;

/**
 * 알림 채널과 알림(SPEC 4절): 강한 알람(전체 화면 · 위에서 내려옴, 소리는 BRingService), 출발 미리 알림, 아침 요약,
 * '시작했어요' 뒤 출발까지 거꾸로 가는 진행 알림(Android 16이면 진행 막대 · Now bar 요청).
 */
final class BNotify {
    private BNotify() {}

    /** 강한 알람. 소리 · 진동은 BRingService가 직접 내므로 채널은 조용히 */
    static final String CH_ALARM = "b_alarm_v1";
    /** 서비스를 못 띄울 때만: 알림 소리로 울린다 */
    static final String CH_ALARM_SOUND = "b_alarm_snd_v1";
    static final String CH_SOFT = "b_soft_v1";
    static final String CH_MORNING = "b_morning_v1";
    static final String CH_ONGOING = "b_ongoing_v1";

    static final String EXTRA_ACT = "b_act", EXTRA_KEY = "b_key", EXTRA_KIND = "b_kind", EXTRA_N = "b_n", EXTRA_SNAP = "b_snap";
    static final String ONGOING_TAG = "b.ongoing:";
    static final int ONGOING_ID = 0xB0;
    /** Notification.EXTRA_REQUEST_PROMOTED_ONGOING(Android 16) */
    static final String EXTRA_PROMOTED = "android.requestPromotedOngoing";
    static final int ACCENT = 0xFF7C9BFF;
    private static final long MIN = 60 * 1000L;

    static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        if (nm.getNotificationChannel(CH_ALARM) == null) {
            NotificationChannel ch = new NotificationChannel(CH_ALARM, "준비 · 출발 알람", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("준비를 시작할 때와 출발할 때 울려요. 소리는 앱이 1분 동안 직접 내요");
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
        if (nm.getNotificationChannel(CH_ALARM_SOUND) == null) {
            NotificationChannel ch = new NotificationChannel(CH_ALARM_SOUND, "준비 · 출발 알람(알림 소리)", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("앱이 소리를 직접 낼 수 없을 때 알림 소리로 울려요");
            Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            ch.setSound(sound, new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            ch.enableVibration(true);
            ch.setVibrationPattern(new long[] { 0, 700, 500, 700 });
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
        if (nm.getNotificationChannel(CH_SOFT) == null) {
            NotificationChannel ch = new NotificationChannel(CH_SOFT, "출발 미리 알림", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("출발 몇 분 전에 알려 줘요");
            nm.createNotificationChannel(ch);
        }
        if (nm.getNotificationChannel(CH_MORNING) == null) {
            NotificationChannel ch = new NotificationChannel(CH_MORNING, "아침 요약", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("그날 나가는 약속과 첫 준비 시작 시각을 아침에 알려 줘요");
            nm.createNotificationChannel(ch);
        }
        if (nm.getNotificationChannel(CH_ONGOING) == null) {
            NotificationChannel ch = new NotificationChannel(CH_ONGOING, "출발까지 남은 시간", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("'시작했어요'를 누른 뒤 출발 시각까지 거꾸로 세어 보여 줘요. 소리는 나지 않아요");
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setShowBadge(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
    }

    /** 단계 알림 번호(붙잡기도 같은 번호로 바꿔 쓴다) */
    static int alarmId(String kind, String key) {
        return ("n:" + kind + ":" + key).hashCode();
    }

    // ───────── 단추 ─────────

    static PendingIntent actionPi(Context c, String act, String kind, String key, Double n, JSONObject snap) {
        Intent i = new Intent(c, BActionReceiver.class);
        i.setAction("kr.boxworks.b.ACT." + act + "." + kind + "." + key);
        i.putExtra(EXTRA_ACT, act);
        i.putExtra(EXTRA_KIND, kind);
        i.putExtra(EXTRA_KEY, key);
        if (n != null) i.putExtra(EXTRA_N, n.doubleValue());
        if (snap != null) i.putExtra(EXTRA_SNAP, snap.toString());
        return PendingIntent.getBroadcast(c, (act + "." + kind + "." + key).hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** '늦는다고 알리기': 알림에서는 뒤에서 공유 창을 열 수 없어 투명 화면(BShareActivity)을 거친다 */
    static PendingIntent latePi(Context c, String kind, String key, JSONObject snap) {
        Intent i = new Intent(c, BShareActivity.class);
        i.setAction("kr.boxworks.b.LATE." + kind + "." + key);
        i.putExtra(EXTRA_KIND, kind);
        i.putExtra(EXTRA_KEY, key);
        if (snap != null) i.putExtra(EXTRA_SNAP, snap.toString());
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_ANIMATION);
        return PendingIntent.getActivity(c, ("late." + kind + "." + key).hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent screenPi(Context c, JSONObject a, int id) {
        Intent full = new Intent(c, BAlarmActivity.class);
        full.putExtra(BAlarmActivity.EXTRA, a.toString());
        full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        return PendingIntent.getActivity(c, id, full, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent openPi(Context c) {
        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(c, 0xB0B, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // ───────── 강한 알람 ─────────

    /**
     * 준비 시작 · 출발 · 이 앱 알림. 잠금 화면 · 화면 꺼짐이면 전체 화면 알람(BAlarmActivity), 쓰는 중이면 위에서 내려오는 알림.
     * withSound: 소리 서비스를 못 띄울 때(알림 소리 채널로)
     */
    static Notification alarm(Context c, JSONObject a, BPlanner.Entry e, long now, boolean h24, boolean withSound) {
        ensureChannels(c);
        String kind = BJson.str(a, "kind", "prep"), key = BJson.str(a, "key", "");
        JSONObject snap = BEngine.snap(e);
        String title = BText.title(kind, e, now), body = BText.body(kind, e, now, h24);
        int id = alarmId(kind, key);
        PendingIntent full = screenPi(c, a, id);
        double limit = "prep".equals(kind) ? BText.leaveAt(e) : "leave".equals(kind) ? e.start + 30 * MIN : e.start + 60 * MIN;
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, withSound ? CH_ALARM_SOUND : CH_ALARM)
            .setSmallIcon(R.drawable.ic_stat_b)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setSubText(BText.label(kind))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setContentIntent(full)
            .setFullScreenIntent(full, true)
            // 밀어 지우면 소리만 멈춘다(대답한 것은 아님)
            .setDeleteIntent(actionPi(c, "ring-off", kind, key, null, null))
            .setTimeoutAfter(Math.max(MIN, (long) (limit - now)))
            .addAction(0, BText.primary(kind), actionPi(c, BText.primaryAct(kind), kind, key, null, snap));
        Object[] sec = BText.secondary(kind, e, now);
        if ("late".equals(sec[1])) b.addAction(0, (String) sec[0], latePi(c, kind, key, snap));
        else b.addAction(0, (String) sec[0], actionPi(c, "snooze", kind, key, (Double) sec[2], snap));
        if ("prep".equals(kind) || "leave".equals(kind)) b.addAction(0, "이번엔 안 가요", actionPi(c, "off", kind, key, null, snap));
        Notification n = b.build();
        if (withSound) n.flags |= Notification.FLAG_INSISTENT;
        return n;
    }

    // ───────── 약한 알림 ─────────

    /** 출발 몇 분 전 */
    static void heads(Context c, String key, BPlanner.Entry e, long now, boolean h24) {
        ensureChannels(c);
        JSONObject snap = BEngine.snap(e);
        String body = BText.body("heads", e, now, h24);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CH_SOFT)
            .setSmallIcon(R.drawable.ic_stat_b)
            .setContentTitle(BText.title("heads", e, now))
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(openPi(c))
            .setTimeoutAfter(Math.max(MIN, (long) (BText.leaveAt(e) + 10 * MIN - now)))
            .addAction(0, "나갔어요", actionPi(c, "left", "heads", key, null, snap));
        notify(c, null, alarmId("heads", key), b.build());
    }

    /** 아침 요약 */
    static void morning(Context c, String ymd, String title, String body) {
        ensureChannels(c);
        PendingIntent open = openPi(c);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CH_MORNING)
            .setSmallIcon(R.drawable.ic_stat_b)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(open)
            .setTimeoutAfter(12 * 60 * MIN)
            .addAction(0, "열기", open);
        notify(c, null, ("morning:" + ymd).hashCode(), b.build());
    }

    // ───────── 진행 알림(곁에서) ─────────

    /** 계획에 맞춰 진행 알림을 띄우거나 고치거나 지운다: '시작했어요' 뒤 아직 안 나간 약속(시작+30분까지) */
    static void syncOngoing(Context c, List<BPlanner.Entry> entries, long now, boolean h24) {
        Set<String> want = new HashSet<>();
        for (BPlanner.Entry e : entries) {
            if (e.out && !e.off && "prep".equals(e.state) && e.leaveAt != null && now < e.start + 30 * MIN) {
                ongoing(c, e, now, h24);
                want.add(e.key);
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                NotificationManager nm = c.getSystemService(NotificationManager.class);
                if (nm != null) {
                    for (StatusBarNotification sb : nm.getActiveNotifications()) {
                        String tag = sb.getTag();
                        if (tag != null && tag.startsWith(ONGOING_TAG) && sb.getId() == ONGOING_ID && !want.contains(tag.substring(ONGOING_TAG.length()))) {
                            nm.cancel(tag, ONGOING_ID);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
        // Android 16의 진행 막대는 스스로 움직이지 않아 1분마다(화면이 켜져 있을 때만) 고친다
        if (Build.VERSION.SDK_INT >= 36 && !want.isEmpty()) BScheduler.tick(c, now + MIN);
        else BScheduler.untick(c);
    }

    static void cancelOngoing(Context c, String key) {
        try {
            NotificationManagerCompat.from(c).cancel(ONGOING_TAG + key, ONGOING_ID);
        } catch (Exception ignored) {
        }
    }

    /** "출발까지 · {제목}", 출발 시각까지 거꾸로 가는 시계, "{출발} 출발 · {도착 예정} 도착", 단추: 나갔어요 · 늦는다고 알리기 */
    static void ongoing(Context c, BPlanner.Entry e, long now, boolean h24) {
        ensureChannels(c);
        JSONObject snap = BEngine.snap(e);
        String t = e.title == null || e.title.isEmpty() ? "(제목 없음)" : e.title;
        String title = "출발까지 · " + t;
        long leave = (long) BText.leaveAt(e);
        String text = BText.hm(leave, h24) + " 출발 · " + BText.hm(BText.arrive(e), h24) + " 도착";
        long until = (long) (e.start + 30 * MIN);
        PendingIntent open = openPi(c);
        PendingIntent left = actionPi(c, "left", "leave", e.key, null, snap);
        PendingIntent late = latePi(c, "leave", e.key, snap);
        Notification n = null;
        if (Build.VERSION.SDK_INT >= 36) {
            long started = e.startedAt != null ? (long) (double) e.startedAt : now;
            n = ongoing36(c, title, text, started, leave, until, now, open, left, late);
        }
        if (n == null) {
            NotificationCompat.Builder b = new NotificationCompat.Builder(c, CH_ONGOING)
                .setSmallIcon(R.drawable.ic_stat_b)
                .setContentTitle(title)
                .setContentText(text)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setCategory(NotificationCompat.CATEGORY_PROGRESS)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(open)
                .setWhen(leave)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(true)
                .setTimeoutAfter(Math.max(MIN, until - now))
                .addAction(0, "나갔어요", left)
                .addAction(0, "늦는다고 알리기", late);
            Bundle ex = new Bundle();
            ex.putBoolean(EXTRA_PROMOTED, true);
            b.addExtras(ex);
            n = b.build();
        }
        notify(c, ONGOING_TAG + e.key, ONGOING_ID, n);
    }

    /**
     * Android 16(API 36): Notification.ProgressStyle로 시작 → 출발 진행 막대와 Now bar 요청(setRequestPromotedOngoing).
     * 새 API는 리플렉션으로 불러 컴파일 SDK와 상관없이 빌드되게 했다. 하나라도 안 되면 null(그냥 시계로)
     */
    private static Notification ongoing36(Context c, String title, String text, long started, long leave, long until, long now,
                                          PendingIntent open, PendingIntent left, PendingIntent late) {
        try {
            Notification.Builder b = new Notification.Builder(c, CH_ONGOING)
                .setSmallIcon(R.drawable.ic_stat_b)
                .setContentTitle(title)
                .setContentText(text)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(Notification.CATEGORY_PROGRESS)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setContentIntent(open)
                .setWhen(leave)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(true)
                .setTimeoutAfter(Math.max(MIN, until - now));
            Icon icon = Icon.createWithResource(c, R.drawable.ic_stat_b);
            b.addAction(new Notification.Action.Builder(icon, "나갔어요", left).build());
            b.addAction(new Notification.Action.Builder(icon, "늦는다고 알리기", late).build());
            Class<?> psc = Class.forName("android.app.Notification$ProgressStyle");
            Class<?> segc = Class.forName("android.app.Notification$ProgressStyle$Segment");
            Object ps = psc.getConstructor().newInstance();
            int total = 1000;
            Object seg = segc.getConstructor(int.class).newInstance(total);
            segc.getMethod("setColor", int.class).invoke(seg, ACCENT);
            psc.getMethod("addProgressSegment", segc).invoke(ps, seg);
            double f = (now - started) / (double) Math.max(1L, leave - started);
            int prog = (int) Math.max(0, Math.min(total, Math.round(total * f)));
            psc.getMethod("setProgress", int.class).invoke(ps, prog);
            b.setStyle((Notification.Style) ps);
            Bundle ex = new Bundle();
            ex.putBoolean(EXTRA_PROMOTED, true);
            b.addExtras(ex);
            try {
                Notification.Builder.class.getMethod("setRequestPromotedOngoing", boolean.class).invoke(b, true);
            } catch (Exception ignored) {
                // 요청 칸(EXTRA_PROMOTED)만으로도 같다
            }
            return b.build();
        } catch (Throwable t) {
            return null;
        }
    }

    // ───────── 지우기 ─────────

    static void dismiss(Context c, String kind, String key) {
        try {
            NotificationManagerCompat.from(c).cancel(alarmId(kind, key));
        } catch (Exception ignored) {
        }
    }

    /** 이 약속의 단계 알림을 모두 지운다(진행 알림은 따로) */
    static void dismissAll(Context c, String key) {
        for (String k : new String[] { "prep", "leave", "heads", "remind" }) dismiss(c, k, key);
    }

    static void notify(Context c, String tag, int id, Notification n) {
        try {
            if (tag == null) NotificationManagerCompat.from(c).notify(id, n);
            else NotificationManagerCompat.from(c).notify(tag, id, n);
        } catch (SecurityException ignored) {
            // 알림 권한이 꺼져 있으면 띄우지 못한다
        }
    }
}
