package kr.boxworks.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONObject;

/** 알람이 울릴 때 띄우는 알림. 잠금 화면에서는 AlarmActivity가 화면 전체로 뜬다. */
final class AlarmNotify {
    static final String CHANNEL = "bx_alarm_v1";
    static final String CHANNEL_REPORT = "bx_report_v1";
    static final int REPORT_ID = 0x0B0B;
    static final String EXTRA_ACT = "bx_act";
    static final long SNOOZE_MS = 5 * 60 * 1000L;

    private AlarmNotify() {}

    /** 인텐트에 실려 온 알람 정보. 예전 형식(제목·내용만)도 읽는다. */
    static JSONObject fromIntent(Intent intent) {
        JSONObject o = null;
        String json = intent == null ? null : intent.getStringExtra(AlarmStore.EXTRA_JSON);
        if (json != null) {
            try {
                o = new JSONObject(json);
            } catch (Exception ignored) {
            }
        }
        if (o == null) {
            o = new JSONObject();
            try {
                if (intent != null) {
                    o.put("id", intent.getStringExtra(AlarmStore.EXTRA_ID));
                    o.put("title", intent.getStringExtra(AlarmStore.EXTRA_TITLE));
                    o.put("body", intent.getStringExtra(AlarmStore.EXTRA_BODY));
                    o.put("at", intent.getLongExtra(AlarmStore.EXTRA_AT, System.currentTimeMillis()));
                }
            } catch (Exception ignored) {
            }
        }
        return o;
    }

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "일정·루틴 알람", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("박스웍스 일정과 루틴 알람");
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        ch.setSound(sound, new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build());
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[] {0, 600, 400, 600});
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    /**
     * 아침 보고(4안-5). 소리 나는 알람이 아니라 보통 알림으로, 오늘 일정 요약을 펼쳐 보여 준다.
     * 아침 루틴 첫 알람을 확인한 직후나, 정한 시각에 뜬다.
     */
    static void showReport(Context c, JSONObject r) {
        if (r == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(CHANNEL_REPORT) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL_REPORT, "아침 보고", NotificationManager.IMPORTANCE_DEFAULT);
                ch.setDescription("하루를 시작할 때 오늘 일정을 요약해 보여 줘요");
                ch.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
                nm.createNotificationChannel(ch);
            }
        }
        String title = r.optString("title", "오늘 일정");
        String text = r.optString("text", "");
        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, REPORT_ID, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent close = new Intent(c, AlarmActionReceiver.class);
        close.setAction("kr.boxworks.app.ACT.report-close");
        close.putExtra(EXTRA_ACT, "report-close");
        PendingIntent closePi = PendingIntent.getBroadcast(c, REPORT_ID + 1, close,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL_REPORT)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(text.split("\n", 2)[0])
            .setStyle(new NotificationCompat.BigTextStyle().setBigContentTitle(title).bigText(text))
            .setSubText("아침 보고")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(openPi)
            .addAction(0, "오늘 보기", openPi)
            .addAction(0, "닫기", closePi);
        try {
            NotificationManagerCompat.from(c).notify(REPORT_ID, b.build());
        } catch (SecurityException ignored) {
            // 알림 권한이 꺼져 있으면 띄우지 못한다.
        }
    }

    static int notifId(String id) {
        return id == null ? 0 : id.hashCode();
    }

    static void show(Context c, JSONObject o) {
        ensureChannel(c);
        String id = o.optString("id");
        String title = o.optString("title");
        String body = o.optString("body");
        if (title.isEmpty()) title = "박스웍스 알람";

        Intent full = new Intent(c, AlarmActivity.class);
        full.putExtra(AlarmStore.EXTRA_JSON, o.toString());
        full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        PendingIntent fullPi = PendingIntent.getActivity(c, notifId(id), full,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent open = new Intent(c, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPi = PendingIntent.getActivity(c, notifId(id) + 1, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_bx)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(openPi)
            .setFullScreenIntent(fullPi, true)
            .addAction(0, "확인", actionPi(c, "ok", o))
            .addAction(0, "5분 뒤", actionPi(c, "snooze", o));
        try {
            NotificationManagerCompat.from(c).notify(notifId(id), b.build());
        } catch (SecurityException ignored) {
            // 알림 권한이 꺼져 있으면 띄우지 못한다. 휴대폰 설정에서 다시 켤 수 있다.
        }
    }

    private static PendingIntent actionPi(Context c, String act, JSONObject o) {
        String id = o.optString("id");
        Intent i = new Intent(c, AlarmActionReceiver.class);
        i.setAction("kr.boxworks.app.ACT." + act + "." + id);
        i.putExtra(EXTRA_ACT, act);
        i.putExtra(AlarmStore.EXTRA_JSON, o.toString());
        return PendingIntent.getBroadcast(c, (act + id).hashCode(), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void snooze(Context c, JSONObject o) {
        try {
            JSONObject s = new JSONObject(o.toString());
            String base = o.optString("id", "alarm");
            s.put("id", base.endsWith("_s") ? base : base + "_s");
            s.put("at", System.currentTimeMillis() + SNOOZE_MS);
            AlarmStore.addLocal(c, s);
        } catch (Exception ignored) {
        }
    }

    static void dismiss(Context c, String id) {
        NotificationManagerCompat.from(c).cancel(notifId(id));
    }
}
